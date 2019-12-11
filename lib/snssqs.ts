import cdk = require('@aws-cdk/core');
import sqs = require('@aws-cdk/aws-sqs');
import sns = require('@aws-cdk/aws-sns');
import subs = require('@aws-cdk/aws-sns-subscriptions');
import iam = require('@aws-cdk/aws-iam');
import s3 = require('@aws-cdk/aws-s3');
import s3n = require('@aws-cdk/aws-s3-notifications');
import lambda = require('@aws-cdk/aws-lambda');

export class SNSSQSStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const MyDBEndpoint = new cdk.CfnParameter(this, 'MyDBEndpoint',{
            type: "String",
            default: "default"
        })

        const DBPassword = new cdk.CfnParameter(this, 'DBPassword', {
            noEcho: true,
            type: "String",
            description: "RDS Password.",
            minLength: 1,
            maxLength: 41,
            constraintDescription: "the password must be between 1 and 41 characters",
            default: "masterpassword"
        })

         /**
         * ---------Queue---------
         */

        const UploadSNSTopic = new sns.Topic(this, 'uploads-topic', {
            displayName: 'uploads-topic',
        });

        const SQSSubscription = new sns.Subscription(this, 'SQSSubscription', {
            endpoint: 'uploads-queue',
            protocol: sns.SubscriptionProtocol.SQS,
            topic: UploadSNSTopic
        });

        const LambdaSubscription = new sns.Subscription(this, 'LambdaSubscription', {
            endpoint: cdk.Fn.getAtt('LabelsLambda','functionArn').toString(),
            protocol: sns.SubscriptionProtocol.LAMBDA,
            topic: UploadSNSTopic
        });

        /**
         * ---------Queue---------
         */

        const UploadQueue = new sqs.Queue(this, 'UploadQueue', {
            queueName: 'uploads-queue'
        });

        const QueuePolicy = new sqs.CfnQueuePolicy(this, 'QueuePolicy', {
            policyDocument: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        principals: [new iam.AnyPrincipal()],
                        actions: ['sqs:SendMessage'],
                        resources: ['*'],
                        conditions: [
                            {
                                StringEquals: {
                                    "aws:SourceArn": SNSSQSStack.arguments.UploadSNSTopic.topicArn
                                }
                            }]
                    })
                ]
            }),
            queues: ['UploadQueue']
        });

        /**
         * ---------s3---------
         */
        
        let image_bucket_name = 'imagebucketsns' + this.artifactId;

        const ImageS3Bucket = new s3.Bucket(this, 'ImageS3Bucket', {
            bucketName: image_bucket_name,
        });

        ImageS3Bucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, new s3n.SnsDestination(UploadSNSTopic));

        /**
         * ---------CfnTopicPolicy---------
         */

        const UploadTopicPolicy = new sns.CfnTopicPolicy(this, 'QueuePolicy', {
            policyDocument: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        principals: [new iam.AnyPrincipal()],
                        actions: ['SNS:Publish'],
                        resources: [UploadSNSTopic.topicArn],
                        conditions: {ArnLike: { 'aws:SourceArn': ImageS3Bucket.bucketArn }} 
                    })
                ]
            }),
            topics: ['UploadSNSTopic']
        });

        /**
         * ---------Lambda---------
         */

        const LambdaExecutionRole = new iam.CfnRole(this, 'LambdaExecutionRole', {
            assumeRolePolicyDocument:{
                Version: '2012-10-17',
                Statement:[{
                    Effect: 'Allow',
                    Principal:{
                        Service:[
                            'lambda.amazonaws.com'
                        ]
                    },
                    Action:[
                        'sts:AssumeRole'
                    ]
                }]
            },
            path: '/',
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
                'arn:aws:iam::aws:policy/AmazonRekognitionReadOnlyAccess',
                'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
                'arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess'
            ],
            policies: [{
                policyName: 'root',
                policyDocument:{
                    Version: '2012-10-17',
                    Statement:[{
                        Effect: 'Allow',
                        Action: [
                            'logs:*'
                        ],
                        Resource: 'arn:aws:logs:*:*:*'
                    }]
                }
            }]
        })

        const LabelsLambda = new lambda.Function(this, 'LabelsLambda', {
            runtime: lambda.Runtime.PYTHON_3_6,      // execution environment
            code: lambda.Code.asset('exercise-lambda.LambdaImageLabels'),  // code loaded from the "lambda" directory
            handler: 'lambda_function.lambda_handler',                // file is "lambda_function", function is "handler"
            timeout: cdk.Duration.seconds(120),
            tracing: lambda.Tracing.ACTIVE,
            //VPC confige,
            environment: {
                'DATABASE_HOST': cdk.Fn.importValue('MyDBEndpoint'),
                'DATABASE_USER': 'web_user',
                'DATABASE_PASSWORD': cdk.Fn.importValue('DBPassword'),
                'DATABASE_DB_NAME': 'Photos'
            },
            role: iam.Role.fromRoleArn(this, 'LambdaExecutionRole', LambdaExecutionRole.attrArn)
        });

        const ImageS3BucketPermission = new lambda.CfnPermission(this, 'ImageS3BucketPermission',{
            action: 'lambda:InvokeFunction',
            functionName: LabelsLambda.functionArn,
            principal: 'sns.amazonaws.com',
            sourceArn: UploadSNSTopic.topicArn
        })

        const ImageS3BucketOutput = new cdk.CfnOutput(this, 'ImageS3BucketOutput', {
            value: ImageS3Bucket.bucketArn,
            description: 'Image S3 Bucket'
        })

        const LabelsLambdaOutput = new cdk.CfnOutput(this, 'LabelsLambdaOutput', {
            value: LabelsLambda.functionArn,
            description: 'Labels Lambda'
        })

    }
}
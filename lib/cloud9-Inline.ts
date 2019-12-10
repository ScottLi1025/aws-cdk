import core = require('@aws-cdk/core');
import cloud9 = require('@aws-cdk/aws-cloud9');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import cf = require('@aws-cdk/aws-cloudformation');
import fs = require('fs');

export class Cloud9StackInline extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id, props);

        this.templateOptions.description = 'Building on AWS Project Security Stack';

        const PublicSubnet1 = new core.CfnParameter(this, 'PublicSubnet1', {
            type: 'AWS::EC2::Subnet::Id',
            default: 'subnet-cb0400c4'
        })

        const EdxProjectCloud9 = new cloud9.CfnEnvironmentEC2(this, 'EdxProjectCloud9', {
            automaticStopTimeMinutes: 30,
            instanceType: 't2.micro',
            name: 'BuildingOnAWS' + core.Aws.STACK_NAME,
            subnetId: PublicSubnet1.valueAsString
        })

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
            policies: [{
                policyName: 'root',
                policyDocument:{
                    Version: '2012-10-17',
                    Statement:[{
                        Effect: 'Allow',
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        Resource: 'arn:aws:logs:*:*:*'
                    },
                    {
                        Effect: 'Allow',
                        Action: 'ec2:Describe*',
                        Resource: "*"
                    }
                    ]
                }
            }]
        })

        const CustomFunction = new lambda.Function(this, 'CustomFunction', {
            functionName: 'CustomFunction',
            code: new lambda.InlineCode(fs.readFileSync('./lib/Cloud9Lambda/cloud9.js', { encoding: 'utf-8' })),
            runtime: lambda.Runtime.NODEJS_8_10,
            handler: 'index.handler',
            role: iam.Role.fromRoleArn(this, 'LambdaExecutionIRole', LambdaExecutionRole.attrArn)
        })

        const CustomResource = new cf.CfnCustomResource(this, 'CustomResource', {
            serviceToken: CustomFunction.functionArn
        })
        CustomResource.addOverride('Properties.EdxProjectCloud9', EdxProjectCloud9.ref)

        const EdxProjectCloud9Id = new core.CfnOutput(this, 'EdxProjectCloud9Id', {
            value: EdxProjectCloud9.ref,
            description: 'Edx User Cloud9'
        })

        const EdxProjectCloud9Sg = new core.CfnOutput(this, 'EdxProjectCloud9Sg', {
            value: core.Fn.getAtt('CustomResource', 'Value').toString(),
            description: 'Edx User Cloud9 Security Group ID'
        })
    }
}
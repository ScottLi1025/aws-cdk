import core = require('@aws-cdk/core');
import cloud9 = require('@aws-cdk/aws-cloud9');
import lambda = require('@aws-cdk/aws-lambda');
import iam = require('@aws-cdk/aws-iam');
import cf = require('@aws-cdk/aws-cloudformation');


export class Cloud9Stack extends core.Stack {
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

        const CustomFunction = new lambda.CfnFunction(this, 'CustomFunction', {
            code: {
                'zipFile': "const response = require('cfn-response');\n" +
                "const AWS = require('aws-sdk');\n" +
                "exports.handler = (event, context) => {\n" +
                "   let params = {\n" +
                "       Filters: [\n" +
                "           {\n" +
                '           Name: "tag:aws:cloud9:environment",\n' +
                '           Values: [\n' +
                '               event.ResourceProperties.EdxProjectCloud9\n' +
                '           ]\n' +
                '          }\n' +
                '         ]\n' +
                '        };\n' +
                '        let ec2 = new AWS.EC2();\n' +
                '        ec2.describeInstances(params, (err, data) => {\n' +
                '           if (err) {\n' +
                '               console.log(err, err.stack); // an error occurred\n' +
                '               response.send(event, context, response.FAILED, err);\n' +
                '           }else{\n' +
                '               let responseData = {Value: data.Reservations[0].Instances[0].SecurityGroups[0].GroupId};\n' +
                '               console.log(responseData);\n' +
                '               response.send(event, context, response.SUCCESS, responseData);\n' +
                '           }\n' +
                '\n' +
                '        });\n' +
                '};\n'

            },
            runtime: 'nodejs8.10',
            handler: 'index.handler',
            role: LambdaExecutionRole.attrArn,
            timeout: 30
        })

        const CustomResource = new cf.CfnCustomResource(this, 'CustomResource', {
            serviceToken: CustomFunction.attrArn,
        })
        CustomResource.addOverride('Properties.EdxProjectCloud9', EdxProjectCloud9.ref)

        const EdxProjectCloud9Id = new core.CfnOutput(this, 'EdxProjectCloud9Id', {
            value: EdxProjectCloud9.ref,
            description: 'Edx User Cloud9',
            exportName: 'EdxProjectCloud9Id'
        })

        const EdxProjectCloud9Sg = new core.CfnOutput(this, 'EdxProjectCloud9Sg', {
            value: core.Fn.getAtt('CustomResource', 'Value').toString(),
            description: 'Edx User Cloud9 Security Group ID',
            exportName: 'EdxProjectCloud9Sg'
        })
    }
}
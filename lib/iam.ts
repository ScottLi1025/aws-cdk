import core = require('@aws-cdk/core');
import iam =  require('@aws-cdk/aws-iam');
import { CfnOutput, CfnParameter } from '@aws-cdk/core';


export class IAMStack extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id);
    
        this.templateOptions.metadata = {
            License: 'Apache-2.0',
        };

        this.templateOptions.description = 'Building on AWS Stack';

        const password = new CfnParameter(this, 'Password', {
            noEcho: true,
            type: "String",
            description: "New account password",
            minLength: 1,
            maxLength: 41,
            constraintDescription: "the password must be between 1 and 41 characters",
            default: "default"
        })

        const user = new iam.CfnUser(this, 'CFNUser', {
            userName: 'edXProjectUser',
            loginProfile: {password: password.valueAsString},
        })

        const group = new iam.CfnGroup(this, 'CFNUserGroup', {
            managedPolicyArns: ['arn:aws:iam::aws:policy/AWSCloud9User'],
            groupName: 'CDKGroup'
        })

        const attachgroup = new iam.CfnUserToGroupAddition(this, 'Users', {
            groupName: group.ref,
            users: [user.ref]
        })

        const policy = new iam.CfnPolicy(this, 'CFNUserPolicies', {
            groups: [group.ref],
            policyName: 'edXProjectPolicy',
            policyDocument: {  
                Statement:[{  
                Sid:"Sid",
                Effect:"Allow",
                Action:[
                    "iam:*",
                    "rds:*",
                    "sns:*",
                    "cloudformation:*",
                    "rekognition:*",
                    "ec2:*",
                    "cognito-idp:*",
                    "sqs:*",
                    "xray:*",
                    "s3:*",
                    "elasticloadbalancing:*",
                    "cloud9:*",
                    "lambda:*",
                    "tag:GetResources",
                    "logs:*",
                    "kms:ListRetirableGrants",
                    "kms:GetKeyPolicy",
                    "kms:ListResourceTags",
                    "kms:ReEncryptFrom",
                    "kms:ListGrants",
                    "kms:GetParametersForImport",
                    "kms:ListKeys",
                    "kms:GetKeyRotationStatus",
                    "kms:ListAliases",
                    "kms:ReEncryptTo",
                    "kms:DescribeKey"
                ],
                Resource: "*",
                }]
            }
        })

        const cfnaccesskey = new iam.CfnAccessKey(this, 'CFNkeys', {
            userName: user.ref
        })

        const output = new CfnOutput(this, 'EdXProjectUser',{
            value: user.attrArn
        })

        const output2 = new CfnOutput(this, 'AccessKey',{
            value: cfnaccesskey.ref,
            description: "AWSAccessKeyId of new user"
        })

        const output3 = new CfnOutput(this, 'SecretKey',{
            value: cfnaccesskey.attrSecretAccessKey,
            description: "AWSSecretKey of new user"
        })
    }
}
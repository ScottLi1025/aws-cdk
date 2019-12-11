import core = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import cognito = require('@aws-cdk/aws-cognito');
import lambda = require('@aws-cdk/aws-lambda');
import cfn = require('@aws-cdk/aws-cloudformation');
import fs = require('fs');


export class CognitoStack extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id, props);

        this.templateOptions.description = 'Building on AWS Cognito Stack Modified https://github.com/rosberglinhares/CloudFormationCognitoCustomResources';

        const LogoutURL = new core.CfnParameter(this, 'LogoutURL', {
            type: 'String',
            default: 'http://localhost'
        })

        const CallbackURL = new core.CfnParameter(this, 'CallbackURL', {
            type: 'String',
            default: 'http://localhost/callback'
        })

        const AppDomain = new core.CfnParameter(this, 'AppDomain', {
            type: 'String',
            default: 'default5'
        })

        const CognitoSNSPolicy = new iam.CfnManagedPolicy(this, 'CognitoSNSPolicy', {
            description: 'Managed policy to allow Amazon Cognito to access SNS',
            policyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Action: [
                        'sns:publish'
                    ],
                    Resource: "*"
                }]
            }
        })

        const SNSRole = new iam.CfnRole(this, 'SNSRole', {
            description: '"An IAM Role to allow Cognito to send SNS messages"',
            roleName: 'cognito-sns-role',
            managedPolicyArns: [CognitoSNSPolicy.ref],
            assumeRolePolicyDocument: {  
                Version: '2012-10-17',  
                Statement:[{  
                    Effect:"Allow",
                    Action:[
                        'sts:AssumeRole'
                    ],
                Principal:{
                    Service:[
                        'cognito-idp.amazonaws.com'
                    ]
                }
                }]
            }
        })

        SNSRole.addDependsOn(CognitoSNSPolicy)
      
        const CognitoUserPool = new cognito.CfnUserPool(this, 'CognitoUserPool', {
            userPoolName: 'photos-pool',
            aliasAttributes: ['email', 'phone_number'],
            autoVerifiedAttributes: ['email'],
            emailVerificationMessage: "Hi, Your verification code is <br/>{####}\n",
            emailVerificationSubject: 'EDX Email Verification',
            mfaConfiguration: 'OPTIONAL',
            policies: {
                passwordPolicy:{
                    minimumLength: 8,
                    requireUppercase: true,
                    requireLowercase: true,
                    requireNumbers: true,
                    requireSymbols: true
                }
            },
            schema:[
                {
                    name: 'nickname',
                    attributeDataType: 'String',
                    mutable: false,
                    required: true
                },
                {
                    name: 'email',
                    attributeDataType: 'String',
                    mutable: false,
                    required: true
                },
                {
                    name: 'phone_number',
                    attributeDataType: 'String',
                    mutable: false,
                    required: true
                }
            ],
            smsConfiguration:{
                externalId: core.Aws.STACK_NAME + '-external',
                snsCallerArn: SNSRole.attrArn
            }
        })

        const CognitoUserPoolClient = new cognito.CfnUserPoolClient(this, 'CognitoUserPoolClient', {
            clientName: 'WebsiteClient',
            generateSecret: true,
            userPoolId: CognitoUserPool.ref
        })

        const CognitoIdPool = new cognito.CfnIdentityPool(this, 'CognitoIdPool', {
            identityPoolName: 'edxcognitoidpool',
            cognitoIdentityProviders: [{
                clientId: CognitoUserPoolClient.ref,
                providerName: CognitoUserPool.attrProviderName
            }],
            allowUnauthenticatedIdentities: false
        })
    
        const CognitoCustomResourceRole = new iam.CfnRole(this, 'CognitoCustomResourceRole', {
            roleName: 'cognito_resource_role',
            assumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Action: 'sts:AssumeRole',
                    Principal: {
                        Service: 'lambda.amazonaws.com'
                    }
                }]
            },
            policies: [{
                policyName: 'WriteCloudWatchLogs',
                policyDocument: {
                    Version: '2012-10-17',
                    Statement:[{
                        Effect: 'Allow',
                        Action:[
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        Resource:'arn:aws:logs:*:*:*'
                    }]
                }
            },
            {
                policyName: 'UpdateUserPoolClient',
                policyDocument: {
                    Version: '2012-10-17',
                    Statement:[{
                        Effect: 'Allow',
                        Action:[
                            'cognito-idp:UpdateUserPoolClient'
                        ],
                        Resource: 'arn:aws:cognito-idp:*:*:userpool/*'
                    }]
                }
            },
            {
                policyName: 'ManageUserPoolDomain',
                policyDocument: {
                    Version: '2012-10-17',
                    Statement:[{
                        Effect: 'Allow',
                        Action:[
                            'cognito-idp:CreateUserPoolDomain'
                        ],
                        Resource: 'arn:aws:cognito-idp:*:*:userpool/*'
                    },
                    {
                        Effect: 'Allow',
                        Action:[
                            'cognito-idp:DeleteUserPoolDomain'
                        ],
                        Resource: 'arn:aws:cognito-idp:*:*:userpool/*'
                    },
                    {
                        Effect: 'Allow',
                        Action:[
                            'cognito-idp:DescribeUserPoolDomain'
                        ],
                        Resource: '*'
                    },
                    {
                        Effect: 'Allow',
                        Action:[
                            'cognito-idp:DescribeUserPoolClient'
                        ],
                        Resource: '*'
                    }
                    ]
                }
            },
            {
                policyName: 'InvokeLambdaFunction',
                policyDocument: {
                    Version: '2012-10-17',
                    Statement:[{
                        Effect: 'Allow',
                        Action:[
                            'lambda:InvokeFunction'
                        ],
                        Resource: 'arn:aws:lambda:*:*:function:*'
                    }]
                }
            }
            ]
      })

        const CognitoUserPoolClientClientSettings = new cfn.CustomResource(this, 'CognitoUserPoolClientClientSettings', {
            provider: cfn.CustomResourceProvider.lambda(new lambda.SingletonFunction(this, 'Singleton', {
            uuid: 'f6dc07d9-1047-4c1b-afdd-749323c87b35',
            code: new lambda.InlineCode(fs.readFileSync('./lib/CognitoLambda/cognito.js', { encoding: 'utf-8' })),
            handler: 'index.handler',
            runtime: lambda.Runtime.NODEJS_8_10,
            role: iam.Role.fromRoleArn(this, 'CognitoCustomResourceIRole', CognitoCustomResourceRole.attrArn)
            })),
            properties: {
                UserPoolId: CognitoUserPool.ref,
                UserPoolClientId: CognitoUserPoolClient.ref,
                AppDomain: AppDomain.valueAsString,
                SupportedIdentityProviders: [
                    'COGNITO'
                ],
                CallbackURL: CallbackURL.valueAsString,
                LogoutURL: LogoutURL.valueAsString,
                AllowedOAuthFlowsUserPoolClient: true,
                AllowedOAuthFlows: [
                    'code'
                ],
                AllowedOAuthScopes: [
                    'openid'
                ]
            }
        });

        const CognitoUserPoolId = new core.CfnOutput(this, 'CognitoUserPoolId', {
            description: 'The Pool ID of the Cognito User Pool',
            value: CognitoUserPool.ref,
            exportName: "CognitoPoolId"
        })

        const CognitoUserPoolProviderURL = new core.CfnOutput(this, 'CognitoUserPoolProviderURL', {
            description: 'The Pool ProviderURL of the Cognito User Pool',
            value: CognitoUserPool.attrProviderUrl
        })

        const CognitoUserPoolArn = new core.CfnOutput(this, 'CognitoUserPoolArn', {
            description: 'The Pool Arn of the Cognito User Pool',
            value: CognitoUserPool.attrArn
        })

        const CognitoUserPoolClientId = new core.CfnOutput(this, 'CognitoUserPoolClientId', {
            description: 'The App Client ID',
            value: CognitoUserPoolClient.ref,
            exportName: "CognitoClientId"
        })

        const ClientSecret = new core.CfnOutput(this, 'ClientSecret', {
            description: 'The Client Secret',
            value: core.Fn.getAtt('CognitoUserPoolClientClientSettings', 'ClientSecret').toString(),
            exportName: "ClientSecret"
        })
    }
}
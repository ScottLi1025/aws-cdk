import cdk = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import cognito = require('@aws-cdk/aws-cognito');
import lambda = require('@aws-cdk/aws-lambda');


export class CognitoStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      this.templateOptions.description = 'Building on AWS Cognito Stack Modified https://github.com/rosberglinhares/CloudFormationCognitoCustomResources';

      const LogoutURL = new cdk.CfnParameter(this, 'LogoutURL', {
          type: 'String',
          default: 'http://localhost'
      })

      const CallbackURL = new cdk.CfnParameter(this, 'CallbackURL', {
          type: 'String',
          default: 'http://localhost/callback'
      })

      const AppDomain = new cdk.CfnParameter(this, 'AppDomain', {
          type: 'String',
          default: 'us-east-1'
      })

      const CognitoSNSPolicy = new iam.CfnManagedPolicy(this, 'CognitoSNSPolicy', {
          description: 'Managed policy to allow Amazon Cognito to access SNS',
          policyDocument: {
              Version: '2012-10-17',
              Statement: [{
                  Effect: 'Allow',
                  Action: 'sns:publish',
                  resource: "*"
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
              //externalId: cdk.Fn.sub(cdk.Aws.STACK_NAME),
              snsCallerArn: SNSRole.attrArn
          }


      })
      const CognitoUserPoolClient = new cognito.CfnUserPoolClient(this, 'CognitoUserPoolClient', {
          clientName: 'WebsiteClient',
          generateSecret: true,
          userPoolId: CognitoUserPool.ref
      })

    //   const CognitoUserPoolClientClientSettings = new cfn.CfnCustomResource(this, 'CognitoUserPoolClientClientSettings', {
    //       serviceToken: 
          
    //   })
      const CognitoCustomResourceRole = new iam.CfnRole(this, 'CognitoCustomResourceRole', {
          roleName: 'cognito_resource_role',
          assumeRolePolicyDocument: {
              Version: '2012-10-17',
              statement: [{
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
          ],
          

      })


      const lambda2 = new lambda.Function(this, 'CloudFormationCognitoUserPoolClientSettings', {
          functionName: 'CloudFormationCognitoUserPoolClientSettings',
          handler: 'index.handler',
          code: lambda.Code.asset('lib/CognitoLambda'),
          runtime: lambda.Runtime.NODEJS_8_10,
          role: iam.Role.fromRoleArn(this, 'CognitoCustomResourceIRole', CognitoCustomResourceRole.attrArn)
      })

    //   const CognitoIdPool = new cognito.CfnIdentityPool(this, 'cfnProperties', {
    //       identityPoolName: 'edxcognitoidpool',
    //       cognitoIdentityProviders
    //   })
      const CognitoUserPoolId = new cdk.CfnOutput(this, 'CognitoUserPoolId', {
          description: 'The Pool ID of the Cognito User Pool',
          value: CognitoUserPool.ref
      })

      const CognitoUserPoolProviderURL = new cdk.CfnOutput(this, 'CognitoUserPoolProviderURL', {
          description: 'The Pool ProviderURL of the Cognito User Pool',
          value: CognitoUserPool.attrProviderUrl
      })

      const CognitoUserPoolArn = new cdk.CfnOutput(this, 'CognitoUserPoolArn', {
          description: 'The Pool Arn of the Cognito User Pool',
          value: CognitoUserPool.attrArn
      })

      const CognitoUserPoolClientId = new cdk.CfnOutput(this, 'CognitoUserPoolClientId', {
          description: 'The App Client ID',
          value: CognitoUserPoolClient.ref
      })

    //   const ClientSecret = new cdk.CfnOutput(this, 'ClientSecret', {
    //       description: 'The Client Secret',
    //       value:
    //   })
    }
}
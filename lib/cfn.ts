import core = require('@aws-cdk/core');
import cfn = require('@aws-cdk/aws-cloudformation');

export class CfnStack extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id, props);

        const SourceBucket = new core.CfnParameter(this, 'SourceBucket', {
            type: 'String',
            description: 'Source Bucket with nested cloudformation template.',
            default: 'cfn-cdk'
        })

        const Password = new core.CfnParameter(this, 'Password', {
            noEcho: true,
            type: 'String',
            description: 'New account.',
            minLength: 1,
            maxLength: 41,
            constraintDescription:'the password must be between 1 and 41 characters.',
            default: 'masterpassword'
        })

        const DBpassword = new core.CfnParameter(this, 'DBPassword', {
            noEcho: true,
            type: "String",
            description: "New account and RDS password",
            minLength: 1,
            maxLength: 41,
            constraintDescription: "the password must be between 1 and 41 characters",
            default: "masterpassword"
        })

        const Appdomain = new core.CfnParameter(this, 'AppDomain', {
            type: 'String',
            description: 'Unique subdomain for cognito app.',
            allowedPattern: '^[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?$',
            constraintDescription: 'Domain names can only contain lower-case letters, numbers, and hyphens.',
            default: 'default6'
        })

        const IAMStack = new cfn.CfnStack(this, 'IAMStack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/iamtack.template.json',
            timeoutInMinutes: 5,
            parameters: {
                Password: Password.valueAsString
            }
        })

        const VPCStack = new cfn.CfnStack(this, 'VPCStack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/vpcstack.template.json',
            timeoutInMinutes: 5
        })

        const Cloud9Stack = new cfn.CfnStack(this, 'Cloud9Stack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/cloud9inlinestack.template.json',
            timeoutInMinutes: 5,
            parameters: {
                PublicSubnet1: core.Fn.importValue('PublicSubnet1')
            }
        })

        const SecurityStack = new cfn.CfnStack(this, 'SecurityStack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/securitystack.template.json',
            timeoutInMinutes: 5,
            parameters: {
                Ec2VPCId: core.Fn.importValue("Ec2VPCId"),
                EdxProjectCloud9Sg: core.Fn.importValue("EdxProjectCloud9Sg")
            }
        })

        const DBStack = new cfn.CfnStack(this, 'DBStack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/dbstack.template.json',
            timeoutInMinutes: 20,
            parameters: {
                Ec2VPCId: core.Fn.importValue("Ec2VPCId"),
                WebSecurityGroup: core.Fn.importValue("WebSecurityGroup"),
                EdxProjectCloud9Sg: core.Fn.importValue("EdxProjectCloud9Sg"),
                LambdaSecurityGroup: core.Fn.importValue("LambdaSecurityGroup"),
                PrivateSubnet1: core.Fn.importValue("PrivateSubnet1"),
                PrivateSubnet2: core.Fn.importValue("PrivateSubnet2"),
                DBPassword: DBpassword.valueAsString
            }
        })

        const CDNStack = new cfn.CfnStack(this, 'CDNStack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/cdnstack.template.json',
            timeoutInMinutes: 20,
            parameters: {
                SourceBucket: SourceBucket.valueAsString,
                Ec2VPCId: core.Fn.importValue("Ec2VPCId"),
                WebSecurityGroup: core.Fn.importValue("WebSecurityGroup"),
                PublicSubnet1: core.Fn.importValue("PublicSubnet1"),
                PublicSubnet2: core.Fn.importValue("PublicSubnet2")
            }
        })

        const CognitoStack = new cfn.CfnStack(this, 'CognitoStack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/cognitostack.template.json',
            timeoutInMinutes: 5,
            parameters: {
                LogoutURL: '' + 'https://' + core.Fn.importValue("DomainName"),
                CallbackURL: '' + 'https://' + core.Fn.importValue("DomainName"),
                AppDomain: Appdomain.valueAsString
            }
        })

        const ParametesStack = new cfn.CfnStack(this, 'ParametesStack', {
            templateUrl: 'https://s3.amazonaws.com/'+ SourceBucket.valueAsString +'/parameterstack.template.json',
            timeoutInMinutes: 15,
            parameters: {
                CognitoPoolId: core.Fn.importValue("CognitoPoolId"),
                CognitoClientId: core.Fn.importValue("CognitoClientId"),
                CognitoClientSecret: core.Fn.importValue("ClientSecret"),
                CognitoDomain: Appdomain + '.auth' + core.Aws.REGION + '.amazoncognito.com',
                BaseUrl: '' + 'https://' + core.Fn.importValue("DomainName"),
                //ImageS3Bucket: SourceBucket.valueAsString,
                DBPassword: DBpassword.valueAsString,
                MyDBEndpoint: core.Fn.importValue("MyDBEndpoint")
            }
        })

        const AccessKey = new core.CfnOutput(this, 'AccessKey', {
            value: core.Fn.importValue('AccessKey'),
            description: 'AWSAccessKeyId of new user.'
        })
        
        const SecretKey = new core.CfnOutput(this, 'SecretKey', {
            value: core.Fn.importValue('SecretKey'),
            description: 'AWSSecretKey of new user.'
        })

        const MyDBEndpoint = new core.CfnOutput(this, 'MyDBEndpoint', {
            value: core.Fn.importValue('MyDBEndpoint'),
            description: 'MySQL RDS'
        })

        const DomainName = new core.CfnOutput(this, 'DomainName', {
            value: core.Fn.importValue('DomainName'),
            description: 'Webpage CloudFront Domain name.'
        })

        // const ImageS3Bucket = new core.CfnOutput(this, 'ImageS3Bucket', {
        //     value: core.Fn.importValue('ImageS3Bucket'),
        //     description: 'Bucket to save images.'
        // })

        // const LabelsLambda = new core.CfnOutput(this, 'LabelsLambda', {
        //     value: core.Fn.importValue('LabelsLambda'),
        //     description: 'Labels Lambda'
        // })
    }
}


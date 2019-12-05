import cdk = require('@aws-cdk/core');
import ssm = require('@aws-cdk/aws-ssm')
import { CfnParameter, Stack } from '@aws-cdk/core';

export class ParameterStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      this.templateOptions.description = 'Building on AWS Parameter Stack';

      const CognitoPoolId = new CfnParameter(this, 'CognitoPoolId', {
        type: "String",
        default: "default"
      })

      const CognitoClientId = new CfnParameter(this, 'CognitoClientId', {
        type: "String",
        default: "default"
      })

      const CognitoClientSecret = new CfnParameter(this, 'CognitoClientSecret', {
        type: "String",
        default: "default"
      })

      const CognitoDomain = new CfnParameter(this, 'CognitoDomain', {
        type: "String",
        default: "default"
      })

      const BaseUrl = new CfnParameter(this, 'BaseUrl', {
        type: "String",
        default: "default"
      })

      const DBendpoint = new CfnParameter(this, 'MyDBEndpoint', {
          type: "String",
          default: "default"
      })
      const s3 = new CfnParameter(this, 'ImageS3Bucket', {
          type: "String",
          default: "default"
      })

      const DBpassword = new CfnParameter(this, 'DBPassword', {
        noEcho: true,
        type: "String",
        description: "RDS Password.",
        minLength: 1,
        maxLength: 41,
        constraintDescription: "the password must be between 1 and 41 characters",
        default: "default"
      })

      const CognitoPoolIdParameter = new ssm.CfnParameter(this, 'CognitoPoolIdParameter', {
        name: 'edx-COGNITO_POOL_ID',
        type: 'String',
        value: CognitoPoolId.valueAsString
      })

      const CognitoClientIdParameter = new ssm.CfnParameter(this, 'CognitoClientIdParameter', {
        name: 'edx-COGNITO_CLIENT_ID',
        type: 'String',
        value: CognitoClientId.valueAsString
      })

      const CognitoClientSecretParameter = new ssm.CfnParameter(this, 'CognitoClientSecretParameter', {
        name: 'edx-COGNITO_CLIENT_SECRET',
        type: 'String',
        value: CognitoClientSecret.valueAsString
      })

      const CognitoDomainParameter = new ssm.CfnParameter(this, 'CognitoDomainParameter',{
        name: 'edx-COGNITO_DOMAIN',
        type: 'String',
        value: CognitoDomain.valueAsString
      })

      const BaseUrlParameter = new ssm.CfnParameter(this, 'BaseUrlParameter', {
        name: 'BaseUrlParameter',
        type: 'String',
        value: BaseUrl.valueAsString
      })

      const DBHostParameter = new ssm.CfnParameter(this, 'DBHostParameter', {
        name: 'edx-DATABASE_HOST',
        type: 'String',
        value: DBendpoint.valueAsString
      })

      const DBUserParameter = new ssm.CfnParameter(this, 'DBUserParameter', {
        name: 'edx-DATABASE_USER',
        type: 'String',
        value: 'web_user'
      })

      const DBPasswordParameter = new ssm.CfnParameter(this, 'DBPasswordParameter', {
        name: 'edx-DATABASE_PASSWORD',
        type: 'String',
        value: DBpassword.valueAsString
      })
      
      const DBNameParameter = new ssm.CfnParameter(this, 'DBNameParameter', {
        name: 'edx-DATABASE_DB_NAME',
        type: 'String',
        value: 'Photos'
      })

      const FlaskSecretParameter = new ssm.CfnParameter(this, 'FlaskSecretParameter', {
        name: 'edx-FLASK_SECRET',
        type: 'String',
        value: 'secret'
      })

      const PhotosBuckeTParameter = new ssm.CfnParameter(this, 'PhotosBuckeTParameter', {
        name: 'edx-PHOTOS_BUCKET',
        type: 'String',
        value: s3.valueAsString
      })
    }
}

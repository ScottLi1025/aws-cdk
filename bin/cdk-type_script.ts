#!/usr/bin/env node
import 'source-map-support/register';
import core = require('@aws-cdk/core');
import { CDNStack } from '../lib/cdn';
import { DBstack } from '../lib/RDS';
import { Cloud9Stack } from '../lib/cloud9';
import { SecurityStack } from '../lib/security';
import { ParameterStack } from '../lib/parameters';
import { IAMStack } from '../lib/iam';
import { VPCStack } from '../lib/vpc';
import { CognitoStack } from '../lib/cognito'
import { Cloud9StackInline } from '../lib/cloud9-Inline'
import { SNSSQSStack } from '../lib/snssqs'
 

const app = new core.App();
new CDNStack(app, 'cdnstack');
new DBstack(app, 'dbstack');
new Cloud9Stack(app, 'cloud9stack');
new SecurityStack(app, 'securitystack');
new ParameterStack(app, 'parameterstack');
new IAMStack(app, 'iamtack');
new VPCStack(app, 'vpcstack');
new CognitoStack(app, 'cognitostack')
new Cloud9StackInline(app, 'cloud9inlinestack')
new SNSSQSStack(app, 'snssqsstack');
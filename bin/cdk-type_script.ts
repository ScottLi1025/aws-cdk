#!/usr/bin/env node
import 'source-map-support/register';
import core = require('@aws-cdk/core');
import { CognitoStack } from '../lib/cognito';

const app = new core.App();
new CognitoStack(app, 'cfnStack');
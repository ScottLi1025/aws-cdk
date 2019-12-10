import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import { ParameterStack } from '../lib/parameters';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new ParameterStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
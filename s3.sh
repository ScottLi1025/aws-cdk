#!/bin/bash

npm run cdk synth -- -o cdk.out

aws s3 cp "cdk.out/cdnstack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/cfnstack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/cloud9inlinestack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/cognitostack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/dbstack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/iamtack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/securitystack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/parameterstack.template.json" s3://cfn-cdk
aws s3 cp "cdk.out/vpcstack.template.json" s3://cfn-cdk
import core = require('@aws-cdk/core');
import Bucket  = require("@aws-cdk/aws-s3");
import {CfnParameter} from "@aws-cdk/core";
import {CfnStack} from "@aws-cdk/aws-cloudformation";
import { DBstack } from '../lib/RDS';
import { VPCStack } from '../lib/vpc';
import { SecurityStack } from '../lib/security';
import { CDNStack } from '../lib/cdn';
import {CognitoStack} from '../lib/cognito';


export class cfnstack extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id, props);

        const SourceBucket = new CfnParameter(this, 'SourceBucket', {
            type: "String",
            description: "Source Bucket with nested cloudformation template."
        })

        const password = new CfnParameter(this, 'Password', {
            noEcho: true,
            type: "String",
            description: "New account password",
            minLength: 1,
            maxLength: 41,
            constraintDescription: "the password must be between 1 and 41 characters",
            default: "default"
        })


        const DBPassword = new CfnParameter(this, 'DBPassword', {
            noEcho: true,
            type: "String",
            description: "RDS Password",
            minLength: 1,
            maxLength: 41,
            constraintDescription: "the password must be between 1 and 41 characters",
            default: "default"
        })

        const AppDomain = new CfnParameter(this, 'AppDomain', {
            type: "String",
            description: "Unique subdomain for cognito app.",
            allowedPattern: "^[a-z0-9](?:[a-z0-9\\-]{0,61}[a-z0-9])?$",
            constraintDescription: "Domain names can only contain lower-case letters, numbers, and hyphens."
        })

        const IAMStack = new CfnStack(this, 'IAMStack', {
            templateUrl: "!Sub 'https://s3.amazonaws.com/${SourceBucket}/iam.yaml'",
            timeoutInMinutes: 5,
            parameters: password //miss ref

        })

        const VPCStack = new CfnStack(this, 'VPCstack', {
            templateUrl: "VPCstack", //need ref
            timeoutInMinutes: 5,
            parameters: password

        })

        const SecurityStack = new CfnStack(this, 'SecurityStack', {
            templateUrl: "SecurityStack", //need ref
            timeoutInMinutes: 5,
            parameters: {
                EC2VpcId: "!GetAtt VPCStack.Outputs.VPC",
                EdxProjectCloud9Sg: "!GetAtt Cloud9Stack.Outputs.EdxProjectCloud9Sg"
            }
        })

        const DBStack = new CfnStack(this, 'DBStack', {
            templateUrl: "DBstack", //need ref
            timeoutInMinutes: 20,
            parameters: {
                EC2VpcId: "!GetAtt VPCStack.Outputs.VPC",
                EdxProjectCloud9Sg: "!GetAtt Cloud9Stack.Outputs.EdxProjectCloud9Sg",
                WebSecurityGroup: "!GetAtt SecurityStack.Outputs.WebSecurityGroup",
                PrivateSubnet1: "!GetAtt VPCStack.Outputs.PrivateSubnet1",
                PrivateSubnet2: "!GetAtt VPCStack.Outputs.PrivateSubnet2"  //need help
            }
        })

        const CDNStack = new CfnStack(this, 'CDNStack', {
            templateUrl: "DBstack", //need ref
            timeoutInMinutes: 30,
            parameters: {
                SourceBucket: "!Ref SourceBucket",
                EC2VpcId: "!GetAtt VPCStack.Outputs.VPC",
                PublicSubnet1: "!GetAtt VPCStack.Outputs.PublicSubnet1",
                PublicSubnet2: "!GetAtt VPCStack.Outputs.PublicSubnet2",
                WebSecurityGroup: "!GetAtt SecurityStack.Outputs.WebSecurityGroup"
            }
        })

        const ParametesStack = new CfnStack(this, 'ParametesStack', {
            templateUrl: "DBstack", //need ref
            timeoutInMinutes: 30,
            parameters: {
                CognitoPoolId: "!GetAtt CognitoStack.Outputs.CognitoUserPoolId",
                CognitoClientId: "!GetAtt CognitoStack.Outputs.CognitoUserPoolClientId",
                CognitoClientSecret: "!GetAtt CognitoStack.Outputs.ClientSecret",
                CognitoDomain: "!Sub \"${AppDomain}.auth.${AWS::Region}.amazoncognito.com\"",
                WebSecurityGroup: "!GetAtt SecurityStack.Outputs.WebSecurityGroup",
                BaseUrl:
                    "    !Join\n" +
                    "          - ''\n" +
                    "          - - 'https://'\n" +
                    "            - !GetAtt CDNStack.Outputs.DomainName",
                ImageS3Bucket:"!Ref ImageS3Bucket",
                DBPassword:"!Ref DBPassword",
                MyDBEndpoint:"!GetAtt DBStack.Outputs.MyDBEndpoint"
            }
        })

        const Cloud9Stack = new CfnStack(this, 'Cloud9Stack', {
             templateUrl:"!Sub 'https://s3.amazonaws.com/${SourceBucket}/cloud9.yaml'",
             timeoutInMinutes:5,
             parameters: {
                 PublicSubnet1: "PublicSubnet1: !GetAtt VPCStack.Outputs.PublicSubnet1\n"
             }
        })

        const CognitoStack = new CfnStack(this, "CognitoStack",{
              templateUrl: "!Sub 'https://s3.amazonaws.com/${SourceBucket}/cognito.yaml'",
              timeoutInMinutes:5,
              parameters: {
                  LogoutUrl: " !Join\n" +
                      "          - ''\n" +
                      "          - - 'https://'\n" +
                      "            - !GetAtt CDNStack.Outputs.DomainName",
                  CallbackUrl:"     !Join\n" +
                      "          - ''\n" +
                      "          - - 'https://'\n" +
                      "            - !GetAtt CDNStack.Outputs.DomainName\n" +
                      "            - '/callback'",
                  AppDomain: "!Ref AppDomain"
              }
        })

        const ImageS3Bucket = new Bucket(this,'ImageS3Bucket',{
              bucketName:"!Sub 'imagebucket${AWS::AccountId}'"
        })


    }}
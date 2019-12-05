import cdk = require('@aws-cdk/core');
import { CfnLoadBalancer } from '@aws-cdk/aws-elasticloadbalancingv2';
import { CfnParameter } from '@aws-cdk/core';
import { CfnInstance, InstanceType } from '@aws-cdk/aws-ec2'

//https://github.com/wongcyrus/AWS-Developer-Building-on-AWS/blob/master/Week%203/Exercise%208/web.yaml

export class SecurityStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
      super(scope, id, props);

      const BucketParameter = new CfnParameter(this, "SourceBucket", {
          type: "String",
          default: "default"
      })

      const PublicSubParameter1 = new CfnParameter(this, "PublicSubnet1", {
          type: "AWS::EC2::VPC::Id",
          default: "default"
      })

      const PublicSubParameter2 = new CfnParameter(this, "PublicSubnet2", {
          type: "AWS::EC2::VPC::Id",
          default: "default"
      })

      const PrivateSubParameter1 = new CfnParameter(this, "PrivateSubnet1", {
          type: "AWS::EC2::VPC::Id",
          default: "default"
      })

      const PrivateSubParameter2 = new CfnParameter(this, "PrivateSubnet2", {
          type: "AWS::EC2::VPC::Id",
          default: "default"
      })

      const WebSGParameter = new CfnParameter(this, "WebSecurityGroup", {
          type: "AWS::EC2::SecurityGroup::Id",
          default: "default"
      })

      const AmiIDParameter = new CfnParameter(this, "LatestAmiId", {
          type: "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
          default: "/aws/service/ami-amazon-linux-latest/amzn-ami-hvm-x86_64-gp2"
      })

      const instance1 = new CfnInstance(this, "WebInstance1", {
          imageId: "LatestAmiId", // need !ref
          instanceType: "t2.micro",
          iamInstanceProfile: "WebServerInstanceProfile", // need !ref
          tags: [{
              "key" : "Name",
              "value": "WebServer1"
          }],
          // userData: "" // don't know how to set this
          // networkInterfaces: 
      })

      const instance2 = new CfnInstance(this, "WebInstance2", {
          imageId: "LatestAmiId", // miss !ref
          instanceType: "t2.micro",
          iamInstanceProfile: "WebServerInstanceProfile", //miss !ref
          tags: [{
            "key" : "Name",
            "value": "WebServer2"
          }],
      })

      const LB = new CfnLoadBalancer(this, "LoadBalancer", {
          subnets: ["PublicSubnet1", "PublicSubnet2"] //not ref
          
      })
    }
}
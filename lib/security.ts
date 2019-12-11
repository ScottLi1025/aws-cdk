import core = require('@aws-cdk/core');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require('@aws-cdk/aws-ec2')


export class SecurityStack extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id, props);

        this.templateOptions.description = 'Building on AWS Project Security Stack';

        const Ec2VPCId = new core.CfnParameter(this, 'Ec2VPCId', {
            type: 'AWS::EC2::VPC::Id',
            default: "vpc-027091518c3abbde4"
        })

        const EdxProjectCloud9Sg = new core.CfnParameter(this, 'EdxProjectCloud9Sg',{
            type: 'AWS::EC2::SecurityGroup::Id',
            default: 'sg-0eb3c75cb8062fabc'
        })

        const WebServerRole = new iam.CfnRole(this, 'WebServerRole', {
            roleName: 'ec2-webserver-role',
            assumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: {
                        Service: [
                            "ec2.amazonaws.com"
                        ]
                    },
                    Action: [
                        "sts:AssumeRole"
                    ]
                }]
            },
            path: "/",
            managedPolicyArns: [
                "arn:aws:iam::aws:policy/AmazonS3FullAccess",
                "arn:aws:iam::aws:policy/AmazonRekognitionReadOnlyAccess",
                "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM",
                "arn:aws:iam::aws:policy/AmazonPollyReadOnlyAccess",
                "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
            ],
            policies: [{
                policyName: 'SystemsManagerParameters',
                policyDocument: {
                    Version: "2012-10-17",
                    Statement: [{
                        Effect: "Allow",
                        Action: "ssm:DescribeParameters",
                        Resource: "*"
                    },
                    {
                        Effect: "Allow",
                        Action: "ssm:GetParameters",
                        Resource: '!Sub "arn:aws:logs::${AWS::Region}:*:*"' //need to set !Sub "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/edx-*" not *
                    }
                    ]}
            },
            {
                policyName: 'LogRolePolicy',
                policyDocument: {
                    Version: "2012-10-17",
                    Statement: [{
                        Effect: 'Allow',
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents',
                            'logs:DescribeLogStreams'
                        ],
                        Resource: '!Sub "arn:aws:logs::${AWS::Region}:*:*"' // NOT * IS !Sub "arn:aws:logs::${AWS::Region}:*:*"
                    }]
                }
            }
            ]
        })

        const WebServerInstanceProfile = new iam.CfnInstanceProfile(this, 'WebServerInstanceProfile', {
            path: "/",
            roles: [WebServerRole.ref]
        })

        const WebSecurityGroup = new ec2.CfnSecurityGroup(this, 'WebSecurityGroup',{
            groupName: 'web-server-sg',
            groupDescription: 'HTTP traffic',
            vpcId: Ec2VPCId.valueAsString,
            securityGroupIngress:[{
                ipProtocol: 'tcp',
                fromPort: 80,
                toPort: 80,
                cidrIp: '0.0.0.0/0'
            }],
            securityGroupEgress:[{
                ipProtocol: 'tcp',
                fromPort: 0,
                toPort: 65535,
                cidrIp: '0.0.0.0/0'
            }]
        })

        const LambdaSecurityGroup = new ec2.CfnSecurityGroup(this, 'LambdaSecurityGroup', {
            groupName: 'labels-lambda-sg',
            groupDescription: 'HTTP traffic',
            vpcId: Ec2VPCId.valueAsString,
            securityGroupEgress:[{
                ipProtocol: 'tcp',
                fromPort: 0,
                toPort: 65535,
                cidrIp: '0.0.0.0/0'
            }]
        })

        const WebServerInstanceProfileId = new core.CfnOutput(this, 'WebServerInstanceProfileId', {
            value: WebServerInstanceProfile.ref,
            description: 'Web Server Instance Profile',
            exportName: 'WebServerInstanceProfileId'
        })

        const WebServerRoleId = new core.CfnOutput(this, 'WebServerRoleId', {
            value: WebServerRole.ref,
            description: 'Web Server Role',
            exportName: 'WebServerRoleId'
        })

        const WebSecurityGroupId = new core.CfnOutput(this, 'WebSecurityGroupId', {
            value: WebSecurityGroup.ref,
            description: 'Web Security Group',
            exportName: 'WebSecurityGroup'
        })

        const LambdaSecurityGroupId = new core.CfnOutput(this, 'LambdaSecurityGroupId', {
            value: LambdaSecurityGroup.ref,
            description: 'Lambda Security Group',
            exportName: 'LambdaSecurityGroup'
        })
    }
}
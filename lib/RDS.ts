import core = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import rds = require('@aws-cdk/aws-rds');

export class DBstack extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id);

        this.templateOptions.metadata = {
            License: 'Apache-2.0',
        };

        this.templateOptions.description = 'Building on AWS DB Tier Stack';

        const Ec2VPCId = new core.CfnParameter(this, 'Ec2VPCId', {
            type: "AWS::EC2::VPC::Id", // remember the vpc and subnet need to create a new one and replace them to demo it
            default: 'vpc-027091518c3abbde4'
        })
    
        const PrivateSubnet1 = new core.CfnParameter(this, 'PrivateSubnet1', {
            type: 'AWS::EC2::Subnet::Id',
            default: 'subnet-05ac606304f5e3465'
        })

        const PrivateSubnet2 = new core.CfnParameter(this, 'PrivateSubnet2', {
            type: 'AWS::EC2::Subnet::Id',
            default: "subnet-0bfa46e496c16b8d6"
        })

        const DBPassword = new core.CfnParameter(this, 'DBPassword', {
            noEcho: true,
            type: "String",
            description: "New account and RDS password",
            minLength: 1,
            maxLength: 41,
            constraintDescription: "the password must be between 1 and 41 characters",
            default: "masterpassword"
        })

        const WebSecurityGroup = new core.CfnParameter(this, 'WebSecurityGroup', {
            type: 'AWS::EC2::SecurityGroup::Id',
            default: "sg-08c81f188a28d198e"
        })

        const EdxProjectCloud9Sg = new core.CfnParameter(this, 'EdxProjectCloud9Sg', {
            type: 'AWS::EC2::SecurityGroup::Id',
            default: "sg-0eb3c75cb8062fabc"
        })

        const LambdaSecurityGroup = new core.CfnParameter(this, 'LambdaSecurityGroup', {
            type: 'AWS::EC2::SecurityGroup::Id',
            default: "sg-0ccc82fdf2ea0e608"
        })

        const DBSubnetGroup = new rds.CfnDBSubnetGroup(this, 'MyDBSubnetGroup', {
            dbSubnetGroupDescription: 'MyDBSubnetGroup',
            subnetIds: [PrivateSubnet1.valueAsString, PrivateSubnet2.valueAsString]
        })

        const dbsecuritygroup = new ec2.CfnSecurityGroup(this, 'DBSecurityGroup', {
            groupDescription: 'DB traffic',
            vpcId: Ec2VPCId.valueAsString,
            securityGroupIngress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 3306,
                    toPort: 3306,
                    sourceSecurityGroupId: WebSecurityGroup.valueAsString
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 3306,
                    toPort: 3306,
                    sourceSecurityGroupId: EdxProjectCloud9Sg.valueAsString
                },
                {
                    ipProtocol: 'tcp',
                    fromPort: 3306,
                    toPort: 3306,
                    sourceSecurityGroupId: LambdaSecurityGroup.valueAsString
                },
            ],
            securityGroupEgress: [
                {
                    ipProtocol: 'tcp',
                    fromPort: 0,
                    toPort: 65535,
                    cidrIp: '0.0.0.0/0'
                }
            ]
        })

        const RDSCluster = new rds.CfnDBCluster(this, 'RDSCluster', {
            dbClusterIdentifier: 'edx-photos-db',
            databaseName: 'Photos',
            masterUsername: 'master',
            masterUserPassword: DBPassword.valueAsString,
            engineMode: 'serverless',
            scalingConfiguration: {autoPause: true, maxCapacity: 4, minCapacity: 2},
            engine: 'aurora',
            dbSubnetGroupName: DBSubnetGroup.ref,
            vpcSecurityGroupIds: [dbsecuritygroup.ref]
        })

        const DBendpointOutput = new core.CfnOutput(this, 'MyDBEndpoint', {
            value: RDSCluster.attrEndpointAddress,
            description: 'MyDB Endpoint',
            exportName: 'MyDBEndpoint'
        })
    }
}
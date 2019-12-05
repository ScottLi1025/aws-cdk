import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');
import { PublicSubnet } from '@aws-cdk/aws-ec2';
import { countResources } from '@aws-cdk/assert';


export class VPCStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.templateOptions.description = 'Building on AWS VPC Stack';

    const VPC = new ec2.CfnVPC(this, 'VPC', {
      cidrBlock: '10.1.0.0/16',
      tags: [{
        key : "Name",
        value: "edx-build-aws-vpc"
      }],
    })

    const PublicSubnet1 = new ec2.CfnSubnet(this, 'PublicSubnet1', {
      cidrBlock: '10.1.1.0/24',
      availabilityZone: cdk.Fn.select(0, cdk.Fn.getAzs(cdk.Aws.REGION)),
      vpcId: VPC.ref,
      mapPublicIpOnLaunch: true,
      tags: [{
        key: 'Name',
        value: 'edx-subnet-public-a'
      }]
    })

    const PublicSubnet2 = new ec2.CfnSubnet(this, 'PublicSubnet2', {
      cidrBlock: '10.1.2.0/24',
      availabilityZone: cdk.Fn.select(1, cdk.Fn.getAzs(cdk.Aws.REGION)),
      vpcId: VPC.ref,
      mapPublicIpOnLaunch: true,
      tags: [{
        key: 'Name',
        value: 'edx-subnet-public-b'
      }]
    })

    const PrivateSubnet1 = new ec2.CfnSubnet(this, 'PrivateSubnet1', {
      cidrBlock: '10.1.3.0/24',
      availabilityZone: cdk.Fn.select(0, cdk.Fn.getAzs(cdk.Aws.REGION)),
      vpcId: VPC.ref,
      tags: [{
        key: 'Name',
        value: 'edx-subnet-private-a'
      }]
    })

    const PrivateSubnet2 = new ec2.CfnSubnet(this, 'PrivateSubnet2', {
      cidrBlock: '10.1.4.0/24',
      availabilityZone: cdk.Fn.select(1, cdk.Fn.getAzs(cdk.Aws.REGION)),
      vpcId: VPC.ref,
      tags: [{
        key: 'Name',
        value: 'edx-subnet-private-b'
      }]
    })

    const InternetGateway = new ec2.CfnInternetGateway(this, 'InternetGateway', {
      tags: [{
        key : "Name",
        value: "edx-igw"
      }]
    })

    const AttachGateway = new ec2.CfnVPCGatewayAttachment(this, 'AttachGateway', {
      vpcId: VPC.ref,
      internetGatewayId: InternetGateway.ref
    })

    const EIP1 = new ec2.CfnEIP(this, 'EIP1', {
      domain: 'vpc'
    })

    const NAT1 = new ec2.CfnNatGateway(this, 'NAT1', {
      allocationId: EIP1.attrAllocationId,
      subnetId: PublicSubnet1.ref
    })

    NAT1.addDependsOn(AttachGateway);

    const PrivateRouteTable1 = new ec2.CfnRouteTable(this, 'PrivateRouteTable1', {
      vpcId: VPC.ref,
      tags: [{
        key: 'Name',
        value: 'edx-routetable-private1'
      }]
    })

    const PrivateRoute1 = new ec2.CfnRoute(this, 'PrivateRoute1', {
      routeTableId: PrivateRouteTable1.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: NAT1.ref
    })

    const EIP2 = new ec2.CfnEIP(this, 'EIP2', {
      domain: 'vpc'
    })

    const NAT2 = new ec2.CfnNatGateway(this, 'NAT2', {
      allocationId: EIP2.attrAllocationId,
      subnetId: PublicSubnet2.ref
    })

    NAT2.addDependsOn(AttachGateway);

    const PrivateRouteTable2 = new ec2.CfnRouteTable(this, 'PrivateRouteTable2', {
      vpcId: VPC.ref,
      tags: [{
        key: 'Name',
        value: 'edx-routetable-private1'
      }]
    })

    const PrivateRoute2 = new ec2.CfnRoute(this, 'PrivateRoute2', {
      routeTableId: PrivateRouteTable2.ref,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: NAT2.ref
    })

    const PublicRouteTable = new ec2.CfnRouteTable(this, 'PublicRouteTable', {
      vpcId: VPC.ref,
      tags: [{
        key: 'Name',
        value: 'edx-subnet-public-b'
      }]
    })

    const PublicDefaultRoute = new ec2.CfnRoute(this, 'PublicDefaultRoute', {
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: InternetGateway.ref,
      routeTableId: PublicRouteTable.ref
    })

    PublicDefaultRoute.addDependsOn(AttachGateway);

    const PublicRouteAssociation1 = new ec2.CfnSubnetRouteTableAssociation(this, 'PublicRouteAssociation1', {
      routeTableId: PublicRouteTable.ref,
      subnetId: PublicSubnet1.ref
    })

    const PublicRouteAssociation2 = new ec2.CfnSubnetRouteTableAssociation(this, 'PublicRouteAssociation2', {
      routeTableId: PublicRouteTable.ref,
      subnetId: PublicSubnet2.ref
    })

    const PrivateRouteAssociation1 = new ec2.CfnSubnetRouteTableAssociation(this, 'PrivateRouteAssociation1', {
      routeTableId: PrivateRouteTable1.ref,
      subnetId: PrivateSubnet1.ref
    })

    const PrivateRouteAssociation2 = new ec2.CfnSubnetRouteTableAssociation(this, 'PrivateRouteAssociation2', {
      routeTableId: PrivateRouteTable2.ref,
      subnetId: PrivateSubnet2.ref
    })

    const VPCOutput = new cdk.CfnOutput(this, 'VPCid', {
      description: 'VPC',
      value: VPC.ref
    })

    const PublicSubnet1_Output = new cdk.CfnOutput(this, 'PublicSubnet1id', {
      description: 'Public Subnet1 1',
      value: PublicSubnet1.ref
    })

    const PublicSubnet2_Output = new cdk.CfnOutput(this, 'PublicSubnet2id', {
      description: 'Public Subnet1 2',
      value: PublicSubnet2.ref
    })

    const PrivateSubnet1_Output = new cdk.CfnOutput(this, 'PrivateSubnet1id', {
      description: 'Private Subnet1 1',
      value: PrivateSubnet1.ref
    })

    const PrivateSubnet2_Output = new cdk.CfnOutput(this, 'PrivateSubnet2id', {
      description: 'Private Subnet1 2',
      value: PrivateSubnet2.ref
    })
  }
}
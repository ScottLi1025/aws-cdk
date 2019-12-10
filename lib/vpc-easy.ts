import core = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');


export class CdkTypeScriptStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props?: core.StackProps) {
    super(scope, id, props);
    
    
    const vpc = new ec2.Vpc(this, 'TheVPC', {
      natGateways: 2,
      cidr: '10.1.0.0/16',
      subnetConfiguration: [
      {
        cidrMask: 24,
        name: 'Public Subnet 1',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: 'Public Subnet 2',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 24,
        name: 'Private Subnet 1',
        subnetType: ec2.SubnetType.PRIVATE,
        reserved: false,   // <---- This subnet group is not reserved
      },
      {
        cidrMask: 24,
        name: 'Private Subnet 2',
        subnetType: ec2.SubnetType.PRIVATE,
      }
    ],
   });
  }
}

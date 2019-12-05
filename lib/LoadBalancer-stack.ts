import cdk = require('@aws-cdk/core');
import { SubnetType, Vpc} from '@aws-cdk/aws-ec2'
import autoscaling = require('@aws-cdk/aws-autoscaling');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');


export class LoadBalancerStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const vpc = new ec2.Vpc(this, 'TheVPC', {
      natGateways: 1,
      subnetConfiguration: [
      {
        cidrMask: 26,
        name: 'Public',
        subnetType: ec2.SubnetType.PUBLIC,
      },
      {
        cidrMask: 26,
        name: 'Application1',
        subnetType: ec2.SubnetType.PRIVATE,
      },
      {
        cidrMask: 26,
        name: 'Application2',
        subnetType: ec2.SubnetType.PRIVATE,
        reserved: false,   // <---- This subnet group is reserved
      },
      {
        cidrMask: 27,
        name: 'Database',
        subnetType: ec2.SubnetType.PRIVATE,
      }
    ],
    });
    
    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
        machineImage: new ec2.AmazonLinuxImage(), // get the latest Amazon Linux image
    });
    
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc, // build a internetFacing ALB
      internetFacing: true
    });
    
    const listener = lb.addListener('Listener', {
      port: 80, //add a Load Balancer listener for restrict only the port80 traffice to instance
    });

    listener.addTargets('Target', {
      port: 80, // add the Load Balancer listener to targets: asg(AutoScalingGroup)
      targets: [asg]
    });
    
    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world'); // Any IPv4 address is allow to connect listener
    
    asg.scaleOnCpuUtilization('KeepSpareCPU', {
        targetUtilizationPercent: 50 // With 50% or above CPU Usage scale out EC2 instance
    });


    }
}
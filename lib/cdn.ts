import core = require('@aws-cdk/core');
import cdn = require('@aws-cdk/aws-cloudfront');
import lb = require('@aws-cdk/aws-elasticloadbalancingv2');
import iam = require('@aws-cdk/aws-iam');
import api = require('@aws-cdk/aws-apigateway');

export class CDNStack extends core.Stack {
    constructor(scope: core.Construct, id: string, props?: core.StackProps) {
        super(scope, id, props);

        this.templateOptions.metadata = {
            License: 'Apache-2.0',
        };

        this.templateOptions.description = 'Building on AWS CDN Tier Stack';

        const SourceBucket = new core.CfnParameter(this, 'SourceBucket', {
            type: 'String',
            default: 'cdktoolkit-stagingbucket-1tptfxb59a0v7'
        })

        const EC2VpcId = new core.CfnParameter(this, 'EC2VpcId', {
            type: 'AWS::EC2::VPC::Id',
            default: 'vpc-027091518c3abbde4'
        })

        const PublicSubnet1 = new core.CfnParameter(this, 'PublicSubnet1', {
            type: 'AWS::EC2::Subnet::Id',
            default: 'subnet-0ad3d4d406fb219ac'
        })

        const PublicSubnet2 = new core.CfnParameter(this, 'PublicSubnet2', {
            type: 'AWS::EC2::Subnet::Id',
            default: 'subnet-043250b103bb15117'
        })

        const WebSecurityGroup = new core.CfnParameter(this, 'WebSecurityGroup', {
            type: 'AWS::EC2::SecurityGroup::Id',
            default: 'sg-0eb3c75cb8062fabc'
        })
        
        const LoadBalancer = new lb.CfnLoadBalancer(this, 'LoadBalancer', {
            subnets: [PublicSubnet1.valueAsString, PublicSubnet2.valueAsString],
            loadBalancerAttributes: [{
                key: 'idle_timeout.timeout_seconds',
                value: '50'
            }],
            securityGroups: [WebSecurityGroup.valueAsString]
        })
        
        const CloudWatchRole = new iam.CfnRole(this, 'CloudWatchRole', {
            assumeRolePolicyDocument: {
                Version: "2012-10-17",
                Statement: [{
                    Effect: 'Allow',
                    Principal: {
                        Service: "apigateway.amazonaws.com"
                    },
                    Action: "sts:AssumeRole"
                }],
            },
            path: '/',
            managedPolicyArns: ["arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs", "arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess"]
        })

        const Account = new api.CfnAccount(this, 'Account', {
            cloudWatchRoleArn: CloudWatchRole.attrArn
        })

        const Api = new api.CfnRestApi(this, 'Api', {
            name: 'WebProxyApi',
            binaryMediaTypes: ["*/*"]
        })

        const WebpageCDN = new cdn.CfnDistribution(this, 'WebpageCDN', {
            distributionConfig: {
                defaultCacheBehavior: {
                    allowedMethods: [
                        'DELETE',
                        'GET',
                        'HEAD',
                        'OPTIONS',
                        'PATCH',
                        'POST',
                        'PUT'
                    ],
                    maxTtl: 0,
                    minTtl: 0,
                    defaultTtl: 0,
                    forwardedValues: {
                        queryString: true,
                        cookies: {
                            forward: 'all'
                        },
                        headers: [
                            'Accept',
                            'Referer',
                            'Athorization',
                            'Content-Type'
                        ]
                    },
                    targetOriginId: 'website',
                    viewerProtocolPolicy: 'redirect-to-https'
                },
                enabled: true,
                origins: [{
                    domainName: Api.ref+'.execute-api.'+core.Aws.REGION+"amazonaws.com",
                    id: 'website',
                    originPath: "/Prod",
                    customOriginConfig: {
                        originProtocolPolicy: 'https-only'
                    }
                }],
                priceClass: 'PriceClass_All'
            }
        })

        const Resource = new api.CfnResource(this, 'Resource', {
            parentId: Api.attrRootResourceId,
            restApiId: Api.ref,
            pathPart: '{proxy+}'
        })

        const RootMethod = new api.CfnMethod(this, 'RootMethod', {
            httpMethod: 'ANY',
            resourceId: Api.attrRootResourceId,
            restApiId: Api.ref,
            authorizationType: 'NONE',
            integration: {
                integrationHttpMethod: 'ANY',
                type: 'HTTP_PROXY',
                uri: 'http://' + LoadBalancer.attrDnsName,
                passthroughBehavior: 'WHEN_NO_MATCH',
                integrationResponses: [{
                    statusCode: "200"
                }]
            }
        })

        const ProxyMethod = new api.CfnMethod(this, 'ProxyMethod', {
            httpMethod: 'ANY',
            resourceId: Resource.ref,
            restApiId: Api.ref,
            authorizationType: 'NONE',
            requestParameters: {
                "method.request.path.proxy": true
            },
            integration: {
                cacheKeyParameters: [
                    'method.request.path.proxy'
                ],
                requestParameters: {
                    "integration.request.path.proxy": 'method.request.path.proxy'
                },
                uri: 'http://' + LoadBalancer.attrDnsName + '/{proxy}',
                integrationHttpMethod: 'ANY',
                type: 'HTTP_PROXY',
                passthroughBehavior: 'WHEN_NO_MATCH',
                integrationResponses: [{
                    statusCode: '200'
                }]

            }
        })

        const Deployment = new api.CfnDeployment(this, 'Deployment', {
            restApiId: Api.ref
        })

        Deployment.addDependsOn(RootMethod)
        Deployment.addDependsOn(ProxyMethod)

        const AlbDNSName = new core.CfnOutput(this, 'AlbDNSName', {
            value: LoadBalancer.attrDnsName,
            description: 'ALB DNSName'
        })

        const DomainName = new core.CfnOutput(this, 'DomainName', {
            value: WebpageCDN.attrDomainName,
            description:'Webpage CloudFront Domain name.'
        })

        const LoadBalancerArn = new core.CfnOutput(this, 'LoadBalancerArn', {
            value: LoadBalancer.ref
        })
    }
}
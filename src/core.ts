import configuration from "./configuration"
import { V1Node } from '@kubernetes/client-node'
import k8sApi from './k8s-api'
import { EC2 } from 'aws-sdk'
import ec2 from './ec2'

export async function start () {
  console.log(`Looking for nodes matches ${configuration.nodeLabelSelector}`)
  const nodes = await findNodes(configuration.nodeLabelSelector)
  if (nodes.length === 0) {
    throw new Error('Unable to find any nodes matching criteria')
  } else {
    console.log(`Found ${nodes.length} k8s nodes`)
  }

  console.log('Converting k8s nodes to ec2 instances')
  const ec2Instances = await k8sNodesToEc2Instances(nodes)

  console.log('Attaching IPs to ec2 instances')
  await attachIpsToInstances(ec2Instances, configuration.ips)
}

async function findNodes (labelSelector: string) {
  const resp = await k8sApi.listNode(undefined, undefined, undefined, undefined, labelSelector)
  const nodes = resp.body.items as V1Node[]

  // Try to be deterministic
  nodes.sort((a, b) => {
    const pid1 = a.spec.providerID
    const pid2 = b.spec.providerID
    return pid1.localeCompare(pid2)
  })

  return nodes
}

async function k8sNodesToEc2Instances (nodes: V1Node[]) {
  const instanceIds = nodes
    .map(n => n.spec.providerID)
    .map(p => p.match('/(i-[^/]+)$')[1])

  const resp = await ec2.describeInstances({
    InstanceIds: instanceIds
  }).promise()

  const data = resp.$response.data

  const instances = (data as EC2.DescribeInstancesResult)
    .Reservations
    .map(x => x.Instances)
    .reduce((acc, cur) => acc.concat(cur), [])

  return instances
}

async function attachIpsToInstances (
  instances: EC2.InstanceList,
  ips: string[]
) {
  const [ins, ...restIns] = instances
  const [ip, ...restIps] = ips

  if (ins && ip) {
    console.log(`Attempting to assign ${ip} to ${ins.InstanceId}`)
    if (ins.PublicIpAddress !== ip) {
      await ec2.associateAddress({
        InstanceId: ins.InstanceId,
        PublicIp: ip
      }).promise()
      console.log('Done!')
    } else {
      console.log('Already done. Skipped...')
    }

    await attachIpsToInstances(restIns, restIps)
  }
}


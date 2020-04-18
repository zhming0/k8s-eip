import { start } from "./core"
import { V1NodeList } from "@kubernetes/client-node"
import k8sApi from './k8s-api'
import ec2 from './ec2'
import configuration from "./configuration"

const mockedK8sApi = k8sApi as any as jest.Mocked<typeof k8sApi>
const mockedEc2 = ec2 as any as jest.Mocked<typeof ec2>

jest.mock('./k8s-api')
jest.mock('./ec2')


describe('core', () => {

  const instanceId1 = 'i-abc123b'
  const instanceId2 = 'i-abc123b'

  const matchedNodes = [{
    spec: {
      providerID: `aws://us-west-2/${instanceId1}`
    },
    metadata: {
      uid: 'cbabcasdfaf',
      status: {
        addresses: [
          { type: 'ExternalIP', address: '127.0.0.1' }
        ]
      }
    }
  }, {
    spec: {
      providerID: `aws://us-west-2/${instanceId2}`
    },
    metadata: {
      uid: 'abcbluhbluh',
      status: {
        addresses: [
          { type: 'ExternalIP', address: '127.0.0.1' }
        ]
      }
    }
  }]

  beforeAll(async () => {
    mockedK8sApi.listNode.mockImplementation(async () => {
      const list = new V1NodeList()
      list.items = matchedNodes
      return {
        response: undefined,
        body: list
      }
    })

    mockedEc2.describeInstances.mockImplementation(() => {
      return {
        promise: async () => {
          return {
            $response: {
              data: {
                Reservations: [{
                  Instances: [{
                    InstanceId: instanceId1
                  }]
                }, {
                  Instances: [{
                    InstanceId: instanceId2
                  }]
                }]
              }
            }
          }
        }
      } as any
    })

    mockedEc2.associateAddress.mockImplementation(() => {
      return {
        promise: async () => {}
      } as any
    })

    await start()
  })

  it('should pass node label selector to k8s api', () => {
    expect(mockedK8sApi.listNode).toHaveBeenCalledTimes(1)
    expect(mockedK8sApi.listNode).toHaveBeenCalledWith(
      undefined, undefined, undefined, undefined,
      configuration.nodeLabelSelector
    )
  })

  it('should query aws for instances info', () => {
    expect(mockedEc2.describeInstances).toHaveBeenCalledTimes(1)
    expect(mockedEc2.describeInstances).toHaveBeenCalledWith({
      InstanceIds: [
        instanceId2,
        instanceId1
      ]
    })
  })

  it('should then try to associate ips with instances', () => {
    expect(mockedEc2.associateAddress).toHaveBeenCalledTimes(2)

    expect(mockedEc2.associateAddress).toHaveBeenCalledWith({
      InstanceId: instanceId1,
      PublicIp: configuration.ips[1]
    })
    expect(mockedEc2.associateAddress).toHaveBeenCalledWith({
      InstanceId: instanceId2,
      PublicIp: configuration.ips[0]
    })
  })
})

import { KubeConfig, CoreV1Api } from "@kubernetes/client-node"

const kc = new KubeConfig()
kc.loadFromDefault()

export default kc.makeApiClient(CoreV1Api)

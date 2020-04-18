const demandEnvVar = (key: string) => {
  if (!process.env[key]) {
    throw new Error(`Unable to locate env var ${key}`)
  }
  return process.env[key]
}

const getIps = () => {
  const ips = demandEnvVar('K8S_EIP_IPS').split(/,/)

  // A simple validation
  for (const ip of ips) {
    if (!ip.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      throw new Error(`Detected invalid IP address from input: ${ip}`)
    }
  }

  return ips
}

export default {
  nodeLabelSelector: demandEnvVar('K8S_EIP_LABEL_SELECTOR'),
  ips: getIps()
}

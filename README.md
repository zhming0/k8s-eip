# K8S-EIP

![GitHub](https://img.shields.io/github/license/zhming0/k8s-eip)
![Docker Pulls](https://img.shields.io/docker/pulls/zhming0/k8s-eip)
[![zhming0](https://circleci.com/gh/zhming0/k8s-eip.svg?style=svg)](https://circleci.com/gh/zhming0/k8s-eip)

Bind a group of AWS Elastic IPs to a group of Kubernetes Nodes that matches criteria.

## Huh? What is this?

> Q: What are you trying to solve mate?

> A: I don't want to create many unnecessary ELBs just for my toy cluster created by kops.

> Q: Can't you just use `nginx-ingress` so you just create one ELB for many services?

> A: Nah, I don't want to pay that $18/month either. I don't want any ELB.

> Q: What a miser! But how?

> A:
`k8s-eip` for you.
It's similar to the [kube-ip](https://github.com/doitintl/kubeip) but for AWS and less mature.
It would bind a group of specified Elastic IPs to a number of K8S nodes on AWS.
It runs in a periodic way, so **you can't use it for HA/critical use cases**.

> Q: Would it trigger the scary Elastic IP remap fee?

> A: As a project with a goal of saving money, surely no :).
Actually, it will **try** not to.

## How to use it?

### Prerequisite

* You are an admin of k8s cluster on AWS and you have `kubectl` configured properly.
Quick test: `kubectl cluster-info`
* You have credentials for an IAM user with following permission:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeInstances",
                "ec2:AssociateAddress"
            ],
            "Resource": "*"
        }
    ]
}
```
* You have labeled the targetted nodes

Via: `kubectl`

```
kubectl label node YOUR_NODE_NAME bation=true
```

Via: `kops`

```yaml
---
...
kind: InstanceGroup
...
spec:
  ...
  nodeLabels:
    ...
    bation: "true" # Or anything you want
  ...

```

### Using Helm v3

First, Prepare a yaml file like this:
```yaml
awsAccessKeyId:  "XXXXXXX" # AWS_ACCESS_KEY_ID of the IAM user account
awsSecretAccessKey: "XXXXXXXXXXXXXXXX" # secret access key of the IAM user account
awsRegion: us-east-1

# Elastic IPs that you own and want to attach to targeting nodes
ips: "8.8.8.8,1.1.1.1"  # example
# The label on Nodes that you want to have elastic IPs attached
labelSelector: "bation=true" # example
```

Then

```bash
helm upgrade -i \
  -f values.yaml \ # The yaml file that you prepared
  -n kube-system \ # This could be any namespace, kube-system is a good idea
  k8s-eip \ # any name
  https://github.com/zhming0/k8s-eip/releases/download/v0.0.1/k8s-eip-0.0.1.tgz
```

Note:
- *Helm is flexible.
There are many ways to supply values.
Please refer to [their doc](https://helm.sh/docs/intro/using_helm/#customizing-the-chart-before-installing)
for other options.*
- use `--dry-run` to preview the changes

### Using Helm v2

Nope :)

### Kubectl directly

Good luck :)

## Project status

As you can see, this is early stage and not actively maintained
as I don't believe it create much value.
Any help is still appreciated though.
Some potential work could be:

- Use K8S's `watch` API to replace/enhance periodic run
- Improve determinism, reduce unnecessary Elastic IPs mapping even when
there are many changes happening to k8s nodes.

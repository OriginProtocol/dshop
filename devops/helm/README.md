# Kubernetes Cluster Setup

## Prerequisites

### Origin Only

- [Configure your CLI environment] https://github.com/oplabs/ops/blob/master/playbook/kubernetes/setup.md
- [Install Helmfile](https://github.com/roboll/helmfile#installation)

### Everybody

- [Install Helm](https://github.com/roboll/helmfile#installation)
- [Install and configure Helm Secrets](https://github.com/jkroepke/helm-secrets) if you want encrypted secrets.
- [Install Helmfile](https://github.com/roboll/helmfile)

## Install

To install a Helm release:

1) Create a values file for your release.  You can use `values/dshop/rinkeby.yaml` as an example.
2) Install your dshop release with the appropriate values files `helm install -f charts/dshop/values.yaml -f path/to/myvalues.yaml`

### Using Helmfile

Update helmfile.yaml with your environment configuration, and sync it:

    helmfile --environment=rinkeby sync

## Helpful Notes

### Multiple Helm Versions

You may need to run multiple helm versions at once if you're working with multiple clusters with incompatible helm/tiller versions.  If you install another binary (say, `helm3`), you can add this to `hemlfile.yaml` to use your specific version of `helm`:

    helmBinary: /path/to/bin/helm3

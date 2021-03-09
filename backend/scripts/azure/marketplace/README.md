# Dshop Azure VM AMI builder

<img width="346" alt="dshops" src="https://user-images.githubusercontent.com/837/80967164-ea868b00-8de3-11ea-85e8-cc863afbdc09.png">

## Quickstart

You will need [packer](https://www.packer.io/downloads/) installed, and
[Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed and configured.

    ./build.sh

## Authentication

Packer will need configuration to access Azure.  The simplest method is to run `az login` and setup your credentials through that.  If you'd like to [use another method, see the Packer documentation](https://www.packer.io/docs/builders/azure#authentication-for-azure).

## Notes

- This build uses the [Azure Resource Manager builder](https://www.packer.io/docs/builders/azure/arm).

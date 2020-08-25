# Dshop AWS EC2 AMI builder

<img width="346" alt="dshops" src="https://user-images.githubusercontent.com/837/80967164-ea868b00-8de3-11ea-85e8-cc863afbdc09.png">

## Quickstart

You will need [packer](https://www.packer.io/downloads/) installed, and
[AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-linux.html#cliv2-linux-install) installed and configured.

    ./build.sh

## Authentication

Packer will need configuration to access AWS.  The simplest method is to run `aws configre` and setup your credentials through that.  If you'd like to [use another method, see the Packer documentation](https://www.packer.io/docs/builders/amazon#specifying-amazon-credentials).

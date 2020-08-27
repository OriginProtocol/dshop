#!/bin/bash
################################################################################
##
## This script will use Packer to build a VM, then create an iamge of said VM 
## for later use in the marketplace.
##
## It builds using the dedicated dshop repo at:
##   https://github.com/OriginProtocol/dshop
##
## startup_script.sh is executed on VM launch to do the system build.
##
## The final image will be named origin-dshop-<VM image name>-image-YYYYMMDDHHmmSS
##
## Requirements: gcloud, packer
##
################################################################################

echo "Writing packer.json..."

BUILD_ID=$(date +%Y%m%d%H%M%S)
IMAGE_FAMILY="origin-dshop"
IMAGE_NAME="debian-10-amd64-$IMAGE_FAMILY-$BUILD_ID"
TMP_DIR="/tmp/dshop-build-$BUILD_ID"
AWS_REGION="us-east-1"
EC2_INSTANCE_TYPE="t2.small"
AMI_NAME_FILTER="debian-10-amd64-2020*"

mkdir -p $TMP_DIR

########################
# Get the GCP project ID
########################

# PROJECT_ID="$AWS_PROJECT_ID"

# if [[ -z "$PROJECT_ID" ]]; then
#     PROJECT_ID=$(gcloud projects list | grep -v PROJECT_ID | head -n1 | awk '{ print $1 }')
# fi

# if [[ -z "$PROJECT_ID" ]]; then
#     echo "Unable to determine GCP project automagically. Set GCP_PROJECT_ID"
#     exit 1
# fi

# echo "Project ID: $PROJECT_ID"

######################
# Create packer config
######################

PACKER_JSON="$TMP_DIR/packer.json"

cat > $PACKER_JSON <<EOF
{
  "builders": [
    {
      "type": "amazon-ebs",
      "instance_type": "$EC2_INSTANCE_TYPE",
      "source_ami_filter": {
        "filters": {
          "virtualization-type": "hvm",
          "name": "$AMI_NAME_FILTER",
          "root-device-type": "ebs"
        },
        "owners": ["136693071363"],
        "most_recent": true
      },
      "ssh_username": "admin",
      "ssh_clear_authorized_keys": true,
      "ami_name": "$IMAGE_NAME",
      "ami_description": "Origin Dshop backend - $BUILD_ID",
      "region": "us-east-1",
      "ami_regions": ["us-east-1", "us-west-2"],
      "security_group_filter": {
        "filters": {
          "tag:Class": "packer"
        }
      }
    }
  ],
  "provisioners": [
    {
      "type": "shell",
      "script": "./startup_script.sh"
    }
  ]
}
EOF

echo "Created $PACKER_JSON"

##################
# Run packer build
##################

echo "Running packer build..."

#packer validate $PACKER_JSON
packer build $PACKER_JSON

echo "Packer image build complete. Image name: $IMAGE_NAME"

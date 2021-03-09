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

TMP_DIR="/tmp/dshop-build-$BUILD_ID"
AZURE_LOCATION="westus2"
PACKER_JSON="$TMP_DIR/packer.json"
BUILD_ID=$(date +%Y%m%d%H%M%S)
IMAGE_FAMILY="origin-dshop"
IMAGE_NAME="debian-10-amd64-$IMAGE_FAMILY-$BUILD_ID"
VM_SIZE="Standard_A2"

mkdir -p $TMP_DIR

###################
# Get Azure details
###################

if [[ -z "$AZURE_SUBSCRIPTION_ID" ]]; then
  AZURE_SUBSCRIPTION_ID=$(az account show | jq -r '.id')
  if [[ -z "$AZURE_SUBSCRIPTION_ID" ]]; then
    echo "AZURE_SUBSCRIPTION_ID must be defined"
    exit 1
  fi
fi

if [[ -z "$AZURE_KEYVAULT_ID" ]]; then
  # Use first available
  AZURE_KEYVAULT_ID=$(az keyvault list | jq -r '.[0].id')
  if [[ -z "$AZURE_KEYVAULT_ID" ]]; then
    echo "AZURE_KEYVAULT_ID must be defined"
    exit 1
  fi
fi

echo "Subscription ID: $AZURE_SUBSCRIPTION_ID"

######################
# Create packer config
######################

cat > $PACKER_JSON <<EOF
{
  "builders": [
    {
      "location": "westus",
      "type": "azure-arm",
      "os_type": "Linux",
      "vm_size": "$VM_SIZE",
      "ssh_clear_authorized_keys": true,
      "image_publisher": "Debian",
      "image_offer": "debian-10",
      "image_sku": "10",
      "managed_image_name": "$IMAGE_NAME",
      "managed_image_resource_group_name": "$IMAGE_FAMILY",
      "subscription_id": "$AZURE_SUBSCRIPTION_ID"
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

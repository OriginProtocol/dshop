# Microsoft Azure

**Note**:  If you have any questions, feel free to contact 
dshop@originprotocol.com.

## Deployment

Go to the Azure offer on the Azure Marketplace.

TBD

### Custom Domain

TBD

## First Run

### Initial Super-Admin Passowrd

When registering your first user as super-admin, you will need to use the `vmId` of your Virtual Machine as the password.  You can get the `vmId` by using the Azure CLI tools:

    az vm show -g [resource_group_name] -n [vm_name] | jq -r '.vmId'

or from within the VM itself:

    curl -H Metadata:true --noproxy "*" "http://169.254.169.254/metadata/instance/compute?api-version=2020-09-01" | jq -r '.vmId'

### Continue

You can now [configure your Dshop node](first-run.md).

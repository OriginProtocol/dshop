# Origin Protocol DShop

An experimental decentralized e-commerce store served entirely from IPFS.

### Clone the repo
```
git clone git@github.com:OriginProtocol/dshop.git dshop
cd dshop
```

### Configure the database
By default, the back-end uses Sqlite. If you want to use Postgres, do the following:
 - Create a new dshop database. For example under psql:
 ```
psql
#> CREATE DATABASE dshop;
```
 - Set DATABASE_URL to point to your newly created DB. For example:
```
export DATABASE_URL="postgres://origin:origin@localhost/dshop"
```

### Configure Redis
The backend uses redis for queues. While you can skip this,it's highly recommended to run a local redis so your testing matches production behavior
```
export REDIS_URL=redis://localhost:6379/
```

### Install
This will install packages, run database migrations to create the schema and copy various files in the right place.
```
yarn install
```

### Build the shop bundle, Start the stack
This will start all the necessary services for running a local dshop stack: IPFS, ganache blockchain, back-end, front-end. It will then open a browser page pointing to the super-admin interface at http://0.0.0.0:9000/#/super-admin
```
cd shop
yarn run build:dist
yarn start
```

### Create a local dshop
Follow the steps on the super-admin to create a local dshop.

## Troubleshooting
### Vips error
If you encounter this error on MacOS while running `yarn install`:
```
../src/common.cc:25:10: fatal error: 'vips/vips8' file not found
```
Try to install vips manually by running:
```brew install vips```

### js-ipfs error
If you encounter this error while using the admin to create a new shop:
```
UnhandledPromiseRejectionWarning: Error: Invalid version, must be a number equal to 1 or 0
    at Function.validateCID
```
Upgrade the ipfs package to 0.43.2 or higher under packages/origin/services/package.json

## Build

```sh
   PROVIDER=<provider> NETWORK=<mainnet|rinkeby> DATA_DIR=mystore npm run build
```

## Configuration
 
### Host on Pinata
To deploy your shop to Pinata, follow these steps:
 - First, sign up for [Pinata](https://pinata.cloud/signup)
 - Then run
```sh
   export IPFS_DEPLOY_PINATA__API_KEY=<YOUR PINATA API KEY>
   export IPFS_DEPLOY_PINATA__SECRET_API_KEY=<YOUR PINATA SECRET KEY>
   DATA_DIR=mystore yarn build
   cp -r data/mystore public
   npx ipfs-deploy -p pinata
```

Make a note of the IPFS hash as you'll need it later...

### Setup domain via Cloudflare

1. Create a CNAME from `subdomain.yourdomain.com` to `cloudflare-ipfs.com`
2. Add a TXT record with the name `_dnslink.subdomain.yourdomain.com` and value
   `dnslink=/ipfs/<your_ipfs_hash_here>`
3. Visit
   [this page on Cloudflare](https://www.cloudflare.com/distributed-web-gateway/),
   scroll to the bottom and add your domain to the form
4. Ignore the 'Authentication Error' if there is one
5. Wait a minute or so, then visit your URL in a browser

### Setup ENS

1. Visit the [ENS App](https://app.ens.domains/)
2. Ensure your wallet (MetaMask et al) is pointing to Mainnet
3. Register your ENS domain
4. Use the Public resolver
5. Set content hash to `ipfs://<your_ipfs_hash_here>`
6. Wait a few minutes, then visit `https://your-ens-domain.eth.link`


[]: ../marketplace/data/origin-header.png
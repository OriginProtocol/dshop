# Origin Protocol Dshop

An experimental decentralized e-commerce store served entirely from IPFS.

## Getting set up: Prerequisites
The instructions in the README have only been tested on **MacOS** and **Linux** systems. **We have not tested on Windows**. As an alternative, Windows users can use docker to run a Linux container.
- **[Node.js](https://nodejs.org/en/)**

  To find out whether Node is already installed on your system, use the command `node --version`( **Node v14.14.0** is recommended). [nvm](https://github.com/nvm-sh/nvm) is a handy tool for managing different versions of Node on your local host.

  
- **[Lerna](https://lerna.js.org/)**
   
   Verify whether you have Lerna installed using `lerna --version`. To install, you can use `npm install -g lerna`
   
 - **[Yarn](https://yarnpkg.com/getting-started/install)**
 
   Verify whether you have Yarn installed using `yarn --version`. To install, you can use `npm install -g yarn`

## Installation steps

### Clone the repo

    git clone git@github.com:OriginProtocol/dshop.git dshop
    cd dshop

### Configure the database

By default, the back-end uses SQLite. If you want to use Postgres, do the
following:

- Create a new dshop database. For example under psql:

      psql
      #> CREATE DATABASE dshop;

- Set DATABASE_URL to point to your newly created DB. Format: 

      export DATABASE_URL="postgres://<system_username>:<db_password>@localhost/<db_name>"
  
  Example:

      export DATABASE_URL="postgres://origin:origin@localhost/dshop"

### Configure Redis

The backend uses redis for queues. While you can skip this, it's highly
recommended to run a local redis so your testing matches production behavior

    export REDIS_URL=redis://localhost:6379/

### Install packages

This will install packages, run database migrations to create the schema and
copy various files in the right place.

    yarn install

### Build the shop bundle, start the stack

This will start all the necessary services for running a local dshop stack:
IPFS, ganache blockchain, back-end, front-end. It will then open a browser page
pointing to the super-admin interface at `http://0.0.0.0:9000/#/super-admin`

    cd shop
    yarn run build:dist
    yarn start

### Create a local dshop

Follow the steps on the super-admin UI to create a local dshop.

# Troubleshooting

### Vips error

If you encounter this error on MacOS while running `yarn install`:

    ../src/common.cc:25:10: fatal error: 'vips/vips8' file not found

Try to install vips manually by running: `brew install vips`

### js-ipfs error

If you encounter this error while using the admin to create a new shop:

    UnhandledPromiseRejectionWarning: Error: Invalid version, must be a number equal to 1 or 0
    at Function.validateCID

Upgrade the ipfs package to 0.43.2 or higher under
packages/origin/services/package.json

### SequelizeDatabaseError

If you encounter an error like this MacOS while running `yarn start`:

    [ERROR] dshop.queues.etlProcessor: Job failed: DatabaseError [SequelizeDatabaseError]: relation "shop_domains" does not exist

`cd` into /backend and run `npm run migrate`

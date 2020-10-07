# Origin Protocol Dshop

An experimental decentralized e-commerce store served entirely from IPFS.

## Clone the repo

    git clone git@github.com:OriginProtocol/dshop.git dshop
    cd dshop

## Configure the database

By default, the back-end uses SQLite. If you want to use Postgres, do the
following:

- Create a new dshop database. For example under psql:

      psql
      #> CREATE DATABASE dshop;

- Set DATABASE_URL to point to your newly created DB. For example:

      export DATABASE_URL="postgres://origin:origin@localhost/dshop"

## Configure Redis

The backend uses redis for queues. While you can skip this, it's highly
recommended to run a local redis so your testing matches production behavior

    export REDIS_URL=redis://localhost:6379/

## Install

This will install packages, run database migrations to create the schema and
copy various files in the right place.

    yarn install

## Build the shop bundle, Start the stack

This will start all the necessary services for running a local dshop stack:
IPFS, ganache blockchain, back-end, front-end. It will then open a browser page
pointing to the super-admin interface at `http://0.0.0.0:9000/#/super-admin`

    cd shop
    yarn run build:dist
    yarn start

## Create a local dshop

Follow the steps on the super-admin to create a local dshop.

### Create a Listing

To create a listing for super-admin configuration, you can run the
`createListing.js` script:

    node backend/scripts/createListing.js

## Troubleshooting

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

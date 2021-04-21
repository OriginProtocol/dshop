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

    export REDIS_URL=redis://localhost:6379

### Install packages

This will install packages, run database migrations to create the schema and
copy various files in the right place.

    yarn install

### Build the shop bundle, start the stack

This will start all the necessary services for running a local dshop stack: IPFS, ganache blockchain, back-end, front-end. 

    cd shop
    yarn run build:dist
    yarn start
    
### Configure the Dshop Deployer

Point your browser to http://localhost:3000 to access the super-admin UI.

When configuring on a local development host, most of the fields are **optional** and can be left empty except the following ones:
  - ```Ethereum Network```: pick Localhost
  - ```Root Domain```: use localhost
  - ```Marketplace Listing ID```: use 999-001-1
  - ```IPFS Gateway```: use http://localhost:8080
  - ```IPFS API```: use http://localhost:5002
  - ```Web3 PK```: this is optional, you can leave empty
  - ```Backend Public URL```: use http://0.0.0.0:3000
  - ```Notification Emails```: enter an email address
  - ```Email Display Name```: choose a name
  - ```Allow New User Signups```: don't forget to check that box otherwise you won't be able to create a shop

### Create a local Dshop

After having configured the Dshop Deployer, follow the steps on the super-admin UI to create a local dshop.

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


### Troubleshooting issues with Macs based on the Apple M1 chip 

Support for new macs that use the arm64 CPU architecture is growing, but limited. Until more support is available for the hardware, one might consider it best to [run the Terminal app using Rosetta 2]. For those that prefer to use the Terminal's default settings:

#### Puppeteer package incompatability
If you encounter [this error](https://github.com/puppeteer/puppeteer/issues/6622) while running `yarn install`:

    error path-to-project/node_modules/puppeteer: Command failed.
    Exit code: 1
    Command: node install.js
    Arguments:
    Directory: path-to-project/node_modules/puppeteer
    Output:
    The chromium binary is not available for arm64:
    If you are on Ubuntu, you can install with:

     apt-get install chromium-browser

    path-to-project/node_modules/puppeteer/lib/cjs/puppeteer/node/BrowserFetcher.js:112
                throw new Error();
                ^

- Install Chromium using the package [chrome-mac.zip](https://commondatastorage.googleapis.com/chromium-browser-snapshots/index.html?prefix=Mac/818858/)
  - After downloading and unzipping the contents of the file into the Applications folder, open it. MacOS’ security settings blocks the file execution, but one can override it by navigating to System Preferences > Security & Privacy > General, and clicking ‘Open Anyway’.

- Add the following lines to ~/.zshrc:
    ```
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    export PUPPETEER_EXECUTABLE_PATH=”/Applications/Chromium.app/Contents/MacOS/Chromium”
    ```
#### Problem with NodeJS version 14.x

If you see an error along the lines of
    
    FATAL ERROR: wasm code commit Allocation failed - process out of memory

when running `yarn start`, upgrade NodeJS to [version 15.3.0](https://nodejs.org/en/blog/release/v15.3.0/) or higher.
# Origin Protocol Dshop Backend

This is the supporting backend for Origin DShop. It's primary functions are:

- Handling off-chain payments, such as credit card transactions
- Sending out confirmation emails
- Order management
- Discount code management

It works by watching the Ethereum blockchain for relevant activity on the Origin
Marketplace contract. Order data is downloaded from IPFS, decrypted and stored
in a Postgres database.

- [Test Data](docs/index.md#manual-testing)
- [Backend Web API](docs/api.md)

## Local development

Follow the steps on the [Front-end README](../shop/README.md) to start a local
back-end.

## Manual Deploy

This assumes you have already followed the steps to setup and deploy a store to
IPFS. You will need your Public URL, PGP Private Key and password, and a
websocket provider URL (eg via Infura or Alchemy).

### Manual deploy to Heroku

Please note that Heroku's free tier puts processes to sleep after some
inactivity. This causes the process watching the blockchain to stop, meaning new
orders will not be processed. Please use a paid Heroku dyno (\$7/month) to
ensure this does not happen.

    # Install and login to heroku if you have not already done so...
    curl https://cli-assets.heroku.com/install.sh | sh
    heroku login

    # Create a new heroku app called 'myshop'
    heroku create myshop

    # Enable Postgres and Sendgrid addons
    heroku addons:create heroku-postgresql:hobby-dev
    heroku addons:create heroku-redis:hobby-dev
    heroku addons:create sendgrid:starter

    # Set environment variables
    heroku config:set ENCRYPTION_KEY=randomstring

    # Commit files
    git add .
    git commit -m "Origin Shop backend"

    # Deploy app to Heroku

    git push heroku master

    # Switch to 'hobby' type dyno to prevent sleeping ($7/month)

    heroku ps:type hobby

## PGP/GPG Key Export

Export key pair in base64 with no newlines:

    gpg --list-keys
    gpg --armor --export KEY_ID | base64 -w0
    gpg --armor --export-secret-key KEY_ID | base64 -w0

## Migrations

[Sequelize migrations docs](https://sequelize.org/master/manual/migrations.html)

Add new migration:

    npx sequelize migration:generate --name migrationName --migrations-path=./db/migrations

## Sync Repos

    npm run build:dist
    rsync -rv --exclude=.git --exclude=.gitignore --exclude=/db/dshop.db --exclude=/node_modules --exclude=/data --delete backend/ DESTINATION

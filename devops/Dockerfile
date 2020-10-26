FROM node:14

ARG ENVKEY
ARG APP_DIR=/app
ARG DSHOP_BACKEND_SOURCE="backend"
ARG DSHOP_DAPP_SOURCE="shop"
ARG SENTRY_DSN=""
ARG ENVIRONMENT="development"

ENV NODE_ENV=production
ENV ENVKEY=$ENVKEY
ENV DISABLE_SYNC=true
ENV SENTRY_DSN=$SENTRY_DSN
ENV ENVIRONMENT=$ENVIRONMENT

RUN export PATH="$PATH:$APP_DIR/shop/node_modules/.bin:$APP_DIR/backend/node_modules/.bin"
RUN echo $DSHOP_BACKEND_SOURCE
RUN echo $DSHOP_DAPP_SOURCE
RUN yarn global add lerna

######
# Clone source from dshop repo
######

WORKDIR $APP_DIR

COPY packages ./packages
COPY package.json ./package.json
COPY lerna.json ./lerna.json
COPY yarn.lock ./yarn.lock

COPY $DSHOP_BACKEND_SOURCE/*.js ./backend/
COPY $DSHOP_BACKEND_SOURCE/package.json ./backend/package.json
COPY $DSHOP_BACKEND_SOURCE/config/ ./backend/config/
COPY $DSHOP_BACKEND_SOURCE/db ./backend/db
COPY $DSHOP_BACKEND_SOURCE/etl ./backend/etl
COPY $DSHOP_BACKEND_SOURCE/logic/ ./backend/logic/
COPY $DSHOP_BACKEND_SOURCE/models ./backend/models
COPY $DSHOP_BACKEND_SOURCE/queues ./backend/queues
COPY $DSHOP_BACKEND_SOURCE/routes ./backend/routes
COPY $DSHOP_BACKEND_SOURCE/scripts ./backend/scripts
COPY $DSHOP_BACKEND_SOURCE/utils ./backend/utils

# Shouldn't be necessary?  Something is requiring it
COPY $DSHOP_BACKEND_SOURCE/test ./backend/test

COPY $DSHOP_DAPP_SOURCE/public ./shop/public
COPY $DSHOP_DAPP_SOURCE/src ./shop/src
COPY $DSHOP_DAPP_SOURCE/scripts ./shop/scripts
COPY $DSHOP_DAPP_SOURCE/translation ./shop/translation
COPY $DSHOP_DAPP_SOURCE/package.json ./shop/package.json
COPY $DSHOP_DAPP_SOURCE/*.js ./shop/
COPY $DSHOP_DAPP_SOURCE/*.sh ./shop/

# Install with dev Dependencies (need to build dapp)
RUN yarn install --pure-lockfile --no-cache --production=false && yarn cache clean

######
# Build dapp for use by the backend
######

WORKDIR $APP_DIR/shop

RUN yarn run build:dist

######
# Copy openpgp dist build to public
######

WORKDIR $APP_DIR/backend

RUN cp -r ../node_modules/openpgp/dist dist

######
# Cleanup after dapp build
######

WORKDIR $APP_DIR

RUN lerna clean --no-progress -y
RUN rm -rf $APP_DIR/$DSHOP_DAPP_SOURCE
RUN yarn install --pure-lockfile --no-cache && yarn cache clean

######
# Run backend
######

WORKDIR $APP_DIR/backend

CMD npm run migrate && node index.js

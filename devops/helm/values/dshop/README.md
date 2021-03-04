# Dshop Values

The following values are required to be defined for an environment unless specifically mentioned as optional.  If you're looking to stand up your own Dshop kubernetes environment, you need to create a values file with these.

## Environment Specific

### Values

- `issuerNginxResolver`: The DNS resolver the issuer NGINX should use.  Generally, this needs to be able to resolve the name for redis.  In a Kubernetes cluster, this is probably `<k8s-subnet>.10`
- `dshopIssuerIp`: The IP address to use for the issuer.  This is probably an already-reserved GCP public IP
- `dshopCacheStorageRequestSize`: This should probably be the same across environments.  The charts currently share this cache because it's expensive and large.
- `dshopStorageNFSPath`: The NFS share path to use for the cache NFS store
- `disableQueueProcessors`: Do not run bull queue processors

### Secrets

- `dshopStorageIP`: NFS Storage IP for Dshop cache
- `dshopEncryptionKey`: Encryption key used to encrypt sensitive data in the DB
- `dshopSessionSecret`: The secret key used to encrypt session data
- `dshopDBInstance`: GCP Cloud SQL instance the proxy will make a connection with
- `dshopDatabaseURL`: PostgreSQL URL to the database.  The host will be `localhost` if using `cloud_sql_proxy` (and setting `dshopDBInstance` above).  e.g. `postgresql://username:password@127.0.0.1:5432/dshop`
- `dshopSentryDSN`: An optional [Sentry](https://sentry.io/) DSN if you want errors reported

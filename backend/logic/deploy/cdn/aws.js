/**
 * AWS Cloudfront CDN configuration resources.
 *
 * Notes
 * =====
 * - To document: You may need to contact AWS support and get this enabled? I
 *    received this error on my first attempt to create a
 *    Cloudfront distribution: AccessDenied: Your account must be verified
 *    before you can add new CloudFront resources.
 */
const _find = require('lodash/find')
const get = require('lodash/get')
const ACM = require('aws-sdk/clients/acm')
const CloudFront = require('aws-sdk/clients/cloudfront')
const S3 = require('aws-sdk/clients/s3')
const { isConfigured } = require('@origin/dshop-validation/matrix')

const {
  DEFAULT_AWS_REGION,
  DEFAULT_AWS_CACHE_POLICY_NAME
} = require('../../../utils/const')
const route53 = require('../../../utils/dns/route53')
const { assert } = require('../../../utils/validators')
const { allIn } = require('../../../utils/array')
const { getLogger } = require('../../../utils/logger')

const log = getLogger('logic.deploy.cdn.aws')

let cloudfrontClient, acmClient, awsCredentials, s3Client

/**
 * Check if AWS is configured and we can deploy to it
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 * @returns {bool} - if we can deploy
 */
function isAvailable({ networkConfig, resourceSelection }) {
  return (
    resourceSelection.includes('aws-cdn') &&
    isConfigured(networkConfig, 'aws-cdn')
  )
}

/**
 * Configure this singleton for a use
 *
 * @param args {Object}
 * @param args.networkConfig {Object} - Decrypted networkConfig object
 */
async function configure({ networkConfig }) {
  awsCredentials = {
    accessKeyId: networkConfig.awsAccessKeyId,
    secretAccessKey: networkConfig.awsSecretAccessKey,
    region: networkConfig.awsRegion || DEFAULT_AWS_REGION
  }
  cloudfrontClient = new CloudFront({
    apiVersion: '2020-05-31',
    region: networkConfig.awsRegion || DEFAULT_AWS_REGION,
    ...awsCredentials
  })
  acmClient = new ACM({
    apiVersion: '2015-12-08',
    region: networkConfig.awsRegion || DEFAULT_AWS_REGION,
    ...awsCredentials
  })
  s3Client = new S3({
    apiVersion: '2006-03-01',
    region: networkConfig.awsRegion || DEFAULT_AWS_REGION,
    ...awsCredentials
  })
}

/**
 * Configure CDN to point to bucket
 *
 * @param args {Object}
 * @param args.shop {Object} - Shop model instance
 * @param args.deployment {Object} - ShopDeployment model instance
 * @param args.domains {Array<string>} - name of Google Cloud Storage bucket
 */
async function configureCDN({ shop, deployment, domains }) {
  assert(!!shop, 'shop must be provied')
  assert(!!deployment, 'deployment must be provied')
  assert(domains instanceof Array, 'domains must be an array')

  if (!deployment.bucketUrls) {
    log.warn(`No bucket URLs found in deployment`)
    return
  }

  const urls = deployment.bucketUrls.split(',').map((u) => new URL(u))
  const bucketUrl = _find(urls, (o) => o.protocol === 's3:')

  if (!bucketUrl) {
    log.warn(`No S3 bucket URL found in deployment`)
    return
  }

  const bucketName = bucketUrl.hostname
  const requestId = String(+new Date())

  let acmCertificateArn
  let cert = await getCertificate(domains[0])

  if (cert && allIn(cert.SubjectAlternativeNames, domains)) {
    log.debug('Found Certificate')

    acmCertificateArn = cert.CertificateArn
  } else {
    log.debug('Creating Certificate')

    acmCertificateArn = await createCertificate({ requestId, domains })
    cert = await getCertificateByARN(acmCertificateArn)
  }

  // Do DNS validation if necessary
  for (const dvo of cert.DomainValidationOptions) {
    const status = dvo.ValidationStatus

    if (status === 'FAILED') {
      log.debug(JSON.stringify(dvo))
      throw new Error('DNS Failed validation and I do not know what to do')
    } else if (status === 'PENDING_VALIDATION') {
      if (dvo.ValidationMethod !== 'DNS') {
        throw new Error('Only DNS validation supported')
      }

      const rr = dvo.ResourceRecord
      const zoneRecord = await route53.resolveZone({
        credentials: awsCredentials,
        DNSName: dvo.DomainName
      })

      if (zoneRecord && rr) {
        log.debug(`Creating DNS validation record ${rr.Name}`)

        await route53.addRecord({
          credentials: awsCredentials,
          zone: zoneRecord.Name,
          type: rr.Type,
          name: rr.Name,
          value: rr.Value
        })
      } else {
        throw new Error(`Domain ${dvo.DomainName} is not controlled by Route53`)
      }
    } else if (status === 'ISSUED' || status === 'SUCCESS') {
      log.debug(`Cert already issued for ${dvo.DomainName}`)
    } else {
      log.warn(`Unhandled domain verification status: ${status}`)
    }
  }

  let bucketWeb = await getBucketWebsite({ bucketName })
  if (bucketWeb) {
    log.debug('Found BucketWebsite')
  } else {
    log.debug('Creating BucketWebsite')

    bucketWeb = await createBucketWebsite({ bucketName })
  }

  bucketWeb = await getBucketWebsite({ bucketName })

  let cachePolicy = await getDefaultCachePolicy()
  if (cachePolicy) {
    log.debug('Found CachePolicy')
  } else {
    log.debug('Creating CachePolicy')

    cachePolicy = await createCachePolicy()
  }

  let dist = await getDistribution(domains[0])
  if (dist) {
    log.debug('Distribution Found, Creating Invalidation')

    await createInvalidation({
      shop,
      requestId,
      distributionId: dist.Id
    })
  } else {
    log.debug('Creating Distribution')

    dist = await createDistribution({
      requestId,
      cnames: domains,
      bucketName,
      bucketWebsiteUrl: getWebsiteURL(bucketName, awsCredentials.region),
      acmCertificateArn,
      cachePolicyId: cachePolicy.CachePolicy.Id
    })
  }

  log.debug(`Cloudfront distribution at https://${dist.DomainName}`)

  return {
    cname: dist.DomainName
  }
}

/**
 * Get details of an AWS Certificate
 *
 * @param arn {string} - The Certificate ARN to fetch
 * @returns {object} - A Certificate object
 */
async function describeCertificate(arn) {
  const res = await acmClient
    .describeCertificate({
      CertificateArn: arn
    })
    .promise()
  return res.Certificate
}

/**
 * List AWS Certificates
 *
 * @returns {array} of Certificate objects
 */
async function listCertificates() {
  return await acmClient
    .listCertificates({
      CertificateStatuses: ['ISSUED', 'PENDING_VALIDATION']
    })
    .promise()
}

/**
 * Get an AWS Certificate by primary domain
 *
 * @param primaryDomain {string} - The Certificate's primary domain name
 * @returns {object} - A Certificate object
 */
async function getCertificate(primaryDomain) {
  const res = await listCertificates()
  const certs = res.CertificateSummaryList
  for (const cert of certs) {
    if (cert.DomainName === primaryDomain) {
      return await describeCertificate(cert.CertificateArn)
    }
  }
  return null
}

/**
 * Get an AWS Certificate by ARN
 *
 * @param arn {string} - The Certificate's ARN
 * @returns {object} - A Certificate object
 */
async function getCertificateByARN(arn) {
  const res = await listCertificates()

  const certs = res.CertificateSummaryList

  for (const cert of certs) {
    if (cert.CertificateArn === arn) {
      return await describeCertificate(cert.CertificateArn)
    }
  }

  return null
}

/**
 * List AWS Cloudfront Distributions
 *
 * @returns {array} of Distribution objects
 */
async function listDistributions() {
  const res = await cloudfrontClient.listDistributions({}).promise()

  // TODO: Add pagination support
  if (res.DistributionList.Quantity == 100) {
    log.warn('Possibly reached max items in distribution list')
  }

  return res.DistributionList.Items
}

/**
 * Get an AWS Cloudfront Distribution by primary domain
 *
 * @param primaryDomain {string} - The Distribution's primary domain alias
 * @returns {object} - A Distribution object
 */
async function getDistribution(primaryDomain) {
  const res = await listDistributions()
  if (res.length < 1) return null

  for (const dist of res) {
    if (
      dist.Aliases &&
      dist.Aliases.Quantity > 0 &&
      dist.Aliases.Items.includes(primaryDomain)
    ) {
      return dist
    }
  }
  return null
}

/**
 * List AWS Cloudfront cache policies
 *
 * @returns {array} of CachePolicy objects
 */
async function listCachePolicies() {
  const res = await cloudfrontClient.listCachePolicies({}).promise()
  // TODO: Add pagination support
  if (res.CachePolicyList.Quantity == 100) {
    log.warn('Possibly reached max items in cache policy list')
  }
  return res.CachePolicyList.Items
}

/**
 * Get the  AWS Cloudfront CachePolicy we created for Dshop
 *
 * @returns {object} - A CachePolicy object
 */
async function getDefaultCachePolicy() {
  const res = await listCachePolicies()
  if (res.length < 1) return null
  for (const policy of res) {
    const name = get(policy, 'CachePolicy.CachePolicyConfig.Name')

    if (name === DEFAULT_AWS_CACHE_POLICY_NAME) {
      return policy
    }
  }
  return null
}

/**
 * Create an AWS Cloudfront CachePolicy to use as default
 *
 * @returns {string} The CachePolicy Id
 */
async function createCachePolicy() {
  const params = {
    CachePolicyConfig: {
      MinTTL: '30',
      Name: DEFAULT_AWS_CACHE_POLICY_NAME,
      Comment: 'Default cache policy for Dshops',
      DefaultTTL: '120',
      MaxTTL: '300',
      ParametersInCacheKeyAndForwardedToOrigin: {
        CookiesConfig: {
          CookieBehavior: 'none'
          /*Cookies: {
            Quantity: '0',
            Items: []
          }*/
        },
        EnableAcceptEncodingGzip: true,
        HeadersConfig: {
          // TODO: CSP?
          HeaderBehavior: 'none'
          /*Headers: {
            Quantity: '0',
            Items: []
          }*/
        },
        QueryStringsConfig: {
          QueryStringBehavior: 'none'
          /*QueryStrings: {
            Quantity: '0',
            Items: []
          }*/
        },
        EnableAcceptEncodingBrotli: false
      }
    }
  }

  const res = await cloudfrontClient.createCachePolicy(params).promise()

  return get(res, 'CachePolicy.Id')
}

/**
 * Create a Cloudfront Distribution
 *
 * Ref: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-working-with.html
 * Ref: https://aws.amazon.com/cloudfront/pricing/
 *
 * @param args {Object}
 * @param args.requestId {string} A unique string for this set of requests for
 *    idempotency protection
 * @param args.cnames {Array} of strings for CNAMEs that the distribution should
 *    accept requests for
 * @param args.bucketName {string} name of the bucket containing the Dshop build
 * @param args.bucketWebsiteUrl {string} URL for the bucket Web endpoint
 * @param args.acmCertificateArn {string} ARN for Cert
 * @param args.cachePolicyId {string} ID for the cache policy to use
 * @returns {object} result of createDistribution request
 */
async function createDistribution({
  requestId,
  cnames = [],
  bucketName,
  bucketWebsiteUrl,
  acmCertificateArn,
  cachePolicyId
}) {
  assert(!!requestId, 'requestId must be provided')
  assert(!!cachePolicyId, 'cachePolicyId must be provided')
  assert(!!cloudfrontClient, 'Call configure() first')

  if (!(bucketWebsiteUrl instanceof URL)) {
    bucketWebsiteUrl = new URL(bucketWebsiteUrl)
  }

  const origins = [
    {
      Id: bucketName,
      DomainName: bucketWebsiteUrl.hostname,
      //CustomHeaders: [], // TOOD: CSP or CORS?
      CustomOriginConfig: {
        HTTPPort: '80',
        HTTPSPort: '443', // required, but unused
        OriginProtocolPolicy: 'http-only'
      }
    }
  ]

  const params = {
    DistributionConfig: {
      CallerReference: requestId,
      Comment: `Distribution for Dshop frontend ${bucketName}`,
      Aliases: {
        Quantity: cnames.length,
        Items: cnames
      },
      DefaultRootObject: 'index.html',
      Origins: {
        Quantity: origins.length,
        Items: origins
      },
      DefaultCacheBehavior: {
        TargetOriginId: origins[0].Id,
        ViewerProtocolPolicy: 'allow-all', // TODO: redirect-to-https?
        CachePolicyId: cachePolicyId,
        AllowedMethods: {
          Quantity: 3,
          Items: ['GET', 'HEAD', 'OPTIONS']
        },
        Compress: true
      },
      Logging: {
        Enabled: false, // Save some S3 storage
        IncludeCookies: false,
        Bucket: '',
        Prefix: ''
      },
      PriceClass: 'PriceClass_100',
      Enabled: true,
      ViewerCertificate: {
        CloudFrontDefaultCertificate: false,
        ACMCertificateArn: acmCertificateArn,
        SSLSupportMethod: 'sni-only'
      },
      IsIPV6Enabled: true
    }
  }

  const res = await cloudfrontClient.createDistribution(params).promise()

  return res
}

/**
 * Create a Cloudfront cache invalidation
 *
 * @param args {object}
 * @param args.shop {object} model instance of Shop
 * @param args.requestId {string} A unique string for this set of requests for
 *    idempotency protection
 * @param args.distributionId {string} Cloudfront Distribution Id
 * @returns {object} result of createInvalidation request
 */
async function createInvalidation({ shop, requestId, distributionId }) {
  const paths = ['/*', `/${shop.authToken}/*`, `/dist/*`]
  const params = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: requestId,
      Paths: {
        Quantity: paths.length,
        Items: paths
      }
    }
  }

  const res = await cloudfrontClient.createInvalidation(params).promise()

  return res
}

/**
 * Create an AWS certificate to use for Cloudfront
 *
 * @param args {object}
 * @param args.requestId {string} A unique string for this set of requests for
 *    idempotency protection
 * @param args.domains {Array} of domain names the cert is for
 * @returns {string} ARN of the newly created certificate
 */
async function createCertificate({ requestId, domains }) {
  const primaryDomain = domains.shift()
  const params = {
    DomainName: primaryDomain,
    DomainValidationOptions:
      domains.length > 0
        ? domains.map((d) => {
            return {
              DomainName: d,
              ValidationDomain: d
            }
          })
        : null,
    IdempotencyToken: requestId,
    SubjectAlternativeNames: domains.length > 0 ? domains : null,
    Tags: [
      {
        Key: 'APP',
        Value: 'dshop'
      }
    ],
    ValidationMethod: 'DNS'
  }

  const res = await acmClient.requestCertificate(params).promise()

  return res.CertificateArn
}

/**
 * Get details about a bucket website service
 *
 * @param args {object}
 * @param args.bucketName {string} - bucket name we're configuring
 * @returns {object} BucketWebsite
 */
async function getBucketWebsite({ bucketName }) {
  try {
    const res = await s3Client
      .getBucketWebsite({
        Bucket: bucketName
      })
      .promise()

    return res
  } catch (err) {
    if (err.toString().includes('NoSuchWebsiteConfiguration')) {
      return null
    }
    throw err
  }
}

/**
 * Creates the website component which is needed to serve static Web sites from
 * s3 buckets.  Similar to backendBuckets for GCP
 *
 * @param args {object}
 * @param args.bucketName {string} - bucket name we're configuring
 * @returns {object} BucketWebsite
 */
async function createBucketWebsite({ bucketName }) {
  const params = {
    Bucket: bucketName,
    WebsiteConfiguration: {
      IndexDocument: {
        Suffix: 'index.html'
      }
    }
  }

  const res = await s3Client.putBucketWebsite(params).promise()

  return res
}

/**
 * Given a bucketName, return HTTP URL used for static Web site serving
 *
 * @param bucketName {string} name of bucket
 * @param region {string} AWS Region
 * @returns {string} HTTP URL to bucket
 */
function getWebsiteURL(bucketName, region) {
  return `http://${bucketName}.s3-website-${
    region ? region : DEFAULT_AWS_REGION
  }.amazonaws.com/`
}

module.exports = { isAvailable, configure, configureCDN }

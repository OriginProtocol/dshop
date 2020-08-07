module.exports = (vars) => `
${vars.siteName}

You’re receiving this email because following error occured while trying to process a Stripe webhook event:

> ${vars.message}

External Payment ID: ${vars.externalPaymentId}

============================
${vars.stackTrace}
============================
`

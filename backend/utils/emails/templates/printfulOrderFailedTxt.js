module.exports = (vars) => `
${vars.siteName}

You’re receiving this message because one of the orders couldn't be created on Printful because of the following reason:

> ${vars.message}

View order on Dshop: ${vars.orderUrlAdmin}

If you have questions, we’re here to help: ${vars.supportEmail}
`

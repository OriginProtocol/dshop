module.exports = (vars) => `
Welcome to Origin Dshop, ${vars.name}.

You’re receiving this message because you recently signed up for a Dshop account.

Confirm your email address by clicking the link below. This step adds extra security to your business by verifying you own this email.

${vars.verifyUrl}

This link will expire in 24 hours. If you have questions, we’re here to help: ${vars.supportEmailPlain}
`

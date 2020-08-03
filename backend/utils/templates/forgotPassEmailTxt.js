module.exports = (vars) => `
Hi, ${vars.name}.

You’re receiving this message because you recently attempted to reset your password.

Please click below to choose a new password:

${vars.verifyUrl}

This link will expire in 24 hours. If you have questions, we’re here to help: ${vars.supportEmailPlain}
`

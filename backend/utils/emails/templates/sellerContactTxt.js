module.exports = (vars) => `
Hi, ${vars.sellerName}.

${vars.fullName} (${vars.userEmail}) has sent you the following message from your shop:

Subject: ${vars.subject}

Message Content:
${vars.content}
`

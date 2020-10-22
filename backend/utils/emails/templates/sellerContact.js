module.exports = (vars) => `
<mjml>
  ${vars.head}
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text mj-class="large">Hi, ${vars.sellerName}</mj-text>
        <mj-text mj-class="light">
          ${vars.fullName} (${vars.userEmail}) has sent you the following message from your shop:
        </mj-text>
        <mj-text mj-class="light">
          Subject: ${vars.subject}
        </mj-text>
        <mj-text mj-class="light">
          Message Content: ${vars.content}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`

module.exports = (vars) => `
<mjml>
  ${vars.head}
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text mj-class="large">${vars.siteName}</mj-text>
        <mj-text mj-class="light">
          You’re receiving this email because following error occured while trying to process a Stripe webhook event:
        </mj-text>
        <mj-text mj-class="light">
          ${vars.message}
        </mj-text>
        <mj-text mj-class="light">
          External Payment ID: ${vars.externalPaymentId}
        </mj-text>
        <blockquote>
          ${vars.stackTrace}
        </blockquote>
      </mj-column>
    </mj-section>
    <mj-divider />
  </mj-body>
</mjml>
`

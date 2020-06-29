module.exports = (vars) => `
<mjml>
  ${vars.head}
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text mj-class="large">Welcome to Origin Dshop, ${vars.name}</mj-text>
        <mj-text mj-class="light">
          You’re receiving this message because you recently signed up for a Dshop account.
        </mj-text>
        <mj-text mj-class="light">
          Confirm your email address by clicking the link below. This step adds extra security to your business by verifying you own this email.
        </mj-text>
        <mj-text css-class="view-order">
          <a href="${vars.verifyUrl}" class="btn">
            Verify your email
          </a>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-divider />

    <mj-divider />
    <mj-section>
      <mj-column>
        <mj-text mj-class="light small">
          If you have any questions, <a href="mailto:${vars.supportEmailPlain}">we're here to help</a>.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`

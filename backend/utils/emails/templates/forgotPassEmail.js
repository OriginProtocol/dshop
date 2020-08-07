module.exports = (vars) => `
<mjml>
  ${vars.head}
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text mj-class="large">Hi, ${vars.name}</mj-text>
        <mj-text mj-class="light">
          You’re receiving this message because you recently attempted to reset your password.
        </mj-text>
        <mj-text mj-class="light">
        Please click below to choose a new password:
        </mj-text>
        <mj-text css-class="view-order">
          <a href="${vars.verifyUrl}" class="btn">
            Reset password
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

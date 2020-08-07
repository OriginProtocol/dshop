module.exports = (vars) => `
<mjml>
  ${vars.head}
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text mj-class="large">${vars.siteName}</mj-text>
        <mj-text mj-class="light">
          You’re receiving this message because one of the orders couldn't be created on Printful because of the following reason:
        </mj-text>
        <mj-text mj-class="light">
          ${vars.message}
        </mj-text>
        <mj-text css-class="view-order">
          <a href="${vars.orderUrlAdmin}" class="btn">
            View order on Dshop
          </a>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-divider />

    <mj-divider />
    <mj-section>
      <mj-column>
        <mj-text mj-class="light small">
          If you have any questions, <a href="mailto:${vars.supportEmail}">we're here to help</a>.
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`

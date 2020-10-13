import React from 'react'
import fbt, { FbtParam } from 'fbt'

const Footer = () => {
  const date = new Date()
  return (
    <div className="container my-20 flex justify-center gap-8">
      <div>
        <a
          className="hover:opacity-75"
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.originprotocol.com/en/dshop"
        >
          <fbt desc="footer.poweredBy">Powered by Origin Dshop</fbt>
        </a>
      </div>
      <div>
        <fbt desc="footer.copyrightText">
          &copy; <FbtParam name="year">{date.getFullYear()}</FbtParam> Origin
          Protocol
        </fbt>
      </div>
    </div>
  )
}

export default Footer

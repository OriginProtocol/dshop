import React from 'react'

import Link from 'components/Link'

import Header from './_Header'
import Footer from './_Footer'
import Products from './_Products'

const About = () => {
  return (
    <div className="bg-gray-100 p-4 border border-gray-400 flex flex-col sm:flex-row">
      <div
        className="order-last sm:order-first bg-contain bg-no-repeat"
        style={{ flex: 1, backgroundImage: `url(peer-art/artist.png)` }}
      />
      <div className="p-12 pr-24 flex flex-col items-start justify-center flex-1">
        <div className="text-3xl sm:text-4xl leading-tight font-light mb-16">
          The Peer Art is run by Ofer Mizrachi, an experienced artist based in
          Israel.
        </div>
        <Link to="/about" className="btn">
          Learn More
        </Link>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <>
      <Header bg={true} />

      <div className="container">
        <div className="text-center my-12 sm:my-24">
          <h1 className="text-3xl sm:text-4xl leading-tight mb-4">
            Limited Edition Art
          </h1>
          <div className="text-gray-500 text-sm">
            Payment via Cryptocurrency: OGN / DAI / ETH / CRO / CEL - also by a
            PayPal & Credit Card.
          </div>
        </div>

        <Products limit={3} />

        <div className="my-24 flex justify-center">
          <Link to="/products" className="btn">
            View All Prints
          </Link>
        </div>

        <About />
      </div>

      <Footer />
    </>
  )
}

export default App

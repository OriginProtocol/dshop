import React from 'react'
import Title from '../components/Title'

const About = () => {
  return (
    <div className="w-full flex flex-col bg-white rounded-lg p-6 pb-8 text-black mb-6">
      <Title back="/">About</Title>

      <div className="whitespace-pre-line">
        {`How it works:

$SOCKS is a token that entitles you to 1 real pair of limited edition socks, shipped anywhere in the world.

You can sell the token back at any time. To get a real pair, redeem a $SOCKS token

How it's priced:

$SOCKS tokens are listed starting at $12 USD. Each buy/sell will move the price. The increase or decrease follows a bonding curve. $SOCKS will eventually find an equillibrium based on market demand.

Unipay:

Buying or selling socks uses the uniswap protocol and accepts any token input as a payment method. The pool of SOCKS is a uniswap pool where 500 SOCKS tokens were deposited along with the starting value of ETH.

Learn more about how uniswap works.

Get in touch.`}
      </div>
    </div>
  )
}

export default About

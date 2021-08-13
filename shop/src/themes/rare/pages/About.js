import React from 'react'

const About = () => {
  return (
    <div className="w-full flex flex-col bg-white rounded-lg p-6 pb-8 text-black mb-6">
      <div className="whitespace-pre-line">
        {`How it works:

$CHICO is a token that entitles you to 1 real limited edition t-shirt, shipped anywhere in the world.

You can sell the token back at any time. To get a real pair, redeem a $CHICO token

How it's priced:

$CHICO tokens are listed starting at $25 USD. Each buy/sell will move the price. The increase or decrease follows a bonding curve. $CHICO will eventually find an equillibrium based on market demand.`}
      </div>
    </div>
  )
}

export default About

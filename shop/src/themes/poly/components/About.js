import React from 'react'

import Header from './_Header'
import Footer from './_Footer'

const About = () => {
  return (
    <>
      <div className="container pt-20">
        <Header />
        <div className="my-24">
          <div className="text-5xl leading-none mb-6">About</div>
          <div className="text-3xl whitespace-pre-line leading-tight max-w-4xl">{`Our team of artists and CAD designers take inspiration from the world around us and turn it into 3D models. We then turn these 3D models into real world pieces of art and collectors items.

Low Poly Mint was founded by creative technologists. We use our unique knowledge and skillsets to bring together the digital and physical worlds. Transforming radical 3D models into physical objects and in turn, works of art.

The products we sell are made from geniune precious metals as per our item specifics, that does make our pricing structure market price dependent. Please understand that as market prices change, our prices may also have to be altered.

We are still working on the crypto payments integration, and will announce this when it arrives.

Currently only shipping in the continental USA - but its FREE SHIPPING!

Stay tuned!

For requests or other business related matters please email us here. Contact@lowpolymint.com

Made in the USA!`}</div>
        </div>
      </div>
      <div
        className="bg-no-repeat mb-12"
        style={{
          paddingTop: '45%',
          backgroundSize: '200%',
          backgroundPosition: '39% 56%',
          backgroundImage:
            'url(low-poly-mint/bitcoin-b/orig/upload_824345c7f5726b7a7cb5222a6ac8ac2d'
        }}
      />
      <div className="container pb-20">
        <Footer />
      </div>
    </>
  )
}

export default About

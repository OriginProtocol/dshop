import React from 'react'

import Link from 'components/Link'

const Home = () => {
  return (
    <>
      <div className="container">
        <div className="text-3xl sm:text-5xl text-center leading-none my-20 whitespace-pre-line">
          {`Custom designed art
        cast out of precious metals`}
        </div>
      </div>
      <div className="sm:container">
        <div className="grid grid-cols-2 gap-px sm:gap-12">
          <div>
            <Link
              to="/product/bitcoin-b"
              className="block bg-no-repeat"
              style={{
                paddingTop: '90%',
                backgroundSize: '162%',
                backgroundPosition: '48% 40%',
                backgroundImage:
                  'url(low-poly-mint/bitcoin-b/orig/upload_824345c7f5726b7a7cb5222a6ac8ac2d'
              }}
            />
            <Link
              to="/product/bitcoin-b"
              className="block bg-no-repeat sm:mt-12 mt-px"
              style={{
                paddingTop: '153%',
                backgroundSize: '210%',
                backgroundPosition: '51% 75%',
                backgroundImage:
                  'url(low-poly-mint/bitcoin-b/orig/upload_c51617c0e1ca63a07e3c18ea8d7db546'
              }}
            />
          </div>
          <div>
            <Link
              to="/product/litecoin-l"
              className="block bg-no-repeat"
              style={{
                paddingTop: '77%',
                backgroundSize: '141%',
                backgroundPosition: '48% 54%',
                backgroundImage:
                  'url(low-poly-mint/litecoin-l/orig/upload_395e3682f299c3d0548f72120872dee0'
              }}
            />
            <Link
              to="/product/litecoin-l"
              className="block bg-no-repeat sm:mt-12 mt-px"
              style={{
                paddingTop: '77%',
                backgroundSize: '308%',
                backgroundPosition: '34% 88%',
                backgroundImage:
                  'url(low-poly-mint/litecoin-l/orig/upload_297f5cd93dcd550412bb6f0daff71633'
              }}
            />
            <Link
              to="/product/litecoin-l"
              className="block bg-no-repeat sm:mt-12 mt-px"
              style={{
                paddingTop: '77%',
                backgroundSize: '119%',
                backgroundPosition: '55% 79%',
                backgroundImage:
                  'url(low-poly-mint/litecoin-l/orig/upload_297f5cd93dcd550412bb6f0daff71633'
              }}
            />
          </div>
        </div>
        <div
          className="bg-no-repeat sm:mt-12"
          style={{
            paddingTop: '50%',
            backgroundSize: '200%',
            backgroundPosition: '39% 62%',
            backgroundImage:
              'url(low-poly-mint/bitcoin-b/orig/upload_824345c7f5726b7a7cb5222a6ac8ac2d'
          }}
        />
        <div className="container py-16 sm:py-32 flex flex-col items-center">
          <div className="text-2xl leading-tight max-w-sm text-center mb-12">
            Our team of artists and CAD designers take inspiration from the
            world around us and turn it into 3D models. We then turn these 3D
            models into real world pieces of art and collectors items.
          </div>
          <Link to="/about" className="btn text-2xl px-10">
            About Us
          </Link>
        </div>
      </div>
    </>
  )
}

export default Home

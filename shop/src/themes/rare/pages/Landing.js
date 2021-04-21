import React from 'react'

import Link from 'components/Link'

import useConfig from 'utils/useConfig'
import { usePrices } from '../utils'

const Storefront = () => {
  const { config } = useConfig()
  const [state] = usePrices()

  return (
    <div className="container">
      <div
        className="bg-no-repeat bg-contain bg-right-top mt-8 sm:mt-0 pb-8 pt-56 sm:pt-0"
        style={{
          backgroundImage: `url(chico-crypto/main-shirt-image.png)`
        }}
      >
        <div className="text-3xl sm:text-7xl font-bold leading-none mt-20 whitespace-pre-line">
          {`Limited edition
          Chico Crypto
          T-shirts`}
        </div>
        <div className="max-w-sm text-gray-300 mt-4">
          <div className="flex flex-col sm:flex-row items-baseline leading-none">
            <div className="text-green-600 text-3xl">{`Only ${state.availableChico} left!`}</div>
            <div className="mt-4 sm:ml-4 sm:mt-0">{`Out of a limited run of ${config.initialCoinSupply}`}</div>
          </div>
          <div className="my-10 text-sm max-w-sm">
            $CHICO is a token that entitles you to a limited edition t-shirt,
            shipped anywhere in the world. You can sell the token back at any
            time. To get a real pair, redeem a $CHICO token.
          </div>
          <Link className="btn btn-primary" to="/product">
            Get one now!
          </Link>
        </div>
      </div>
      <div className="flex flex-col sm:grid grid-cols-2 my-8 sm:my-24">
        <div className="flex">
          <div
            className="bg-no-repeat bg-contain w-32 h-32 sm:w-48 sm:h-48"
            style={{ backgroundImage: `url(chico-crypto/chico-pic.png)` }}
          />
          <div
            className="bg-no-repeat bg-contain w-32 h-32 sm:w-48 sm:h-48 rounded-full"
            style={{
              marginLeft: -30,
              backgroundImage: `url(chico-crypto/artist-pic.jpg)`
            }}
          />
        </div>
        <div>
          <div className="text-2xl font-bold">
            Chico Crypto <span className="text-purple-600">+</span> Fullmetal
            Magdalene
          </div>
          <div className="text-gray-300 text-sm my-6 leading-tight">
            Praesent vitae vehicula ligula, quis varius lacus. Fusce posuere
            euismod est, id pellentesque nulla bibendum a. Nullam interdum quam
            vitae massa tempor ornare.
          </div>
          <div className="flex flex-col sm:grid grid-cols-2 gap-4">
            <button className="btn border-green-600 text-green-600 text-sm">
              About Chico Crypto
            </button>
            <a
              href="https://lynxinbio.com/9txd8"
              target="_blank"
              rel="noreferrer"
              className="btn border-green-600 text-green-600 text-sm"
            >
              About Fullmetal Magdalene
            </a>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:grid grid-cols-2 my-12 sm:my-32 items-center">
        <div className="flex flex-col pr-12 mt-6">
          <div className="font-bold text-3xl">
            About <span className="text-purple-600">$CHICO</span>
          </div>
          <div className="text-gray-300 my-6 leading-tight">
            $CHICO is a token that entitles you to a limited edition t-shirt,
            shipped anywhere in the world. You can sell the token back at any
            time. To get a real pair, redeem a $CHICO token.
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center">
            <div className="border border-purple-600 rounded-full h-24 w-24 sm:h-32 sm:w-32 flex items-center justify-center text-purple-600 text-lg sm:text-2xl">
              $CHICO
            </div>
            <div className="mx-6 text-purple-600 text-2xl">=</div>
            <div
              className="border border-purple-600 rounded-full h-24 w-24 sm:h-32 sm:w-32 flex items-center justify-center bg-no-repeat bg-center"
              style={{
                backgroundSize: '60%',
                backgroundImage: `url(chico-crypto/mini-shirt-icon.svg)`
              }}
            />
          </div>
          <div className="flex text-green-600 text-2xl mt-6">
            <div>Buy</div>
            <div className="ml-8">Sell</div>
            <div className="ml-8">Redeem</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:grid grid-cols-2 my-16 items-center">
        <div className="flex justify-center pr-20">
          <div
            className="bg-contain bg-no-repeat w-48 h-48 sm:w-64 sm:h-64"
            style={{
              backgroundImage: `url(chico-crypto/payment-icons.svg)`
            }}
          />
        </div>
        <div className="flex flex-col mt-12 sm:mt-0">
          <div className="font-bold text-3xl leading-tight">
            <span className="text-purple-600">ETH</span>,{' '}
            <span className="text-orange-600">DAI</span>, OUSD &{' '}
            <span className="text-blue-600">OGN</span>
            <div className="inline sm:block ml-1">payments accepted</div>
          </div>
          <div className="text-gray-300 leading-tight mt-6">
            Praesent vitae vehicula ligula, quis varius lacus. Fusce posuere
            euismod est, id pellentesque nulla bibendum a. Nullam interdum quam
            vitae massa tempor ornare.
          </div>
        </div>
      </div>

      <div className="border-t border-b border-gray-600 my-12 sm:my-24 flex flex-col sm:grid grid-cols-2 py-8 sm:py-16">
        <div className="sm:px-12 flex flex-col items-center">
          <div className="text-xl sm:text-3xl font-bold leading-tight text-center">
            Check out <span className="text-purple-600">Chico Crypto</span> on
            social media
          </div>
          <div className="flex flex-col sm:grid grid-cols-2 gap-4 mt-8">
            <a
              target="_blank"
              rel="noreferrer"
              href="https://www.youtube.com/channel/UCHop-jpf-huVT1IYw79ymPw"
              className="btn text-sm px-6"
            >
              Chico on YouTube
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://www.instagram.com/chicocrypto/"
              className="btn text-sm px-6"
            >
              Chico on Instagram
            </a>
          </div>
        </div>
        <div className="mt-12 sm:mt-0 sm:px-12 flex flex-col items-center">
          <div className="text-xl sm:text-3xl font-bold leading-tight text-center">
            This site was built by the team at{' '}
            <span className="text-blue-600">Origin Protocol</span>
          </div>
          <div className="flex flex-col sm:grid grid-cols-2 gap-4 mt-8">
            <a
              target="_blank"
              rel="noreferrer"
              href="https://www.originprotocol.com"
              className="btn text-sm px-6"
            >
              Visit Our Website
            </a>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://discord.gg/jyxpUSe"
              className="btn text-sm px-6"
            >
              Join Us On Discord
            </a>
          </div>
        </div>
      </div>

      <div className="gradient-border flex sm:px-32 p-6 mt-6 sm:mt-10 flex-col items-center mx-auto max-w-2xl font-bold leading-tight py-6 sm:py-12">
        <div className="text-lg sm:text-2xl text-center">
          Stay up to date on all future limited edition product launches from
          Chico Crypto
        </div>
        <input
          type="text"
          className="border-b border-white bg-black text-center my-12 py-3 w-full"
          placeholder="Your email here"
        />
        <button className="btn btn-primary w-auto px-12">
          Keep me in the loop!
        </button>
      </div>
    </div>
  )
}

export default Storefront

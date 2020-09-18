import React from 'react'

const Footer = () => {
  return (
    <>
      <div className="border-t mt-24" />

      <div className="container pt-16 pb-16 sm:pb-48">
        <div className="text-2xl font-medium leading-none">The Peer Art</div>
        <div />
        <div className="flex flex-col sm:flex-row justify-between mt-8 text-gray-500 text-sm font-light">
          <div className="flex flex-col sm:flex-row pb-8 sm:pb-0">
            <div className="mr-10">Powered by Origin Dshop</div>
            <div>© 2020 Origin Protocol</div>
          </div>
          <ul className="flex flex-col sm:flex-row ">
            <li className="pb-4 sm:mr-10">
              <a href="#">FAQ</a>
            </li>
            <li className="pb-4 sm:mr-10">
              <a href="#">About Dshop</a>
            </li>
            <li className="pb-4 sm:mr-10">
              <a href="#">Visit Origin</a>
            </li>
            <li className="pb-4">
              <a href="#">Support</a>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}

export default Footer

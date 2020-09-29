import React from 'react'

const Contact = () => (
  <div className="container mt-12">
    <div className="flex">
      <div style={{ flex: '2' }}>
        <div className="text-4xl leading-none font-medium">Contact us</div>
        <div className="mt-12 text-sm">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </div>
        <div className="mt-4 font-semibold">
          contact@thepeerart.com
          <br />
          +1 (123) 456-7890
        </div>
      </div>
      <form
        className="grid gap-y-2 ml-24"
        style={{ flex: '3' }}
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <label>First name</label>
          <label>Last name</label>
          <input className="border bg-gray-100 p-3 w-full" />
          <input className="border bg-gray-100 p-3 w-full" />
        </div>
        <label className="mt-3">Email</label>
        <input className="border bg-gray-100 p-3 w-full" />
        <label className="mt-3">Subject</label>
        <input className="border bg-gray-100 p-3 w-full" />
        <label className="mt-3">Message</label>
        <textarea className="border bg-gray-100 p-3 w-full h-32" />
        <div className="mt-6 flex justify-end">
          <button className="btn btn-primary px-16">Submit</button>
        </div>
      </form>
    </div>
  </div>
)

export default Contact

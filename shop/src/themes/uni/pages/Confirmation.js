import React from 'react'
import { Link } from 'react-router-dom'

const Confirmation = () => {
  return (
    <>
      <div className="w-full flex flex-col items-center bg-white rounded-lg pt-6 pb-8 text-black mb-6">
        <div className="font-bold text-3xl">Congratulations!</div>
        <div>You should receive a confirmation email momentarily.</div>
      </div>
      <Link to="/" className="btn">
        Continue
      </Link>
    </>
  )
}

export default Confirmation

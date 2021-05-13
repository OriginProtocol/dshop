import React from 'react'

const RedeemSummary = ({ item }) => {
  return (
    <>
      <div className="text-lg font-medium">Order Summary</div>
      <div className="bg-gray-900 rounded-lg px-4 py-4 mt-4 text-sm font-medium">
        <div className="flex leading-none items-center">
          <div
            className="w-16 h-16 flex items-center justify-center bg-contain"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          />
          <div className="flex-1 flex flex-col ml-2 justify-center">
            <div>Chico Tee Limited Edition</div>
          </div>
          <div className="mx-6">{item.quantity}</div>
          <div>{`${item.quantity} $CHICO`}</div>
        </div>
        <div className="my-4 pt-6 border-t border-gray-600 flex justify-between">
          <div>Size</div>
          <div>{item.options.join(', ')}</div>
        </div>
        <div className="mt-6 pt-6 pb-4 border-t border-gray-600 flex justify-between">
          <div>Total</div>
          <div>{`${item.quantity} $CHICO`}</div>
        </div>
      </div>
    </>
  )
}

export default RedeemSummary

import React from 'react'

const ButtonPrimary = ({
  loading,
  disabled,
  onClick,
  onClickOverride,
  text,
  error
}) => {
  return (
    <>
      <button
        className={`btn btn-primary${
          disabled || loading ? ' disabled opacity-50 pointer-events-none' : ''
        }`}
        onClick={() => {
          if (disabled || loading) return
          if (onClickOverride || onClick) {
            onClickOverride ? onClickOverride() : onClick()
          }
        }}
      >
        {text}
      </button>
      {!error ? null : (
        <div className="text-sm mt-2 px-4 text-red-500 break-all">{error}</div>
      )}
    </>
  )
}

export default ButtonPrimary

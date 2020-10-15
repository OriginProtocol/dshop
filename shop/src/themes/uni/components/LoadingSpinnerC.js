import React from 'react'

const LoadingSpinnerC = (props) => {
  return (
    <svg width="50" height="50" viewBox="0 0 110 110" {...props}>
      <linearGradient id="linearColors1" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#53ff96" stopOpacity="0"></stop>
        <stop offset="25%" stopColor="#53ff96" stopOpacity="0.7"></stop>
        <stop offset="100%" stopColor="#4b9dff"></stop>
      </linearGradient>
      <linearGradient id="linearColors2" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor="#4b9dff"></stop>
        <stop offset="100%" stopColor="#f644ff"></stop>
      </linearGradient>
      <g>
        <path
          d=" M 105 55 A 50 50 0 0 1 5 55"
          fill="none"
          stroke="url(#linearColors1)"
          strokeWidth="10"
        />
        <path
          d=" M 5 55 A 50 50 180 0 1 105 55"
          fill="none"
          stroke="url(#linearColors2)"
          strokeWidth="10"
        />
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          dur="1s"
          from="0 55 55"
          to="360 55 55"
          repeatCount="indefinite"
        />
      </g>
    </svg>
  )
}

export default LoadingSpinnerC

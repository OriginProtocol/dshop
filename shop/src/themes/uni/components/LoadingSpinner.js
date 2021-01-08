import React from 'react'

const Loading = (props) => {
  return (
    <svg width="16" height="16" viewBox="0 0 120 120" fill="none" {...props}>
      <circle
        cx="60"
        cy="60"
        r="52"
        strokeWidth="16"
        stroke="#fff"
        strokeLinecap="round"
        strokeDasharray="339.292"
        strokeDashoffset="105.181"
      >
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          dur="1s"
          from="0 60 60"
          to="360 60 60"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  )
}

export default Loading

import React from 'react'

const Button = (props) => {
  return (
    <button
      {...props}
      className={`btn btn-primary generic-button${
        props.className ? ' ' + props.className : ''
      }`}
    />
  )
}

export default Button

require('react-styl')(`
  .generic-button
    box-shadow: 5px 5px 8px 0 #0065d2, -3px -3px 6px 0 #2a92ff, inset 3px 3px 2px 0 #0e4d90, inset -3px -3px 2px 0 #021d3a
    background-image: linear-gradient(289deg, #02203f, #053c77 6%)
    color: #fff
    border-radius: 5px
    width: auto
    margin: 0.75rem auto
    display: inline-block
    padding: 0.5rem 1.75rem
    font-size: 1.125rem
`)

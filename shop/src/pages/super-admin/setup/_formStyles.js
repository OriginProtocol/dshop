export const formGroupStyles = styleSelector => `
  ${styleSelector}
    margin-bottom: 1.5rem

    label
      text-align: left
      color: #fff
      font-size: 1.125rem
      font-weight: bold
      margin-bottom: 0.5rem

    input, select, textarea
      border-radius: 5px
      border-style: solid
      border-width: 1px
      border-image-source: linear-gradient(to bottom, #1384ff, #006ee6)
      border-image-slice: 1
      background-image: linear-gradient(98deg, #0073ed, #007cff), linear-gradient(to bottom, #1384ff, #006ee6)
      color: #fff

      &:focus
        color: #fff

      &:disabled
        color: #a3a3a3
      
      &::placeholder
        color: #a3a3a3

    .input-group-prepend, .input-group-append
      .input-group-text
        background-image: linear-gradient(289deg, #02203f, #053c77 6%)
        color: #fff
        border: 0

`

export const buttonBgStyle = styleSelector => `
  ${styleSelector}
    box-shadow: 5px 5px 8px 0 #0065d2, -3px -3px 6px 0 #2a92ff, inset 3px 3px 2px 0 #0e4d90, inset -3px -3px 2px 0 #021d3a
    background-image: linear-gradient(289deg, #02203f, #053c77 6%)
    color: #fff
`

export const buttonStyle = styleSelector => `
  ${styleSelector}
    ${buttonBgStyle('')}
    border-radius: 5px
    width: auto
    margin: 0.75rem auto
    display: inline-block
    padding: 0.5rem 1.75rem
    font-size: 1.125rem
`

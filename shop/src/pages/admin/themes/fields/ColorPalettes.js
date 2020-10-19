import React from 'react'
import get from 'lodash/get'

const ColorPalettes = ({ field, value, onChange }) => {
  const palettes = get(field, 'palettes', [])
  const selectedPaletteId = value || get(palettes, '0.id')
  const selectedPalette = palettes.find((p) => p.id === selectedPaletteId)

  return (
    <>
      <div className="form-group">
        <label>{field.title}</label>
        <select
          className="form-control"
          value={selectedPaletteId}
          onChange={(e) => onChange(e.target.value)}
        >
          {palettes.map((palette) => (
            <option key={palette.id} value={palette.id}>
              {palette.title}
            </option>
          ))}
        </select>
      </div>
      <div className="selected-palette-colors">
        {!selectedPalette
          ? null
          : Object.keys(field.colorLabels).map((colorKey) => {
              return (
                <div key={colorKey}>
                  <div
                    className="color-box"
                    style={{
                      backgroundColor: selectedPalette.colors[colorKey]
                    }}
                  />
                  <div>{field.colorLabels[colorKey]}</div>
                </div>
              )
            })}
      </div>
    </>
  )
}

export default ColorPalettes

require('react-styl')(`
  .selected-palette-colors
    margin: 0.5rem 0
    > div
      margin-bottom: 0.5rem
      display: flex
      align-items: center
      .color-box
        flex: auto 0 0
        height: 25px
        width: 25px
        border: 1px solid #999999
        display: inline-block
        margin-right: 0.5rem
`)

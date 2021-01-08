import React from 'react'
import fbt from 'fbt'
import get from 'lodash/get'

import TextField from './fields/Text'
import MediaField from './fields/Media'
import ProductsList from './fields/ProductsList'
import CollectionsList from './fields/CollectionsList'
import ColorPalettes from './fields/ColorPalettes'
import Range from './fields/Range'
import Select from './fields/Select'

const Section = ({ section, state, setState, onDrilldown, isActive }) => {
  return (
    <>
      <div
        className="section-title admin-title"
        onClick={() => {
          if (onDrilldown) {
            onDrilldown()
          }
        }}
      >
        {section.title}
        <span className="chevron" />
      </div>

      <div className={`section-fields${isActive ? ' active' : ''}`}>
        {!isActive ? null : (
          <>
            {section.fields.map((field) => {
              const fieldState = get(state, field.id)
              const setFieldState = (newState) => {
                setState({
                  ...state,
                  [field.id]: newState
                })
              }

              const props = {
                key: field.id,
                field,
                value: fieldState,
                onChange: setFieldState
              }

              switch (field.type) {
                case 'media':
                  return <MediaField {...props} />

                case 'collections_list':
                  return <CollectionsList {...props} />

                case 'products_list':
                  return <ProductsList {...props} />

                case 'color_palettes':
                  return <ColorPalettes {...props} />

                case 'range':
                  return <Range {...props} />

                case 'select':
                  return <Select {...props} />

                default:
                  return <TextField {...props} />
              }
            })}
          </>
        )}
      </div>
    </>
  )
}

const SectionsList = ({
  state,
  theme,
  onChange,
  onDrilldown,
  activeSection
}) => {
  if (!theme) return null

  if (!theme.config || !theme.config.length) {
    return (
      <div>
        <fbt desc="admin.themes.customize.noConfig">
          No configuration found for the active theme
        </fbt>
      </div>
    )
  }

  return (
    <div className="theme-config-sections-list">
      {theme.config.map((section) => {
        const sectionState = get(state, section.id, {})
        const setSectionState = (newState) => {
          onChange({
            ...state,
            [section.id]: {
              ...sectionState,
              ...newState
            }
          })
        }

        return (
          <Section
            key={section.id}
            section={section}
            state={sectionState}
            setState={setSectionState}
            onDrilldown={() => onDrilldown(section)}
            isActive={activeSection === section.id}
          />
        )
      })}
    </div>
  )
}

export default SectionsList

require('react-styl')(`
  .theme-config-sections-list
    position: relative
    height: 100%
    overflow-x: hidden
    .section-title
      font-size: 1.25rem
      margin: 0.5rem 0
      cursor: pointer
      transition: color 0.3s ease
      color: #444
      display: flex
      align-items: center
      justify-content: space-between
      &:hover
        color: #000

    .section-fields
      position: absolute
      top: 0
      bottom: 0
      left: 100%
      right: -100%
      transition: all 0.3s ease
      overflow: scroll
      background: #fafbfc
      padding: 0 5px

      &.active
        left: 0
        right: 0
        z-index: 10

      label
        font-weight: 700

    .back-button
      font-size: 0.875rem
      cursor: pointer
      display: flex
      align-items: center
      margin-bottom: 0.825rem
      &::before
        content: ""
        display: inline-block
        width: 7px
        height: 7px
        border-width: 0 2px 2px 0
        border-style: solid
        border-color: #3b80ee
        transform: rotate(-225deg) translateY(-1px)
        margin-right: 7px
        margin-left: 3px

`)

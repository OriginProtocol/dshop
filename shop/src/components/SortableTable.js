import React, { useReducer, useEffect } from 'react'

function reducer(state, newState) {
  return { ...state, ...newState }
}

let over = false

const SortableTable = ({
  items,
  onClick,
  children,
  onChange,
  labels = ['Name', 'Number of Products']
}) => {
  const [state, setState] = useReducer(reducer, { items })
  useEffect(() => {
    setState({ items })
  }, [items])

  const sortedItems = [...state.items]
  const { dragging, dragTarget } = state
  const isDragging = typeof dragging === 'number'
  if (isDragging && typeof dragTarget === 'number') {
    sortedItems.splice(dragging, 1)
    sortedItems.splice(dragTarget, 0, state.items[dragging])
  }

  const DragTarget = () => (
    <div
      className="reorder"
      onMouseOver={() => (over = true)}
      onMouseOut={() => (over = false)}
    >
      <svg width="10" hieght="40" viewBox="0 0 10 40">
        <line x1="1" y1="0" x2="1" y2="40" />
        <line x1="4" y1="0" x2="4" y2="40" />
        <line x1="7" y1="0" x2="7" y2="40" />
      </svg>
    </div>
  )

  return (
    <div
      className={`sortable-table${isDragging ? '' : ' hoverable'}${
        onClick ? ' clickable' : ''
      }`}
      onDragOver={(e) => e.preventDefault()}
      style={{ gridTemplateColumns: labels.map(() => 'auto').join(' ') }}
    >
      {labels[0] ? <div className="th">{labels[0]}</div> : null}
      {labels[1] ? <div className="th text-center">{labels[1]}</div> : null}
      {sortedItems.map((item, idx) => {
        return (
          <div
            key={`item-${item.id || idx}`}
            className={`grid-row${state.dragTarget === idx ? ' dragging' : ''}`}
            onClick={() => (onClick ? onClick(item) : null)}
            onDragEnter={() => setState({ dragTarget: idx })}
            onDragEnd={() => {
              setState({ dragging: null, dragTarget: null, items: sortedItems })
              onChange(sortedItems)
            }}
            onDragStart={(e) => {
              over ? setState({ dragging: idx }) : e.preventDefault()
            }}
          >
            {children(item, DragTarget)}
          </div>
        )
      })}
    </div>
  )
}

export default SortableTable

require('react-styl')(`
  .sortable-table
    display: grid
    grid-template-columns: auto auto
    .th
      border-width: 1px 0
      border-style: solid
      border-color: #cdd7e0
      color: #9faebd
      font-size: 14px
      font-weight: normal
      background-color: #fafbfc
      padding: 0.5rem
    .td
      border-bottom: 1px solid #cdd7e0
      padding: 0.5rem
    .grid-row
      display: contents
      .td,.draggable-content
        display: flex
        align-items: center
      &.dragging
        .td
          color: transparent
          > *
            visibility: hidden
    &.clickable
      cursor: pointer
      .grid-row:hover .td
        background-color: #f3f8ff
    &.hoverable
      .title:hover
        .reorder
          visibility: visible
    .reorder
      visibility: hidden
      margin-right: 0.5rem
      svg line
        stroke: #cdd7e0
      &:hover
        cursor: move
        visibility: visible
    .title
      font-weight: bold
  `)

import React from 'react'
import useRedirect from 'utils/useRedirect'

const TaskItem = ({ task }) => {
  const redirectTo = useRedirect()

  if (!task) return null

  return (
    <div
      className="task-item"
      onClick={() => {
        if (task.onClick) {
          task.onClick()
        } else if (task.link) {
          redirectTo(task.link)
        }
      }}
    >
      <div className={task.completed ? ' completed' : ''}>
        {task.icon}
        <div className="task-data">
          <div className="task-name">{task.name}</div>
          <div className="task-desc">{task.desc}</div>
        </div>
        {task.completed && (
          <img
            className="completed-icon"
            src="images/green-checkmark-circle.svg"
          />
        )}
      </div>
    </div>
  )
}

export default TaskItem

require('react-styl')(`
  .task-item
    border-radius: 10px
    border: solid 1px #cdd7e0
    position: relative
    display: flex
    > div:first-child
      padding: 1.5rem 1.25rem
      display: flex
      flex: 1
      min-height: 5rem
      line-height: normal
      align-items: flex-start
      cursor: pointer
      &:hover
        background-color: #f8f8f8
        border-radius: 10px

      .task-data
        flex: 1
        .task-name
          padding-right: 2rem
          font-size: 1.25rem
          padding-bottom: 2px
          margin-bottom: 0.5rem
        .task-desc
          font-size: 1rem
          color: #8293a4

      .icon
        margin-right: 1.5rem

      .completed-icon
        height: 34px
        width: 34px
        object-fit: contain
        right: 13px
        top: 13px
        align-self: center

      &.completed
        .task-name
          color: #8293a4
          font-weight: normal
        .icon
          path
            fill: #8493A3 !important
`)

import React, { useReducer } from 'react'
const reducer = (state, newState) => ({ ...state, ...newState })

function useForm({
  initialState,
  className = '',
  defaultClassName = '',
  errorClassName = '',
  feedbackClassName = ''
}) {
  const [state, setState] = useReducer(reducer, initialState)

  const formInput = (state, setState) => (field) => {
    const err = state[`${field}Error`] ? true : false
    className = `${className} ${err ? errorClassName : defaultClassName}`
    return {
      value: state[field] || '',
      className,
      name: field,
      onChange: (e) =>
        setState({
          [field]: e.target.value,
          [`${field}Error`]: false
        })
    }
  }

  const Feedback = ({ error }) => {
    if (!error) return null
    return <div className={feedbackClassName}>{error}</div>
  }

  const input = formInput(state, setState)

  return { state, setState, input, Feedback }
}

export default useForm

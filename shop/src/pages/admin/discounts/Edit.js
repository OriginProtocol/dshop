import React, { useEffect } from 'react'
import { useRouteMatch } from 'react-router-dom'
import dayjs from 'dayjs'

import fbt from 'fbt'

import { formInput, formFeedback } from 'utils/formHelpers'
import useConfig from 'utils/useConfig'
import useRest from 'utils/useRest'
import useRedirect from 'utils/useRedirect'
import { useStateValue } from 'data/state'
import useSetState from 'utils/useSetState'
import Link from 'components/Link'
import DeleteButton from './_Delete'
import formatPrice from 'utils/formatPrice'

const times = Array(48)
  .fill(0)
  .map((o, idx) => {
    const time = dayjs('2018-01-01').add(idx * 30, 'm')
    return [time.format('HH:mm:00'), time.format('h:mm A')]
  })

function validate(state) {
  const newState = {}

  if (!state.code) {
    newState.codeError = fbt(
      'Enter a discount code',
      'admin.discounts.edit.codeError'
    )
  } else if (state.code.length < 3) {
    newState.codeError = fbt(
      'Code is too short',
      'admin.discounts.edit.codeError'
    )
  }

  if (!state.value) {
    newState.valueError = fbt(
      'Enter a value',
      'admin.discounts.edit.valueError'
    )
  } else if (Number(state.value) <= 0) {
    newState.valueError = fbt(
      'Value must be greater than zero',
      'admin.discounts.edit.invalidValueError'
    )
  }

  if (state.discountType === 'percentage' && state.value > 100) {
    newState.valueError = fbt(
      'Discount cannot be greater than 100%',
      'admin.discounts.edit.invalidPercentageError'
    )
  }

  if (state.maxUses && state.maxUses.length && Number(state.maxUses) <= 0) {
    newState.maxUsesError = fbt(
      'Max usage must be greater than zero',
      'admin.discounts.edit.maxUsesError'
    )
  }

  const valid = Object.keys(newState).every((f) => f.indexOf('Error') < 0)

  return { valid, newState: { ...state, ...newState } }
}

const defaultValues = {
  discountType: 'percentage',
  startDate: dayjs().format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
  status: 'active'
}

const AdminEditDiscount = () => {
  const { config } = useConfig()
  const redirectTo = useRedirect()
  const match = useRouteMatch('/admin/discounts/:discountId')
  const { discountId } = match.params
  const { data: discount } = useRest(`/discounts/${discountId}`, {
    skip: discountId === 'new'
  })
  const [state, setState] = useSetState(defaultValues)
  const [, dispatch] = useStateValue()
  useEffect(() => {
    if (discount) {
      setState({
        ...discount,
        endDateEnabled: discount.endTime ? true : false,
        startDate: dayjs(discount.startTime).format('YYYY-MM-DD'),
        endDate: dayjs(discount.endTime).format('YYYY-MM-DD'),
        startTime: dayjs(discount.startTime).format('HH:mm:ss'),
        endTime: dayjs(discount.endTime).format('HH:mm:ss')
      })
    } else {
      setState(defaultValues, true)
    }
  }, [discount])

  const input = formInput(state, (newState) => setState(newState))
  const Feedback = formFeedback(state)
  const title =
    discountId === 'new' ? (
      <fbt desc="admin.discounts.edit.createDiscount">Create Discount</fbt>
    ) : (
      <fbt desc="admin.discounts.edit.editDiscount">Edit Discount</fbt>
    )

  const actions = (
    <div className="actions">
      {!discount ? null : <DeleteButton discount={discount} />}
      <button type="submit" className="btn btn-primary">
        <fbt desc="Save">Save</fbt>
      </button>
    </div>
  )

  return (
    <form
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault()
        const { valid, newState } = validate(state)
        setState(newState)
        if (valid) {
          let url = `${config.backend}/discounts`
          if (discount && discount.id) {
            url += `/${discount.id}`
          }

          const startTimeS = `${newState.startDate} ${newState.startTime}`
          const endTimeS = `${newState.endDate} ${newState.endTime}`
          const startTime = dayjs(startTimeS, 'YYYY-MM-DD HH:mm:ss').format()
          const endTime = newState.endDateEnabled
            ? dayjs(endTimeS, 'YYYY-MM-DD HH:mm:ss').format()
            : null

          const raw = await fetch(url, {
            headers: {
              authorization: `bearer ${encodeURIComponent(
                config.backendAuthToken
              )}`,
              'content-type': 'application/json'
            },
            credentials: 'include',
            method: discount && discount.id ? 'PUT' : 'POST',
            body: JSON.stringify({
              discountType: newState.discountType,
              value: Number(newState.value),
              startTime,
              endTime,
              code: newState.code,
              status: newState.status,
              maxUses: newState.maxUses ? Number(newState.maxUses) : null,
              onePerCustomer: newState.onePerCustomer ? true : false,
              excludeShipping: newState.excludeShipping ? true : false
            })
          })
          if (raw.ok) {
            dispatch({ type: 'toast', message: 'Discount created OK' })
            redirectTo('/admin/discounts')
          }
        } else {
          window.scrollTo(0, 0)
        }
      }}
    >
      <h3 className="admin-title with-border">
        <Link to="/admin/discounts" className="muted">
          <fbt desc="Discounts">Discounts</fbt>
        </Link>
        <span className="chevron" />
        {title}
        {actions}
      </h3>
      <div className="form-group" style={{ maxWidth: '30rem' }}>
        <label>
          <fbt desc="admin.discounts.edit.discountCode">Discount code</fbt>
          <span>
            (
            <fbt desc="admin.discounts.edit.discountCodeDesc">
              customers will enter this at the checkout
            </fbt>
            )
          </span>
        </label>
        <input
          autoFocus
          className="form-control"
          value={state.code || ''}
          placeholder="e.g. SUMMERSALE"
          onChange={(e) =>
            setState({
              code: e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, ''),
              codeError: null
            })
          }
        />
        {Feedback('code')}
      </div>
      <div className="form-row">
        <div className="form-group col-md-6" style={{ maxWidth: '15rem' }}>
          <label>
            <fbt desc="Status">Status</fbt>
          </label>
          <select {...input('status')}>
            <option value="active">
              <fbt desc="Active">Active</fbt>
            </option>
            <option value="inactive">
              <fbt desc="Inactive">Inactive</fbt>
            </option>
          </select>
          {Feedback('status')}
        </div>
      </div>
      <div className="form-group" style={{ maxWidth: '15rem' }}>
        <label>
          <fbt desc="Type">Type</fbt>
        </label>
        <div className="form-check">
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="radio"
              name="type"
              checked={state.discountType === 'percentage'}
              onChange={() => setState({ discountType: 'percentage' })}
            />
            <fbt desc="Percentage">Percentage</fbt>
          </label>
        </div>
        <div className="form-check">
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="radio"
              name="type"
              checked={state.discountType === 'fixed'}
              onChange={() => setState({ discountType: 'fixed' })}
            />
            <fbt desc="admin.discounts.edit.fixedAmount">Fixed amount</fbt>
          </label>
        </div>
      </div>
      <div className="form-group" style={{ maxWidth: '15rem' }}>
        <label>
          <fbt desc="admin.discounts.edit.discountValue">Discount Value</fbt>
        </label>
        <div className="input-group">
          {state.discountType !== 'fixed' ? null : (
            <div className="input-group-prepend">
              <span className="input-group-text">
                {formatPrice(0, {
                  symbolOnly: true,
                  currency: config.currency
                })}
              </span>
            </div>
          )}
          <input type="number" {...input('value')} />
          {state.discountType === 'fixed' ? null : (
            <div className="input-group-append">
              <span className="input-group-text">%</span>
            </div>
          )}
        </div>
        {Feedback('value')}
      </div>
      <div className="form-check mb-3">
        <label className="form-check-label">
          <input
            className="form-check-input"
            type="checkbox"
            checked={state.excludeShipping ? true : false}
            onChange={(e) => setState({ excludeShipping: e.target.checked })}
          />
          <fbt desc="admin.discounts.edit.excludeShipping">
            Exclude shipping price from discount
          </fbt>
        </label>
      </div>
      <div className="form-group" style={{ maxWidth: '15rem' }}>
        <label>
          <fbt desc="admin.discounts.edit.maxUses">Max Uses</fbt>
        </label>
        <input type="number" {...input('maxUses')} />
        {Feedback('maxUses')}
      </div>
      <div className="form-check mb-3">
        <label className="form-check-label">
          <input
            className="form-check-input"
            type="checkbox"
            checked={state.onePerCustomer ? true : false}
            onChange={(e) => setState({ onePerCustomer: e.target.checked })}
          />
          <fbt desc="admin.discounts.edit.onePerCustomer">One Per Customer</fbt>
        </label>
      </div>
      <div className="form-row mb-3" style={{ maxWidth: '30rem' }}>
        <div className="col-6">
          <label>
            <fbt desc="StartDate">Start Date</fbt>
          </label>
          <input type="date" {...input('startDate')} required />
          {Feedback('startDate')}
        </div>
        <div className="col-6">
          <label>
            <fbt desc="StartTime">Start Time</fbt>
          </label>
          <select {...input('startTime')}>
            {times.map((time, idx) => (
              <option key={idx} value={time[0]}>
                {time[1]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-check mb-3">
        <label className="form-check-label">
          <input
            className="form-check-input"
            type="checkbox"
            name="type"
            checked={state.endDateEnabled ? true : false}
            onChange={(e) => setState({ endDateEnabled: e.target.checked })}
          />
          <fbt desc="admin.discounts.edit.setEndDate">Set end date</fbt>
        </label>
      </div>
      {!state.endDateEnabled ? null : (
        <div className="form-row mb-3" style={{ maxWidth: '30rem' }}>
          <div className="col-6">
            <label>
              <fbt desc="EndDate">End Date</fbt>
            </label>
            <input type="date" {...input('endDate')} required />
            {Feedback('endDate')}
          </div>
          <div className="col-6">
            <label>
              <fbt desc="EndTime">End Time</fbt>
            </label>
            <select {...input('endTime')}>
              {times.map((time, idx) => (
                <option key={idx} value={time[0]}>
                  {time[1]}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="footer-actions">{actions}</div>
    </form>
  )
}

export default AdminEditDiscount

import React from 'react'
import { useHistory } from 'react-router-dom'
import dayjs from 'dayjs'

import Paginate from 'components/Paginate'
import Link from 'components/Link'
import Loading from 'components/Loading'
import NoItems from 'components/NoItems'

import useRest from 'utils/useRest'

function description(discount) {
  let str = `$${discount.value} off entire order`
  if (discount.discountType === 'percentage') {
    str = `${discount.value}% off entire order`
  }
  if (discount.onePerCustomer) {
    return <>{str} &bull; One per customer</>
  }
  return str
}

function active(discount) {
  const start = dayjs(discount.startTime).format('MMM D')
  if (discount.endTime) {
    const end = dayjs(discount.endTime).format('MMM D')
    return `${start} - ${end}`
  }
  return `From ${start}`
}

const AdminDiscounts = () => {
  const history = useHistory()
  const { data: discounts = [], loading } = useRest('/discounts')

  return (
    <>
      <h3 className="admin-title">
        Discounts
        {!discounts.length ? null : (
          <div className="actions">
            <Link to="/admin/discounts/new" className="btn btn-primary">
              Create discount
            </Link>
          </div>
        )}
      </h3>
      {loading ? (
        <Loading />
      ) : (
        <>
          {discounts.length ? (
            <table className="table admin-discounts table-hover">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Used</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr
                    key={discount.id}
                    onClick={(e) => {
                      if (e.target.matches('.action-icon, .action-icon *')) {
                        return
                      }
                      history.push(`/admin/discounts/${discount.id}`)
                    }}
                  >
                    {/* <td>{dayjs(discount.createdAt).format('MMM D, h:mm A')}</td> */}
                    <td>
                      <div className="font-weight-bold">
                        {discount.code.toUpperCase()}
                      </div>
                      <div className="text-muted">{description(discount)}</div>
                    </td>
                    <td>
                      <span className={`discount-status ${discount.status}`}>
                        {discount.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>{`${discount.uses || '0'}${
                      discount.maxUses ? `/${discount.maxUses}` : ''
                    } used`}</td>
                    <td>{active(discount)}</td>
                    <td>
                      <div className="actions">
                        <div className="action-icon">
                          <Link to={`/admin/discounts/${discount.id}`}>
                            <img src="images/edit-icon.svg" />
                          </Link>
                        </div>

                        <div
                          className="action-icon"
                          onClick={async (e) => {
                            e.preventDefault()
                          }}
                        >
                          <img src="images/delete-icon.svg" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <NoItems
              heading="Add a discount code"
              description="Offer discounts on your products."
              linkTo="/admin/discounts/new"
              buttonText="Create discount"
            />
          )}
        </>
      )}

      <Paginate total={discounts.length} />
    </>
  )
}

export default AdminDiscounts

require('react-styl')(`
  .admin-orders
    tbody tr
      cursor: pointer
  .discount-status
    font-size: 1rem
    color: #000
    display: flex
    align-items: center
    &:before
      content: ''
      display: inline-block
      height: 8px
      width: 8px
      margin-right: 7px
      border-radius: 50%
      background-color: #44c94a
    &.inactive:before
      background-color: #c9444a

`)

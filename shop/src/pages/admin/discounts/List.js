import React from 'react'
import { useHistory } from 'react-router-dom'
import dayjs from 'dayjs'
import fbt, { FbtParam } from 'fbt'

import Paginate from 'components/Paginate'
import Link from 'components/Link'
import Loading from 'components/Loading'
import NoItems from 'components/NoItems'

import DeleteDiscount from './_Delete'

import useRest from 'utils/useRest'

function description(discount) {
  // TODO: use config.currency
  let str = fbt(
    `$${fbt.param('discount', discount.value)} off entire order`,
    'admin.discounts.discountVal'
  )
  if (discount.discountType === 'percentage') {
    str = fbt(
      `${fbt.param('discount', discount.value)}% off entire order`,
      'admin.discounts.discountPercentage'
    )
  }
  if (discount.onePerCustomer) {
    return (
      <>
        {str} &bull;{' '}
        <fbt desc="admin.discounts.onePerCustomer">One per customer</fbt>
      </>
    )
  }
  return str
}

function active(discount) {
  const start = dayjs(discount.startTime).format('MMM D')
  if (discount.endTime) {
    const end = dayjs(discount.endTime).format('MMM D')
    return `${start} - ${end}`
  }
  return (
    <fbt desc="admin.discounts.discountStartTime">
      From <FbtParam name="startTime">{start}</FbtParam>
    </fbt>
  )
}

const AdminDiscounts = () => {
  const history = useHistory()
  const { data: discounts = [], loading, reload } = useRest('/discounts')

  return (
    <>
      <h3 className="admin-title">
        <fbt desc="Discounts">Discounts</fbt>
        {!discounts.length ? null : (
          <div className="actions">
            <Link to="/admin/discounts/new" className="btn btn-primary">
              <fbt desc="admin.discounts.createDiscount">Create discount</fbt>
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
                  <th>
                    <fbt desc="Code">Code</fbt>
                  </th>
                  <th>
                    <fbt desc="Status">Status</fbt>
                  </th>
                  <th>
                    <fbt desc="Used">Used</fbt>
                  </th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr
                    key={discount.id}
                    onClick={(e) => {
                      if (e.target.matches('.actions *')) {
                        e.stopPropagation()
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
                    <td>
                      <fbt desc="admin.discounts.discountUsage">
                        <FbtParam name="usageCount">{`${discount.uses || '0'}${
                          discount.maxUses ? `/${discount.maxUses}` : ''
                        }`}</FbtParam>{' '}
                        used
                      </fbt>
                    </td>
                    <td>{active(discount)}</td>
                    <td>
                      <div className="actions">
                        <div className="action-icon">
                          <Link to={`/admin/discounts/${discount.id}`}>
                            <img src="images/edit-icon.svg" />
                          </Link>
                        </div>

                        <DeleteDiscount discount={discount} reload={reload}>
                          <img src="images/delete-icon.svg" />
                        </DeleteDiscount>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <NoItems
              heading={fbt('Add a discount code', 'admin.discounts.addCode')}
              description={fbt(
                'Offer discounts on your products.',
                'admin.discounts.addCodeDesc'
              )}
              linkTo="/admin/discounts/new"
              buttonText={fbt(
                'Create discount',
                'admin.discounts.createDiscount'
              )}
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

const get = require('lodash/get')
const { Countries } = require('./Countries')

function generatePrintfulOrder(order, printfulIds, draft) {
  const data = order.data
  if (!data || !data.userInfo) return {}

  const printfulData = {
    draft,
    external_id: order.orderId,
    recipient: {
      name: `${data.userInfo.firstName} ${data.userInfo.lastName}`,
      phone: data.userInfo.phone,
      address1: data.userInfo.address1,
      address2: data.userInfo.address2,
      city: data.userInfo.city,
      state_name: data.userInfo.province,
      state_code: get(
        Countries,
        `[${data.userInfo.country}].provinces[${data.userInfo.province}].code`
      ),
      country_name: data.userInfo.country,
      country_code: get(Countries, `[${data.userInfo.country}].code`),
      zip: data.userInfo.zip
    },
    items: data.items
      .map((item) => ({
        sync_variant_id: get(printfulIds, `[${item.product}][${item.variant}]`),
        quantity: item.quantity,
        retail_price: (item.price / 100).toFixed(2)
      }))
      .filter((i) => i.sync_variant_id),

    retail_costs: {
      currency: 'USD',
      subtotal: (get(data, 'subTotal', 0) / 100).toFixed(2),
      discount: (get(data, 'discount', 0) / 100).toFixed(2),
      shipping: (get(data, 'shipping.amount', 0) / 100).toFixed(2),
      tax: '0.00',
      total: (data.total / 100).toFixed(2)
    }
  }
  return printfulData
}

module.exports = generatePrintfulOrder

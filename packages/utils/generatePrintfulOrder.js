const get = require('lodash/get')
const { Countries } = require('./Countries')

/**
 * Generates the data for calling the Printful API to place an order.
 * For reference, see https://www.printful.com/docs/orders
 *
 * @param {models.Order||Object} DB order if called by the backend, or order data returned by the routes/orders/:orderId if called by the front-end.
 * @param {Object} printfulIds: Data read from the shop's printful-ids.json file.
 * @param {boolean} draft: If true, the order is created but not yet submitted for fullfilment and can still be edited.
 * @returns {{}|{retail_costs: {total: string, shipping: string, subtotal: string, discount: string, currency: string, tax: string}, draft: *, recipient: {zip: *, country_code: *, phone: *, address2: *, city: *, state_name: *, address1: *, name: string, country_name: *, state_code: *}, external_id: *, items: *}}
 */
function generatePrintfulOrder(order, printfulIds, draft) {
  const data = order.data
  if (!data || !data.userInfo) return {}

  const printfulData = {
    draft,
    external_id: order.shortId,
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

const shippingTimes = [
  {
    value: 'free',
    label: 'Free',
    detail: ''
  },
  {
    value: 'expedited',
    label: 'Expedited',
    processingTime: '1 day',
    detail: 'Arrives in a day'
  },
  {
    value: 'fast',
    label: 'Fast',
    processingTime: '2-7 days',
    detail: 'Arrives in 2-7 days'
  },
  {
    value: 'slow',
    label: 'Slow',
    processingTime: '7+ days',
    detail: 'Can take longer than 7 days to arrive'
  }
]

export default shippingTimes

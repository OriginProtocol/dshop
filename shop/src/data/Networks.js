export const Networks = [
  {
    id: 1,
    idStr: 'mainnet',
    name: 'Mainnet'
  },
  {
    id: 4,
    idStr: 'rinkeby',
    name: 'Rinkeby'
  },
  {
    id: 999,
    idStr: 'localhost',
    name: 'Localhost'
  }
]

export const NetworksById = Networks.reduce((m, o) => {
  m[o.id] = o
  return m
}, {})

export const NetworksByIdStr = Networks.reduce((m, o) => {
  m[o.idStr] = o
  return m
}, {})

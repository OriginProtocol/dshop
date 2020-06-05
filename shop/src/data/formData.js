export default function formData(state) {
  return Object.keys(state)
    .filter((k) => k.indexOf('Error') < 0)
    .reduce((m, o) => {
      m[o] = state[o]
      return m
    }, {})
}

function assert(cond, message) {
  if (!cond) {
    throw new Error(`Assertion error: ${message}`)
  }
  return true
}

module.exports = {
  assert
}

class DuplicateDeploymentError extends Error {
  constructor(message) {
    super(message)
  }
}

module.exports = {
  DuplicateDeploymentError
}

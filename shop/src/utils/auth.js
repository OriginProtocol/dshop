import _get from 'lodash/get'

export const isLoggedIn = (admin) => {
  return !['no-such-user', 'not-logged-in', 'no-users'].includes(
    _get(admin, 'reason', '')
  )
}

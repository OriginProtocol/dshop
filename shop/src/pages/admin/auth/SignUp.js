import React from 'react'

import SetupLayout from 'pages/super-admin/setup/_SetupLayout'
import SignUp from 'pages/super-admin/setup/SignUp'
import Link from 'components/Link'

const Signup = () => {
  return (
    <SetupLayout>
      <div className="mt-3">
        <SignUp url="/register" />
      </div>
      <div className="actions">
        Already have an account?
        <Link className="ml-2" to="/admin/login" children="Login" />
      </div>
    </SetupLayout>
  )
}

export default Signup

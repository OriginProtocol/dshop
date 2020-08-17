import React from 'react'

import fbt from 'fbt'

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
        <fbt desc="admin.auth.register.alreadyHaveAccount">
          Already have an account?
        </fbt>
        <Link
          className="ml-2"
          to="/admin/login"
          children={<fbt desc="Login">Login</fbt>}
        />
      </div>
    </SetupLayout>
  )
}

export default Signup

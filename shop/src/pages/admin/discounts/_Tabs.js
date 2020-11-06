import React from 'react'
import { NavLink } from 'react-router-dom'
import fbt from 'fbt'

const DiscountTabs = () => {
  return (
    <ul className="nav nav-tabs mt-3">
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/discounts" exact>
          <fbt desc="Manual">Manual</fbt>
        </NavLink>
      </li>
      <li className="nav-item">
        <NavLink className="nav-link" to="/admin/discounts/auto" exact>
          <fbt desc="Automatic">Automatic</fbt>
        </NavLink>
      </li>
    </ul>
  )
}

export default DiscountTabs

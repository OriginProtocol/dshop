import React from 'react'
import fbt from 'fbt'
import * as Icons from 'components/icons/Admin'
import Link from 'components/Link'

const SettingsListItem = ({ icon, title, desc, link }) => {
  return (
    <Link to={link}>
      <div className="settings-list-item">
        {icon}
        <div className="link-content">
          <div className="title">{title}</div>
          <div className="desc">{desc}</div>
        </div>
      </div>
    </Link>
  )
}

const List = () => {
  return (
    <div className="settings-list">
      <SettingsListItem
        icon={<Icons.Settings />}
        title={<fbt desc="General">General</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/general"
      />
      <SettingsListItem
        icon={<Icons.Appearance />}
        title={<fbt desc="Appearance">Appearance</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/general"
      />
      <SettingsListItem
        icon={<Icons.Card />}
        title={<fbt desc="Payments">Payments</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/payments"
      />
      <SettingsListItem
        icon={<Icons.Apps />}
        title={<fbt desc="Apps">Apps</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/apps"
      />
      <SettingsListItem
        icon={<Icons.Shipping />}
        title={<fbt desc="Shipping">Shipping</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/shipping"
      />
      <SettingsListItem
        icon={<Icons.Checkout />}
        title={<fbt desc="Checkout">Checkout</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/checkout"
      />
      <SettingsListItem
        icon={<Icons.Users />}
        title={<fbt desc="Users">Users</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/users"
      />
      <SettingsListItem
        icon={<Icons.Publish />}
        title={<fbt desc="Publish">Publish</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/publish"
      />
      <SettingsListItem
        icon={<Icons.Advanced />}
        title={<fbt desc="Advanced">Advanced</fbt>}
        desc={'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'}
        link="/admin/settings/advanced"
      />
    </div>
  )
}

export default List

require('react-styl')(`
  .settings-list
    display: grid
    grid-template-columns: 33% 33% 33%

    .settings-list-item
      margin-right: 1.25rem
      margin-top: 1.25rem
      padding: 1.25rem
      border-radius: 10px
      border: solid 1px #cdd7e0
      background-color: #ffffff

      display: flex

      &:hover
        background-color: #f8f8f8

      svg
        margin-right: 1.25rem
        flex: 40px 0 0
        width: 40px
        height: 40px
        path
          fill: #007cff !important
      
      .link-content
        flex: 1

        .title
          font-size: 1.25rem
          font-family: Lato

        .desc
          font-size: 1rem
          color: #8293a4

`)

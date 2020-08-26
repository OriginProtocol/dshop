import React from 'react'
import fbt from 'fbt'
import * as Icons from 'components/icons/Admin'
import Link from 'components/Link'

const SettingsListItem = ({ icon, title, desc, link }) => {
  return (
    <Link to={link} className="settings-list-item">
      {icon}
      <div className="link-content">
        <div className="title">{title}</div>
        <div className="desc">{desc}</div>
      </div>
    </Link>
  )
}

const List = () => {
  return (
    <>
      <h3 className="admin-title">
        <fbt desc="Settings">Settings</fbt>
      </h3>
      <div className="settings-list">
        <SettingsListItem
          icon={<Icons.Settings />}
          title={<fbt desc="General">General</fbt>}
          desc={
            <fbt desc="admin.Settings.generalDesc">
              Update important details for your shop
            </fbt>
          }
          link="/admin/settings/general"
        />
        <SettingsListItem
          icon={<Icons.Appearance />}
          title={<fbt desc="Appearance">Appearance</fbt>}
          desc={
            <fbt desc="admin.Settings.appearanceDesc">
              Manage your shop’s online appearance
            </fbt>
          }
          link="/admin/settings/appearance"
        />
        <SettingsListItem
          icon={<Icons.Card />}
          title={<fbt desc="Payments">Payments</fbt>}
          desc={
            <fbt desc="admin.Settings.paymentsDesc">
              Enable and manage payment methods
            </fbt>
          }
          link="/admin/settings/payments"
        />
        <SettingsListItem
          icon={<Icons.Apps />}
          title={<fbt desc="Apps">Apps</fbt>}
          desc={
            <fbt desc="admin.Settings.appsDesc">
              Use apps to make your store more powerful
            </fbt>
          }
          link="/admin/settings/apps"
        />
        <SettingsListItem
          icon={<Icons.Shipping />}
          title={<fbt desc="Shipping">Shipping</fbt>}
          desc={
            <fbt desc="admin.Settings.shippingDesc">
              Manage how you ship orders to customers
            </fbt>
          }
          link="/admin/settings/shipping"
        />
        <SettingsListItem
          icon={<Icons.Checkout />}
          title={<fbt desc="Checkout">Checkout</fbt>}
          desc={
            <fbt desc="admin.Settings.shippingDesc">
              Customise your online checkout process
            </fbt>
          }
          link="/admin/settings/checkout"
        />
        <SettingsListItem
          icon={<Icons.Users />}
          title={<fbt desc="Users">Users</fbt>}
          desc={
            <fbt desc="admin.Settings.usersDesc">
              Add additional staff for your shop
            </fbt>
          }
          link="/admin/settings/users"
        />
        <SettingsListItem
          icon={<Icons.Publish />}
          title={<fbt desc="Publish">Publish</fbt>}
          desc={
            <fbt desc="admin.Settings.publishDesc">
              Publish your shop to make it visible to public
            </fbt>
          }
          link="/admin/settings/publish"
        />
        <SettingsListItem
          icon={<Icons.Advanced />}
          title={<fbt desc="Advanced">Advanced</fbt>}
          desc={
            <fbt desc="admin.Settings.advancedDesc">
              View advanced settings such as custom CSS and error reporting
            </fbt>
          }
          link="/admin/settings/advanced"
        />
      </div>
    </>
  )
}

export default List

require('react-styl')(`
  .settings-list
    margin-top: 1rem
    display: grid
    grid-template-columns: 1fr 1fr 1fr
    column-gap: 1.25rem
    row-gap: 1.25rem

    .settings-list-item
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
          margin-top: 0.25rem
          margin-bottom: 0.25rem

        .desc
          font-size: 1rem
          color: #8293a4
          line-height: normal

`)

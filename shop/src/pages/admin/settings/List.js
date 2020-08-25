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
              Choose a domain name and support email address
            </fbt>
          }
          link="/admin/settings/general"
        />
        <SettingsListItem
          icon={<Icons.Appearance />}
          title={<fbt desc="Appearance">Appearance</fbt>}
          desc={
            <fbt desc="admin.Settings.appearanceDesc">
              Change the name and logo of your store
            </fbt>
          }
          link="/admin/settings/general"
        />
        <SettingsListItem
          icon={<Icons.Card />}
          title={<fbt desc="Payments">Payments</fbt>}
          desc={
            <fbt desc="admin.Settings.paymentsDesc">
              Select payment options, from crypto currency to credit cards
            </fbt>
          }
          link="/admin/settings/payments"
        />
        <SettingsListItem
          icon={<Icons.Apps />}
          title={<fbt desc="Apps">Apps</fbt>}
          desc={
            <fbt desc="admin.Settings.appsDesc">
              Integrate third party applications into your store
            </fbt>
          }
          link="/admin/settings/apps"
        />
        <SettingsListItem
          icon={<Icons.Shipping />}
          title={<fbt desc="Shipping">Shipping</fbt>}
          desc={
            <fbt desc="admin.Settings.shippingDesc">
              Specify where your products ship and how much it costs
            </fbt>
          }
          link="/admin/settings/shipping"
        />
        <SettingsListItem
          icon={<Icons.Checkout />}
          title={<fbt desc="Checkout">Checkout</fbt>}
          desc={
            <fbt desc="admin.Settings.shippingDesc">
              Customize your checkout with notices or reminders
            </fbt>
          }
          link="/admin/settings/checkout"
        />
        <SettingsListItem
          icon={<Icons.Users />}
          title={<fbt desc="Users">Users</fbt>}
          desc={
            <fbt desc="admin.Settings.usersDesc">
              Grant team members access to your store
            </fbt>
          }
          link="/admin/settings/users"
        />
        <SettingsListItem
          icon={<Icons.Publish />}
          title={<fbt desc="Publish">Publish</fbt>}
          desc={
            <fbt desc="admin.Settings.publishDesc">
              Publish changes to your store live to the web
            </fbt>
          }
          link="/admin/settings/publish"
        />
        <SettingsListItem
          icon={<Icons.Advanced />}
          title={<fbt desc="Advanced">Advanced</fbt>}
          desc={
            <fbt desc="admin.Settings.advancedDesc">
              Advanced settings such as SEO and CSS.
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

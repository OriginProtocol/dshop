import React, { useMemo } from 'react'
import maskSecret from 'utils/maskSecret'

const useEmailAppsList = ({ shopConfig }) => {
  const emailAppsList = useMemo(() => {
    if (!shopConfig) return []

    const {
      email,
      sendgridApiKey,
      sendgridUsername,
      awsAccessKey,
      mailgunSmtpLogin,
      mailgunSmtpServer
    } = shopConfig

    const sendgridEnabled = email === 'sendgrid'
    const awsEnabled = email === 'aws'
    const mailgunEnabled = email === 'mailgun'

    return [
      {
        id: 'sendgrid',
        title: 'Sendgrid',
        description: sendgridEnabled
          ? `Sendgrid ${sendgridApiKey ? 'API key' : 'username'}: ${
              sendgridApiKey ? maskSecret(sendgridApiKey, 12) : sendgridUsername
            }`
          : 'Send emails using SendGrid',
        icon: <img src="images/sendgrid.png" width="100%" />,
        enabled: sendgridEnabled
      },
      {
        id: 'aws',
        title: 'AWS SES',
        description: awsEnabled
          ? `AWS SES Access Key: ${maskSecret(awsAccessKey, 12)}`
          : 'Send emails using AWS SES',
        icon: <img src="images/aws-ses.png" width="60%" />,
        enabled: awsEnabled
      },
      {
        id: 'mailgun',
        title: 'Mailgun',
        description: mailgunEnabled
          ? `Mailgun account: ${mailgunSmtpLogin}@${mailgunSmtpServer}`
          : 'Send emails using Mailgun',
        icon: <img src="images/mailgun.png" width="80%" />,
        enabled: mailgunEnabled
      }
    ]
  }, [shopConfig])

  return {
    emailAppsList
  }
}

export default useEmailAppsList

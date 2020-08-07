const parsePlainEmail = (emailAddress) => {
  if (!emailAddress || !emailAddress.includes('<')) return emailAddress

  const extract = /<[^>]*>/.exec(emailAddress)

  return extract ? extract[0].replace(/[<>]/g, '') : emailAddress
}

export default parsePlainEmail

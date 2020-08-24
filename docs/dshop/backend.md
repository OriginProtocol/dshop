# Backend

The backend consists of:

- A realtime connection to an Ethereum node listening for relevant events on the
  Origin Marketplace contract
- A database containing up to date customer order information
- An emailer for sending out receipts and notifications
- An off-chain payment processor for accepting credit card orders and putting
  them on-chain
- An API for sellers to view and manage orders

The backend can be hosted by any individual or third party provider.

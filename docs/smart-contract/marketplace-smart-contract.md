# Smart Contract

Origin Protocol have developed a smart contract known as the Marketplace. It
allows sellers to post listings, buyers to make offers, arbitrators to manage
disputes, and affiliates to earn commissions. It also provides an incentive
mechanism to ensure the long term health and growth of the network.

Although the primary function of the Marketplace is to handle the transfer of
funds between parties, it also references off-chain data by leveraging the
addressable content feature of IPFS. Every event emitted by the Marketplace
contract includes an IPFS hash where details of the event can be found,
typically in the form of a JSON object. Data that is not related to the transfer
or control of funds is held in IPFS, for example a product title or customer's
encrypted shipping address.

The format of the data stored in IPFS together with the rules and process
defined by the Marketplace smart contract constitute the Origin Protocol.

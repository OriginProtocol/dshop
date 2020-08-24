# Overview

Dshop is an open source e-commerce site built to use the Origin Protocol. The
front end and product database are hosted on IPFS and can be served via ENS.
When customers place an order, their contact and shipping information is
encrypted via PGP and stored on IPFS. The IPFS hash and payment \(Eth or ERC20\)
is sent to the Marketplace smart contract.

A separate process watches the blockchain for events emitted by the smart
contract and takes care of any off-chain actions such as sending out
confirmation emails, notifications, fulfilling orders, or any other applicable
tasks. This process can be run by any individual or service provider so long as
they possess the private keys to decrypt buyer data.

Sellers also have the option of accepting payment via other means such as credit
cards. Credit card orders are sent to the same smart contract, albeit via a
centralized payment processor which can be run either by the seller or a third
party.

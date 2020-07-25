// Gas limit when sending transactions to the marketplace contract.
const marketplaceTxGasLimit = 350000

const marketplaceAbi = [
  'function makeOffer(uint listingID, bytes32 ipfsHash, uint finalizes, address affiliate, uint256 commission, uint value, address currency, address arbitrator) payable',
  'function acceptOffer(uint listingID, uint offerID, bytes32 ipfsHash) public',
  'function withdrawOffer(uint listingID, uint offerID, bytes32 ipfsHash) public',
  'function finalize(uint listingID, uint offerID, bytes32 ipfsHash) public',
  'function createListing(bytes32, uint256, address)',
  'function updateListing(uint256, bytes32, uint256)',
  'event ListingCreated (address indexed party, uint indexed listingID, bytes32 ipfsHash)',
  'event ListingUpdated (address indexed party, uint indexed listingID, bytes32 ipfsHash)',
  'event OfferCreated (address indexed party, uint indexed listingID, uint indexed offerID, bytes32 ipfsHash)',
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint256'
      },
      {
        name: '',
        type: 'uint256'
      }
    ],
    name: 'offers',
    outputs: [
      {
        name: 'value',
        type: 'uint256'
      },
      {
        name: 'commission',
        type: 'uint256'
      },
      {
        name: 'refund',
        type: 'uint256'
      },
      {
        name: 'currency',
        type: 'address'
      },
      {
        name: 'buyer',
        type: 'address'
      },
      {
        name: 'affiliate',
        type: 'address'
      },
      {
        name: 'arbitrator',
        type: 'address'
      },
      {
        name: 'finalizes',
        type: 'uint256'
      },
      {
        name: 'status',
        type: 'uint8'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    name: 'listings',
    outputs: [
      {
        name: 'seller',
        type: 'address'
      },
      {
        name: 'deposit',
        type: 'uint256'
      },
      {
        name: 'depositManager',
        type: 'address'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]

module.exports = {
  marketplaceAbi,
  marketplaceTxGasLimit
}

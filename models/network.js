module.exports = (sequelize, DataTypes) => {
  const Network = sequelize.define(
    'Network',
    {
      networkId: {
        // 1=Mainnet, 4=Rinkeby, 999=localhost.
        type: DataTypes.INTEGER,
        unique: true,
        primaryKey: true
      },
      lastBlock: DataTypes.INTEGER, // Used as a cursor storing the last block processed by the listener.
      provider: DataTypes.STRING, // HTTP web3 provider URL.
      providerWs: DataTypes.STRING, // WebSocket web3 provider URL.
      ipfs: DataTypes.STRING, // IPFS Gateway URL.
      ipfsApi: DataTypes.STRING, // IPFS API URL.
      marketplaceContract: DataTypes.STRING, // Ethereum address of the marketplace smart contract.
      marketplaceVersion: DataTypes.STRING, // Version of the marketplace. ex: '001'.
      listingId: DataTypes.STRING, // Fully qualified listing id. ex: '1-001-123'.
      active: DataTypes.BOOLEAN, // True if the network is active.
      publicSignups: DataTypes.BOOLEAN, // True if anyone can sign up as a user.
      useMarketplace: DataTypes.BOOLEAN, // True if orders should be recorded on the blockchain using the marketplace contract.
      config: DataTypes.TEXT // Encrypted JSON blob storing sensitive configuration such as API keys and secrets.
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'networks'
    }
  )
  return Network
}

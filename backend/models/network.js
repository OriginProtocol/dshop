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
      provider: DataTypes.STRING, // URL of an HTTP web3 provider (e.g. Infura, Alchemy, etc...).
      providerWs: DataTypes.STRING, // URL of WebSocket web3 provider.
      ipfs: DataTypes.STRING, // URL of the IPFS Gateway to use.
      ipfsApi: DataTypes.STRING, // URL of the IPFS API server to use.
      marketplaceContract: DataTypes.STRING, // Ethereum address of the marketplace smart contract.
      marketplaceVersion: DataTypes.STRING, // Version of the marketplace. ex: 'V01'.
      active: DataTypes.BOOLEAN, // True if the network is active.
      config: DataTypes.TEXT // Encrypted JSON blob storing the configuration.
    },
    {
      timestamps: false,
      underscored: true,
      tableName: 'networks'
    }
  )
  return Network
}

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

'use strict';

module.exports = {
  up: (queryInterface) => {
    const q = 'UPDATE sellers SET email = lower(email);'
    return queryInterface.sequelize.query(q)
  },

  down: () => Promise.resolve()
};

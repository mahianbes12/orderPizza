'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Restaurant extends Model {

    static associate(models) {
     
        User.belongsTo(models.Restaurant, { foreignKey: 'restaurantId' });
        
        // A User can have many Orders (as a Customer)
        User.hasMany(models.Order, { foreignKey: 'customerId' });

    }
  }
  Restaurant.init({
    name: DataTypes.STRING,
    address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Restaurant',
  });
  return Restaurant;
};
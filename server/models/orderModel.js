'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {

    static associate(models) {
      
        // An Order belongs to a User (Customer)
        Order.belongsTo(models.User, { foreignKey: 'customerId' });
    
        // An Order belongs to a Pizza
        Order.belongsTo(models.Pizza, { foreignKey: 'pizzaId' });
    
        // An Order belongs to a Restaurant
        Order.belongsTo(models.Restaurant, { foreignKey: 'restaurantId' });

    }
  }
  Order.init({
    status: DataTypes.STRING,
    customerId: DataTypes.INTEGER,
    restaurantId: DataTypes.INTEGER,
    pizzaId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};
'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pizza extends Model {

    static associate(models) {
      
      
        Pizza.belongsTo(models.Restaurant, { foreignKey: 'restaurantId' });
        
        // Many-to-Many relationship between Pizza and Topping
        Pizza.belongsToMany(models.Topping, { through: 'PizzaToppings', foreignKey: 'pizzaId' });
        
        // A Pizza can be part of many Orders
        Pizza.hasMany(models.Order, { foreignKey: 'pizzaId' });

    }
  }
  Pizza.init({
    name: DataTypes.STRING,
    restaurantId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Pizza',
  });
  return Pizza;
};
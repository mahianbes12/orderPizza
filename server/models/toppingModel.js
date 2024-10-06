'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Topping extends Model {

    static associate(models) {
      // define association here
     
        Topping.belongsToMany(models.Pizza, { through: 'PizzaToppings', foreignKey: 'toppingId' });

    }
  }
  Topping.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Topping',
  });
  return Topping;
};
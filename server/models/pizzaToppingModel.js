module.exports = (sequelize, DataTypes) => {
    const PizzaToppings = sequelize.define('PizzaToppings', {
      pizzaId: DataTypes.INTEGER,
      toppingId: DataTypes.INTEGER,
    });
  
    return PizzaToppings;
  };
  
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false // Order status is required
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false, // Order belongs to a customer
        references: {
          model: 'Users', // References the Users table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      restaurantId: {
        type: Sequelize.INTEGER,
        allowNull: false, // Order belongs to a restaurant
        references: {
          model: 'Restaurants', // References the Restaurants table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      pizzaId: {
        type: Sequelize.INTEGER,
        allowNull: false, // Order includes a pizza
        references: {
          model: 'Pizzas', // References the Pizzas table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now') // Automatically set timestamp
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now') // Automatically set timestamp
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};


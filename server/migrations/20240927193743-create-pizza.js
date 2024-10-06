'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Pizzas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false // Pizza name is required
      },
      restaurantId: {
        type: Sequelize.INTEGER,
        allowNull: false, // Every pizza belongs to a restaurant
        references: {
          model: 'Restaurants', // References the Restaurants table
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
    await queryInterface.dropTable('Pizzas');
  }
};

'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false, // Name is required
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,  // Email is required
        unique: true,      // Ensure emails are unique
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,  // Password is required
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,  // Role is required
      },
      restaurantId: {
        type: Sequelize.INTEGER, // Optional: Only if the user is linked to a restaurant (managers)
        references: {
          model: 'Restaurants',   // Foreign key to Restaurants table
          key: 'id',
        },
        onDelete: 'SET NULL',     // When a restaurant is deleted, set restaurantId to null
        allowNull: true           // Can be null for customers
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now') // Automatically set to current timestamp
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now') // Automatically set to current timestamp
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};

const { Pizza } = require('../models');

// Get all pizzas
exports.getAllPizzas = async (req, res) => {
  try {
    const pizzas = await Pizza.findAll();
    res.json(pizzas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pizzas' });
  }
};

// Create a new pizza
exports.createPizza = async (req, res) => {
  try {
    const pizza = await Pizza.create(req.body);
    res.status(201).json(pizza);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create pizza' });
  }
};

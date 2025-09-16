// src/routers/views.router.js
const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');

const router = Router();
const productManager = new ProductManager();

// HOME: lista de productos por SSR
router.get('/', async (req, res, next) => {
  try {
    const products = await productManager.getAll();
    res.render('home', { products, title: 'Home' });
  } catch (err) {
    next(err);
  }
});

// REALTIME: lista + forms con WebSocket
router.get('/realtimeproducts', async (req, res, next) => {
  try {
    const products = await productManager.getAll();
    res.render('realTimeProducts', { products, title: 'Real Time Products' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');
const CartManager = require('../managers/CartManager');


const router = Router();
const productManager = new ProductManager();
const cartManager = new CartManager(productManager);


// POST /api/carts/
router.post('/', async (req, res, next) => {
try {
const cart = await cartManager.createCart();
res.status(201).json({ status: 'success', payload: cart });
} catch (err) { next(err); }
});


// GET /api/carts/:cid
router.get('/:cid', async (req, res, next) => {
try {
const cart = await cartManager.getById(req.params.cid);
if (!cart) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });
res.json({ status: 'success', payload: cart.products });
} catch (err) { next(err); }
});


// POST /api/carts/:cid/product/:pid
router.post('/:cid/product/:pid', async (req, res, next) => {
try {
const { quantity = 1 } = req.body || {};
const result = await cartManager.addProductToCart(req.params.cid, req.params.pid, quantity);


if (result?.error === 'CartNotFound')
return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });
if (result?.error === 'ProductNotFound')
return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });


res.status(201).json({ status: 'success', payload: result });
} catch (err) { next(err); }
});


module.exports = router;
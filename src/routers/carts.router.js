const { Router } = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { Types } = require('mongoose');

const router = Router();

/** POST /api/carts
 * Crea un carrito vacío
 */
router.post('/', async (req, res, next) => {
  try {
    const cart = await Cart.create({ products: [] });

    // // Tiempo real (opcional)
    // const io = req.app.get('io');
    // io?.emit('carts:update', { cartId: cart._id, action: 'created' });

    res.status(201).json({ status: 'success', payload: cart });
  } catch (err) {
    next(err);
  }
});

/** GET /api/carts/:cid
 * Devuelve los productos del carrito con populate (producto completo)
 */
router.get('/:cid', async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product').lean();
    if (!cart) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });

    res.json({ status: 'success', payload: cart.products });
  } catch (err) {
    next(err);
  }
});

/** POST /api/carts/:cid/product/:pid
 * Agrega el producto (o incrementa quantity si ya existe)
 * Body: { quantity?: number }  (default 1)
 */
router.post('/:cid/product/:pid', async (req, res, next) => {
  try {
    const { cid, pid } = req.params;
    const qty = Number(req.body?.quantity || 1);

    if (!Types.ObjectId.isValid(pid)) {
      return res.status(400).json({ status: 'error', error: 'pid inválido' });
    }

    const product = await Product.findById(pid);
    if (!product) return res.status(404).json({ status: 'error', error: 'Producto no existe' });

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });

    const idx = cart.products.findIndex((p) => p.product.toString() === pid);
    if (idx === -1) cart.products.push({ product: pid, quantity: qty });
    else cart.products[idx].quantity += qty;

    await cart.save();
    const populated = await cart.populate('products.product');

    // // Tiempo real (opcional)
    // const io = req.app.get('io');
    // io?.emit('carts:update', { cartId: cart._id, action: 'add', pid, quantity: qty });

    res.status(201).json({ status: 'success', payload: populated });
  } catch (err) {
    next(err);
  }
});

/** NUEVOS ENDPOINTS DE LA ENTREGA **/

/** DELETE /api/carts/:cid/products/:pid
 * Elimina un producto del carrito
 */
router.delete('/:cid/products/:pid', async (req, res, next) => {
  try {
    const { cid, pid } = req.params;
    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });

    const before = cart.products.length;
    cart.products = cart.products.filter((p) => p.product.toString() !== pid);
    if (cart.products.length === before) {
      return res.status(404).json({ status: 'error', error: 'Producto no estaba en el carrito' });
    }

    await cart.save();

    // // Tiempo real (opcional)
    // const io = req.app.get('io');
    // io?.emit('carts:update', { cartId: cart._id, action: 'remove', pid });

    res.json({ status: 'success', payload: cart });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/carts/:cid
 * Reemplaza TODO el arreglo de productos del carrito
 * Body: { products: [{ product: <ObjectId>, quantity: <number> }, ...] }
 */
router.put('/:cid', async (req, res, next) => {
  try {
    const { products = [] } = req.body;

    // Validación mínima del body
    for (const item of products) {
      if (!item || !Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({ status: 'error', error: 'product id inválido en body' });
      }
      if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 0) {
        return res.status(400).json({ status: 'error', error: 'quantity inválida en body' });
      }
    }

    const cart = await Cart.findByIdAndUpdate(
      req.params.cid,
      { products },
      { new: true, runValidators: true }
    );

    if (!cart) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });

    // // Tiempo real (opcional)
    // const io = req.app.get('io');
    // io?.emit('carts:update', { cartId: cart._id, action: 'replace', products });

    res.json({ status: 'success', payload: cart });
  } catch (err) {
    next(err);
  }
});

/** PUT /api/carts/:cid/products/:pid
 * Actualiza SOLO la cantidad de un producto
 * Body: { quantity: <number> }
 */
router.put('/:cid/products/:pid', async (req, res, next) => {
  try {
    const { cid, pid } = req.params;
    const q = Number(req.body?.quantity);

    if (!Number.isFinite(q) || q < 0) {
      return res.status(400).json({ status: 'error', error: 'quantity inválida' });
    }

    const cart = await Cart.findById(cid);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });

    const idx = cart.products.findIndex((p) => p.product.toString() === pid);
    if (idx === -1) return res.status(404).json({ status: 'error', error: 'Producto no está en el carrito' });

    cart.products[idx].quantity = q;
    await cart.save();

    // // Tiempo real (opcional)
    // const io = req.app.get('io');
    // io?.emit('carts:update', { cartId: cart._id, action: 'setQty', pid, quantity: q });

    res.json({ status: 'success', payload: cart });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/carts/:cid
 * Vacía el carrito (elimina todos los productos)
 */
router.delete('/:cid', async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.cid);
    if (!cart) return res.status(404).json({ status: 'error', error: 'Carrito no encontrado' });

    cart.products = [];
    await cart.save();

    // // Tiempo real (opcional)
    // const io = req.app.get('io');
    // io?.emit('carts:update', { cartId: cart._id, action: 'clear' });

    res.json({ status: 'success', payload: cart });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const { Router } = require('express');
const ProductManager = require('../managers/ProductManager');


const router = Router();
const productManager = new ProductManager();


// GET /api/products/
router.get('/', async (req, res, next) => {
try {
const products = await productManager.getAll();
res.json({ status: 'success', payload: products });
} catch (err) { next(err); }
});


// GET /api/products/:pid
router.get('/:pid', async (req, res, next) => {
try {
const product = await productManager.getById(req.params.pid);
if (!product) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
res.json({ status: 'success', payload: product });
} catch (err) { next(err); }
});


// POST /api/products/
router.post('/', async (req, res, next) => {
try {
const body = { ...req.body };
// Ignorar id si viene en body (se autogenera)
delete body.id;
const product = await productManager.create(body);
res.status(201).json({ status: 'success', payload: product });
} catch (err) {
const code = err.statusCode || 500;
res.status(code).json({ status: 'error', error: err.message || 'Error al crear producto' });
}
});


// PUT /api/products/:pid
router.put('/:pid', async (req, res, next) => {
try {
const { id, ...changes } = req.body || {};
const updated = await productManager.update(req.params.pid, changes);
if (!updated) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
res.json({ status: 'success', payload: updated });
} catch (err) { next(err); }
});


// DELETE /api/products/:pid
router.delete('/:pid', async (req, res, next) => {
try {
const ok = await productManager.delete(req.params.pid);
if (!ok) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
res.json({ status: 'success', message: 'Producto eliminado' });
} catch (err) { next(err); }
});


module.exports = router;

// ... arriba queda igual
router.post('/', async (req, res, next) => {
  try {
    const body = { ...req.body };
    delete body.id;
    const product = await productManager.create(body);

    // <-- emitir actualización
    try {
      const io = req.app.get('io');
      const list = await productManager.getAll();
      io?.emit('products:update', list);
    } catch (_) {}

    res.status(201).json({ status: 'success', payload: product });
  } catch (err) {
    const code = err.statusCode || 500;
    res.status(code).json({ status: 'error', error: err.message || 'Error al crear producto' });
  }
});

router.delete('/:pid', async (req, res, next) => {
  try {
    const ok = await productManager.delete(req.params.pid);
    if (!ok) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });

    // <-- emitir actualización
    try {
      const io = req.app.get('io');
      const list = await productManager.getAll();
      io?.emit('products:update', list);
    } catch (_) {}

    res.json({ status: 'success', message: 'Producto eliminado' });
  } catch (err) {
    next(err);
  }
});

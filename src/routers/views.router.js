// src/routers/views.router.js
const { Router } = require('express');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const router = Router();

/** Home → redirige al listado de productos */
router.get('/', (req, res) => res.redirect('/products'));

// form de creación (simple)
router.get('/products/new', (req, res) => {
  res.render('newProduct', { title: 'Nuevo producto' });
});

/** Listado de productos con paginación/filtros/orden */
router.get('/products', async (req, res, next) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    // Filtro (category:XXX | status:true/false | fallback)
    let filter = {};
    if (query) {
      const [key, rawValue] = String(query).split(':');
      if (key && typeof rawValue !== 'undefined') {
        if (key === 'status') filter.status = rawValue === 'true';
        else if (key === 'category') filter.category = rawValue;
        else filter[key] = rawValue;
      }
    }

    // Orden por precio
    let sortOpt;
    if (sort === 'asc') sortOpt = { price: 1 };
    if (sort === 'desc') sortOpt = { price: -1 };

    const lim = Math.max(parseInt(limit, 10) || 10, 1);
    const pg = Math.max(parseInt(page, 10) || 1, 1);

    const totalDocs = await Product.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalDocs / lim), 1);
    const safePage = Math.min(pg, totalPages);

    const products = await Product.find(filter)
      .sort(sortOpt)
      .skip((safePage - 1) * lim)
      .limit(lim)
      .lean();

    const hasPrevPage = safePage > 1;
    const hasNextPage = safePage < totalPages;

    res.render('products', {
      title: 'Productos',
      products,
      page: safePage,
      totalPages,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? safePage - 1 : null,
      nextPage: hasNextPage ? safePage + 1 : null,
      query,
      sort,
      limit: lim
      // OJO: "cid" NO hace falta pasarlo: ya va en res.locals.cid por el middleware
    });
  } catch (err) {
    next(err);
  }
});

/** Detalle de producto */
router.get('/products/:pid', async (req, res, next) => {
  try {
    const prod = await Product.findById(req.params.pid).lean();
    if (!prod) return res.status(404).send('Producto no encontrado');
    res.render('productDetail', { title: prod.title, product: prod });
  } catch (err) {
    next(err);
  }
});

/** Vista carrito con populate */
router.get('/carts/:cid', async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.cid).populate('products.product').lean();
    if (!cart) return res.status(404).send('Carrito no encontrado');
    res.render('cart', { title: 'Mi carrito', cart });
  } catch (err) {
    next(err);
  }
});

/** Real-time (lista que se actualiza por Socket.IO) */
router.get('/realtimeproducts', async (req, res, next) => {
  try {
    const products = await Product.find().lean();
    res.render('realtimeProducts', { title: 'Real-Time Products', products });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

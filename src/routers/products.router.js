// src/routers/products.router.js
const { Router } = require('express');
const { Types } = require('mongoose');          // ← importa Types de mongoose
const Product = require('../models/Product');

const router = Router();

/**
 * GET /api/products
 * ?limit=10&page=1&sort=asc|desc&query=category:XYZ|status:true
 */
router.get('/', async (req, res, next) => {
  try {
    const { limit = 10, page = 1, sort, query } = req.query;

    // Filtro
    let filter = {};
    if (query) {
      const [key, rawValue] = String(query).split(':');
      if (key && typeof rawValue !== 'undefined') {
        if (key === 'status') filter.status = rawValue === 'true';
        else if (key === 'category') filter.category = rawValue;
        else filter[key] = rawValue; // title:..., code:..., etc.
      }
    }

    // Orden por precio
    let sortOpt;
    if (sort === 'asc') sortOpt = { price: 1 };
    if (sort === 'desc') sortOpt = { price: -1 };

    const lim = Math.max(parseInt(limit, 10) || 10, 1);
    const pg  = Math.max(parseInt(page, 10)  || 1,  1);

    const totalDocs  = await Product.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(totalDocs / lim), 1);
    const safePage   = Math.min(pg, totalPages);

    const docs = await Product.find(filter)
      .sort(sortOpt)
      .skip((safePage - 1) * lim)
      .limit(lim)
      .lean();

    const hasPrevPage = safePage > 1;
    const hasNextPage = safePage < totalPages;
    const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
    const link = (p) => {
      const params = new URLSearchParams({ ...req.query, page: String(p), limit: String(lim) });
      return `${baseUrl}?${params.toString()}`;
    };

    res.json({
      status: 'success',
      payload: docs,
      totalPages,
      prevPage: hasPrevPage ? safePage - 1 : null,
      nextPage: hasNextPage ? safePage + 1 : null,
      page: safePage,
      hasPrevPage,
      hasNextPage,
      prevLink: hasPrevPage ? link(safePage - 1) : null,
      nextLink: hasNextPage ? link(safePage + 1) : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:pid (con validación de ObjectId)
router.get('/:pid', async (req, res, next) => {
  try {
    const { pid } = req.params;
    if (!Types.ObjectId.isValid(pid)) {
      return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    }
    const product = await Product.findById(pid).lean();
    if (!product) {
      return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    }
    res.json({ status: 'success', payload: product });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', async (req, res, next) => {
  try {
    const created = await Product.create(req.body);

    // Emitir actualización en tiempo real (si hay Socket.IO)
    try {
      const io = req.app.get('io');
      if (io) {
        const list = await Product.find().lean();
        io.emit('products:update', list);
      }
    } catch (_) {}

    res.status(201).json({ status: 'success', payload: created });
  } catch (err) {
    // Maneja error de índice único en code
    if (err?.code === 11000 && err?.keyPattern?.code) {
      err.statusCode = 400;
      err.message = 'El campo "code" debe ser único';
    }
    next(err);
  }
});

// PUT /api/products/:pid
router.put('/:pid', async (req, res, next) => {
  try {
    const { pid } = req.params;
    if (!Types.ObjectId.isValid(pid)) {
      return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    }

    const updated = await Product.findByIdAndUpdate(pid, req.body, { new: true }).lean();
    if (!updated) {
      return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    }

    // Emitir actualización
    try {
      const io = req.app.get('io');
      if (io) {
        const list = await Product.find().lean();
        io.emit('products:update', list);
      }
    } catch (_) {}

    res.json({ status: 'success', payload: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:pid
router.delete('/:pid', async (req, res, next) => {
  try {
    const { pid } = req.params;
    if (!Types.ObjectId.isValid(pid)) {
      return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    }

    const deleted = await Product.findByIdAndDelete(pid).lean();
    if (!deleted) {
      return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
    }

    // Emitir actualización
    try {
      const io = req.app.get('io');
      if (io) {
        const list = await Product.find().lean();
        io.emit('products:update', list);
      }
    } catch (_) {}

    res.json({ status: 'success', payload: deleted });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// src/server.js
require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { engine } = require('express-handlebars');

// Models (para crear/obtener carrito por cookie)
const Cart = require('./models/Cart');

// Routers
const productsRouter = require('./routers/products.router');
const cartsRouter = require('./routers/carts.router');
const viewsRouter = require('./routers/views.router');

const app = express();
app.get('/favicon.ico', (_req, res) => res.status(204).end()); // No Content: evita 404
const server = http.createServer(app);
const io = new Server(server);

// Hacer io accesible en rutas (req.app.get('io'))
app.set('io', io);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Seguridad (CSP permisiva para favicon e imágenes locales)
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "img-src": ["'self'", "data:"], // permite /favicon.ico y data URIs
      },
    },
  })
);

// Static y favicon (evita warning/404 de favicon)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (_req, res) => res.status(204).end());

/**
 * Middleware: asegurar carrito por usuario (mediante cookie "cid")
 * - Si no hay cookie, crea/usa un carrito y setea "cid".
 * - Expone "cid" en res.locals para usarlo en las vistas (layouts y templates).
 */
app.use(async (req, res, next) => {
  try {
    let cid = req.cookies?.cid;
    if (!cid) {
      let cart = await Cart.findOne({});
      if (!cart) cart = await Cart.create({ products: [] });
      cid = String(cart._id);
      res.cookie('cid', cid, { httpOnly: true, sameSite: 'lax' });
    }
    req.cid = cid;
    res.locals.cid = cid; // disponible en layouts/vistas
    next();
  } catch (e) {
    next(e);
  }
});

// Handlebars
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Routers API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Vistas
app.use('/', viewsRouter);

// Health
app.get('/health', (_req, res) => res.send('ok'));

// Socket.IO (opcional)
io.on('connection', (socket) => {
  console.log('🟢 Cliente conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
});

// Manejo de errores (centralizado)
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ status: 'error', error: err.message || 'ERR' });
});

// Arranque
const PORT = 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce';

mongoose
  .connect(MONGO_URI, { dbName: 'ecommerce' })
  .then(() => {
    console.log('✅ Mongo conectado');
    server.listen(PORT, () => {
      console.log(`✅ API http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error('❌ Error conectando a Mongo:', e.message);
    process.exit(1);
  });

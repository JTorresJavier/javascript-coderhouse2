// src/server.js
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const productsRouter = require('./routers/products.router');
const cartsRouter = require('./routers/carts.router');
const viewsRouter = require('./routers/views.router');

const ProductManager = require('./managers/ProductManager');
const productManager = new ProductManager();

// Handlebars
const { engine } = require('express-handlebars');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Hacer io accesible en rutas HTTP (para emitir dentro de POST/DELETE)
app.set('io', io);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars config
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Routers API
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Views router
app.use('/', viewsRouter);

// Health
app.get('/health', (_, res) => res.send('ok'));

// Socket.IO
io.on('connection', async (socket) => {
  console.log('🟢 Cliente conectado:', socket.id);

  // Enviamos el estado inicial por si el cliente lo necesita:
  const products = await productManager.getAll();
  socket.emit('products:update', products);

  // (Opcional) Manejar creación/eliminación vía WebSocket (sin HTTP)
  socket.on('product:create', async (data, cb) => {
    try {
      const created = await productManager.create(data);
      const list = await productManager.getAll();
      io.emit('products:update', list);
      cb?.({ ok: true, payload: created });
    } catch (err) {
      cb?.({ ok: false, error: err.message || 'Error al crear' });
    }
  });

  socket.on('product:delete', async (id, cb) => {
    try {
      const ok = await productManager.delete(id);
      const list = await productManager.getAll();
      io.emit('products:update', list);
      cb?.({ ok, id });
    } catch (err) {
      cb?.({ ok: false, error: err.message || 'Error al eliminar' });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado:', socket.id);
  });
});

// Manejo de errores (central)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({ status: 'error', error: err.message || 'Internal Server Error' });
});

const PORT = 8080;
// const HOST = '0.0.0.0';
server.listen(PORT /*, HOST*/, () => {
  console.log(`✅ API escuchando en http://localhost:${PORT}`);
});

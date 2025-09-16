// src/public/js/realtime.js
const socket = io();

// Helpers DOM
const $ = (sel) => document.querySelector(sel);
const productsGrid = $('#products');

// Render completo desde una lista
function renderProducts(list) {
  if (!productsGrid) return;
  productsGrid.innerHTML = list
    .map(
      (p) => `
      <div class="card" data-id="${p.id}">
        <h3>${p.title}</h3>
        <p class="muted">${p.description}</p>
        <p><strong>$${p.price}</strong> · Stock: ${p.stock} · Cat: ${p.category}</p>
        <p><small>code: ${p.code} · id: ${p.id}</small></p>
      </div>
    `
    )
    .join('');
}

// Al conectarse o cuando haya cambios, el server emite la lista completa
socket.on('products:update', (list) => {
  renderProducts(list || []);
});

// Crear producto vía WebSocket
const createForm = $('#createForm');
const createMsg = $('#createMsg');

createForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(createForm);
  const data = Object.fromEntries(fd.entries());
  data.price = Number(data.price);
  data.stock = Number(data.stock);
  data.status = String(data.status) === 'true';
  data.thumbnails = (data.thumbnails || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  socket.emit('product:create', data, (resp) => {
    if (resp?.ok) {
      createMsg.textContent = '✅ Producto creado';
      createForm.reset();
    } else {
      createMsg.textContent = '❌ ' + (resp?.error || 'Error desconocido');
    }
    setTimeout(() => (createMsg.textContent = ''), 2000);
  });
});

// Eliminar producto vía WebSocket
const deleteForm = $('#deleteForm');
const deleteMsg = $('#deleteMsg');

deleteForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(deleteForm);
  const id = fd.get('id');
  socket.emit('product:delete', Number(id), (resp) => {
    if (resp?.ok) {
      deleteMsg.textContent = '🗑️ Producto eliminado';
      deleteForm.reset();
    } else {
      deleteMsg.textContent = '❌ ' + (resp?.error || 'Error desconocido');
    }
    setTimeout(() => (deleteMsg.textContent = ''), 2000);
  });
});

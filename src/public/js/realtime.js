const socket = io();
const $ = (sel) => document.querySelector(sel);
const grid = $('#products');

function render(list) {
  if (!grid) return;
  grid.innerHTML = (list || [])
    .map(
      (p) => `
      <div class="card" data-id="${p._id}">
        <h3>${p.title}</h3>
        <p class="muted">${p.description || ''}</p>
        <p><strong>$${p.price}</strong> · Stock: ${p.stock ?? 0} · Cat: ${p.category || ''}</p>
        <p><small>code: ${p.code || ''} · _id: ${p._id}</small></p>
      </div>
    `
    )
    .join('');
}

socket.on('products:update', render);

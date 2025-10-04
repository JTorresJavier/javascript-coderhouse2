// src/public/js/new-product.js
const form = document.getElementById('productForm');
const msg  = document.getElementById('msg');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = 'Guardando...';

  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());

  // convertir tipos
  data.price  = Number(data.price);
  data.stock  = Number(data.stock);
  data.status = String(data.status) === 'true';
  data.thumbnails = (data.thumbnails || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // si usas token admin:
      // headers: { 'Content-Type':'application/json', 'x-admin-token': 'TU_TOKEN' },
      body: JSON.stringify(data)
    });
    const json = await res.json();

    if (!res.ok) throw new Error(json?.error || 'Error al crear');

    msg.textContent = '✅ Producto creado';
    form.reset();
    // location.href = '/products'; // si querés redirigir
  } catch (err) {
    msg.textContent = '❌ ' + err.message;
  } finally {
    setTimeout(() => (msg.textContent = ''), 2500);
  }
});

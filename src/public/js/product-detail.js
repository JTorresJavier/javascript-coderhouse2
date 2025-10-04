function getCurrentCartId() {
  const ls = localStorage.getItem('cartId');
  return window.cartId || ls;
}

async function ensureCartId() {
  let cid = getCurrentCartId();
  if (cid) return cid;
  const res = await fetch('/api/carts', { method: 'POST' });
  const json = await res.json();
  if (!res.ok || !json?.payload?._id) throw new Error('No se pudo crear el carrito');
  cid = json.payload._id;
  localStorage.setItem('cartId', cid);
  window.cartId = cid;
  return cid;
}

document.getElementById('btnAdd')?.addEventListener('click', async (e) => {
  const pid = e.currentTarget.dataset.pid;
  try {
    const cid = await ensureCartId();
    const res = await fetch(`/api/carts/${cid}/product/${pid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: 1 })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Error al agregar');
    e.currentTarget.textContent = 'Agregado ✅';
    setTimeout(() => (e.currentTarget.textContent = 'Agregar al carrito'), 1200);
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

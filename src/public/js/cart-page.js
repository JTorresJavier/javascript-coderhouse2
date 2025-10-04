// src/public/js/cart-page.js

/*** CONFIGURABLES ***/
const IVA_RATE = 0.21;        // 21% Argentina (cambiá si necesitás)
const DISCOUNT_THRESHOLD = 300000;
const DISCOUNT_RATE = 0.30;

// Recargos de cuotas (puede ajustarse a tasas "reales" del momento)
const INSTALLMENT_SURCHARGE = {
  1: 0.00,  // 1 cuota sin recargo
  3: 0.10,  // 10% recargo total
  6: 0.25,  // 25% recargo total
  12: 0.55  // 55% recargo total
};
/*** FIN CONFIG ***/

function getCurrentCartId() {
  // Primero intenta leer del DOM (cuando estás en /carts/:cid)
  const root = document.getElementById('cartRoot');
  const pageCid = root?.dataset?.cartId;
  if (pageCid) return pageCid;

  // Si no, desde localStorage (creado por cart-common.js)
  const ls = localStorage.getItem('cartId');
  if (ls) return ls;

  return window.cartId; // fallback
}

function currency(n) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function readLines() {
  const items = [];
  document.querySelectorAll('#cartList li[data-pid]').forEach((li) => {
    const price = Number(li.dataset.price) || 0;
    const qtyInput = li.querySelector('.qty');
    const qty = Number(qtyInput?.value) || 0;
    items.push({ price, qty, li, qtyInput });
  });
  return items;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function computeTotals() {
  const items = readLines();

  const subtotal = items.reduce((acc, it) => acc + it.price * it.qty, 0);
  const discount = subtotal >= DISCOUNT_THRESHOLD ? subtotal * DISCOUNT_RATE : 0;
  const taxableBase = Math.max(subtotal - discount, 0);
  const iva = taxableBase * IVA_RATE;
  const total = taxableBase + iva;

  setText('subtotal',  currency(subtotal));
  setText('discount', '-' + currency(discount));
  setText('iva',       currency(iva));
  setText('total',     currency(total));

  computeInstallments(total);
  return { subtotal, discount, iva, total };
}


function currentPlanRate(plan) {
  const n = Number(plan);
  return INSTALLMENT_SURCHARGE[n] ?? 0;
}

function computeInstallments(totalWithVat) {
  const planSel = document.getElementById('plan');
  if (!planSel) return;

  const n = Number(planSel.value);
  const rate = INSTALLMENT_SURCHARGE[n] ?? 0;

  const financedTotal   = totalWithVat * (1 + rate);
  const installmentValue = n > 0 ? financedTotal / n : financedTotal;

  setText('planRateInfo',    n > 1 ? `Recargo: ${(rate * 100).toFixed(0)}%` : 'Sin recargo');
  setText('financedTotal',   currency(financedTotal));
  setText('installmentValue',currency(installmentValue));
}

/*** EVENTOS ***/

// Cambios de cantidad / eliminar producto / etc.
document.getElementById('cartList')?.addEventListener('click', async (e) => {
  const li = e.target.closest('li[data-pid]');
  const cartId = getCurrentCartId();

  // actualizar cantidad (PUT /api/carts/:cid/products/:pid)
  if (li && e.target.matches('.update-qty')) {
    const pid = li.dataset.pid;
    const qty = Number(li.querySelector('.qty')?.value);
    if (!Number.isFinite(qty) || qty < 0) return alert('Cantidad inválida');
    try {
      const res = await fetch(`/api/carts/${cartId}/products/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al actualizar cantidad');
      if (qty === 0) li.remove();
      computeTotals();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  }

  // eliminar (DELETE /api/carts/:cid/products/:pid)
  if (li && e.target.matches('.remove-item')) {
    const pid = li.dataset.pid;
    if (!confirm('¿Eliminar este producto del carrito?')) return;
    try {
      const res = await fetch(`/api/carts/${cartId}/products/${pid}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Error al eliminar');
      li.remove();
      computeTotals();
    } catch (err) {
      alert('❌ ' + err.message);
    }
  }
});

// Vaciar carrito (DELETE /api/carts/:cid)
document.getElementById('clearCart')?.addEventListener('click', async () => {
  const cartId = getCurrentCartId();
  if (!confirm('¿Vaciar carrito completo?')) return;
  try {
    const res = await fetch(`/api/carts/${cartId}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Error al vaciar carrito');
    const ul = document.getElementById('cartList');
    if (ul) ul.innerHTML = '';
    computeTotals();
  } catch (err) {
    alert('❌ ' + err.message);
  }
});

// Si cambia el plan de cuotas, recalculamos cuotas con el total actual
document.getElementById('plan')?.addEventListener('change', () => {
  const totalText = document.getElementById('total')?.textContent || '$0';
  // Recalcular desde las líneas para evitar parsing de texto:
  const { total } = computeTotals(); // esto ya recalcula todo y llama computeInstallments
});

// Recalcular al cargar la página
document.addEventListener('DOMContentLoaded', computeTotals);

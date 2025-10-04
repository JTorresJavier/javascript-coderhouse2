// src/public/js/cart-common.js
(async function ensureCart() {
  try {
    const key = 'cartId';
    let cartId = localStorage.getItem(key);

    if (!cartId) {
      // crea un carrito vacío
      const res = await fetch('/api/carts', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json?.payload?._id) throw new Error('No se pudo crear el carrito');
      cartId = json.payload._id;
      localStorage.setItem(key, cartId);
      console.log('🛒 Carrito creado:', cartId);
    }

    // lo expongo global para otros scripts
    window.cartId = cartId;
  } catch (e) {
    console.error('Error asegurando el carrito:', e);
  }
})();

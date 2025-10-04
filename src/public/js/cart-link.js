// src/public/js/cart-link.js
(function () {
  const a = document.getElementById('cartLink');
  const cid = localStorage.getItem('cartId');
  if (cid) {
    a.href = `/carts/${cid}`;
  } else {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      alert('Aún no hay carrito. Agregá un producto primero.');
    });
  }
})();

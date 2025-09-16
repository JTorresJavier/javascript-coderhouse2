const path = require('path');
const { readJSON, writeJSON, nextIdFrom } = require('../utils/file');


class CartManager {
constructor(productManager) {
this.filePath = path.join(__dirname, '..', 'data', 'carts.json');
this.productManager = productManager; // para validar existencia de productos
}


async getAll() {
return await readJSON(this.filePath);
}


async getById(id) {
const carts = await this.getAll();
return carts.find(c => String(c.id) === String(id)) || null;
}


async createCart() {
const carts = await this.getAll();
const newId = nextIdFrom(carts);
const cart = { id: newId, products: [] };
carts.push(cart);
await writeJSON(this.filePath, carts);
return cart;
}


async addProductToCart(cartId, productId, quantity = 1) {
const cart = await this.getById(cartId);
if (!cart) return { error: 'CartNotFound' };


// Validar que el producto exista
const product = await this.productManager.getById(productId);
if (!product) return { error: 'ProductNotFound' };


const q = Number(quantity) || 1;
const existing = cart.products.find(p => String(p.product) === String(productId));
if (existing) {
existing.quantity += q;
} else {
cart.products.push({ product: product.id, quantity: q });
}


// Persistir cambios
const carts = await this.getAll();
const idx = carts.findIndex(c => String(c.id) === String(cartId));
if (idx === -1) return { error: 'CartNotFound' };
carts[idx] = cart;
await writeJSON(this.filePath, carts);


return cart;
}
}


module.exports = CartManager;
// ./src/managers/ProductManager.js (encabezado sugerido)
const path = require('path');
const { readJSON, writeJSON, nextIdFrom } = require('../utils/file');

class ProductManager {
  constructor() {
    this.filePath = path.join(__dirname, '..', 'data', 'products.json');
  }


async getAll() {
    return await readJSON(this.filePath);
}


async getById(id) {
    const products = await this.getAll();
    return products.find(p => String(p.id) === String(id)) || null;
}


async create(data) {
    const required = ['title', 'description', 'code', 'price', 'status', 'stock', 'category'];
    for (const key of required) {
    if (data[key] === undefined) {
        const err = new Error(`Falta el campo requerido: ${key}`);
        err.statusCode = 400;
    throw err;
    }
}


const products = await this.getAll();


// Autogenerar id
const newId = nextIdFrom(products);


const product = {
id: newId,
title: String(data.title),
description: String(data.description),
code: String(data.code),
price: Number(data.price),
status: Boolean(data.status),
stock: Number(data.stock),
category: String(data.category),
thumbnails: Array.isArray(data.thumbnails) ? data.thumbnails.map(String) : []
};


products.push(product);
await writeJSON(this.filePath, products);
return product;
}


async update(id, changes) {
const products = await this.getAll();
const idx = products.findIndex(p => String(p.id) === String(id));
if (idx === -1) return null;


const { id: _ignored, ...rest } = changes || {};
const allowed = ['title', 'description', 'code', 'price', 'status', 'stock', 'category', 'thumbnails'];
for (const key of Object.keys(rest)) {
if (!allowed.includes(key)) delete rest[key];
}


if (rest.price !== undefined) rest.price = Number(rest.price);
if (rest.status !== undefined) rest.status = Boolean(rest.status);
if (rest.stock !== undefined) rest.stock = Number(rest.stock);
if (rest.thumbnails !== undefined) rest.thumbnails = Array.isArray(rest.thumbnails) ? rest.thumbnails : [];


products[idx] = { ...products[idx], ...rest };
await writeJSON(this.filePath, products);
return products[idx];
}


async delete(id) {
const products = await this.getAll();
const before = products.length;
const filtered = products.filter(p => String(p.id) !== String(id));
if (filtered.length === before) return false;
await writeJSON(this.filePath, filtered);
return true;
}
}


module.exports = ProductManager;
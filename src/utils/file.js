const fs = require('fs/promises');
const path = require('path');


async function ensureFile(filePath, initialValue = '[]') {
try {
await fs.mkdir(path.dirname(filePath), { recursive: true });
await fs.access(filePath);
} catch {
await fs.writeFile(filePath, initialValue, 'utf-8');
}
}


async function readJSON(filePath) {
await ensureFile(filePath);
const data = await fs.readFile(filePath, 'utf-8');
return JSON.parse(data || '[]');
}


async function writeJSON(filePath, data) {
await ensureFile(filePath);
await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


function nextIdFrom(collection) {
if (!Array.isArray(collection) || collection.length === 0) return 1;
const maxId = collection.reduce((max, item) => {
const idNum = Number(item.id) || 0;
return idNum > max ? idNum : max;
}, 0);
return maxId + 1;
}


module.exports = { ensureFile, readJSON, writeJSON, nextIdFrom };
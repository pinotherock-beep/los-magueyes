const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../public/js/menu.js'), 'utf8');
function run(storage) {
  const elements = new Map();
  const document = { querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, { innerHTML: '', textContent: '', content: '', classList: { add() {} }, addEventListener() {}, querySelectorAll: () => [] });
    return elements.get(selector);
  }};
  const context = vm.createContext({ document, localStorage: storage, Intl, fetch: async () => ({ ok: true, json: async () => ({ products: [{ id: 1, name: 'Taco', price: 32, category: 'Tacos' }] }) }) });
  vm.runInContext(source, context);
  return context;
}
test('almacenamiento corrupto no impide cargar el menú', async () => {
  const ctx = run({ getItem: () => '{mal', setItem() {} });
  await vm.runInContext('loadMenu()', ctx);
  expect(vm.runInContext('products.length', ctx)).toBe(1);
  expect(vm.runInContext('cart.length', ctx)).toBe(0);
});
test('carrito sigue funcionando si localStorage está bloqueado', async () => {
  const ctx = run({ getItem() { throw Error(); }, setItem() { throw Error(); } });
  await vm.runInContext('loadMenu()', ctx);
  vm.runInContext('addToCart(1)', ctx);
  expect(vm.runInContext('cart[0].quantity', ctx)).toBe(1);
});
test('quita productos retirados del catálogo y limita cantidad a 20', async () => {
  const ctx = run({ getItem: () => '[{"productId":999,"quantity":1}]', setItem() {} });
  await vm.runInContext('loadMenu()', ctx);
  expect(vm.runInContext('cart.length', ctx)).toBe(0);
  vm.runInContext('for(let i=0;i<25;i++) addToCart(1)', ctx);
  expect(vm.runInContext('cart[0].quantity', ctx)).toBe(20);
});

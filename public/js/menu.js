const list = document.querySelector('#menu-list');
const filters = document.querySelector('#category-filter');
const cartItems = document.querySelector('#cart-items');
const totalElement = document.querySelector('#cart-total');
const form = document.querySelector('#order-form');
const message = document.querySelector('#order-message');
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || '';

let products = [];
let selectedCategory = 'Todos';
let cart = [];
try {
  const saved = JSON.parse(localStorage.getItem('losMagueyesCart') || '[]');
  if (Array.isArray(saved)) cart = saved.filter(item => item && Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20).slice(0, 30);
  cart = cart.filter((item, index) => cart.findIndex(entry => entry.productId === item.productId) === index);
} catch { /* El menú funciona también sin almacenamiento disponible. */ }

const money = value => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);
const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[character]));

async function loadMenu() {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('No se pudo cargar el menú.');
    ({ products } = await response.json());
    cart = cart.filter(item => products.some(product => product.id === item.productId));
    renderFilters();
    renderProducts();
    saveCart();
  } catch (error) {
    list.textContent = 'No se pudo cargar el menú. Intenta recargar la página en unos momentos.';
  }
}

function renderFilters() {
  const categories = ['Todos', ...new Set(products.map(product => product.category))];
  filters.innerHTML = categories.map(category => `<button type="button" class="${category === selectedCategory ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
  filters.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    selectedCategory = button.dataset.category;
    renderFilters();
    renderProducts();
  }));
}

function renderProducts() {
  const visible = selectedCategory === 'Todos' ? products : products.filter(product => product.category === selectedCategory);
  list.innerHTML = visible.map(product => `
    <article class="menu-card">
      <div><h2>${escapeHtml(product.name)}</h2><p>${escapeHtml(product.description || '')}</p></div>
      <strong class="menu-price">${money(product.price)}</strong>
      <button type="button" data-id="${product.id}" aria-label="Agregar ${escapeHtml(product.name)}">Agregar</button>
    </article>
  `).join('');
  list.querySelectorAll('button').forEach(button => button.addEventListener('click', () => addToCart(Number(button.dataset.id))));
}

function addToCart(productId) {
  const item = cart.find(entry => entry.productId === productId);
  if ((item && item.quantity >= 20) || (!item && cart.length >= 30)) {
    message.textContent = 'Máximo 20 unidades por producto y 30 productos distintos.';
    message.className = 'form-message error';
    return;
  }
  if (item) item.quantity += 1;
  else cart.push({ productId, quantity: 1 });
  saveCart();
}

function removeFromCart(productId) {
  const item = cart.find(entry => entry.productId === productId);
  if (!item) return;
  item.quantity -= 1;
  if (item.quantity <= 0) cart = cart.filter(entry => entry.productId !== productId);
  saveCart();
}

function saveCart() {
  try { localStorage.setItem('losMagueyesCart', JSON.stringify(cart)); } catch { /* Carrito en memoria. */ }
  renderCart();
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = '<p class="muted">Aún no agregas productos.</p>';
    totalElement.textContent = money(0);
    return;
  }
  let total = 0;
  cartItems.innerHTML = cart.map(item => {
    const product = products.find(entry => entry.id === item.productId);
    if (!product) return '';
    const subtotal = Number(product.price) * item.quantity;
    total += subtotal;
    return `<div class="cart-line"><strong>${item.quantity} × ${escapeHtml(product.name)}</strong><small>${money(subtotal)}</small><button type="button" data-id="${product.id}" aria-label="Quitar uno">−</button></div>`;
  }).join('');
  totalElement.textContent = money(total);
  cartItems.querySelectorAll('button').forEach(button => button.addEventListener('click', () => removeFromCart(Number(button.dataset.id))));
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  message.className = 'form-message';
  if (!cart.length) {
    message.textContent = 'Agrega al menos un producto.';
    message.classList.add('error');
    return;
  }
  const data = Object.fromEntries(new FormData(form));
  data.items = cart;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Enviando…';
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'No se pudo registrar el pedido.');
    message.textContent = `Pedido #${result.orderNumber || result.orderId} recibido. Total: ${money(result.total)}.`;
    message.classList.add('success');
    cart = [];
    saveCart();
    form.reset();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
  } finally {
    button.disabled = false;
    button.textContent = 'Confirmar pedido';
  }
});

loadMenu();

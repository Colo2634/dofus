const form = document.getElementById('item-form');
const itemsContainer = document.getElementById('items-container');
const historySection = document.getElementById('history-section');
const ctx = document.getElementById('history-chart').getContext('2d');
let chart;

let items = JSON.parse(localStorage.getItem('dofusItems') || '{}');
renderItems();

form.addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('item-name').value.trim();
  const category = document.getElementById('item-category').value.trim();
  const price1 = parseInt(document.getElementById('price-1').value, 10);
  const price10 = parseInt(document.getElementById('price-10').value, 10);
  const price100 = parseInt(document.getElementById('price-100').value, 10);
  const price1000 = parseInt(document.getElementById('price-1000').value, 10);

  if (!items[name]) {
    items[name] = { category, prices: {}, history: [] };
  }
  items[name].category = category;
  items[name].prices = { 1: price1, 10: price10, 100: price100, 1000: price1000 };
  items[name].history.push({
    date: new Date().toISOString(),
    prices: { 1: price1, 10: price10, 100: price100, 1000: price1000 }
  });
  localStorage.setItem('dofusItems', JSON.stringify(items));
  form.reset();
  renderItems();
});

function renderItems() {
  itemsContainer.innerHTML = '';
  const categories = {};
  Object.keys(items).forEach(name => {
    const item = items[name];
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push({ name, ...item });
  });
  Object.keys(categories).forEach(cat => {
    const h3 = document.createElement('h3');
    h3.textContent = cat;
    itemsContainer.appendChild(h3);
    const table = document.createElement('table');
    const header = document.createElement('tr');
    header.innerHTML = '<th>Nom</th><th>x1</th><th>x10</th><th>x100</th><th>x1000</th><th></th>';
    table.appendChild(header);
    categories[cat].forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.name}</td><td>${item.prices[1]}</td><td>${item.prices[10]}</td><td>${item.prices[100]}</td><td>${item.prices[1000]}</td>`;
      const btn = document.createElement('button');
      btn.textContent = 'Historique';
      btn.addEventListener('click', () => showHistory(item.name));
      const td = document.createElement('td');
      td.appendChild(btn);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    itemsContainer.appendChild(table);
  });
}

function showHistory(name) {
  const item = items[name];
  if (!item) return;
  historySection.classList.remove('hidden');
  const labels = item.history.map(h => new Date(h.date).toLocaleDateString());
  const data = item.history.map(h => h.prices[1]);
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: `Prix x1 de ${name}`, data }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
}

const form = document.getElementById('item-form');
const itemsContainer = document.getElementById('items-container');
const historySection = document.getElementById('history-section');
const ctx = document.getElementById('history-chart').getContext('2d');
let chart;
let items = [];

async function loadResources() {
  const res = await fetch('/api/resources');
  items = await res.json();
  renderItems();
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('item-name').value.trim();
  const category = document.getElementById('item-category').value.trim();
  const price1 = parseInt(document.getElementById('price-1').value, 10);
  const price10 = parseInt(document.getElementById('price-10').value, 10);
  const price100 = parseInt(document.getElementById('price-100').value, 10);
  const price1000 = parseInt(document.getElementById('price-1000').value, 10);

  const resResource = await fetch('/api/resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category })
  });
  const { id } = await resResource.json();
  const prices = { 1: price1, 10: price10, 100: price100, 1000: price1000 };
  for (const [qty, price] of Object.entries(prices)) {
    await fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: id, quantity: parseInt(qty, 10), price })
    });
  }
  form.reset();
  loadResources();
});

function renderItems() {
  itemsContainer.innerHTML = '';
  const categories = {};
  items.forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
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
      tr.innerHTML = `<td>${item.name}</td><td>${item.prices[1] ?? ''}</td><td>${item.prices[10] ?? ''}</td><td>${item.prices[100] ?? ''}</td><td>${item.prices[1000] ?? ''}</td>`;
      const btn = document.createElement('button');
      btn.textContent = 'Historique';
      btn.addEventListener('click', () => showHistory(item.id, item.name));
      const td = document.createElement('td');
      td.appendChild(btn);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    itemsContainer.appendChild(table);
  });
}

async function showHistory(id, name) {
  const res = await fetch(`/api/prices/${id}/1`);
  const data = await res.json();
  if (!data.length) {
    historySection.classList.add('hidden');
    return;
  }
  historySection.classList.remove('hidden');
  const labels = data.map(h => new Date(h.created_at).toLocaleDateString());
  const prices = data.map(h => h.price);
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: `Prix x1 de ${name}`, data: prices, borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.2)' }]
    },
    options: { scales: { y: { beginAtZero: true } } }
  });
}

loadResources();

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
let db;

function initDb(filename = 'dofus.db') {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(filename, err => {
      if (err) return reject(err);
      db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS resources (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE,
          category_id INTEGER,
          FOREIGN KEY(category_id) REFERENCES categories(id)
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS prices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resource_id INTEGER,
          quantity INTEGER,
          price INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(resource_id) REFERENCES resources(id)
        )`, err2 => {
          if (err2) return reject(err2);
          resolve();
        });
      });
    });
  });
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/resources', (req, res) => {
  const sql = `SELECT r.id, r.name, c.name as category,
      (SELECT price FROM prices WHERE resource_id = r.id AND quantity = 1 ORDER BY created_at DESC LIMIT 1) as p1,
      (SELECT price FROM prices WHERE resource_id = r.id AND quantity = 10 ORDER BY created_at DESC LIMIT 1) as p10,
      (SELECT price FROM prices WHERE resource_id = r.id AND quantity = 100 ORDER BY created_at DESC LIMIT 1) as p100,
      (SELECT price FROM prices WHERE resource_id = r.id AND quantity = 1000 ORDER BY created_at DESC LIMIT 1) as p1000
    FROM resources r
    LEFT JOIN categories c ON r.category_id = c.id
    ORDER BY c.name, r.name`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = rows.map(r => ({
      id: r.id,
      name: r.name,
      category: r.category,
      prices: { 1: r.p1, 10: r.p10, 100: r.p100, 1000: r.p1000 }
    }));
    res.json(formatted);
  });
});

app.post('/api/resources', (req, res) => {
  const { name, category } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Missing fields' });
  db.serialize(() => {
    db.run(`INSERT OR IGNORE INTO categories(name) VALUES (?)`, [category]);
    db.get(`SELECT id FROM categories WHERE name = ?`, [category], (err, cat) => {
      if (err) return res.status(500).json({ error: err.message });
      db.run(`INSERT OR IGNORE INTO resources(name, category_id) VALUES (?, ?)`, [name, cat.id], function (err2) {
        if (err2) return res.status(500).json({ error: err2.message });
        db.get(`SELECT id FROM resources WHERE name = ?`, [name], (err3, resource) => {
          if (err3) return res.status(500).json({ error: err3.message });
          res.json({ id: resource.id });
        });
      });
    });
  });
});

app.post('/api/prices', (req, res) => {
  const { resource_id, quantity, price } = req.body;
  if (!resource_id || !quantity || price == null) return res.status(400).json({ error: 'Missing fields' });
  db.run(`INSERT INTO prices(resource_id, quantity, price) VALUES (?, ?, ?)`, [resource_id, quantity, price], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.get('/api/prices/:id/:qty', (req, res) => {
  const { id, qty } = req.params;
  db.all(`SELECT price, created_at FROM prices WHERE resource_id = ? AND quantity = ? ORDER BY created_at`, [id, qty], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = { app, initDb };

if (require.main === module) {
  initDb().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server running on ${port}`));
  }).catch(err => {
    console.error('Failed to init db', err);
  });
}

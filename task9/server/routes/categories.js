const express = require('express');
const db = require('../db');
const { validateCategory } = require('../validation');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT id, name, type FROM categories ORDER BY type, name').all();
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось получить список категорий' });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const error = validateCategory(body);
    if (error) {
      return res.status(400).json({ error });
    }

    const name = body.name.trim();
    const duplicate = db
      .prepare('SELECT id FROM categories WHERE lower(name) = lower(?) AND type = ?')
      .get(name, body.type);
    if (duplicate) {
      return res.status(400).json({ error: 'Такая категория уже существует' });
    }

    const result = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)').run(name, body.type);
    const category = db
      .prepare('SELECT id, name, type FROM categories WHERE id = ?')
      .get(Number(result.lastInsertRowid));
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось создать категорию' });
  }
});

module.exports = router;

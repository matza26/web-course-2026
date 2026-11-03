const express = require('express');
const db = require('../db');
const { parseId, validateTransaction, validateFilters } = require('../validation');

const router = express.Router();

const SELECT_TRANSACTIONS = `
  SELECT t.id, t.amount, t.category_id, t.date, t.comment,
         c.name AS category_name, c.type
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
`;

function findTransaction(id) {
  return db.prepare(`${SELECT_TRANSACTIONS} WHERE t.id = ?`).get(id);
}

function normalizeComment(comment) {
  if (typeof comment !== 'string') {
    return null;
  }
  const trimmed = comment.trim();
  return trimmed === '' ? null : trimmed;
}

router.get('/', (req, res) => {
  try {
    const error = validateFilters(req.query);
    if (error) {
      return res.status(400).json({ error });
    }

    const { category_id: categoryId, type, from, to } = req.query;
    const conditions = [];
    const params = [];

    if (categoryId !== undefined) {
      conditions.push('t.category_id = ?');
      params.push(Number(categoryId));
    }
    if (type !== undefined) {
      conditions.push('c.type = ?');
      params.push(type);
    }
    if (from !== undefined) {
      conditions.push('t.date >= ?');
      params.push(from);
    }
    if (to !== undefined) {
      conditions.push('t.date <= ?');
      params.push(to);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `${SELECT_TRANSACTIONS} ${where} ORDER BY t.date DESC, t.id DESC`;
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось получить список операций' });
  }
});

router.post('/', (req, res) => {
  try {
    const body = req.body || {};
    const error = validateTransaction(body, db);
    if (error) {
      return res.status(400).json({ error });
    }

    const result = db
      .prepare('INSERT INTO transactions (amount, category_id, date, comment) VALUES (?, ?, ?, ?)')
      .run(body.amount, Number(body.category_id), body.date, normalizeComment(body.comment));
    res.status(201).json(findTransaction(Number(result.lastInsertRowid)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось создать операцию' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Некорректный id операции' });
    }

    const existing = findTransaction(id);
    if (!existing) {
      return res.status(404).json({ error: `Операция с id ${id} не найдена` });
    }

    const body = req.body || {};
    const updated = {
      amount: body.amount !== undefined ? body.amount : existing.amount,
      category_id: body.category_id !== undefined ? body.category_id : existing.category_id,
      date: body.date !== undefined ? body.date : existing.date,
      comment: body.comment !== undefined ? body.comment : existing.comment,
    };

    const error = validateTransaction(updated, db);
    if (error) {
      return res.status(400).json({ error });
    }

    db.prepare('UPDATE transactions SET amount = ?, category_id = ?, date = ?, comment = ? WHERE id = ?').run(
      updated.amount,
      Number(updated.category_id),
      updated.date,
      normalizeComment(updated.comment),
      id
    );
    res.json(findTransaction(id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось обновить операцию' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Некорректный id операции' });
    }

    const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: `Операция с id ${id} не найдена` });
    }
    res.json({ id, deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось удалить операцию' });
  }
});

module.exports = router;

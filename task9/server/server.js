const express = require('express');
const cors = require('cors');
const categoriesRouter = require('./routes/categories');
const transactionsRouter = require('./routes/transactions');

const PORT = 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.use('/categories', categoriesRouter);
app.use('/transactions', transactionsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Маршрут ${req.method} ${req.path} не найден` });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Тело запроса должно быть корректным JSON' });
  }
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Сервер Zen-Money запущен: http://localhost:${PORT}`);
});

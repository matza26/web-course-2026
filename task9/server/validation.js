const TYPES = ['income', 'expense'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NAME_LENGTH = 50;
const MAX_COMMENT_LENGTH = 300;

function isValidType(value) {
  return TYPES.includes(value);
}

function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateCategory(body) {
  const { name, type } = body;
  if (typeof name !== 'string' || name.trim() === '') {
    return 'Название категории обязательно';
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return `Название категории не должно быть длиннее ${MAX_NAME_LENGTH} символов`;
  }
  if (!isValidType(type)) {
    return 'Тип категории должен быть income или expense';
  }
  return null;
}

function validateTransaction(data, db) {
  const { amount, category_id: categoryId, date, comment } = data;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    return 'Сумма должна быть числом больше 0';
  }
  if (parseId(categoryId) === null) {
    return 'Не указана категория';
  }
  const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(Number(categoryId));
  if (!category) {
    return `Категория с id ${categoryId} не существует`;
  }
  if (!isValidDate(date)) {
    return 'Дата должна быть в формате ГГГГ-ММ-ДД';
  }
  if (comment !== undefined && comment !== null && typeof comment !== 'string') {
    return 'Комментарий должен быть строкой';
  }
  if (typeof comment === 'string' && comment.length > MAX_COMMENT_LENGTH) {
    return `Комментарий не должен быть длиннее ${MAX_COMMENT_LENGTH} символов`;
  }
  return null;
}

function validateFilters(query) {
  const { category_id: categoryId, type, from, to } = query;
  if (categoryId !== undefined && parseId(categoryId) === null) {
    return 'Параметр category_id должен быть положительным целым числом';
  }
  if (type !== undefined && !isValidType(type)) {
    return 'Параметр type должен быть income или expense';
  }
  if (from !== undefined && !isValidDate(from)) {
    return 'Параметр from должен быть датой в формате ГГГГ-ММ-ДД';
  }
  if (to !== undefined && !isValidDate(to)) {
    return 'Параметр to должен быть датой в формате ГГГГ-ММ-ДД';
  }
  if (from !== undefined && to !== undefined && from > to) {
    return 'Дата from не может быть позже даты to';
  }
  return null;
}

module.exports = {
  parseId,
  validateCategory,
  validateTransaction,
  validateFilters,
};

import * as api from './api.js';
import * as ui from './ui.js';

const FILTERS_KEY = 'zen-money-filters';
const THEME_KEY = 'zen-money-theme';

const transactionForm = document.getElementById('transaction-form');
const categoryForm = document.getElementById('category-form');
const filterForm = document.getElementById('filter-form');
const cancelButton = document.getElementById('cancel-edit');
const resetButton = document.getElementById('reset-filters');
const themeToggle = document.getElementById('theme-toggle');
const transactionsBody = document.getElementById('transactions-body');

const state = {
  categories: [],
  transactions: [],
  editingId: null,
  theme: 'light',
};

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (err) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.warn('localStorage недоступен');
  }
}

function getFilters() {
  return {
    type: filterForm.elements.type.value,
    category_id: filterForm.elements.category_id.value,
    from: filterForm.elements.from.value,
    to: filterForm.elements.to.value,
  };
}

function setFilters(filters) {
  filterForm.elements.type.value = filters.type || '';
  renderFilterCategories();
  filterForm.elements.category_id.value = filters.category_id || '';
  filterForm.elements.from.value = filters.from || '';
  filterForm.elements.to.value = filters.to || '';
}

function renderFormCategories() {
  ui.renderCategoryOptions(transactionForm.elements.category_id, state.categories, transactionForm.elements.type.value);
}

function renderFilterCategories() {
  ui.renderCategoryOptions(filterForm.elements.category_id, state.categories, filterForm.elements.type.value);
}

async function loadCategories() {
  try {
    state.categories = await api.getCategories();
    renderFormCategories();
    renderFilterCategories();
  } catch (err) {
    ui.showMessage(err.message);
  }
}

async function loadTransactions() {
  ui.setLoading(true);
  try {
    state.transactions = await api.getTransactions(getFilters());
    ui.renderTransactions(state.transactions, state.editingId);
    ui.renderSummary(state.transactions);
  } catch (err) {
    ui.showMessage(err.message);
  } finally {
    ui.setLoading(false);
  }
}

function resetTransactionForm() {
  state.editingId = null;
  transactionForm.reset();
  ui.clearInvalid(transactionForm);
  transactionForm.elements.date.value = ui.todayIso();
  renderFormCategories();
  ui.setEditMode(false);
  ui.renderTransactions(state.transactions, null);
}

function readTransactionForm() {
  const { amount, category_id: categoryId, date, comment } = transactionForm.elements;
  const invalid = [];
  const errors = [];
  const amountValue = Number(amount.value);

  if (amount.value.trim() === '' || !Number.isFinite(amountValue) || amountValue <= 0) {
    invalid.push(amount);
    errors.push('сумма должна быть больше 0');
  }
  if (categoryId.value === '') {
    invalid.push(categoryId);
    errors.push('выберите категорию');
  }
  if (date.value === '') {
    invalid.push(date);
    errors.push('укажите дату');
  }

  return {
    invalid,
    errors,
    data: {
      amount: Math.round(amountValue * 100) / 100,
      category_id: Number(categoryId.value),
      date: date.value,
      comment: comment.value.trim(),
    },
  };
}

async function handleTransactionSubmit(event) {
  event.preventDefault();
  ui.clearInvalid(transactionForm);

  const { invalid, errors, data } = readTransactionForm();
  if (errors.length > 0) {
    ui.markInvalid(invalid);
    ui.showMessage(`Проверьте форму: ${errors.join(', ')}`);
    return;
  }

  try {
    if (state.editingId !== null) {
      await api.updateTransaction(state.editingId, data);
      ui.showMessage('Операция обновлена', 'success');
    } else {
      await api.createTransaction(data);
      ui.showMessage('Операция добавлена', 'success');
    }
    resetTransactionForm();
    await loadTransactions();
  } catch (err) {
    ui.showMessage(err.message);
  }
}

function startEdit(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) {
    return;
  }

  state.editingId = id;
  ui.clearInvalid(transactionForm);
  transactionForm.elements.type.value = transaction.type;
  renderFormCategories();
  transactionForm.elements.amount.value = transaction.amount;
  transactionForm.elements.category_id.value = String(transaction.category_id);
  transactionForm.elements.date.value = transaction.date;
  transactionForm.elements.comment.value = transaction.comment || '';
  ui.setEditMode(true);
  ui.renderTransactions(state.transactions, id);
  transactionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  transactionForm.elements.amount.focus({ preventScroll: true });
}

async function removeTransaction(id) {
  if (!confirm('Удалить операцию?')) {
    return;
  }
  try {
    await api.deleteTransaction(id);
    if (state.editingId === id) {
      resetTransactionForm();
    }
    ui.showMessage('Операция удалена', 'success');
    await loadTransactions();
  } catch (err) {
    ui.showMessage(err.message);
  }
}

function handleTableClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    return;
  }
  const id = Number(button.dataset.id);
  if (button.dataset.action === 'edit') {
    startEdit(id);
  } else if (button.dataset.action === 'delete') {
    removeTransaction(id);
  }
}

async function handleCategorySubmit(event) {
  event.preventDefault();
  ui.clearInvalid(categoryForm);

  const nameField = categoryForm.elements.name;
  const name = nameField.value.trim();
  const type = categoryForm.elements.type.value;

  if (name === '') {
    ui.markInvalid([nameField]);
    ui.showMessage('Введите название категории');
    return;
  }

  try {
    const category = await api.createCategory({ name, type });
    categoryForm.reset();
    await loadCategories();
    ui.showMessage(`Категория «${category.name}» создана`, 'success');
  } catch (err) {
    ui.showMessage(err.message);
  }
}

async function handleFilterSubmit(event) {
  event.preventDefault();
  ui.clearInvalid(filterForm);

  const filters = getFilters();
  if (filters.from && filters.to && filters.from > filters.to) {
    ui.markInvalid([filterForm.elements.from, filterForm.elements.to]);
    ui.showMessage('Дата «С даты» не может быть позже даты «По дату»');
    return;
  }

  ui.hideMessage();
  writeStorage(FILTERS_KEY, filters);
  await loadTransactions();
}

async function handleFilterReset() {
  ui.clearInvalid(filterForm);
  setFilters({});
  writeStorage(FILTERS_KEY, null);
  ui.hideMessage();
  await loadTransactions();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  ui.applyTheme(state.theme);
  writeStorage(THEME_KEY, state.theme);
}

async function init() {
  state.theme = readStorage(THEME_KEY) === 'dark' ? 'dark' : 'light';
  ui.applyTheme(state.theme);
  transactionForm.elements.date.value = ui.todayIso();

  transactionForm.addEventListener('submit', handleTransactionSubmit);
  transactionForm.elements.type.addEventListener('change', renderFormCategories);
  cancelButton.addEventListener('click', resetTransactionForm);
  categoryForm.addEventListener('submit', handleCategorySubmit);
  filterForm.addEventListener('submit', handleFilterSubmit);
  filterForm.elements.type.addEventListener('change', renderFilterCategories);
  resetButton.addEventListener('click', handleFilterReset);
  transactionsBody.addEventListener('click', handleTableClick);
  themeToggle.addEventListener('click', toggleTheme);

  await loadCategories();
  const savedFilters = readStorage(FILTERS_KEY);
  if (savedFilters && typeof savedFilters === 'object') {
    setFilters(savedFilters);
  }
  await loadTransactions();
}

init();

const messageBox = document.getElementById('message');
const loading = document.getElementById('loading');
const empty = document.getElementById('empty');
const table = document.getElementById('transactions-table');
const tableBody = document.getElementById('transactions-body');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelButton = document.getElementById('cancel-edit');
const themeToggle = document.getElementById('theme-toggle');

let messageTimer = null;

export function formatMoney(value) {
  return value.toFixed(2);
}

export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

export function todayIso() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export function showMessage(text, kind = 'error') {
  clearTimeout(messageTimer);
  messageBox.textContent = text;
  messageBox.className = `message message--${kind}`;
  messageBox.hidden = false;
  if (kind === 'success') {
    messageTimer = setTimeout(hideMessage, 3000);
  }
}

export function hideMessage() {
  clearTimeout(messageTimer);
  messageBox.hidden = true;
  messageBox.textContent = '';
}

export function setLoading(isLoading) {
  loading.hidden = !isLoading;
}

export function renderSummary(transactions) {
  let income = 0;
  let expense = 0;
  transactions.forEach((transaction) => {
    if (transaction.type === 'income') {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }
  });
  document.getElementById('total-income').textContent = formatMoney(income);
  document.getElementById('total-expense').textContent = formatMoney(expense);
  document.getElementById('total-balance').textContent = formatMoney(income - expense);
}

export function renderCategoryOptions(select, categories, type, emptyLabel = '') {
  const currentValue = select.value;
  select.replaceChildren();

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = emptyLabel;
  select.append(placeholder);

  categories
    .filter((category) => !type || category.type === type)
    .forEach((category) => {
      const option = document.createElement('option');
      option.value = String(category.id);
      option.textContent = category.name;
      select.append(option);
    });

  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function createButton(text, action, id, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button button--outline button--small ${extraClass}`.trim();
  button.textContent = text;
  button.dataset.action = action;
  button.dataset.id = String(id);
  return button;
}

function createRow(transaction, editingId) {
  const row = document.createElement('tr');
  row.className = `row--${transaction.type}`;
  if (transaction.id === editingId) {
    row.classList.add('row--editing');
  }

  const dateCell = document.createElement('td');
  dateCell.textContent = formatDate(transaction.date);

  const categoryCell = document.createElement('td');
  categoryCell.textContent = transaction.category_name;

  const commentCell = document.createElement('td');
  commentCell.textContent = transaction.comment || '—';

  const amountCell = document.createElement('td');
  const sign = transaction.type === 'income' ? '+' : '−';
  amountCell.className = `table__amount amount--${transaction.type}`;
  amountCell.textContent = `${sign}${formatMoney(transaction.amount)}`;

  const actionsCell = document.createElement('td');
  const actions = document.createElement('div');
  actions.className = 'table__actions';
  actions.append(
    createButton('Изменить', 'edit', transaction.id),
    createButton('Удалить', 'delete', transaction.id, 'button--danger')
  );
  actionsCell.append(actions);

  row.append(dateCell, categoryCell, commentCell, amountCell, actionsCell);
  return row;
}

export function renderTransactions(transactions, editingId = null) {
  tableBody.replaceChildren(...transactions.map((transaction) => createRow(transaction, editingId)));
  table.hidden = transactions.length === 0;
  empty.hidden = transactions.length !== 0;
}

export function setEditMode(isEditing) {
  formTitle.textContent = isEditing ? 'Редактирование операции' : 'Новая операция';
  submitButton.textContent = isEditing ? 'Сохранить' : 'Добавить';
  cancelButton.hidden = !isEditing;
}

export function markInvalid(fields) {
  fields.forEach((field) => field.classList.add('invalid'));
  if (fields.length > 0) {
    fields[0].focus();
  }
}

export function clearInvalid(form) {
  form.querySelectorAll('.invalid').forEach((field) => field.classList.remove('invalid'));
}

export function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? 'Светлая тема' : 'Тёмная тема';
}

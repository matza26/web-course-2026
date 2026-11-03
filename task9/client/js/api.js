const BASE_URL = 'http://localhost:3001';

async function request(path, options = {}) {
  const config = { method: options.method || 'GET', headers: {} };
  if (options.body !== undefined) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, config);
  } catch (err) {
    throw new Error('Нет связи с сервером. Проверьте, что он запущен на http://localhost:3001');
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const reason = data && data.error ? data.error : 'неизвестная ошибка';
    throw new Error(`Ошибка ${response.status}: ${reason}`);
  }

  return data;
}

export async function getCategories() {
  return request('/categories');
}

export async function createCategory(category) {
  return request('/categories', { method: 'POST', body: category });
}

export async function getTransactions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return request(query ? `/transactions?${query}` : '/transactions');
}

export async function createTransaction(transaction) {
  return request('/transactions', { method: 'POST', body: transaction });
}

export async function updateTransaction(id, transaction) {
  return request(`/transactions/${id}`, { method: 'PUT', body: transaction });
}

export async function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: 'DELETE' });
}

const API_URL = 'https://jsonplaceholder.typicode.com/posts';
const PAGE_SIZE = 10;
const DEBOUNCE_DELAY = 300;

const state = {
  posts: [],
  query: '',
  isLoading: false,
  hasMore: true,
  hasError: false,
};

const postsEl = document.getElementById('posts');
const searchEl = document.getElementById('search');
const counterEl = document.getElementById('counter');
const emptyEl = document.getElementById('empty');
const loaderEl = document.getElementById('loader');
const errorEl = document.getElementById('error');
const errorTextEl = document.getElementById('error-text');
const retryEl = document.getElementById('retry');
const endEl = document.getElementById('end');
const sentinelEl = document.getElementById('sentinel');

let debounceTimer = null;
let observer = null;

async function loadNextPage() {
  if (state.isLoading || !state.hasMore || state.hasError) {
    return;
  }

  state.isLoading = true;
  updateStatus();

  try {
    const start = state.posts.length;
    const response = await fetch(`${API_URL}?_start=${start}&_limit=${PAGE_SIZE}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const batch = await response.json();
    state.posts.push(...batch);

    if (batch.length < PAGE_SIZE) {
      state.hasMore = false;
    }
  } catch (error) {
    state.hasError = true;
    errorTextEl.textContent = getErrorMessage(error);
  } finally {
    state.isLoading = false;
  }

  render();
  updateStatus();
  recheckSentinel();
}

function getErrorMessage(error) {
  if (error instanceof TypeError) {
    return 'Не удалось связаться с сервером. Проверьте подключение к интернету и попробуйте снова.';
  }
  if (error.message.startsWith('HTTP')) {
    return `Сервер вернул ошибку (${error.message}). Попробуйте повторить запрос позже.`;
  }
  return 'Не удалось загрузить посты. Попробуйте ещё раз.';
}

function getFilteredPosts() {
  if (!state.query) {
    return state.posts;
  }
  return state.posts.filter((post) => post.title.toLowerCase().includes(state.query));
}

function highlight(text, query) {
  const fragment = document.createDocumentFragment();

  if (!query) {
    fragment.append(text);
    return fragment;
  }

  const lowerText = text.toLowerCase();
  let position = 0;
  let index = lowerText.indexOf(query, position);

  while (index !== -1) {
    if (index > position) {
      fragment.append(text.slice(position, index));
    }

    const mark = document.createElement('mark');
    mark.className = 'highlight';
    mark.textContent = text.slice(index, index + query.length);
    fragment.append(mark);

    position = index + query.length;
    index = lowerText.indexOf(query, position);
  }

  if (position < text.length) {
    fragment.append(text.slice(position));
  }

  return fragment;
}

function createCard(post) {
  const card = document.createElement('article');
  card.className = 'card';

  const author = document.createElement('p');
  author.className = 'card__author';
  author.textContent = `Автор: ${post.userId}`;

  const title = document.createElement('h2');
  title.className = 'card__title';
  title.append(highlight(post.title, state.query));

  const body = document.createElement('p');
  body.className = 'card__body';
  body.textContent = post.body;

  card.append(author, title, body);
  return card;
}

function render() {
  const filtered = getFilteredPosts();
  const cards = filtered.map(createCard);
  postsEl.replaceChildren(...cards);

  counterEl.textContent = `Загружено: ${state.posts.length}, показано: ${filtered.length}`;
}

function updateStatus() {
  const filtered = getFilteredPosts();

  loaderEl.hidden = !state.isLoading;
  errorEl.hidden = !state.hasError;
  endEl.hidden = state.hasMore || state.hasError || state.isLoading;
  emptyEl.hidden = !(
    state.posts.length > 0 &&
    filtered.length === 0 &&
    !state.isLoading
  );
}

function setupObserver() {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadNextPage();
      }
    },
    { rootMargin: '0px 0px 200px 0px' }
  );
  observer.observe(sentinelEl);
}

function recheckSentinel() {
  if (!observer) {
    return;
  }
  observer.unobserve(sentinelEl);
  observer.observe(sentinelEl);
}

function handleSearchInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.query = searchEl.value.trim().toLowerCase();
    render();
    updateStatus();
    recheckSentinel();
  }, DEBOUNCE_DELAY);
}

searchEl.addEventListener('input', handleSearchInput);

retryEl.addEventListener('click', () => {
  state.hasError = false;
  loadNextPage();
});

setupObserver();

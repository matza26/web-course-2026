# Zen-Money — сервер (Express + SQLite)

REST API для учёта доходов и расходов. Данные хранятся в SQLite (`database.sqlite`).

## Установка и запуск

```bash
cd task8-9/server
npm install
npm start
```

Сервер стартует на `http://localhost:3001` (то же самое — `node server.js`).

## База данных

Файл `database.sqlite` создаётся автоматически при первом запуске сервера (`db.js`): создаются таблицы `categories` и `transactions` (`CREATE TABLE IF NOT EXISTS`), а если таблица категорий пустая — добавляются стартовые категории «Еда», «Транспорт» (expense) и «Зарплата» (income). Файл базы не коммитится (см. `.gitignore`).

## Структура

- `server.js` — точка входа: `cors()`, `express.json()`, подключение роутов, обработка 404 и некорректного JSON
- `db.js` — подключение к SQLite, создание таблиц, стартовые категории
- `validation.js` — серверная валидация тела запроса и query-параметров
- `routes/categories.js` — `GET /categories`, `POST /categories`
- `routes/transactions.js` — `GET /transactions`, `POST /transactions`, `PUT /transactions/:id`, `DELETE /transactions/:id`

## API

| Метод | Роут | Что делает | Статусы |
|---|---|---|---|
| GET | `/categories` | все категории | 200 |
| POST | `/categories` | создать категорию (`name`, `type`: `income`/`expense`) | 201, 400 |
| GET | `/transactions` | все операции; фильтры `?category_id=`, `?type=`, `?from=&to=` (SQL `WHERE`) | 200, 400 |
| POST | `/transactions` | создать операцию (`amount` > 0, существующий `category_id`, `date` ГГГГ-ММ-ДД, `comment`) | 201, 400 |
| PUT | `/transactions/:id` | обновить операцию (можно передать только изменяемые поля) | 200, 400, 404 |
| DELETE | `/transactions/:id` | удалить операцию | 200, 404 |

При ошибке сервер всегда отвечает JSON вида `{ "error": "..." }`, при внутренней ошибке — статус 500.

## Лог проверки через curl

```
$ curl http://localhost:3001/categories
[{"id":1,"name":"Еда","type":"expense"},{"id":2,"name":"Транспорт","type":"expense"},{"id":3,"name":"Зарплата","type":"income"}]
[HTTP 200]

$ curl -X POST http://localhost:3001/categories -H 'Content-Type: application/json' -d '{"name":"Подработка","type":"income"}'
{"id":4,"name":"Подработка","type":"income"}
[HTTP 201]

$ curl -X POST http://localhost:3001/categories -H 'Content-Type: application/json' -d '{"name":"","type":"other"}'
{"error":"Название категории обязательно"}
[HTTP 400]

$ curl -X POST http://localhost:3001/transactions -H 'Content-Type: application/json' -d '{"amount":50000,"category_id":3,"date":"2026-11-01","comment":"Аванс"}'
{"id":1,"amount":50000,"category_id":3,"date":"2026-11-01","comment":"Аванс","category_name":"Зарплата","type":"income"}
[HTTP 201]

$ curl -X POST http://localhost:3001/transactions -H 'Content-Type: application/json' -d '{"amount":1250.5,"category_id":1,"date":"2026-11-02","comment":"Продукты"}'
{"id":2,"amount":1250.5,"category_id":1,"date":"2026-11-02","comment":"Продукты","category_name":"Еда","type":"expense"}
[HTTP 201]

$ curl -X POST http://localhost:3001/transactions -H 'Content-Type: application/json' -d '{"amount":-5,"category_id":1,"date":"2026-11-02"}'
{"error":"Сумма должна быть числом больше 0"}
[HTTP 400]

$ curl -X POST http://localhost:3001/transactions -H 'Content-Type: application/json' -d '{"amount":100,"category_id":999,"date":"2026-11-02"}'
{"error":"Категория с id 999 не существует"}
[HTTP 400]

$ curl http://localhost:3001/transactions
[{"id":2,"amount":1250.5,"category_id":1,"date":"2026-11-02","comment":"Продукты","category_name":"Еда","type":"expense"},{"id":1,"amount":50000,"category_id":3,"date":"2026-11-01","comment":"Аванс","category_name":"Зарплата","type":"income"}]
[HTTP 200]

$ curl 'http://localhost:3001/transactions?type=expense&from=2026-11-01&to=2026-11-30'
[{"id":2,"amount":1250.5,"category_id":1,"date":"2026-11-02","comment":"Продукты","category_name":"Еда","type":"expense"}]
[HTTP 200]

$ curl 'http://localhost:3001/transactions?category_id=3'
[{"id":1,"amount":50000,"category_id":3,"date":"2026-11-01","comment":"Аванс","category_name":"Зарплата","type":"income"}]
[HTTP 200]

$ curl 'http://localhost:3001/transactions?type=abc'
{"error":"Параметр type должен быть income или expense"}
[HTTP 400]

$ curl -X PUT http://localhost:3001/transactions/2 -H 'Content-Type: application/json' -d '{"amount":1300,"comment":"Продукты на неделю"}'
{"id":2,"amount":1300,"category_id":1,"date":"2026-11-02","comment":"Продукты на неделю","category_name":"Еда","type":"expense"}
[HTTP 200]

$ curl -X PUT http://localhost:3001/transactions/999 -H 'Content-Type: application/json' -d '{"amount":10}'
{"error":"Операция с id 999 не найдена"}
[HTTP 404]

$ curl -X DELETE http://localhost:3001/transactions/1
{"id":1,"deleted":true}
[HTTP 200]

$ curl -X DELETE http://localhost:3001/transactions/999
{"error":"Операция с id 999 не найдена"}
[HTTP 404]

```

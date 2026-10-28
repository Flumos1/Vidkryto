# Vidkryto — аналітика публічних закупівель

**Репозиторій:** https://github.com/Flumos1/Vidkryto

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Flumos1/Vidkryto)

Незалежна аналітична платформа для публічних закупівель України: пошук процедур
ProZorro, аналітика ринку, цінові бенчмарки, профілі компаній, збережені пошуки,
експорт та REST API.

Дизайн і код — оригінальні. Дані — з відкритих джерел (ProZorro, data.gov.ua).

## Можливості

- **Закупівлі** — повнотекстовий пошук, фільтри (статус, регіон, КПВ, метод, сума, дати),
  сортування, таблиця/картки, пагінація, експорт CSV та XLSX.
- **Картка закупівлі** — позиції, учасники, переможці, документи, скарги, хронологія,
  схожі процедури.
- **Компанії** — реєстр замовників і постачальників, профіль з історією, win rate,
  структурою КПВ і контрагентами.
- **Аналітика** — KPI, динаміка, регіони, КПВ, статуси, топ-замовники й постачальники.
- **Ціни** — середня знижка та економія за категоріями КПВ, бенчмарки.
- **Аукціони** — каталог лотів ProZorro.Продажі (демо-режим без токена).
- **Акаунти** — реєстрація/вхід, scrypt-хеші, підписана сесія, демо-доступ.
- **Підписки** — збережені пошуки, сповіщення про нові закупівлі.
- **API** — `/api/v1/*`, ключі, ліміти, CORS, документація `/api-docs`.
- **UX** — темна/світла тема, ⌘K-палітра, адаптив, доступність.

## Швидкий старт

Потрібен Node.js 22+ (використовується вбудований `node:sqlite`).

```bash
npm install
npm run seed      # завантажити ~6000 реальних закупівель з ProZorro (~3–5 хв)
npm run dev       # http://localhost:3000
```

Якщо база вже є (`data/clarity.db`), достатньо `npm run dev`.

Демо-акаунт: `demo@vidkryto.ua` / `demo1234` (створюється при першому вході).

## Скрипти

| Команда | Дія |
|---|---|
| `npm run dev` | dev-сервер |
| `npm run build` | production-збірка |
| `npm start` | запуск збірки |
| `npm run seed [pages]` | оновлення знімка даних (100 закупівель на сторінку) |
| `npm run typecheck` | перевірка типів |
| `npm run lint` | ESLint |
| `npm test` | юніт-тести (node:test) |

## Змінні середовища

Створіть `.env.local`:

```bash
SITE_URL=http://localhost:3000
AUTH_SECRET=change-me-to-a-long-random-string
DB_FILE=./data/clarity.db
# PROZORRO_SALE_TOKEN=...   # для живих аукціонів ProZorro.Продажі
```

## Структура

```
app/                 маршрути (App Router)
  tenders/           пошук і картка закупівлі
  companies/         реєстр і профілі
  analytics/ prices/ auctions/
  dashboard/         кабінет, підписки
  api/               REST: v1, auth, export, sync, search
components/          UI, графіки, палітра, форми
lib/                 БД, запити, формат, auth, ingest, API-хелпери
scripts/seed.mjs     завантаження даних з ProZorro
data/clarity.db      SQLite-знімок (створюється сідом)
```

## Деплой на Netlify Drop

Готовий архів: `dist/vidkryto-netlify.zip` (~15 МБ).

1. Відкрийте [app.netlify.com/drop](https://app.netlify.com/drop).
2. Перетягніть zip-архів (не розпаковуйте). Netlify виконає
   `node scripts/assemble-db.mjs && npm run build`.
3. Дочекайтеся збірки та отримайте URL `*.netlify.app`.
4. За бажанням задайте `AUTH_SECRET` у Site settings → Environment variables.

Як це працює: база розбита на частини `data/clarity.db.partNN` (менше 10 МБ),
які складаються під час збірки. На serverless диск доступний лише для читання,
тому застосунок копіює БД у `/tmp` і працює з копією.

Обмеження Netlify: записи (реєстрація, підписки, синхронізація) живуть у `/tmp`
конкретного інстансу й можуть скидатися після cold start. Для постійного
зберігання використовуйте Railway/Render/VPS або Turso.

Повний сайт на VPS: `npm ci && npm run seed && npm run build && npm start`.

## Постійна база даних (Railway / Render / Docker / VPS)

Netlify та інші serverless-платформи не дають постійного диска. Для повноцінної
роботи з реєстрацією, підписками та синхронізацією розгорніть застосунок там,
де є volume.

### Railway

1. Створіть проєкт з GitHub-репозиторію `Flumos1/Vidkryto`.
2. Додайте volume з mount path `/data`.
3. Змінні: `DB_FILE=/data/clarity.db`, `AUTH_SECRET=<довгий випадковий рядок>`.
4. Build/start беруться з `railway.toml`; перший запуск скопіює знімок у volume.

### Render

Імпортуйте репозиторій — `render.yaml` створить web-сервіс із диском 1 GB,
змінними `DB_FILE=/data/clarity.db` та згенерованим `AUTH_SECRET`.

### Docker / VPS

```bash
docker compose up -d --build
```

або без Docker на сервері:

```bash
npm install
node scripts/assemble-db.mjs
npm run build
DB_FILE=/var/lib/vidkryto/clarity.db node scripts/init-db.mjs
DB_FILE=/var/lib/vidkryto/clarity.db PORT=3000 npm start
```

Health-check: `GET /api/health` повертає кількість закупівель, компаній і дату
знімка. Резервна копія — файл `clarity.db` (зупиніть застосунок або виконайте
`sqlite3 clarity.db ".backup backup.db"`).

## Санкційний перелік (data.gov.ua)

Імпорт побудований на CKAN API:

```bash
npm run ingest:sanctions
```

Кроки: `package_show` → останній XLSX-ресурс → посилання на XML → парсинг →
таблиці `sanctions` та `ingest_runs`. Записів: 1 014 (724 особи, 290 організацій).

- Сторінка: `/sanctions` (пошук, фільтр за типом).
- Картка компанії: блок «Санкційна перевірка» (збіг за нормалізованою назвою).
- Health: `GET /api/health` повертає `sanctions`.
- Cron на Railway/VPS: `node scripts/ingest-sanctions.mjs` раз на добу.

Обмеження: перелік Держфінмоніторингу не містить ЄДРПОУ, тому зіставлення йде
за назвою. Це індикатор, а не юридичний висновок.

## Дані та обмеження

- Безкоштовний API ProZorro не підтримує фільтри за датами, тому знімок формується з
  останніх процедур за `dateModified`. Вибірка не є повною історією ринку.
- Закриті реєстри (ЄДР, судові рішення, АМКУ) підключені як каталог джерел; для
  продакшену потрібні офіційні договори з API.
- Платежі не проводяться: тарифи — інтерфейс, готова точка інтеграції.
- Проєкт не пов'язаний із ProZorro чи Clarity Project; усі торгові марки належать
  правовласникам.

## Ліцензія

Код — MIT (використовуйте вільно). Дані — згідно з ліцензіями першоджерел.

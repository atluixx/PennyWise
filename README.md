<p align="center">
  <img src="src/main/resources/static/images/penny-wise-transparent.png" alt="PennyWise logo" width="180">
</p>

# PennyWise: personal finance, kept local

PennyWise is a personal finance tracker built with Java and Spring Boot. Record your income and expenses by hand, organize them into categories, and see where your money went each month. The browser interface and REST API run on your computer.

## Features

- **Manual transactions:** create, edit, and delete income and expenses.
- **Categories:** organize transactions and review totals by category.
- **Monthly summaries:** see income, expenses, and balance for a selected month.
- **Private accounts:** sign in with a JWT; users can access only their own records.
- **Safe retries:** an optional idempotency key prevents duplicate transaction creation on a single application instance.
- **Local persistence:** use PostgreSQL with Docker or file-based H2 with Maven.

> **Currency limitation:** PennyWise currently assumes one currency. Do not combine euros and reais in the same database: amounts are not converted or separated by currency. The app does not connect to banks.

---

## Quick start with Docker

You need Docker, Docker Compose, and OpenSSL. In the project directory, create `.env` **once**:

```sh
printf 'POSTGRES_USER=pennywise\nPOSTGRES_PASSWORD=%s\nPENNYWISE_JWT_SECRET=%s\n' \
  "$(openssl rand -hex 24)" "$(openssl rand -base64 32)" > .env
```

Keep `.env` private and back it up securely. Run the app:

```sh
docker compose up --build
```

Visit [http://localhost:8080](http://localhost:8080), create an account, and add a category before recording a transaction.

To stop the app, press `Ctrl+C` and run `docker compose down`. The PostgreSQL volume persists across restarts. **Do not use `docker compose down -v` unless you want to delete your database.** Changing the JWT secret invalidates existing tokens. Changing the PostgreSQL password in `.env` does not change the password already stored in an initialized database volume.

## Run with Java and Maven

Install Java 21, Maven, and OpenSSL:

```sh
export PENNYWISE_JWT_SECRET="$(openssl rand -base64 32)"
mvn spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080). The local H2 database is stored in `./data/`; keep and back up that directory. Save the signing secret securely if you need existing tokens to remain valid across restarts. Maven and Docker use separate databases.

## How it works

1. Register and sign in.
2. Create categories such as Salary or Groceries.
3. Add income and expenses with an amount, category, and date.
4. Choose a month to review your transactions and balance.

## REST API

Log in via `POST /auth/login`, then send the returned token as `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Obtain a token |
| GET, POST | `/categories` | List or create categories |
| GET, PUT, DELETE | `/categories/{id}` | Read, update, or delete a category |
| GET, POST | `/transactions` | List or create transactions |
| GET, PUT, DELETE | `/transactions/{id}` | Read, update, or delete a transaction |
| GET | `/summary?month=YYYY-MM` | Summarize a month |

Use the optional `Idempotency-Key` header when creating a transaction to replay a successful request safely. A key is scoped to its user. See the request DTOs in [`src/main/java`](src/main/java/com/example/pennywise) for field definitions.

## Tests

```sh
mvn clean test
```

Tests use JUnit 5, Mockito, a separate in-memory H2 database, and a test-only JWT secret. The Docker/PostgreSQL setup has been checked for persistence across a restart. The browser interface does not yet have automated end-to-end tests.

## Technology

Java 21 · Spring Boot 3 · Spring Web · Spring Data JPA · Spring Security and JWT · PostgreSQL · H2 · Maven · Docker

Hibernate's `ddl-auto=update` is intended for local development; it is not a substitute for database migrations or backups. This configuration is intended for local use, not public deployment.

## Frontend development

The app is served by Spring Boot. Its transaction filters and type selector use adapted [EasyUI Animated Tabs](https://easyui.site/components/animated-tabs), the category button uses [PressButton](https://easyui.site/components/press-button), confirmations use [SettleModal](https://easyui.site/components/settle-modal), and notifications use [Alert](https://easyui.site/components/alert). The original component is MIT-licensed; see [`frontend/EASYUI-LICENSE.txt`](frontend/EASYUI-LICENSE.txt). The adapted React source is in `frontend/`; the bundled JavaScript is committed so Docker and Maven do not need Node.js. After changing the component, rebuild it with Node.js and npm:

```sh
npm ci
npm run build
```

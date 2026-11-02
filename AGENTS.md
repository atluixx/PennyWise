# PennyWise project guidance

## Purpose and user preferences

- PennyWise is a beginner-friendly personal finance tracker and REST API. The owner is learning Java and appreciates plain-language explanations of new Java and Spring concepts, complete file paths, and instructions to run and test changes.
- The app is intended for local use. Users enter income and expenses manually; do not add bank connections, Open Finance integrations, paid services, or public deployment without a request.
- The project is public at https://github.com/atluixx/PennyWise. The owner requested at least one commit per feature; keep changes logically grouped in descriptive commits.
- Preserve the current clean interface, guided transaction entry, interactive charts, EasyUI-based controls, and light/dark modes. The user preferred the original green design over a blue reference-based redesign. Avoid native JavaScript `alert`, `confirm`, and `prompt`; use accessible in-app EasyUI components.

## Stack and layout

- Java 21, Spring Boot 3, Maven, Spring Web, Spring Data JPA, Spring Security JWT, JUnit 5 and Mockito.
- Java sources are under `src/main/java/com/example/pennywise`, grouped into `auth`, `category`, `transaction`, `summary`, and `error`. Controllers use DTOs and constructor injection. Do not expose JPA entities directly.
- `src/main/resources/static` contains the Spring-served frontend. `app.js` owns API calls and the guided form. `frontend/` contains React islands adapted from EasyUI; keep their MIT attribution and `frontend/EASYUI-LICENSE.txt`. Run `npm ci && npm run build` after changing React source, and commit the generated `src/main/resources/static/easyui.js` so Maven and Docker do not require Node.
- `src/test` contains unit and integration tests. Run `mvn clean test` on Java 21. Build frontend assets with `npm run build`; test relevant browser behavior and accessibility when changing interactions.

## Data, security, and operation

- A JWT identifies the user. Always scope category, transaction, summary, and idempotency queries to that user; do not weaken per-user isolation. Transaction idempotency keys are scoped to users but only serialized within one application instance.
- Amounts use `BigDecimal`; the app currently assumes a **single currency**. Never combine EUR and BRL into a single total as though currency conversion existed. Preserve the visible limitation until currency support is implemented.
- Docker Compose runs a local-only web app and PostgreSQL, with data in a named volume. `docker compose up -d --build` runs it; `docker compose down` preserves data. Never remove volumes or the `data/` folder without explicit authorization.
- Direct Maven runs use a separate file-based H2 database in `data/`. The configured schema update is for local development, not a production migration strategy.
- `.env` contains local database and JWT secrets and must remain private and untracked. Never print, commit, or replace existing secrets unnecessarily. Use separate throwaway credentials and databases when testing.
- Existing EasyUI assets and frontend bundles are served by Spring Security's allowlist; update it when adding public static resources. Keep dialogs keyboard accessible, restore focus, and respect reduced motion.

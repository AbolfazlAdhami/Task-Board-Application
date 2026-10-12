# Backend

NestJS API service for the Task Board monorepo. Run the project from the repository root; setup, migrations, seed accounts, API routes, and checks are documented in the [root README](../README.md).

Backend-specific notes:

- Local API base URL: `http://localhost:3001/api/v1`
- Health check: `GET /api/v1/health`
- Unit tests: `npm test --workspace=backend -- --runInBand`
- HTTP e2e tests (requires the configured PostgreSQL database): `npm run test:e2e --workspace=backend -- --runInBand`
- Database migration and seed commands are run from the repository root as documented in the root README.

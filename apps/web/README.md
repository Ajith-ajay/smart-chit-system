# SCMS Web

The web application uses Next.js 11 Pages Router. Existing feature pages,
components, API clients, and styles remain in `src/`; `pages/` provides the
Next.js application entry points and route handling.

## Development

From the repository root, install workspace dependencies and start the web app:

```sh
pnpm install
pnpm dev:web
```

The app runs on port 3000. Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` to
the browser-accessible NestJS API base URL. The default API URL is
`http://localhost:3001/api/v1`.

## Production

```sh
pnpm --filter web build
pnpm --filter web start
```

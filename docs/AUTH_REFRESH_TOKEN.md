# SCMS Authentication: Refresh Token Flow

## Contract

- `POST /api/v1/auth/login` returns `{ success, timestamp, data: { accessToken, refreshToken, user } }`.
- `POST /api/v1/auth/refresh` accepts `{ refreshToken }` and returns `{ success, timestamp, data: { accessToken, refreshToken } }`.
- Access and refresh tokens are signed with separate configured secrets and carry explicit `type` claims (`access` and `refresh`).
- The access token lifetime defaults to `15m`; the refresh token lifetime defaults to `7d`.

## Rotation and storage

The database stores a SHA-256 digest of the refresh JWT in `users.refresh_token_hash`, never the raw token. SHA-256 is appropriate here because refresh JWTs are high-entropy secrets; bcrypt must not be used for JWTs because its input is truncated after 72 bytes.

Refresh rotation uses a conditional `updateMany` against the previously read hash. Only one concurrent request can replace that hash, preventing two requests from successfully rotating the same token.

Logout, password change, password reset, and inactive-account checks invalidate or reject refresh sessions.

## Frontend behavior

The Axios response interceptor shares one in-flight refresh promise across concurrent 401 responses. It reads the Nest response envelope at `response.data.data`, stores both rotated tokens, and retries each original request once.

A refresh 401/403 clears local tokens and emits `scms:auth-expired`. Network errors and 5xx responses do not clear tokens, because they do not prove the refresh token is invalid.

## Deployment note

This implementation changes refresh-token storage from the previous bcrypt digest to SHA-256 and adds token-type claims. Existing sessions created by the old code will not pass the new checks. Deploy the backend and frontend together and require users to sign in again once.

## Browser storage note

The existing application stores both JWTs in `localStorage` for compatibility. This is vulnerable to token theft if an XSS vulnerability exists. For a higher-security production deployment, move the refresh token to a `Secure`, `HttpOnly`, appropriately `SameSite` cookie and add CSRF protection appropriate to the chosen cookie policy.

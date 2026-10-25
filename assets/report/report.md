# Vibe Check report — http://127.0.0.1:8099

_Generated 2026-10-25 18:13 UTC · 19 confirmed, 0 suspected_

**Authorization:** VulnLab sandbox (localhost demo)  
**Target:** http://127.0.0.1:8099

> Every confirmed finding below was re-executed and re-confirmed by the engine. Suspicions were proposed but could not be proven and do not count toward the verdict.

## Verdict
**Security grade: F**

- **CRITICAL** × 7
- **HIGH** × 3
- **MEDIUM** × 8
- **INFO** × 1

## Confirmed findings

### [CRITICAL] Exposed .env file (secrets served from web root)
*class: `sensitive-file-exposure`*

**Why it matters:** Your .env — database URLs, API keys, JWT secrets — is downloadable by anyone.

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/.env
```
Response `200`:
```
DATABASE_URL=postgres://user:pw@localhost/db
STRIPE_SECRET_KEY=***redacted***
JWT_SECRET=***redacted***

```

Checks the engine confirmed:
- body is KEY=VALUE environment config
- response is the real file, not an SPA catch-all page

**Fix:** Stop serving dotfiles from the web root, move secrets out of the served directory, and ROTATE every key that was exposed.


### [CRITICAL] Exposed SQL database dump (backup.sql)
*class: `backup-file-exposure`*

**Why it matters:** /backup.sql is downloadable by anyone — a database dump or config backup hands over your data and secrets wholesale.

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/backup.sql
```
Response `200`:
```
-- MySQL dump
CREATE TABLE users (id INT, email TEXT, password_hash TEXT);
INSERT INTO users VALUES (1, 'alice@example.com', '$2b$...');

```

Checks the engine confirmed:
- /backup.sql carries a real backup/dump signature

**Fix:** Remove backup/dump files from the web root and block dotfile/backup extensions at the web server; rotate anything exposed.


### [CRITICAL] Stripe secret key exposed in client code
*class: `client-secret-exposure`*

**Why it matters:** A Stripe SECRET key is shipped to the browser — anyone who views source can charge cards and issue refunds on your account.

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/app.js
```
Response `200`:
```
const API = '/api';
const STRIPE_SECRET_KEY = '***redacted***';
const AWS_ACCESS_KEY_ID = '***redacted***';

```

Checks the engine confirmed:
- Stripe secret key pattern present in the response

**Fix:** Move the secret key server-side, use only the publishable key client-side, and rotate the exposed key now.


### [CRITICAL] AWS access key id exposed in client code
*class: `client-secret-exposure`*

**Why it matters:** An AWS access key id is embedded in client code — a path to full cloud-account abuse if the secret is nearby or reused.

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/app.js
```
Response `200`:
```
const API = '/api';
const STRIPE_SECRET_KEY = '***redacted***';
const AWS_ACCESS_KEY_ID = '***redacted***';

```

Checks the engine confirmed:
- AWS access key id pattern present in the response

**Fix:** Remove AWS credentials from the frontend and rotate the key immediately.


### [CRITICAL] Guessable password-reset token on /password-reset
*class: `weak-reset-token`*

**Why it matters:** The reset token is only 9 characters (low entropy, brute-forceable), so an attacker can guess it outright. A leaked or guessable reset token is full account takeover — the single most damaging bug a vibe-coded auth flow ships with.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/password-reset?email=vibe-check-probe@example.com
```
Response `200`:
```
{"reset_link":"http://127.0.0.1:8099/reset?token=secret123"}
```

Checks the engine confirmed:
- the response body leaks a reset/login token

**Fix:** Never return the reset token in the API response — email a link to the registered address only. Use a cryptographically random token (>=32 chars), single-use, short-lived, and rate-limit the reset endpoint.


### [CRITICAL] Password-reset token exposed in the response on /api/password/forgot
*class: `weak-reset-token`*

**Why it matters:** The reset token is returned in the HTTP response instead of being emailed, so anyone who can call this endpoint can take over the account. A leaked or guessable reset token is full account takeover — the single most damaging bug a vibe-coded auth flow ships with.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/api/password/forgot?email=vibe-check-probe@example.com
```
Response `200`:
```
{"ok":true,"email":"vibe-check-probe@example.com","reset_token":"b7e2a1c9f04d4e5a8c3b6d9e1f2a7c84","reset_url":"http://localhost/reset?token=b7e2a1c9f04d4e5a8c3b6d9e1f2a7c84"}
```

Checks the engine confirmed:
- the response body leaks a reset/login token

**Fix:** Never return the reset token in the API response — email a link to the registered address only. Use a cryptographically random token (>=32 chars), single-use, short-lived, and rate-limit the reset endpoint.


### [CRITICAL] Cross-account object read (IDOR/BOLA) on /api/invoices/{id}
*class: `idor`*

**Why it matters:** Two different logged-in users (alice and bob) receive the same private object at /api/invoices/117. The endpoint never checks ownership, so any authenticated user can read anyone else's records.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/api/invoices/117
Authorization: ***masked***
```
Response `200`:
```
{"owner":"alice","owner_email":"alice@example.com","total":1200}
```
Baseline (authenticated as alice) returned `200`.

Checks the engine confirmed:
- bob received byte-identical data to alice

**Fix:** Enforce an ownership/authorization check (object.owner_id == the current user) before returning the object; return 403 otherwise.


### [HIGH] CORS reflects any origin with credentials on /api/me
*class: `cors-misconfiguration`*

**Why it matters:** The endpoint echoes any website's Origin and allows credentials, so a malicious site can read this authenticated response from a logged-in user's browser.

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/api/me
Origin: https://evil.example
```
Response `200`:
```
{"user":"anonymous"}
```

Checks the engine confirmed:
- reflected the attacker Origin
- allowed credentials cross-origin

**Fix:** Never reflect the Origin header. Allow only an explicit allowlist of trusted origins, and don't combine a wildcard origin with credentials.


### [HIGH] Reflected input (likely XSS) via ?q= on /search
*class: `reflected-input`*

**Why it matters:** The `q` parameter is reflected into the HTML response unencoded, so an attacker can inject script and run it in a victim's browser (reflected XSS).

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/search?q=vck9z%3Csvg/onload%3D1%3E
```
Response `200`:
```
<!doctype html><html><body>Results for: vck9z<svg/onload=1></body></html>
```

Checks the engine confirmed:
- the HTML-breaking payload was reflected unencoded
- in an HTML response

**Fix:** Context-encode all user input on output (HTML-escape), and add a Content-Security-Policy as defense in depth.


### [HIGH] Stack trace / debug output leaked on /api/calc
*class: `debug-disclosure`*

**Why it matters:** The app returns internal stack traces or debug pages to clients, exposing file paths, framework internals and sometimes secrets — and it usually means debug mode is enabled in production.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/api/calc
```
Response `500`:
```
Traceback (most recent call last):
  File "/Users/trading/ClaudeWorkspace/vibe-stresser/targets/vulnlab/app.py", line 71, in calc
    return str(1 / int(x))
               ~~^~~~~~~~
ZeroDivisionError: division by zero

```

Checks the engine confirmed:
- error/debug marker present in the response

**Fix:** Turn off debug mode in production and return generic error pages; log the details server-side only.


### [MEDIUM] Missing security headers (x-content-type-options, x-frame-options, content-security-policy, referrer-policy)
*class: `security-headers`*

**Why it matters:** Without these headers the app is exposed in the browser to MIME-type sniffing, clickjacking, cross-site scripting and content injection, leaking URLs to third parties via the Referer header — cheap, high-value hardening a vibe-coded app almost always skips.

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/
```
Response `200`:
```
VulnLab
/api/invoices/117
/api/invoices/118
/api/signup
/api/me
/redirect
/app.js
/api/calc
/search
/health

```

Checks the engine confirmed:
- x-content-type-options is not set on the response
- x-frame-options is not set on the response
- content-security-policy is not set on the response
- referrer-policy is not set on the response

**Fix:** Send `X-Content-Type-Options: nosniff`. Send `X-Frame-Options: DENY` (or a CSP `frame-ancestors 'none'`). Add a restrictive `Content-Security-Policy`, e.g. `default-src 'self'`. Send `Referrer-Policy: strict-origin-when-cross-origin`.


### [MEDIUM] Session cookie 'session' set without HttpOnly
*class: `insecure-cookie`*

**Why it matters:** The 'session' cookie is readable from JavaScript, so any XSS on the site can steal the session and impersonate the user.

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/login
```
Response `200`:
```
logged in
```

Checks the engine confirmed:
- a session cookie is set
- the cookie lacks HttpOnly

**Fix:** Set the cookie with HttpOnly (and Secure + SameSite): e.g. `Set-Cookie: session=...; HttpOnly; Secure; SameSite=Lax`.


### [MEDIUM] Open redirect via ?url= on /redirect
*class: `open-redirect`*

**Why it matters:** The `url` parameter sends users to any URL, so an attacker can craft a link on your domain that lands victims on a phishing site.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/redirect?url=https%3A%2F%2Fevil.example%2F
```
Response `302`:
```

```

Checks the engine confirmed:
- redirected off-site to the attacker URL

**Fix:** Redirect only to a known allowlist of internal paths, or validate the target is same-origin before redirecting.


### [MEDIUM] GraphQL introspection enabled on /graphql
*class: `graphql-introspection`*

**Why it matters:** Introspection is on, so anyone can download your full GraphQL schema — every type, field and mutation — making the rest of the API trivial to attack.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
POST http://127.0.0.1:8099/graphql
Content-Type: application/json

{"query":"query{__schema{queryType{name}}}"}
```
Response `200`:
```
{"data":{"__schema":{"queryType":{"name":"Query"},"types":[{"name":"User"},{"name":"Invoice"}]}}}
```

Checks the engine confirmed:
- schema introspection returned the schema

**Fix:** Disable introspection in production (e.g. the GraphQL server's introspection flag), or gate it behind authentication.


### [MEDIUM] Prometheus metrics endpoint exposed
*class: `exposed-management-endpoint`*

**Why it matters:** Operational metrics (and often internal hostnames and counts) are public.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/metrics
```
Response `200`:
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total 1337

```

Checks the engine confirmed:
- response is a real /metrics endpoint

**Fix:** Require authentication for /metrics or bind it to an internal network only.


### [MEDIUM] Open directory listing at /files/
*class: `directory-listing`*

**Why it matters:** Anyone can browse every file under /files/ — including backups, dumps and source that were never meant to be downloadable.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/files/
```
Response `200`:
```
<html><head><title>Index of /files</title></head><body><h1>Index of /files</h1><ul><li>backup.zip</li><li>db.sql</li></ul></body></html>
```

Checks the engine confirmed:
- response is a directory autoindex page

**Fix:** Turn off directory autoindex (e.g. nginx `autoindex off`) and serve an explicit index or 403 instead.


### [MEDIUM] Exposed docker-compose.yml
*class: `exposed-config-file`*

**Why it matters:** /docker-compose.yml is downloadable, exposing your service layout, image/registry names and pipeline — and sometimes embedded secrets.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/docker-compose.yml
```
Response `200`:
```
version: '3'
services:
  web:
    image: myapp:latest
    environment:
      - DB_PASSWORD=supersecret

```

Checks the engine confirmed:
- /docker-compose.yml carries a /docker-compose.yml format signature

**Fix:** Don't deploy CI/infra config to the web root; block these filenames at the web server.


### [MEDIUM] Host header reflected on /password-reset
*class: `host-header-injection`*

**Why it matters:** The app trusts the Host header to build absolute links, so an attacker can set Host to their domain and poison password-reset links or caches.

**Proof** (re-confirmed by the engine 2026-10-25 18:13 UTC):

```http
GET http://127.0.0.1:8099/password-reset
Host: evil.example
```
Response `200`:
```
{"reset_link":"http://evil.example/reset?token=secret123"}
```

Checks the engine confirmed:
- the spoofed Host was reflected in the body

**Fix:** Build absolute URLs from a configured canonical host, not the request Host header; validate Host against an allowlist.


### [INFO] Technology disclosed via X-Powered-By (Express)
*class: `tech-disclosure`*

**Why it matters:** The X-Powered-By header advertises 'Express', telling an attacker which framework to target — free reconnaissance you can remove. (Informational.)

**Proof** (re-confirmed by the engine 2026-10-25 18:12 UTC):

```http
GET http://127.0.0.1:8099/
```
Response `200`:
```
VulnLab
/api/invoices/117
/api/invoices/118
/api/signup
/api/me
/redirect
/app.js
/api/calc
/search
/health

```

Checks the engine confirmed:
- on a successful response
- X-Powered-By still discloses 'Express'

**Fix:** Remove the X-Powered-By header (e.g. Express: `app.disable('x-powered-by')`) and suppress versioned Server banners.


## Appendix — discovered routes

- `GET /` [200]
- `GET /api` [404]
- `GET /api/calc` [500]
- `GET /api/invoices/{id}` [401] · object
- `GET /api/me` [200]
- `GET /api/signup` [405]
- `GET /app.js` [200]
- `GET /health` [200]
- `GET /redirect` [400]
- `GET /search` [200]

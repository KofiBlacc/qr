# QR Verify (with database and departments)
1. Push this folder to GitHub and import it in Vercel.
2. In the Vercel project: Storage tab > Create/Connect Neon (Postgres). This adds DATABASE_URL.
3. Add the env var ADMIN_PASSWORD, then deploy (or redeploy).
4. Open /admin: add departments, generate codes. Open /scan on your phone to verify.
Tables are created automatically on first use.
Local: npm install && cp .env.example .env.local (fill in values) && npm run dev

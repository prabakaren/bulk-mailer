# BulkMail – MERN Bulk Mail Application

Send one email to many recipients, keep a history of everything sent, and log in as admin to use it.

**Stack:** React (Vite) · Node.js + Express · MongoDB (Mongoose) · Gmail API (OAuth 2.0)

## Features
- Admin login (JWT)
- Compose page with subject, message and multiple recipients (comma / space / new line separated)
- Live email validation and success / partial / failure messages
- Each recipient gets their own copy, so nobody sees the other addresses
- History page with status, recipient count, failed addresses and delete

## Why Gmail API and not Nodemailer SMTP?
SMTP ports (465 / 587) are blocked or restricted on many hosts (Render free plan, Vercel). The Gmail API sends mail over HTTPS, so it works everywhere.

## Folder structure
```
bulk-mail-app/
├── client/   React frontend
└── server/   Express API (also runs as a Vercel serverless function)
```

## 1. Get the Gmail API credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com), create a project.
2. **APIs & Services → Library** → enable **Gmail API**.
3. **OAuth consent screen** → External → add your Gmail as a **Test user**.
4. **Credentials → Create credentials → OAuth client ID** → type **Web application**.
   Add this redirect URI: `https://developers.google.com/oauthplayground`
5. Copy the **Client ID** and **Client Secret**.
6. Open [OAuth Playground](https://developers.google.com/oauthplayground):
   - Click the gear icon → tick **Use your own OAuth credentials** → paste Client ID and Secret.
   - In Step 1 select scope `https://www.googleapis.com/auth/gmail.send` → Authorize APIs.
   - In Step 2 click **Exchange authorization code for tokens** and copy the **Refresh token**.

> While the consent screen is in "Testing" mode, refresh tokens expire after 7 days. Click **Publish app** on the consent screen if you want it to last.

## 2. Run locally
```bash
# backend
cd server
cp .env.example .env      # fill in the values
npm install
npm run dev               # http://localhost:5000

# frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

## 3. Push to GitHub
```bash
cd bulk-mail-app
git init
git add .
git commit -m "Bulk mail app"
git branch -M main
git remote add origin https://github.com/<your-username>/bulk-mail-app.git
git push -u origin main
```
`.env` files are git-ignored, so your secrets stay local.

## 4. Deploy on Vercel
You will create **two** Vercel projects from the same GitHub repo.

### Backend
1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `server`  (Framework preset: Other)
3. Add Environment Variables:

| Name | Value |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLIENT_URL` | your frontend URL (add after step below, no trailing slash) |
| `ADMIN_USERNAME` | admin username |
| `ADMIN_PASSWORD` | admin password |
| `JWT_SECRET` | any long random string |
| `GMAIL_USER` | the Gmail address you authorised |
| `GOOGLE_CLIENT_ID` | from Google Cloud |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud |
| `GOOGLE_REFRESH_TOKEN` | from OAuth Playground |

4. Deploy. Open the backend URL – you should see `{"status":"ok"}`.

### Frontend
1. Add another project from the same repo, **Root Directory:** `client` (Framework: Vite).
2. Environment Variable: `VITE_API_URL` = `https://<your-backend>.vercel.app/api`
3. Deploy, then copy the frontend URL into the backend's `CLIENT_URL` and **redeploy the backend**.

### MongoDB Atlas
In Atlas → **Network Access** → add `0.0.0.0/0` (Vercel uses changing IPs).

## Notes
- `MAX_RECIPIENTS` (default 100) limits one send. Gmail free accounts allow about 500 emails per day.
- Vercel functions have a time limit (60s is set in `server/vercel.json`), so keep each send to a reasonable size.
- Any change to environment variables needs a redeploy to take effect.

## API
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Admin login, returns JWT |
| POST | `/api/mail/send` | Send bulk mail `{ subject, body, recipients[] }` |
| GET | `/api/mail/history` | List sent mails |
| DELETE | `/api/mail/:id` | Delete a history record |

# 🏫 Mostafa Pre Cadet School — Backend Setup Guide

## Step 1: MongoDB Atlas (Free Database)

1. Go to **https://cloud.mongodb.com** → Sign up (free)
2. Create a new **Project** → name it "MostafaSchool"
3. Click **"Build a Database"** → Choose **M0 FREE** tier
4. Choose region: **Asia Pacific (Mumbai)** — closest to Bangladesh
5. Click **Create** → wait 2-3 minutes

### Get your connection string:
1. Click **"Connect"** on your cluster
2. Choose **"Drivers"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy the connection string — looks like:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/
   ```
5. Replace `<password>` with your actual password
6. Add database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mostafa_school
   ```

### Allow all IPs (important for Render):
1. In MongoDB Atlas: **Security → Network Access**
2. Click **"Add IP Address"**
3. Click **"Allow Access From Anywhere"** → `0.0.0.0/0`
4. Click **Confirm**

---

## Step 2: Deploy Backend on Render.com (Free)

1. Go to **https://render.com** → Sign up with GitHub

### Upload your code to GitHub first:
```bash
# In your school-backend folder:
git init
git add .
git commit -m "Initial backend"
# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/mostafa-school-backend.git
git push -u origin main
```

### Create Web Service on Render:
1. Dashboard → **"New"** → **"Web Service"**
2. Connect your GitHub repo
3. Settings:
   - **Name:** `mostafa-school-api`
   - **Region:** Singapore (closest to Bangladesh)
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

### Add Environment Variables on Render:
Go to your service → **"Environment"** tab → Add these:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | your MongoDB Atlas connection string |
| `JWT_SECRET` | (any long random text, min 32 chars) e.g. `Mpcs2025SuperSecretKeyForJWT_Bangladesh` |
| `JWT_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | your Vercel frontend URL (add later) |
| `NODE_ENV` | `production` |
| `EMAIL_USER` | your Gmail address (optional) |
| `EMAIL_PASS` | your Gmail App Password (optional) |

4. Click **"Create Web Service"**
5. Wait 3-5 minutes for deployment
6. Your API URL will be: `https://mostafa-school-api.onrender.com`

> ⚠️ **Free Render note:** The server "sleeps" after 15 min of inactivity.
> First request after sleep takes ~30 seconds. This is normal on free tier.

---

## Step 3: Deploy Frontend on Vercel (Free)

1. Go to **https://vercel.com** → Sign up with GitHub
2. Upload your `school-mobile` folder to a GitHub repo
3. In Vercel: **"New Project"** → Import your repo
4. No build settings needed (pure HTML)
5. Click **Deploy**
6. Your site URL: `https://mostafa-school.vercel.app`

### Update Render with your Vercel URL:
1. Go back to Render → your service → Environment
2. Update `CLIENT_URL` = `https://mostafa-school.vercel.app`
3. Redeploy

---

## Step 4: Connect Frontend to Backend

Replace `js/db.js` with the new `js/api.js` file provided.
Then update each HTML file's script tag from:
```html
<script src="js/db.js"></script>
```
to:
```html
<script src="js/api.js"></script>
```

---

## Step 5: Test Your API

Open your browser or use Postman:

```
GET  https://mostafa-school-api.onrender.com/
→ Should return: { "success": true, "message": "🏫 Mostafa Pre Cadet School API is running!" }
```

### Create Super Admin (first time only):
```
POST https://mostafa-school-api.onrender.com/api/auth/superadmin/signup
Body: {
  "username": "superadmin",
  "password": "YourStrongPassword",
  "email": "admin@school.com",
  "phone": "01700000000"
}
```

---

## API Endpoints Summary

### Auth
| Method | Endpoint | Who |
|--------|----------|-----|
| POST | `/api/auth/superadmin/signup` | First time setup |
| POST | `/api/auth/superadmin/login` | Super Admin |
| POST | `/api/auth/admin/login` | Admin |
| POST | `/api/auth/teacher/login` | Teacher |
| POST | `/api/auth/student/login` | Student |
| GET  | `/api/auth/me` | Any logged in user |
| PUT  | `/api/auth/change-password` | Any logged in user |

### Students
| Method | Endpoint | Who |
|--------|----------|-----|
| GET    | `/api/students` | Admin+ |
| GET    | `/api/students/me` | Student |
| POST   | `/api/students` | Admin+ |
| PUT    | `/api/students/:id` | Admin+ |
| PUT    | `/api/students/:id/payment` | Admin+ |
| PUT    | `/api/students/:id/photo` | Any |
| POST   | `/api/students/:id/promote` | Admin+ |
| DELETE | `/api/students/:id` | Admin+ |

### Teachers
| Method | Endpoint | Who |
|--------|----------|-----|
| GET    | `/api/teachers` | Admin+ |
| POST   | `/api/teachers` | Public (registration) |
| PUT    | `/api/teachers/:id/approve` | Admin+ |
| PUT    | `/api/teachers/:id/assignments` | Admin+ |
| DELETE | `/api/teachers/:id` | Admin+ |

### Others
| Method | Endpoint | Who |
|--------|----------|-----|
| GET/POST/DELETE | `/api/notices` | Public read, Admin write |
| GET/POST | `/api/attendance` | Teacher+ |
| GET/POST | `/api/results` | Teacher+ |
| GET/POST | `/api/applications` | Public submit, Admin manage |
| GET/POST/DELETE | `/api/holidays` | Public read, Admin write |
| GET/POST | `/api/exam-names` | Auth read, Admin write |
| GET/PUT | `/api/class-config/:class` | Auth read, Admin write |
| GET/POST | `/api/admins` | Super Admin only |
| GET | `/api/email-log` | Admin+ |

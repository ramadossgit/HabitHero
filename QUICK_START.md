# Habit Heroes - Quick Start Guide 🚀

Get your local development environment up and running in **5 minutes**!

---

## Prerequisites Check ✅

Before starting, ensure you have:

- [ ] **Node.js 20+** installed - Check: `node --version`
- [ ] **npm 10+** installed - Check: `npm --version`
- [ ] **PostgreSQL 13+** installed - Check: `psql --version`

**Don't have these?** See [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md#system-requirements) for installation instructions.

---

## 5-Minute Setup

### Step 1: Install Dependencies (2 min)

```bash
cd HabitHero
npm install
```

☕ **Wait for installation to complete** (~2 minutes)

---

### Step 2: Configure Environment (1 min)

**2a. Create `.env` file:**
```bash
# Copy the example
cp .env.example .env

# Or on Windows CMD:
copy .env.example .env
```

**2b. Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**2c. Edit `.env`** and paste the generated secret:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/habithero
SESSION_SECRET=<paste_generated_secret_here>
```

> 💡 **Important:** Replace `YOUR_PASSWORD` with your PostgreSQL password!

---

### Step 3: Set Up Database (1 min)

**3a. Create database:**
```bash
# Using psql
psql -U postgres -c "CREATE DATABASE habithero;"

# Verify
psql -U postgres -l | grep habithero
```

**3b. Push database schema:**
```bash
npm run db:push
```

✅ **You should see:** "Schema applied successfully"

---

### Step 4: Start Application (1 min)

```bash
npm run dev
```

✅ **You should see:**
```
🏠 Local development mode: Replit OAuth disabled
💡 Using local authentication (email/password)
serving on port 5000
```

---

### Step 5: Open Browser

Navigate to: **http://localhost:5000**

🎉 **You should see the Habit Heroes landing page!**

---

## First Time Usage

### Create Your Parent Account

1. Click **"Get Started"** or **"Parent Login"**
2. Click **"Create New Account"**
3. Fill in:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - First Name: `Test`
   - Last Name: `Parent`
4. Click **"Register"**

✅ **You'll be logged in and see your Family Code!**

---

### Add Your First Child

1. In Parent Dashboard, click **"Add Child"**
2. Fill in:
   - Name: `Test Kid`
   - Username: `testkid`
   - PIN: `1234`
3. Select an avatar type
4. Click **"Save"**

✅ **Child account created!**

---

### Test Child Login

1. Logout from parent account
2. Click **"Kids Login"**
3. Enter:
   - **Family Code:** (from parent account)
   - **Username:** `testkid`
   - **PIN:** `1234`
4. Login

✅ **You should see the kids interface!**

---

## Troubleshooting

### ❌ Can't connect to database

**Solution:**

1. **Start PostgreSQL:**
   ```bash
   # Windows
   net start postgresql-x64-16

   # macOS
   brew services start postgresql@16

   # Linux
   sudo systemctl start postgresql
   ```

2. **Verify DATABASE_URL in `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/habithero
   ```

---

### ❌ Port 5000 already in use

**Solution:**

```bash
# Option 1: Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Option 2: Change port in .env
echo "PORT=3000" >> .env
```

---

### ❌ npm install fails

**Solution:**

```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### ❌ SESSION_SECRET error

**Solution:**

```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
echo "SESSION_SECRET=<paste_secret>" >> .env
```

---

## What's Next?

### Explore Features

- ✅ Create habits for your child
- ✅ Complete habits and earn XP
- ✅ Unlock avatars and gear
- ✅ Set up rewards
- ✅ Try parental controls

### Read Documentation

- **Full Setup Guide:** [LOCAL_DEPLOYMENT_GUIDE.md](LOCAL_DEPLOYMENT_GUIDE.md)
- **Database Guide:** [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Docker Guide:** [DOCKER_SETUP.md](DOCKER_SETUP.md)
- **Migration Report:** [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

---

## Quick Commands Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npm run db:push          # Push schema to database
npm run db:studio        # Open database GUI
npm run db:generate      # Generate migrations

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run check            # TypeScript check

# Docker
docker-compose up -d     # Start with Docker
docker-compose down      # Stop Docker containers
```

---

## Need Help?

1. **Check troubleshooting** above
2. **Read full guides** in documentation
3. **Common issues:** See [LOCAL_DEPLOYMENT_GUIDE.md#troubleshooting](LOCAL_DEPLOYMENT_GUIDE.md#troubleshooting)
4. **Database issues:** See [DATABASE_SETUP.md#troubleshooting](DATABASE_SETUP.md#troubleshooting)

---

## System Architecture (High-Level)

```
┌──────────────────┐
│   Browser        │
│  localhost:5000  │
└────────┬─────────┘
         │ HTTP
┌────────▼─────────┐
│   Express API    │
│   + Vite Dev     │
│   (Node.js)      │
└────────┬─────────┘
         │ SQL
┌────────▼─────────┐
│   PostgreSQL     │
│   localhost:5432 │
└──────────────────┘
```

---

## Success Checklist ✅

After completing the setup, you should be able to:

- [ ] Access http://localhost:5000
- [ ] See the landing page without errors
- [ ] Create a parent account
- [ ] Login successfully
- [ ] See the parent dashboard
- [ ] Create a child account
- [ ] Login as a child
- [ ] See the kids interface
- [ ] Create a habit
- [ ] Complete a habit
- [ ] Earn XP and points

---

## 🎉 You're Ready to Develop!

The application is now running locally on your machine. All features are preserved and working identically to the Replit version.

**Happy coding! 🚀**

---

## Additional Resources

- **Architecture Overview:** [replit.md](replit.md)
- **Design Guidelines:** [design_guidelines.md](design_guidelines.md)
- **Testing Guide:** [docs/TDD_WORKFLOW.md](docs/TDD_WORKFLOW.md)
- **Mobile App:** [MOBILE_QUICK_START.md](MOBILE_QUICK_START.md)

---

**Last Updated:** January 26, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready

# Database Setup Guide - Habit Heroes

## Overview

Habit Heroes uses **PostgreSQL** as its database with **Drizzle ORM** for type-safe database operations. This guide covers setting up PostgreSQL locally and migrating the database schema.

---

## Prerequisites

- Node.js 20+ installed
- PostgreSQL 13+ installed locally

---

## Step 1: Install PostgreSQL

### Windows

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer (EDB installer recommended)
3. During installation:
   - Set a password for the `postgres` superuser (remember this!)
   - Default port: `5432`
   - Default locale: Your system locale
4. After installation, PostgreSQL should be running as a Windows service

**Verify installation:**
```cmd
psql --version
```

### macOS

```bash
# Using Homebrew
brew install postgresql@16
brew services start postgresql@16

# Verify
psql --version
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify
psql --version
```

---

## Step 2: Create Database

### Option A: Using psql Command Line

```bash
# Connect to PostgreSQL (Windows may require full path)
psql -U postgres

# Inside psql:
CREATE DATABASE habithero;

# Create a dedicated user (optional but recommended)
CREATE USER habithero_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE habithero TO habithero_user;

# Exit psql
\q
```

### Option B: Using pgAdmin (GUI)

1. Open pgAdmin (installed with PostgreSQL)
2. Connect to your local server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `habithero`
5. Owner: `postgres` (or create new user)
6. Click "Save"

---

## Step 3: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and update DATABASE_URL:**

   ```env
   # Using postgres superuser (development only)
   DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/habithero

   # OR using dedicated user (recommended)
   DATABASE_URL=postgresql://habithero_user:your_secure_password@localhost:5432/habithero
   ```

3. **Generate SESSION_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the output and paste it in `.env`:
   ```env
   SESSION_SECRET=<paste_generated_secret_here>
   ```

---

## Step 4: Database Schema Migration

Habit Heroes uses Drizzle Kit for database migrations. The schema is defined in `shared/schema.ts`.

### Generate Migration Files

```bash
npm run db:generate
```

This creates SQL migration files in the `migrations/` directory.

### Push Schema to Database

```bash
npm run db:push
```

This command:
- Connects to your local PostgreSQL database
- Creates all required tables
- Sets up indexes and constraints
- Creates the sessions table for authentication

### Expected Tables Created

- `users` - Parent accounts
- `children` - Child accounts linked to parents
- `habits` - Habit definitions
- `habit_completions` - Daily habit completion records
- `rewards` - Reward catalog
- `reward_claims` - Reward redemption history
- `reward_transactions` - Point transaction log
- `parental_controls` - Parent control settings per child
- `avatar_shop_items` - Avatar customization items
- `gear_shop_items` - Gear/equipment items
- `devices` - Registered family devices
- `sync_events` - Cross-device synchronization events
- `sessions` - Express session storage
- `subscriptions` - (Optional) Stripe subscription data
- `weekend_challenges` - Weekend challenge definitions
- `master_habits` - Habit templates

---

## Step 5: Verify Database Setup

### Using psql

```bash
# Connect to your database
psql -U postgres -d habithero

# List all tables
\dt

# Check users table structure
\d users

# Exit
\q
```

### Using Drizzle Studio (GUI)

Drizzle Studio provides a web-based database browser:

```bash
npm run db:studio
```

This opens http://localhost:4983 in your browser where you can:
- Browse all tables
- View and edit data
- Run queries
- Inspect schema

---

## Troubleshooting

### Issue: `psql: command not found`

**Solution:** Add PostgreSQL to your system PATH

**Windows:**
```cmd
# Add to PATH (adjust version number):
C:\Program Files\PostgreSQL\16\bin
```

**macOS/Linux:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
source ~/.bashrc
```

---

### Issue: `DATABASE_URL must be set`

**Solution:** Ensure `.env` file exists and DATABASE_URL is correctly formatted

```bash
# Verify .env exists
ls -la .env

# Check DATABASE_URL format
cat .env | grep DATABASE_URL
```

---

### Issue: `Connection refused` or `ECONNREFUSED`

**Solutions:**

1. **Check if PostgreSQL is running:**
   ```bash
   # Windows
   sc query postgresql-x64-16

   # macOS
   brew services list | grep postgresql

   # Linux
   sudo systemctl status postgresql
   ```

2. **Start PostgreSQL if stopped:**
   ```bash
   # Windows
   net start postgresql-x64-16

   # macOS
   brew services start postgresql@16

   # Linux
   sudo systemctl start postgresql
   ```

3. **Verify port 5432 is listening:**
   ```bash
   # Windows
   netstat -an | findstr :5432

   # macOS/Linux
   lsof -i :5432
   ```

---

### Issue: `password authentication failed`

**Solutions:**

1. **Reset postgres password:**
   ```bash
   # Windows (as Administrator)
   psql -U postgres
   ALTER USER postgres PASSWORD 'new_password';

   # macOS/Linux
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'new_password';
   ```

2. **Update DATABASE_URL in `.env` with new password**

---

### Issue: `permission denied for schema public`

**Solution:** Grant necessary privileges:

```sql
-- Connect as postgres superuser
psql -U postgres -d habithero

-- Grant privileges
GRANT ALL ON SCHEMA public TO habithero_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO habithero_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO habithero_user;
```

---

## Production Deployment (Neon Serverless)

The application originally used **Neon** (serverless PostgreSQL). To deploy to production:

1. **Create Neon account:** https://neon.tech
2. **Create new project**
3. **Get connection string** from project dashboard
4. **Update production `.env` or environment variables:**
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

5. **Run migrations:**
   ```bash
   npm run db:push
   ```

---

## Database Backup & Restore

### Backup

```bash
# Backup entire database
pg_dump -U postgres habithero > habithero_backup.sql

# Backup with timestamp
pg_dump -U postgres habithero > habithero_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore

```bash
# Restore from backup
psql -U postgres habithero < habithero_backup.sql
```

---

## Development Tips

### Reset Database

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE habithero;"
psql -U postgres -c "CREATE DATABASE habithero;"

# Push schema again
npm run db:push
```

### Seed Test Data

Create a seed script in `scripts/seed.ts`:

```typescript
import { db } from '../server/db';
import { users, children, habits } from '../shared/schema';

async function seed() {
  // Insert test parent
  const [parent] = await db.insert(users).values({
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'Parent',
    familyCode: 'TEST123',
    // ... other fields
  }).returning();

  // Insert test child
  await db.insert(children).values({
    userId: parent.id,
    name: 'Test Child',
    username: 'testchild',
    // ... other fields
  });

  console.log('✅ Database seeded successfully');
}

seed().catch(console.error);
```

Run with:
```bash
tsx scripts/seed.ts
```

---

## Next Steps

After setting up the database:

1. ✅ Verify database connection: `npm run db:studio`
2. ✅ Start development server: `npm run dev`
3. ✅ Create first parent account via app UI
4. ✅ Test child account creation

---

## Support

- **Drizzle ORM Docs:** https://orm.drizzle.team
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Neon Docs:** https://neon.tech/docs

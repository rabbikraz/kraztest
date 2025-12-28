# Database Setup Instructions

## Your Connection String

Your Supabase connection string is:
```
postgresql://postgres:[YOUR-PASSWORD]@db.tjywoiawsxrrepthgkqd.supabase.co:5432/postgres
```

## Steps to Configure

### 1. Replace [YOUR-PASSWORD]
Replace `[YOUR-PASSWORD]` with your actual Supabase database password (the one you set when creating the project).

**Example:**
```
postgresql://postgres:MySecurePassword123@db.tjywoiawsxrrepthgkqd.supabase.co:5432/postgres
```

### 2. Add SSL Mode (Required for Supabase)
Add `?sslmode=require` to the end:

```
postgresql://postgres:MySecurePassword123@db.tjywoiawsxrrepthgkqd.supabase.co:5432/postgres?sslmode=require
```

### 3. Set in Netlify
1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"**
5. Key: `DATABASE_URL`
6. Value: Your complete connection string (with password and ?sslmode=require)
7. Click **"Save"**
8. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### 4. After Deployment
Visit these endpoints in order:
1. `/api/setup-db` - Creates database tables
2. `/api/rss/sync` - Syncs shiurim from RSS feed

## Important Notes
- Keep your password secure - never commit it to git
- The connection string must include `?sslmode=require` for Supabase
- After setting DATABASE_URL, you MUST redeploy for it to take effect


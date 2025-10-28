# PostgreSQL Database Setup on Railway

Your Mara chatbot now supports database persistence! Follow these steps to add a PostgreSQL database on Railway.

## 🎯 What the Database Does

With the database, your chatbot will:
- ✅ **Persist conversations** - Survive server restarts
- ✅ **Store chat history** - Long-term conversation records
- ✅ **Track analytics** - Analyze student questions and emotional states
- ✅ **Better Chat ID continuity** - More reliable cross-session conversations

**Note**: The app works fine WITHOUT a database (uses in-memory caching), but adding one gives you persistence and analytics.

---

## 🚂 Railway Database Setup (Step-by-Step)

### Step 1: Login to Railway
1. Go to https://railway.app
2. Login with GitHub
3. Find your **mara-chatbot** project

### Step 2: Add PostgreSQL Database
1. Click on your project
2. Click **"+ New"** button (top right)
3. Select **"Database"**
4. Choose **"Add PostgreSQL"**
5. Railway will create a new PostgreSQL database

### Step 3: Link Database to Your App
Railway automatically creates a `DATABASE_URL` environment variable!

**You don't need to do anything** - Railway automatically:
- Creates the database
- Generates connection string
- Adds `DATABASE_URL` to your app's environment variables
- Links them together

### Step 4: Redeploy Your App
1. Go to your app service (not the database)
2. Click **"Deployments"**
3. Click **"Redeploy"** (or push new commit to GitHub)
4. Railway will rebuild with database support

### Step 5: Verify Database Connection
1. Check your deployment logs
2. You should see: `✓ Database connected`
3. You should see: `✓ Database tables initialized`

---

## 📊 Database Schema

The database automatically creates these tables:

### `sessions` Table
- Stores user sessions (name, student number, chat ID)
- Expires after 30 days of inactivity

### `messages` Table
- Stores all conversation messages
- Includes intent and emotional state
- Linked to sessions

### `chat_history` Table
- Stores conversation summaries for Chat ID continuity
- Allows users to resume conversations

---

## 🔍 Using the Database

### Automatic Features
Once database is connected:
- **All conversations are automatically saved**
- **Chat IDs work across server restarts**
- **Analytics are automatically collected**

### Analytics Endpoint
Access conversation analytics:
```
GET https://your-app.railway.app/api/analytics?days=7
```

**Example Response:**
```json
{
  "period": "Last 7 days",
  "data": [
    {
      "total_sessions": 45,
      "total_messages": 203,
      "active_users": 38,
      "intent": "fee_inquiry",
      "emotional_state": "frustrated",
      "count": 12
    },
    {
      "intent": "emotional_support",
      "emotional_state": "stressed",
      "count": 8
    }
  ]
}
```

---

## 💰 Cost

**Railway PostgreSQL Free Tier:**
- ✅ Up to 500 MB storage
- ✅ Shared CPU
- ✅ Perfect for testing and demos
- ✅ Part of $5/month free credit

**For your course project**: Free tier is more than enough!

---

## 🛠️ Troubleshooting

### Issue: "Database not available" in logs

**Solution:**
1. Check Railway dashboard - is PostgreSQL service running?
2. Go to Variables tab - is `DATABASE_URL` present?
3. Try redeploying the app

### Issue: Tables not created

**Solution:**
The app automatically creates tables on first connection. If you see errors:
1. Check database logs in Railway
2. Ensure PostgreSQL service is healthy
3. The app will retry on next restart

### Issue: Want to view data directly

**Solution:**
1. Railway dashboard → PostgreSQL service
2. Click "Data" tab
3. Or use **"psql"** command in Railway terminal

---

## 📈 Monitoring

### Check Database Usage
1. Railway dashboard → PostgreSQL service
2. View **Metrics** tab
3. See:
   - Storage used
   - Number of connections
   - Query performance

### View Stored Data
Access via Railway psql:
```sql
-- Count total sessions
SELECT COUNT(*) FROM sessions;

-- View recent messages
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- Get conversation stats
SELECT intent, COUNT(*) as count
FROM messages
GROUP BY intent;
```

---

## 🔒 Privacy & Data Retention

### Automatic Cleanup
The database includes cleanup features:
- Sessions older than 30 days are automatically deleted
- Complies with privacy requirements
- You can adjust retention in `services/database.js`

### Manual Cleanup
To clean old data manually:
```javascript
// In your code or via API
database.cleanupOldData();
```

---

## ⚙️ Configuration

### Environment Variables

**Required** (Auto-set by Railway):
- `DATABASE_URL` - PostgreSQL connection string

**Optional** (you can add):
- `DATABASE_POOL_SIZE` - Max connections (default: 10)
- `DATABASE_SSL` - Enable SSL (auto-enabled in production)

---

## 🎯 What's Different With/Without Database

### WITHOUT Database (Current)
- ✅ Works perfectly
- ✅ Fast (in-memory)
- ✅ Privacy-compliant (24hr expiry)
- ⚠️ Data lost on restart
- ⚠️ No analytics

### WITH Database
- ✅ Everything from above
- ✅ **Data persists** across restarts
- ✅ **Analytics available**
- ✅ **Better Chat ID continuity**
- ✅ **Long-term insights**
- ⚠️ Slightly slower (network calls)

---

## 📝 Summary

**To add database persistence to your Railway deployment:**

1. ✅ Code is ready (already pushed to GitHub)
2. ➡️ Go to Railway dashboard
3. ➡️ Click "+ New" → "Database" → "Add PostgreSQL"
4. ➡️ Wait 30 seconds for database to provision
5. ➡️ Redeploy your app
6. ✅ Done! Database is automatically connected

**Your chatbot will automatically use the database once `DATABASE_URL` is set.**

---

## 🆘 Need Help?

- Railway docs: https://docs.railway.app/databases/postgresql
- Check your deployment logs for database connection status
- The app gracefully handles no database (keeps working with in-memory cache)

---

**Happy deploying! Your chatbot now has enterprise-grade persistence! 🚀**

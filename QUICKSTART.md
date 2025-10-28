# 🚀 Quick Start Guide - Get Mara Running in 5 Minutes

## What You Need
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Node.js 18+ ([Download](https://nodejs.org))

## Local Development (3 Steps)

### 1. Install Dependencies
```bash
cd D:\Chuyuan_Documents\Ashley\mara-chatbot
npm install
```

### 2. Configure API Key
Open `.env` file and replace `your_openai_api_key_here` with your actual key:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx
```

### 3. Start Server
```bash
npm start
```

✅ **Done!** Open browser to `http://localhost:3001`

---

## Railway Deployment (5 Steps)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

### 2. Go to Railway
Visit [railway.app](https://railway.app) and login with GitHub

### 3. Deploy
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose `mara-chatbot`

### 4. Add Environment Variable
- Go to "Variables" tab
- Add: `OPENAI_API_KEY` = `your-api-key-here`

### 5. Get URL
- Go to "Settings" → "Generate Domain"
- Visit your live app! 🎉

---

## Test It Works

### Quick Test
1. Open the chat interface
2. Enter:
   - Name: "Test User"
   - Student Number: (leave blank)
3. Send: "Hello Mara"
4. You should get a friendly response!

### Full Test
Follow the 3 scenarios in `TESTING.md`

---

## What's Next?

- **Customize**: Edit `data/knowledge.json` to add more McMaster info
- **Adjust Personality**: Edit `utils/systemPrompts.js`
- **Add Contacts**: Edit `services/escalationService.js`
- **Monitor**: Check Railway logs for usage

---

## Need Help?

| Issue | Solution |
|-------|----------|
| "Module not found" | Run `npm install` |
| "OpenAI API key not configured" | Check `.env` file has correct key |
| Bot not responding | Check OpenAI API key has credits |
| Can't access on Railway | Check environment variables are set |

**Full docs**: See `README.md`, `DEPLOYMENT.md`, and `TESTING.md`

---

## Project Structure

```
mara-chatbot/
├── server.js          ← Main server
├── services/          ← AI services (intent, RAG, LLM, etc.)
├── data/              ← Knowledge base
├── public/            ← Chat interface
└── .env               ← Your API key (DON'T COMMIT!)
```

---

**That's it! You're ready to go! 🎓**

Questions? Check the full README.md or the deployment guide.

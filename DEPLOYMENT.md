# Railway Deployment Guide for Mara Chatbot

## Step-by-Step Deployment Instructions

### 1. Prepare Your Repository

First, initialize Git and push to GitHub:

```bash
cd D:\Chuyuan_Documents\Ashley\mara-chatbot

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Mara chatbot for McMaster remote students"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/mara-chatbot.git
git branch -M main
git push -u origin main
```

### 2. Sign Up / Log In to Railway

1. Go to [railway.app](https://railway.app)
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your GitHub account

### 3. Create New Project

1. Click "New Project" button
2. Select "Deploy from GitHub repo"
3. Choose your `mara-chatbot` repository
4. Railway will automatically detect it's a Node.js project

### 4. Configure Environment Variables

After deployment starts:

1. Click on your project
2. Go to the "Variables" tab
3. Add these environment variables:

```
OPENAI_API_KEY = sk-your-actual-openai-api-key-here
NODE_ENV = production
PORT = 3001
```

**Important**: Replace `sk-your-actual-openai-api-key-here` with your real OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)

### 5. Deploy

Railway will automatically:
- Install dependencies (`npm install`)
- Start your server (`npm start`)
- Assign a public URL

### 6. Get Your App URL

1. Go to "Settings" tab
2. Under "Domains", you'll see your Railway-provided domain
3. Click "Generate Domain" if not already generated
4. Your app will be live at: `https://your-app-name.up.railway.app`

### 7. Test Your Deployment

Visit your Railway URL and test:
- Chat interface loads ✓
- Can create a session ✓
- Can send messages ✓
- Bot responds appropriately ✓

### 8. Custom Domain (Optional)

To use your own domain:
1. Go to "Settings" → "Domains"
2. Click "Custom Domain"
3. Enter your domain name
4. Update your DNS records as instructed

## Troubleshooting

### Issue: "Application failed to respond"

**Solution**:
- Check Railway logs: Click "Deployments" → Select latest deployment → "View Logs"
- Ensure `OPENAI_API_KEY` is set correctly
- Verify `PORT` is set to `3001` or let Railway auto-assign

### Issue: "OpenAI API key not configured"

**Solution**:
- Go to Variables tab
- Check `OPENAI_API_KEY` is present and starts with `sk-`
- Redeploy: Click "Deploy" → "Redeploy"

### Issue: Bot not responding

**Solution**:
- Check Railway logs for errors
- Verify OpenAI API key has credits
- Test the API endpoint directly: `https://your-app.railway.app/health`

### Issue: "Cannot find module" errors

**Solution**:
- Ensure `package.json` is in root directory
- Check `node_modules` isn't in `.gitignore` (it should be)
- Railway will reinstall dependencies automatically

## Monitoring & Logs

### View Logs
1. Go to Railway dashboard
2. Click your project
3. Click "Deployments"
4. Click latest deployment
5. Click "View Logs"

### Check Metrics
Railway provides:
- CPU usage
- Memory usage
- Network traffic
- Request counts

## Updating Your Deployment

When you make changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push

# Railway automatically redeploys!
```

## Cost Considerations

### Railway Free Tier
- $5 free credit per month
- Suitable for testing and demos
- May sleep after inactivity

### OpenAI Costs
- GPT-4: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- Embeddings: ~$0.0001 per 1K tokens
- Monitor usage at [platform.openai.com](https://platform.openai.com/usage)

### Cost Optimization Tips
1. Use GPT-3.5-Turbo for testing (cheaper)
2. Limit conversation history to 10 messages
3. Cache common queries
4. Set OpenAI monthly spending limits

## Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Rotate API keys periodically**
3. **Use Railway environment variables** for secrets
4. **Enable CORS** only for your domain in production
5. **Monitor API usage** to detect anomalies

## Scaling (If Needed)

If your app gets popular:

1. **Upgrade Railway Plan**:
   - Hobby: $5/month
   - Pro: $20/month

2. **Add Vector Database**:
   - Pinecone (Railway integration available)
   - Weaviate
   - Qdrant

3. **Add Persistent Storage**:
   - Railway PostgreSQL
   - MongoDB Atlas

4. **Add Redis for Sessions**:
   - Railway Redis plugin
   - Upstash Redis

## Production Checklist

Before sharing with users:

- [ ] OpenAI API key is set in Railway
- [ ] Health check endpoint returns 200: `/health`
- [ ] Frontend loads correctly
- [ ] Test all 3 scenarios from K-scripts
- [ ] Crisis detection works (routes to wellness)
- [ ] Chat IDs are generated and displayed
- [ ] Contact information is accurate
- [ ] Error messages are user-friendly
- [ ] Logs show no critical errors
- [ ] Set up usage alerts on OpenAI dashboard

## Support & Resources

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **OpenAI Documentation**: [platform.openai.com/docs](https://platform.openai.com/docs)

## Quick Reference Commands

```bash
# Local development
npm install
npm start

# Push to GitHub (triggers Railway deploy)
git add .
git commit -m "Update"
git push

# View Railway logs
railway logs

# Deploy to Railway manually
railway up
```

## Example Deployment Flow

```
Local Development → GitHub Push → Railway Auto-Deploy → Live App
     ↓                   ↓              ↓                  ↓
   Test on          Commit &      Build & Start      Test in Production
  localhost:3001      Push       (npm install +          on Railway URL
                                   npm start)
```

## Need Help?

1. Check Railway logs first
2. Review this deployment guide
3. Check main README.md
4. Verify environment variables
5. Test OpenAI API key directly at platform.openai.com

---

**Ready to deploy?** Follow steps 1-7 above and your Mara chatbot will be live in minutes! 🚀

# 🚀 Deployment Guide: Fusion 360 API Documentation MCP Server

This guide covers multiple hosting options for deploying your MCP server as a public web service.

## 🌟 Quick Start: Railway (Recommended)

Railway is the fastest and easiest way to deploy this service.

### 1. **Prepare Your Repository**

First, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Fusion 360 API MCP Server"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fusion360-docs-mcp.git
git push -u origin main
```

### 2. **Deploy to Railway**

1. Visit [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will automatically:
   - Detect it's a Python project
   - Install dependencies from `requirements.txt`
   - Run `python fusion360_docs_server_web.py`
   - Assign a public URL (e.g., `https://your-app.railway.app`)

**That's it!** ✅ Your service will be live in ~2 minutes.

### 3. **Configure for MCP Usage**

Once deployed, update your Claude Desktop config to use the web version:

```json
{
    "mcpServers": {
        "fusion360-docs": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-fetch", "YOUR_RAILWAY_URL"]
        }
    }
}
```

Replace `YOUR_RAILWAY_URL` with your Railway app URL.

---

## 🔧 Alternative Hosting Options

### Option 2: Render.com

1. **Connect Repository**:
   - Go to [render.com](https://render.com)
   - **New** → **Web Service** → **Connect GitHub**
   - Select your repository

2. **Configure**:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python fusion360_docs_server_web.py`
   - **Plan**: Free (or paid for better performance)

3. **Deploy**: Click **Create Web Service**

### Option 3: Fly.io

1. **Install Fly CLI**:
   ```bash
   # macOS
   brew install flyctl
   
   # Linux/WSL
   curl -L https://fly.io/install.sh | sh
   ```

2. **Deploy**:
   ```bash
   fly launch
   # Follow prompts, select region
   fly deploy
   ```

### Option 4: Google Cloud Run

1. **Install gcloud CLI**
2. **Build and Deploy**:
   ```bash
   gcloud run deploy fusion360-docs-mcp \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

## 🔍 Testing Your Deployment

### 1. **Health Check**

Visit your deployed URL in a browser. You should see the MCP server interface.

### 2. **Test MCP Tools**

Use the MCP inspector or test directly:

```bash
# Test the health check tool
curl -X POST https://your-app.railway.app/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "health_check", "arguments": {}}'
```

### 3. **Test Fusion 360 API Query**

```bash
curl -X POST https://your-app.railway.app/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "analyze_arrange3d_definition", "arguments": {}}'
```

---

## ⚙️ Configuration

### Environment Variables

All hosting platforms support these optional environment variables:

- `PORT` - Server port (auto-set by most platforms)
- `CACHE_DIR` - Cache directory path (default: `cache`)

### Custom Domain (Optional)

Most platforms allow custom domains:

- **Railway**: Project Settings → Domains
- **Render**: Service → Settings → Custom Domains  
- **Fly.io**: `fly certs add yourdomain.com`

---

## 📊 Monitoring & Maintenance

### Health Monitoring

Your deployment includes a health check endpoint at `/health` that returns:
```json
{"status": "healthy", "message": "🟢 Fusion 360 API Documentation MCP Server is running!"}
```

### Logs

View logs to monitor performance:

- **Railway**: Project → Deployments → View Logs
- **Render**: Service → Logs tab
- **Fly.io**: `fly logs`

### Cache Management

The server automatically caches API documentation for faster responses. Cache is stored in the `cache/` directory and persists between deployments on most platforms.

---

## 🛡️ Security Considerations

### Rate Limiting

Consider adding rate limiting for public APIs:

```python
# Add to fusion360_docs_server_web.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

### CORS (if needed)

For browser access, add CORS headers:

```python
# Add CORS middleware if needed
from starlette.middleware.cors import CORSMiddleware
```

---

## 💰 Cost Estimates

| Platform | Free Tier | Paid Plans Start |
|----------|-----------|------------------|
| **Railway** | $5/month of usage | $5/month |
| **Render** | 750 hours/month | $7/month |
| **Fly.io** | 3 VMs, 160GB/month | $2.67/month |
| **Google Cloud Run** | 2M requests/month | Pay per use |

---

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails**: Check `requirements.txt` has correct versions
2. **Server Won't Start**: Verify `PORT` environment variable
3. **Slow Responses**: First requests fetch from Autodesk APIs (normal)
4. **Cache Issues**: Delete and redeploy to clear cache

### Getting Help

- Check platform-specific logs for error details
- Test locally first: `python fusion360_docs_server_web.py`
- Verify all dependencies install correctly

---

## 🎯 Next Steps

Once deployed, you can:

1. **Configure Claude Desktop** to use your hosted MCP server
2. **Share the URL** with team members
3. **Monitor usage** through platform dashboards
4. **Scale up** to paid plans for better performance
5. **Add custom features** like authentication, rate limiting, etc.

Your Fusion 360 API documentation is now available as a public MCP service! 🎉 
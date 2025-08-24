# 🚀 PixelSqueeze Deployment Guide

## 🚨 **Current Issue: Frontend-Backend Mismatch**

Your frontend is deployed on **Vercel** but trying to call backend APIs that don't exist there, causing **502 Bad Gateway** errors.

## 🔍 **Problem Analysis**

- **Frontend**: ✅ Deployed on Vercel (`pixelsqueeze-rho.vercel.app`)
- **Backend**: ❌ Not deployed or deployed elsewhere
- **API Calls**: ❌ Going to Vercel instead of your backend server
- **Error**: `502 Bad Gateway` when calling `/api/admin/users`

## 🎯 **Solution: Configure Backend URL**

### **Step 1: Deploy Your Backend**

You need to deploy your Node.js backend to a platform that supports it:

#### **Option A: Render (Recommended)**
```bash
# 1. Go to render.com and create account
# 2. Connect your GitHub repository
# 3. Create new Web Service
# 4. Set build command: npm install
# 5. Set start command: npm start
# 6. Set environment variables (see below)
```

#### **Option B: Heroku**
```bash
# 1. Install Heroku CLI
# 2. Login: heroku login
# 3. Create app: heroku create your-app-name
# 4. Deploy: git push heroku main
# 5. Set environment variables
```

#### **Option C: Railway**
```bash
# 1. Go to railway.app
# 2. Connect GitHub repository
# 3. Deploy automatically
# 4. Set environment variables
```

### **Step 2: Set Environment Variables**

#### **Backend Environment Variables**
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Port
PORT=5002

# Other configs from your .env file
```

#### **Frontend Environment Variables (Vercel)**
```env
# Set this in Vercel Dashboard > Settings > Environment Variables
NEXT_PUBLIC_API_URL=https://your-backend-server.onrender.com
```

### **Step 3: Configure Vercel**

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Settings > Environment Variables**
4. **Add:**
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://your-backend-server.onrender.com`
   - **Environment**: Production (and Preview if needed)
5. **Redeploy** your frontend

## 🔧 **Current Configuration Status**

### **What We've Fixed:**
- ✅ **API Calls**: Now use `buildApiUrl()` function
- ✅ **Error Handling**: Better error messages and retry functionality
- ✅ **Health Checks**: API endpoint monitoring
- ✅ **Configuration Check**: Deployment status monitoring

### **What You Need to Do:**
1. **Deploy backend** to Render/Heroku/Railway
2. **Set `NEXT_PUBLIC_API_URL`** in Vercel
3. **Redeploy frontend**

## 📱 **How to Test the Fix**

### **1. Check Configuration Status**
- Go to `/admin` dashboard
- Look for "Configuration Status" section
- Should show "Production Configuration OK" when fixed

### **2. Test API Health**
- Same dashboard has "API Health Status"
- All endpoints should show "healthy" status
- Response times should be reasonable

### **3. Test User Management**
- Go to `/admin/users`
- Should load users without errors
- No more 502 Bad Gateway errors

## 🚀 **Quick Deployment Commands**

### **For Render:**
```bash
# 1. Push latest code
git push origin main

# 2. Go to render.com and deploy
# 3. Copy the URL (e.g., https://pixelsqueeze.onrender.com)

# 4. Set in Vercel
NEXT_PUBLIC_API_URL=https://pixelsqueeze.onrender.com
```

### **For Heroku:**
```bash
# 1. Add Heroku remote
heroku git:remote -a your-app-name

# 2. Deploy
git push heroku main

# 3. Set environment variables
heroku config:set MONGODB_URI=your_mongo_uri
heroku config:set JWT_SECRET=your_jwt_secret

# 4. Copy URL and set in Vercel
NEXT_PUBLIC_API_URL=https://your-app-name.herokuapp.com
```

## 🔍 **Troubleshooting**

### **Still Getting 502 Errors?**
1. **Check backend logs** on your deployment platform
2. **Verify backend is running** (check status page)
3. **Test backend directly** (curl your-backend-url/api/admin/users)
4. **Check environment variables** are set correctly

### **Frontend Not Updating?**
1. **Clear Vercel cache** and redeploy
2. **Check environment variables** are set for Production
3. **Verify build logs** for any errors

### **Database Connection Issues?**
1. **Check MongoDB URI** is correct
2. **Verify network access** (IP whitelist if needed)
3. **Check database credentials**

## 📊 **Expected Results After Fix**

- ✅ **No more 502 errors**
- ✅ **Admin dashboard loads properly**
- ✅ **User management works**
- ✅ **API health shows all green**
- ✅ **Configuration status shows "OK"**

## 🆘 **Need Help?**

If you're still having issues:

1. **Check the Configuration Status** component on `/admin`
2. **Review API Health Check** for specific endpoint errors
3. **Check browser console** for detailed error messages
4. **Verify backend deployment** is successful

## 🎉 **Success Checklist**

- [ ] Backend deployed and running
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] Frontend redeployed
- [ ] No 502 errors
- [ ] Admin dashboard loads
- [ ] API health check passes
- [ ] Configuration status shows "OK"

---

**Remember**: The frontend and backend are separate deployments. Vercel hosts your React app, but you need another platform for your Node.js server! 🚀

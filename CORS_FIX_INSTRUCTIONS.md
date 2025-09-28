# CORS Fix Instructions

## 🚨 **URGENT: Update Render Environment Variables**

The CORS policy has been fixed in the code, but you need to update your Render deployment environment variables to complete the fix.

### **Step 1: Update Render Environment Variables**

1. Go to your Render dashboard: https://dashboard.render.com
2. Navigate to your PixelSqueeze backend service
3. Go to **Environment** tab
4. Add these new environment variables:

```
FRONTEND_URL=https://pixelsqueeze-rho.vercel.app
ADMIN_URL=https://pixelsqueeze-rho.vercel.app/admin
```

### **Step 2: Redeploy**

After adding the environment variables, trigger a redeploy:
- Click **Manual Deploy** → **Deploy latest commit**

### **Step 3: Test**

Once deployed, test your Vercel frontend:
- Go to https://pixelsqueeze-rho.vercel.app/images
- The CORS errors should be resolved
- API calls should work properly

## **What Was Fixed**

### **Code Changes Made:**
1. **Updated CORS Configuration** (`server/services/securityService.js`)
   - Added `https://pixelsqueeze-rho.vercel.app` to allowed origins
   - Added `https://pixelsqueeze.vercel.app` as backup domain
   - Improved CORS callback logic

2. **Updated Environment Template** (`env.example`)
   - Added `FRONTEND_URL` and `ADMIN_URL` variables
   - Documented CORS configuration

### **Root Cause:**
The CORS policy was blocking requests from your Vercel frontend (`https://pixelsqueeze-rho.vercel.app`) to your Render backend (`https://pixelsqueeze.onrender.com`) because the frontend URL wasn't in the allowed origins list.

### **Error Messages Fixed:**
- `Access to XMLHttpRequest at 'https://pixelsqueeze.onrender.com/api/auth/me' from origin 'https://pixelsqueeze-rho.vercel.app' has been blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header is present on the requested resource`

## **Verification**

After updating the environment variables and redeploying, you should see:
- ✅ No CORS errors in browser console
- ✅ Successful API calls to `/api/auth/me`
- ✅ Successful API calls to `/api/images`
- ✅ Authentication working properly
- ✅ Images loading correctly

## **Next Steps**

Once CORS is fixed:
1. Test all major features (login, image upload, compression)
2. Verify admin panel access
3. Test payment flows
4. Check mobile responsiveness

---

**Note:** The code changes have been pushed to GitHub. You just need to update the Render environment variables and redeploy.

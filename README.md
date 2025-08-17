# PixelSqueeze - Cloud Image Optimization Platform

A fully web-based SaaS platform for image optimization with API service for third-party integrations.

## 🚀 Features

### Web Application
- Drag-and-drop image optimization interface
- Real-time optimization (JPG/PNG)
- Before/After size comparison
- Bulk download as ZIP
- User authentication & usage statistics
- **Advanced Admin Panel** with analytics and user management
- **Real-time notifications** with customizable themes and sounds
- **Comprehensive analytics dashboard** for business insights

### REST API Service
- `POST /api/optimize` - Upload and optimize images
- `POST /api/optimize-url` - Optimize images from URLs
- `GET /api/stats` - Get usage statistics
- API key authentication
- Rate limiting and usage tracking
- **Advanced image processing** with watermarks and transformations
- **Batch processing** capabilities for multiple images

### Subscription Plans
- **Free Tier**: 100 images/month, max 2MB each
- **Starter**: 5,000 images - $9/month
- **Pro**: 20,000 images - $29/month
- **Enterprise**: 100,000 images - $99/month

### Payment Processing
- **Stripe Integration**: Secure payment processing
- **Subscription Management**: Automatic billing and plan upgrades
- **Billing Portal**: Self-service billing management
- **Webhook Handling**: Real-time subscription updates

## 🛠 Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Next.js + TypeScript
- **Database**: MongoDB
- **Image Processing**: Sharp + Imagemin
- **Storage**: AWS S3
- **Payments**: Stripe
- **Authentication**: JWT + API Keys
- **Real-time**: WebSocket support
- **Push Notifications**: Web Push + Firebase
- **Analytics**: Custom analytics engine

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB
- AWS S3 bucket
- Stripe account

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd pixelsqueeze
```

2. **Install dependencies**
```bash
npm install
cd client && npm install
```

3. **Environment configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/pixelsqueeze

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# API
API_RATE_LIMIT=100
API_RATE_LIMIT_WINDOW=900000
```

4. **Start development servers**
```bash
# Start both backend and frontend
npm run dev

# Or start separately
npm run server:dev
npm run client:dev
```

5. **Build for production**
```bash
npm run build
npm start
```

## 🏗 Project Structure

```
pixelsqueeze/
├── client/                 # Next.js frontend
│   ├── components/        # React components
│   ├── pages/            # Next.js pages
│   ├── hooks/            # Custom React hooks
│   └── types/            # TypeScript type definitions
├── server/                # Express.js backend
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   ├── models/           # MongoDB models
│   └── middleware/       # Express middleware
├── docs/                  # Project documentation
└── shared/                # Shared utilities
```

## 🚀 Deployment

### Vercel (Frontend)
```bash
cd client
vercel --prod
```

### Render/Heroku (Backend)
```bash
git push heroku main
```

## 📊 Current Status

✅ **Phase 1**: Core Image Optimization  
✅ **Phase 2**: User Authentication & Plans  
✅ **Phase 3**: Payment Integration  
✅ **Phase 4**: Advanced Features  
✅ **Phase 5**: System Integration  
✅ **Phase 6**: User Experience Enhancements  
✅ **Phase 7**: Advanced Analytics & Insights  

**Status**: 🎉 **PRODUCTION READY**

## 🔧 Development

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Comprehensive error handling

### Testing
- Manual testing completed
- Production deployment verified
- Performance monitoring enabled

## 📝 License

MIT License - see LICENSE file for details. 
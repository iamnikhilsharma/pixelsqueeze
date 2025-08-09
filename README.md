# PixelSqueeze - Cloud Image Optimization Platform

A fully web-based SaaS platform for image optimization with API service for third-party integrations.

## 🚀 Features

### Web Application
- Drag-and-drop image optimization interface
- Real-time optimization (JPG/PNG)
- Before/After size comparison
- Bulk download as ZIP
- User authentication & usage statistics

### REST API Service
- `POST /api/optimize` - Upload and optimize images
- `POST /api/optimize-url` - Optimize images from URLs
- `GET /api/stats` - Get usage statistics
- API key authentication
- Rate limiting and usage tracking

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
- **Frontend**: React + Next.js
- **Database**: MongoDB
- **Image Processing**: Sharp + Imagemin
- **Storage**: AWS S3
- **Payments**: Stripe
- **Authentication**: JWT + API Keys

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

4. **Configure Stripe (Optional)**
   
   For payment processing, set up Stripe:
   ```bash
   # Follow the detailed guide
   cat STRIPE_SETUP.md
   ```

5. **Start development servers**
```bash
npm run dev
```

- Backend API: http://localhost:5000
- Frontend: http://localhost:3000

## 🐳 Docker Deployment

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run
```

## 📚 API Documentation

### Authentication
All API requests require an API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

#### POST /api/optimize
Upload and optimize an image.

**Request:**
- Content-Type: multipart/form-data
- Body: image file

**Response:**
```json
{
  "success": true,
  "data": {
    "originalSize": 1024000,
    "optimizedSize": 256000,
    "compressionRatio": 75,
    "downloadUrl": "https://s3.amazonaws.com/...",
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

#### POST /api/optimize-url
Optimize an image from URL.

**Request:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "quality": 80
}
```

#### GET /api/stats
Get user's monthly usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "monthlyUsage": 1500,
    "planLimit": 5000,
    "planType": "starter",
    "remainingImages": 3500
  }
}
```

## 🔌 SDKs & Integrations

### PHP SDK
```php
require_once 'pixelsqueeze-php-sdk.php';

$pixelSqueeze = new PixelSqueeze('YOUR_API_KEY');
$result = $pixelSqueeze->optimize('path/to/image.jpg');
```

### Node.js SDK
```javascript
const PixelSqueeze = require('pixelsqueeze-node-sdk');

const pixelSqueeze = new PixelSqueeze('YOUR_API_KEY');
const result = await pixelSqueeze.optimize('path/to/image.jpg');
```

### WordPress Plugin
Automatically optimizes uploaded images using the PixelSqueeze API.

## 🏗 Project Structure

```
pixelsqueeze/
├── server/                 # Backend API
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── client/                # Frontend React app
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom hooks
│   └── utils/            # Frontend utilities
├── sdk/                   # SDK packages
│   ├── php/              # PHP SDK
│   ├── node/             # Node.js SDK
│   └── wordpress/        # WordPress plugin
└── docs/                 # Documentation
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="API"
```

## 📊 Monitoring

- API usage analytics
- Server performance metrics
- Error tracking and logging
- Admin dashboard for user management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- Email: support@pixelsqueeze.com
- Documentation: https://docs.pixelsqueeze.com
- API Status: https://status.pixelsqueeze.com 

## CI/CD

- GitHub Actions (example):
  - Add a workflow (e.g., `.github/workflows/ci.yml`) that runs `npm ci`, `npm run build`, and lints/tests.
  - Configure environment variables in GitHub secrets for any needed checks.
- Auto-deploy:
  - Render (server): connect repo, set start command `npm start`, set environment variables (including SMTP, SENTRY_DSN, CORS_ORIGIN), enable auto-deploy on push to `main`.
  - Vercel (client): import `client/`, set `NEXT_PUBLIC_API_URL`, enable preview deployments, and production on `main`. 
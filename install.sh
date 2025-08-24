#!/bin/bash

# PixelSqueeze Installation Script
echo "🚀 Installing PixelSqueeze..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads/temp
mkdir -p client/public

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your configuration before starting the application."
fi

# Create MongoDB initialization script
echo "📝 Creating MongoDB initialization script..."
mkdir -p scripts
cat > scripts/mongo-init.js << 'EOF'
// MongoDB initialization script
db = db.getSiblingDB('pixelsqueeze');

// Create collections
db.createCollection('users');
db.createCollection('images');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "apiKey": 1 }, { unique: true, sparse: true });
db.users.createIndex({ "subscription.stripeCustomerId": 1 });

db.images.createIndex({ "user": 1, "createdAt": -1 });
db.images.createIndex({ "status": 1 });
db.images.createIndex({ "expiresAt": 1 });
db.images.createIndex({ "storage.optimizedKey": 1 });

print('MongoDB initialization completed successfully!');
EOF

# Create Docker Compose override for development
echo "🐳 Creating Docker Compose development override..."
cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  backend:
    build:
      target: development
    volumes:
      - .:/app
      - /app/node_modules
      - ./logs:/app/logs
    environment:
      NODE_ENV: development
    command: npm run server:dev

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    volumes:
      - ./client:/app
      - /app/node_modules
      - /app/.next
    environment:
      NODE_ENV: development
    command: npm run dev
EOF

# Create client Dockerfile
echo "🐳 Creating client Dockerfile..."
cat > client/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
EOF

# Create health check script
echo "🏥 Creating health check script..."
cat > healthcheck.js << 'EOF'
const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 3000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on('error', () => {
  process.exit(1);
});

req.on('timeout', () => {
  req.destroy();
  process.exit(1);
});

req.end();
EOF

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next/
out/

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker
.dockerignore

# Uploads
uploads/
!uploads/.gitkeep

# Build outputs
build/
dist/

# Test outputs
coverage/
.nyc_output/

# Local development
*.local
EOF

# Create uploads directory with .gitkeep
mkdir -p uploads
touch uploads/.gitkeep

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start MongoDB (or use Docker Compose)"
echo "3. Run 'npm run dev' to start development servers"
echo ""
echo "🐳 Or use Docker Compose:"
echo "   docker-compose up -d"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 Documentation: README.md" 
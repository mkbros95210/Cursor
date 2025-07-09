#!/bin/bash

# Sports Betting Platform - Development Setup Script
echo "🎯 Setting up Sports Betting Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if MongoDB is running (optional)
if command -v mongo &> /dev/null || command -v mongod &> /dev/null; then
    echo "✅ MongoDB is available"
else
    echo "⚠️ MongoDB not found locally. Make sure to use MongoDB Atlas or install MongoDB"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd apps/backend
npm install
cd ../..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd apps/frontend
npm install
cd ../..

# Install admin dependencies
echo "📦 Installing admin dependencies..."
cd apps/admin
npm install
cd ../..

# Install shared dependencies
echo "📦 Installing shared dependencies..."
cd shared
npm install
npm run build
cd ..

# Create logs directory for backend
mkdir -p apps/backend/logs

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your MongoDB URI and other configurations"
echo "2. Start development servers with: npm run dev"
echo "3. Access applications at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Admin Panel: http://localhost:3001"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "📚 For detailed setup instructions, see README.md"
echo ""
echo "🚀 Happy coding!"
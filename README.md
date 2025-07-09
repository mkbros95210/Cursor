# 🎯 Sports Betting Platform - Full MERN Stack

A complete, production-ready sports betting platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js). Features real-time odds updates, secure payments, comprehensive admin panel, and modern responsive UI.

## 🚀 Features

### 🔐 Authentication & Security
- JWT-based authentication with role-based access control
- Secure password hashing with bcryptjs
- Rate limiting and brute-force protection
- Input validation with Zod schemas
- CORS and Helmet security middleware

### 🎮 User Features
- **Match Browsing**: Live, Upcoming, and Completed matches
- **Real-time Betting**: Place bets with live odds updates
- **Wallet System**: Secure deposit/withdrawal with Stripe & Razorpay
- **Bet History**: Complete betting history with filtering
- **Live Updates**: Real-time odds changes and match results
- **Responsive Design**: Mobile-first design with Tailwind CSS

### 🛠 Admin Panel
- **Match Management**: Create, edit, delete matches
- **Odds Control**: Real-time odds updates
- **User Management**: View, manage, ban users
- **Transaction Control**: Approve/reject withdrawals
- **Analytics Dashboard**: Revenue, user stats, betting insights
- **Banner Management**: Marketing banners and promotions
- **Real-time Monitoring**: Live bet placement tracking

### 💳 Payment Integration
- **Stripe**: International card payments
- **Razorpay**: Indian payment gateway
- **Secure Processing**: PCI-compliant payment handling
- **Multi-currency Support**: USD, INR, and more

### 🔄 Real-time Features
- **WebSocket Integration**: Socket.io for live updates
- **Odds Broadcasting**: Real-time odds changes
- **Match Results**: Instant result notifications
- **Bet Monitoring**: Live bet placement tracking
- **Notifications**: System-wide messaging

## 📁 Project Structure

```
sports-betting-platform/
├── apps/
│   ├── backend/          # Express.js API Server
│   │   ├── src/
│   │   │   ├── config/   # Database & app configuration
│   │   │   ├── models/   # MongoDB schemas
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middleware/ # Auth, validation, error handling
│   │   │   ├── services/ # Business logic & external APIs
│   │   │   └── utils/    # Helper functions
│   │   └── package.json
│   ├── frontend/         # React.js User Interface
│   │   ├── src/
│   │   │   ├── components/ # Reusable UI components
│   │   │   ├── pages/    # Application pages
│   │   │   ├── hooks/    # Custom React hooks
│   │   │   ├── services/ # API calls & utilities
│   │   │   ├── store/    # State management (Zustand)
│   │   │   └── utils/    # Helper functions
│   │   └── package.json
│   └── admin/           # React.js Admin Panel
│       ├── src/
│       │   ├── components/ # Admin-specific components
│       │   ├── pages/    # Admin pages
│       │   ├── hooks/    # Admin hooks
│       │   └── services/ # Admin API calls
│       └── package.json
├── shared/              # Shared types & utilities
│   ├── src/
│   │   ├── types/       # TypeScript interfaces
│   │   ├── schemas/     # Zod validation schemas
│   │   └── utils/       # Shared utility functions
│   └── package.json
├── .env.example        # Environment variables template
└── package.json       # Root workspace configuration
```

## 🛠 Tech Stack

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Zod schemas
- **Real-time**: Socket.io WebSockets
- **Payments**: Stripe & Razorpay
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Winston logger
- **Testing**: Jest with Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Real-time**: Socket.io client
- **UI Components**: Custom components with Headless UI
- **Forms**: React Hook Form with Zod validation

### DevOps & Deployment
- **Backend**: Railway, Render, or Heroku
- **Frontend**: Vercel or Netlify
- **Database**: MongoDB Atlas
- **CI/CD**: GitHub Actions (optional)
- **Monitoring**: Winston logs & error tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### 1. Clone & Install
```bash
git clone <repository-url>
cd sports-betting-platform

# Install all dependencies
npm run install:all

# Or install individually
npm install
cd apps/backend && npm install
cd ../frontend && npm install
cd ../admin && npm install
cd ../../shared && npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: MONGODB_URI, JWT_SECRET
# Optional: Payment gateway keys, email settings
```

### 3. Database Setup
```bash
# Start MongoDB locally or use MongoDB Atlas
# Create database: sports-betting

# The app will create collections automatically
```

### 4. Development
```bash
# Start all services (backend + frontends)
npm run dev

# Or start individually
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
npm run dev:admin     # http://localhost:3001
```

### 5. Access Applications
- **User Interface**: http://localhost:3000
- **Admin Panel**: http://localhost:3001
- **API Documentation**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health

## 🔧 Configuration

### Environment Variables
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/sports-betting
MONGODB_URI_PROD=mongodb+srv://user:pass@cluster.mongodb.net/sports-betting

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# Email (Optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🎯 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh token

### Matches
- `GET /api/v1/matches` - Get matches with filters
- `GET /api/v1/matches/:id` - Get single match
- `GET /api/v1/matches/featured/list` - Featured matches
- `GET /api/v1/matches/live/list` - Live matches

### Betting
- `POST /api/v1/bets` - Place a bet
- `GET /api/v1/bets/history` - User bet history
- `GET /api/v1/bets/:id` - Get specific bet
- `PATCH /api/v1/bets/:id/cancel` - Cancel bet

### Wallet
- `GET /api/v1/wallet/balance` - Get wallet balance
- `GET /api/v1/wallet/transactions` - Transaction history
- `POST /api/v1/wallet/deposit/stripe/intent` - Create payment intent
- `POST /api/v1/wallet/withdraw` - Request withdrawal

### Admin (Protected)
- `POST /api/v1/matches` - Create match
- `PUT /api/v1/matches/:id` - Update match
- `PATCH /api/v1/matches/:id/odds` - Update odds
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/users` - Manage users

## 🧪 Testing

```bash
# Run backend tests
npm run test:backend

# Run tests with coverage
cd apps/backend && npm run test -- --coverage

# Run tests in watch mode
cd apps/backend && npm run test:watch
```

## 🚀 Deployment

### Backend (Railway/Render)
1. Create account on Railway or Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy from main branch

### Frontend (Vercel/Netlify)
1. Create account on Vercel or Netlify
2. Connect GitHub repository
3. Set build command: `npm run build:frontend`
4. Set publish directory: `apps/frontend/dist`

### Database (MongoDB Atlas)
1. Create MongoDB Atlas account
2. Create cluster and database
3. Get connection string
4. Update MONGODB_URI_PROD

## 📊 Features Breakdown

### User Dashboard
- ✅ Account management
- ✅ Wallet balance & transactions
- ✅ Bet history with filters
- ✅ Live match updates
- ✅ Responsive mobile design

### Betting Interface
- ✅ Match browsing with filters
- ✅ Real-time odds display
- ✅ Bet slip with multiple selections
- ✅ Live betting on ongoing matches
- ✅ Instant bet confirmation

### Admin Panel
- ✅ Dashboard with analytics
- ✅ Match CRUD operations
- ✅ Real-time odds management
- ✅ User management & banning
- ✅ Transaction approval system
- ✅ Banner & promotion management

### Payment System
- ✅ Stripe integration for cards
- ✅ Razorpay for Indian users
- ✅ Secure wallet system
- ✅ Withdrawal approval workflow
- ✅ Transaction history

### Real-time Features
- ✅ Live odds updates
- ✅ Match result broadcasting
- ✅ Real-time notifications
- ✅ Admin bet monitoring
- ✅ Socket.io integration

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcryptjs
- ✅ Input validation with Zod
- ✅ Rate limiting by IP
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ SQL injection prevention
- ✅ XSS protection

## 📱 Mobile Responsiveness

- ✅ Mobile-first design approach
- ✅ Touch-friendly interface
- ✅ Responsive breakpoints
- ✅ Progressive Web App features
- ✅ Optimized for all screen sizes

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@sportsbetting.com or join our Discord community.

## 🎉 Acknowledgments

- MongoDB for the excellent database
- Stripe & Razorpay for payment processing
- Socket.io for real-time features
- The React and Node.js communities

---

**Built with ❤️ by the Sports Betting Platform Team**
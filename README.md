# FitForge 💪

A progressive web application for tracking workouts with AI-powered analysis and cloud synchronization.

![Status](https://img.shields.io/badge/Status-Production-green)
![AWS](https://img.shields.io/badge/AWS-Deployed-orange)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## 🎯 Overview

FitForge is a personal fitness tracking application designed for serious strength training enthusiasts. It combines progressive overload tracking with AI-powered workout analysis to optimize training results.

**Live Demo**: [https://www.barani.org/fitforge/](https://www.barani.org/fitforge/)

## ✨ Features

### Core Functionality
- **📊 Progressive Workout Tracking**: Track sets, reps, weight, and RPE for each exercise
- **🤖 AI-Powered Analysis**: Get personalized insights and recommendations using Claude AI
- **☁️ Cloud Sync**: Automatic synchronization with AWS backend
- **📱 PWA Support**: Install as a mobile app for offline access
- **🎨 Visual Workout Selector**: Beautiful card-based UI for workout selection
- **📈 Progress Metrics**: Track hard sets, tonnage, and training intensity

### Advanced Features
- **🔄 Cycle-Based Training**: Complete training cycles trigger AI analysis
- **💾 Offline Support**: LocalStorage fallback when offline
- **📝 Workout History**: View and analyze past workouts
- **🎯 RPE Tracking**: Rate of Perceived Exertion for autoregulation
- **🏋️ Exercise Skipping**: Skip exercises with tracking
- **📓 Session Notes**: Add notes to each workout

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS Account (for deployment)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/fitforge.git
cd fitforge

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Set up environment variables
cp .env.example .env
# Edit .env with your AWS credentials
```

### Development

```bash
# Start the development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  CloudFront  │────▶│  S3 Static  │
│     PWA     │     │     CDN      │     │   Hosting   │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       │ HTTPS
       ▼
┌──────────────┐    ┌──────────────┐    ┌─────────────┐
│ API Gateway  │───▶│    Lambda    │───▶│  DynamoDB   │
│   (HTTP)     │    │   Function   │    │   (NoSQL)   │
└──────────────┘    └──────────────┘    └─────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐    ┌──────────────┐
│   Cognito    │    │ Claude API   │
│    Auth      │    │   Analysis   │
└──────────────┘    └──────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **React 18**: UI framework with hooks
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **AWS Amplify**: Authentication and API integration

### Backend
- **AWS Lambda**: Serverless compute
- **Express.js**: API routing
- **DynamoDB**: NoSQL database
- **API Gateway**: HTTP API
- **Cognito**: User authentication

### Infrastructure
- **CloudFront**: CDN for global distribution
- **S3**: Static website hosting
- **AWS SAM**: Infrastructure as code
- **GitHub Actions**: CI/CD pipeline

## 📂 Project Structure

```
fitforge/
├── src/
│   ├── components/        # React components
│   │   ├── WorkoutTracker.jsx
│   │   ├── WorkoutSelector.jsx
│   │   ├── WorkoutHistory.jsx
│   │   └── Login.jsx
│   ├── services/          # API services
│   │   └── workoutService.js
│   ├── styles/            # CSS files
│   ├── App.jsx           # Main app component
│   └── aws-config.js     # AWS configuration
├── backend/
│   ├── api/              # API routes
│   │   └── workoutAPI.js
│   ├── services/         # Backend services
│   │   ├── dynamoService.js
│   │   ├── claudeAnalysis.js
│   │   └── secretsManager.js
│   ├── database/         # Database schemas
│   └── index.js         # Lambda handler
├── dist/                 # Build output
├── deploy/               # Deployment scripts
└── docs/                # Documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# AWS Configuration
VITE_AWS_REGION=us-west-2
VITE_USER_POOL_ID=your-user-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
VITE_API_ENDPOINT=https://your-api.execute-api.region.amazonaws.com/prod

# Optional
VITE_ENABLE_DEBUG=false
```

### AWS Services Required
- Lambda (1 function)
- DynamoDB (1 table)
- API Gateway (1 HTTP API)
- Cognito (1 user pool)
- S3 (1 bucket)
- CloudFront (1 distribution)

## 📱 Progressive Web App

FitForge can be installed as a PWA:

1. Visit the app in a supported browser
2. Click the install prompt or use browser menu
3. App will be available offline with limited functionality

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Check code quality
npm run lint
```

## 📦 Deployment

### Automatic Deployment

Push to `main` branch triggers automatic deployment via GitHub Actions.

### Manual Deployment

```bash
# Deploy frontend
npm run build
aws s3 sync dist/ s3://your-bucket/fitforge/
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/fitforge/*"

# Deploy backend
cd backend
sam build
sam deploy --stack-name fitforge-backend
```

## 📊 Workout Programs

### Available Templates
- **Workout A**: Push Day (Power Focus)
- **Workout B**: Pull Day (Width Focus)
- **Workout C**: Push Day (Hypertrophy)
- **Workout D**: Pull Day (Strength)
- **Workout E**: Leg Day
- **Optional**: Recovery & Mobility

### Training Cycle
Complete all selected workouts to trigger AI analysis and recommendations.

## 🔐 Security

- Authentication via AWS Cognito
- JWT token validation
- CORS configured for specific origins
- API rate limiting
- Encrypted data transmission (HTTPS)
- Secure secret storage (AWS Secrets Manager)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👨‍💻 Author

**Igor Barani**
- Website: [barani.org](https://barani.org)
- GitHub: [@ibarani](https://github.com/ibarani)

## 🙏 Acknowledgments

- AWS for cloud infrastructure
- Anthropic for Claude AI integration
- React team for the amazing framework
- Tailwind CSS for beautiful styling

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Contact via the website

---

Built with ❤️ for the fitness community
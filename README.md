# 🏥 SithaMithuru - Elder Safety & Care System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.73-61dafb.svg)](https://reactnative.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-ffca28.svg)](https://firebase.google.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-ff6f00.svg)](https://www.tensorflow.org/)

> **Offline-First Elder Safety & Care Mobile Application**  
> An innovative Android-based solution designed to support elderly individuals living independently by ensuring their safety, daily well-being, and emergency support.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**SithaMithuru** addresses a critical gap in elder care in Sri Lanka, where many elderly people live alone or spend long hours without supervision. Existing digital solutions often require continuous internet connectivity and are not designed with elder-friendly interfaces.

This application provides:
- ✅ **Offline-first architecture** - Works reliably without internet
- ✅ **AI-powered emergency detection** - Detects emergency keywords in Sinhala, Tamil, and English
- ✅ **Elder-friendly interface** - Large buttons, simple navigation, high contrast
- ✅ **Guardian monitoring** - Real-time status updates and risk-level alerts
- ✅ **Daily support features** - Medicine reminders, task tracking, mood logging

---

## 🎯 Problem Statement

Elderly individuals face several challenges:

- ❌ Difficulty remembering daily tasks and medications
- ❌ Delayed help during emergencies
- ❌ Lack of continuous monitoring by family members
- ❌ Dependence on internet-based solutions
- ❌ Complex user interfaces not suitable for elders

**Current solutions:**
- Require internet connectivity
- Do not support local languages well
- Do not provide intelligent emergency detection
- Are not designed for low digital literacy users

---

## 🚀 Key Features

### 🔴 1. Offline Emergency Keyword Detection (AI-based)

**Most Innovative Feature** - Uses on-device TensorFlow Lite CNN model

- Detects emergency phrases in **Sinhala**, **Tamil**, and **English**:
  - 🇱🇰 "උදව් කරන්න", "අම්මෝ", "අනතුරක්"
  - 🇮🇳 "உதவி செய்யுங்கள்", "ஆபத்து"
  - 🇬🇧 "Help me", "Emergency", "Help"
- Works **completely offline**
- Automatically triggers SOS alerts
- < 100ms inference time

### 🟡 2. Context-Aware Guardian Monitoring

Uses rule-based risk levels:
- 🟢 **Green** - Normal (all tasks completed, medicines taken)
- 🟡 **Yellow** - Warning (missed doses, irregular activity)
- 🔴 **Red** - Emergency (SOS triggered, prolonged inactivity)

Reduces unnecessary alerts and notifies guardians only when required.

### 🟢 3. Offline-First Daily Support

- 💊 **Medicine Reminders** - Scheduled notifications with adherence tracking
- ✅ **Daily Task Tracking** - Simple checklist interface
- 😊 **Mood Logging** - Emoji-based mood selection
- 💾 **Local Data Storage** - SQLite database for offline operation
- 🔄 **Background Sync** - Automatic sync when internet is available

### 👴 Elder Mode Features

- Large, easy-to-tap buttons
- High contrast UI
- Voice feedback
- Emergency SOS button (always accessible)
- Simplified navigation

### 👨‍👩‍👧 Guardian Mode Features

- Real-time elder status dashboard
- Medication adherence monitoring
- Emergency alert notifications
- Risk-level tracking
- Location tracking
- Activity timeline

---

## 🛠 Technology Stack

### Mobile Application
- **Framework**: React Native 0.73
- **Language**: TypeScript
- **State Management**: React Context + Hooks
- **Local Database**: SQLite (react-native-sqlite-storage)
- **Navigation**: React Navigation 6
- **AI/ML**: TensorFlow Lite
- **Audio**: react-native-audio-recorder-player
- **Maps**: react-native-maps

### Backend Server
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Push Notifications**: Firebase Cloud Messaging
- **Real-time**: Socket.io

### AI/ML
- **Framework**: TensorFlow 2.15
- **Model**: CNN for keyword spotting
- **Features**: MFCC (Mel-frequency cepstral coefficients)
- **Deployment**: TensorFlow Lite
- **Training**: Python + Jupyter

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Testing**: Jest + React Native Testing Library
- **Code Quality**: ESLint + Prettier

---

## 🏗 Architecture

```
┌─────────────────────────────────────────┐
│     Mobile App (React Native)           │
│  ┌────────────┐    ┌────────────┐      │
│  │ Elder Mode │    │Guardian Mode│      │
│  └────────────┘    └────────────┘      │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  AI Emergency Detection (TFLite) │  │
│  └──────────────────────────────────┘  │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │    Local Database (SQLite)       │  │
│  └──────────────────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
               │ HTTPS / WebSocket
               │
┌──────────────▼───────────────────────────┐
│      Backend Server (Node.js)            │
│  ┌──────────────────────────────────┐   │
│  │  Risk Assessment | Notifications  │   │
│  └──────────────────────────────────┘   │
└──────────────┬───────────────────────────┘
               │
               │ Firebase SDK
               │
┌──────────────▼───────────────────────────┐
│         Firebase Services                │
│  Firestore | Auth | FCM | Storage        │
└──────────────────────────────────────────┘
```

For detailed architecture, see [ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Android Studio** (for Android development)
- **Python** 3.8+ (for AI model training)
- **Firebase** account
- **Git**

### Quick Setup

1. **Clone the repository**
```bash
git clone https://github.com/dilminekanayaka/SithaMithuru-Elder-Care-System.git
cd SithaMithuru-Elder-Care-System
```

2. **Run the setup script**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. **Configure Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Download `google-services.json` and place in `mobile/android/app/`
   - Download Firebase Admin SDK key and update `backend/.env`

4. **Start the backend**
```bash
cd backend
npm run dev
```

5. **Start the mobile app**
```bash
cd mobile
npm start
# In another terminal
npm run android
```

For detailed setup instructions, see [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)

---

## 📁 Project Structure

```
SithaMithuru-Elder-Care-System/
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # App screens
│   │   ├── services/      # Business logic
│   │   ├── database/      # SQLite database
│   │   └── assets/        # Images, fonts, models
│   └── android/           # Android native code
│
├── backend/               # Node.js backend server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── middleware/    # Express middleware
│   └── tests/             # Backend tests
│
├── model_training/        # AI model training
│   ├── notebooks/         # Jupyter notebooks
│   ├── src/               # Training scripts
│   └── models/            # Trained models
│
├── docs/                  # Documentation
├── firebase/              # Firebase configuration
└── scripts/               # Utility scripts
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete structure.

---

## 💻 Development

### Mobile Development

```bash
cd mobile

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run tests
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

### Backend Development

```bash
cd backend

# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### AI Model Training

```bash
cd model_training

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Train model
python src/training/train.py

# Evaluate model
python src/training/evaluate.py

# Convert to TFLite
python src/utils/convert_to_tflite.py
```

---

## 🧪 Testing

### Unit Tests
```bash
# Mobile
cd mobile && npm test

# Backend
cd backend && npm test
```

### Integration Tests
```bash
# Backend
cd backend && npm run test:integration
```

### E2E Tests
```bash
# Mobile (using Detox)
cd mobile && npm run test:e2e
```

---

## 🚢 Deployment

### Mobile App (Android)

```bash
cd mobile/android
./gradlew assembleRelease
```

APK will be generated in `mobile/android/app/build/outputs/apk/release/`

### Backend Server

Deploy to your preferred platform:
- **AWS**: See deployment guide

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Dilmin Ekanayaka**
- **Denethmi Ranasinghe**
- **Shiwanthaka Savinda**
- **Thisara Warshan**
- **Ravindu Kushan**
- **Pubudu Almeda**

---

## 📞 Contact

- **GitHub**: [https://github.com/dilminekanayaka/SithaMithuru-Elder-Care-System](https://github.com/dilminekanayaka/SithaMithuru-Elder-Care-System)



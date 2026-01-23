# 🏥 SithaMithuru - Elder Safety & Care System

> **Offline-First Elder Safety & Care Mobile Application**  
> An innovative Android-based solution designed to support elderly individuals living independently.

---

## 📋 Overview

**SithaMithuru** addresses elder care challenges in Sri Lanka by providing:
- ✅ **Offline-first architecture** - Works reliably without internet
- ✅ **AI-powered emergency detection** - Detects emergency keywords in Sinhala, Tamil, and English
- ✅ **Elder-friendly interface** - Large buttons, simple navigation, high contrast
- ✅ **Guardian monitoring** - Real-time status updates and risk-level alerts
- ✅ **Daily support features** - Medicine reminders, task tracking, mood logging

---

## 🚀 Key Features

### 🔴 Offline Emergency Keyword Detection (AI-based)
- Uses on-device TensorFlow Lite CNN model
- Detects emergency phrases in **Sinhala**, **Tamil**, and **English**
- Works **completely offline**
- < 100ms inference time

### 🟡 Context-Aware Guardian Monitoring
- 🟢 **Green** - Normal
- 🟡 **Yellow** - Warning
- 🔴 **Red** - Emergency

### 🟢 Offline-First Daily Support
- 💊 Medicine Reminders
- ✅ Daily Task Tracking
- 😊 Mood Logging
- 💾 Local Data Storage (SQLite)
- 🔄 Background Sync

---

## 🛠 Technology Stack

### Mobile Application
- React Native 0.73
- TypeScript
- SQLite
- TensorFlow Lite
- Firebase (Auth, Firestore, FCM, Storage)

### Backend Server
- Node.js 18+
- Express.js
- TypeScript
- Firebase Firestore

### AI/ML
- TensorFlow 2.15
- Python
- CNN for keyword spotting
- MFCC feature extraction

---

## 📁 Project Structure

```
SithaMithuru-Elder-Care-System/
│
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── screens/       # App screens
│   │   ├── services/      # Business logic
│   │   ├── database/      # SQLite database
│   │   ├── navigation/    # Navigation
│   │   ├── hooks/         # Custom hooks
│   │   ├── context/       # Context providers
│   │   ├── assets/        # Images, fonts, models
│   │   ├── styles/        # Global styles
│   │   └── utils/         # Utilities
│   ├── package.json
│   └── tsconfig.json
│
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   ├── config/        # Configuration
│   │   └── utils/         # Utilities
│   ├── package.json
│   └── tsconfig.json
│
├── model_training/        # AI model training
│   ├── notebooks/         # Jupyter notebooks
│   ├── src/
│   │   ├── data/         # Data processing
│   │   ├── models/       # Model architectures
│   │   ├── training/     # Training scripts
│   │   └── utils/        # Utilities
│   ├── datasets/         # Training data
│   ├── models/           # Trained models
│   └── requirements.txt
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Android Studio
- Python 3.8+ (for AI model training)
- Firebase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/dilminekanayaka/SithaMithuru-Elder-Care-System.git
cd SithaMithuru-Elder-Care-System
```

2. **Install mobile dependencies**
```bash
cd mobile
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Configure Firebase**
   - Create a Firebase project
   - Download `google-services.json` → `mobile/android/app/`
   - Configure backend with Firebase Admin SDK

5. **Start development**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Mobile
cd mobile
npm start
npm run android
```

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

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the elderly community in Sri Lanka**

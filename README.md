# SithaMithuru – Smart Elder Care Assistance System

SithaMithuru is an **offline-first intelligent mobile application designed to support elderly individuals living independently in Sri Lanka**. The system improves safety, medication adherence, and guardian monitoring through **voice-based emergency detection, context-aware risk monitoring, and offline reminder systems**.

The platform is designed specifically for:

- Low-connectivity environments
- Low-end Android devices
- Elder-friendly accessibility

The system architecture includes **Elder Mode**, **Guardian Mode**, and a **cloud synchronization backend**.

---

# Project Overview

SithaMithuru addresses three major challenges faced by elderly individuals:

1. Forgetting medication
2. Difficulty requesting help during emergencies
3. Lack of visibility for guardians monitoring elderly relatives

To solve these problems, the system introduces three core innovations:

1. Offline Emergency Keyword Detection  
2. Context-Aware Guardian Risk Monitoring  
3. Offline-First Reminder and Safety Support  

The application supports **Sinhala, Tamil, and English**, ensuring accessibility for diverse users.

---

# Core Features

## 1. Offline Emergency Keyword Detection

The application continuously listens for predefined emergency phrases using a lightweight **TensorFlow Lite CNN model**.

Example emergency keywords:


### English
- "Help me"

When a keyword is detected:

1. The system triggers an emergency workflow
2. A confirmation countdown is shown
3. An emergency alert is generated
4. The guardian is notified

All processing happens **on-device without internet**.

---

## 2. Context-Aware Guardian Monitoring

Instead of sending excessive alerts, the system evaluates behaviour patterns to determine risk levels.

| Risk Level | Meaning |
|------------|--------|
| Green | Safe |
| Yellow | Needs Attention |
| Red | Critical Situation |

Risk evaluation considers:

- Missed medications
- Long inactivity
- Emergency events
- Behaviour trends

This approach reduces **alert fatigue for guardians**.

---

## 3. Offline-First Reminder System

The application is designed to work **fully offline**.

Offline features include:

- Medication reminders
- Daily task reminders
- Emergency detection
- Mood logging
- Behaviour tracking

All data is stored locally using **SQLite** and synchronized when internet becomes available.

---

# System Architecture

The system contains three major layers.

Elder Mobile App

├── Elder Mode UI
├── Emergency Detection Engine
├── Reminder Engine
├── Local Storage (SQLite)
└── Sync Manager

Backend API (Node.js)

├── Authentication Service
├── Risk Analysis Engine
└── Notification Service

Guardian Dashboard


The architecture follows an **offline-first design pattern**, ensuring system reliability in unstable network environments.

---

# Technology Stack

## Mobile Application

- Android (Kotlin / Java)
- TensorFlow Lite
- SQLite
- Android WorkManager
- AlarmManager
- Android Foreground Services

## Backend

- Node.js
- Express.js
- PostgreSQL
- REST APIs

## Cloud Infrastructure

- AWS
- Firebase Cloud Messaging (FCM)

## Machine Learning

- Python
- TensorFlow
- TensorFlow Lite
- MFCC Feature Extraction
- CNN Keyword Spotting Model

---

# Project Structure

backend/

mobile/

model_training/

README.md


---

# Machine Learning Model

The system uses a **Keyword Spotting CNN model**.

### Audio Processing Pipeline

Audio Input
↓
Noise Filtering
↓
MFCC Feature Extraction
↓
CNN Model
↓
Keyword Detection
↓
Emergency Trigger


### Model Specifications

| Parameter | Value |
|----------|------|
| Model Type | CNN |
| Input | MFCC features |
| Model Size | < 15MB |
| Inference Time | < 1 second |
| Target Precision | 85% |
| Target Recall | 80% |

---

# Installation Guide

## Clone Repository
git clone https://github.com/dilminekanayaka/sithamithuru.git

cd sithamithuru

# Backend Setup

cd backend
npm install
npm run dev


### Environment Variables
DB_HOST=
DB_USER=
DB_PASSWORD=
JWT_SECRET=
AWS_KEY=
FCM_KEY=


---

# Mobile App Setup

Open project in **Android Studio**

mobile-app/


Minimum Requirements:

- Android 8+
- 2GB RAM
- Microphone access

---

# ML Model Setup

cd ml-model
pip install -r requirements.txt
python train_model.py


Convert model to TensorFlow Lite:
python convert_to_tflite.py


---

# API Overview

## Authentication
POST /api/auth/register
POST /api/auth/login


## Elder Data
GET /api/elder/profile
POST /api/elder/reminder
POST /api/elder/mood



## Emergency
POST /api/emergency/trigger
GET /api/emergency/history


## Guardian
GET /api/guardian/dashboard
GET /api/guardian/risk-status


---

# Security Considerations

The system implements:

- Token-based authentication
- HTTPS encrypted API communication
- Role-based access control
- Local data encryption
- Secure guardian–elder linking

Privacy protection is critical because the system handles **sensitive health-related behaviour data**.

---

# Deployment

Backend deployment steps:
Docker Build
↓
AWS EC2 Deployment
↓
PostgreSQL Setup
↓
API Gateway
↓
FCM Integration


CI/CD pipelines can be integrated using:

- GitHub Actions
- AWS CodePipeline

---

# Future Improvements

- Fall detection using sensors
- AI-based behaviour prediction
- Smart wearable integration
- Telemedicine integration
- Advanced voice detection models

---

# Contributors

Group 5,
Batch 04,
BSc (Hons) Software Engineering  
Faculty of Computing  
CINEC Campus

---

# License

This project is released under the **MIT License**.




#!/bin/bash

# SithaMithuru Project Setup Script
# This script sets up the development environment for the SithaMithuru Elder Care System

set -e

echo "======================================"
echo "SithaMithuru Project Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js installation
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check npm installation
echo -e "${YELLOW}Checking npm installation...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"

# Check Python installation (for AI model training)
echo -e "${YELLOW}Checking Python installation...${NC}"
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}⚠ Python is not installed. AI model training will not be available.${NC}"
else
    PYTHON_CMD=$(command -v python3 || command -v python)
    echo -e "${GREEN}✓ Python $($PYTHON_CMD --version) detected${NC}"
fi

echo ""
echo "======================================"
echo "Installing Dependencies"
echo "======================================"
echo ""

# Install mobile app dependencies
echo -e "${YELLOW}Installing mobile app dependencies...${NC}"
cd mobile
npm install
echo -e "${GREEN}✓ Mobile app dependencies installed${NC}"
cd ..

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ..

# Setup Python environment for AI model training (if Python is available)
if command -v python3 &> /dev/null || command -v python &> /dev/null; then
    echo -e "${YELLOW}Setting up Python environment for AI model training...${NC}"
    cd model_training
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv 2>/dev/null || python -m venv venv
        echo -e "${GREEN}✓ Virtual environment created${NC}"
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
    deactivate
    
    cd ..
fi

echo ""
echo "======================================"
echo "Setting up Configuration Files"
echo "======================================"
echo ""

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✓ Backend .env file created${NC}"
    echo -e "${YELLOW}⚠ Please update backend/.env with your Firebase credentials${NC}"
else
    echo -e "${GREEN}✓ Backend .env file already exists${NC}"
fi

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "1. Configure Firebase:"
echo "   - Create a Firebase project at https://console.firebase.google.com"
echo "   - Download google-services.json (Android) and place in mobile/android/app/"
echo "   - Download Firebase Admin SDK key and update backend/.env"
echo ""
echo "2. Start the backend server:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. Start the mobile app:"
echo "   cd mobile"
echo "   npm start"
echo "   npm run android  # In another terminal"
echo ""
echo "4. (Optional) Train AI model:"
echo "   cd model_training"
echo "   source venv/bin/activate"
echo "   python src/training/train.py"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

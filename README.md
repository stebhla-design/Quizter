# 🚀 Quizter | Live Interactive Game Show Platform

**Quizter** is a premium, real-time interactive quiz and presentation platform (in the style of Kahoot! and Mentimeter) built to boost classroom engagement, meeting participation, and trivia nights.

Featuring robust **WebSockets** for real-time synchronization, custom quiz builders, and a state-of-the-art **Gemini AI Quiz Generator**, Quizter makes creating and hosting games immediate, beautiful, and fluid.

---

## ✨ Features

### 1. 🤖 AI Quiz Generator (Magic Generation)
Generate fully structured quizzes in seconds from multiple content sources:
- **Document Uploads**: Supported formats include **PDF (`.pdf`)**, **Word (`.docx`)**, **PowerPoint (`.pptx`)**, and **Text (`.txt`/`.csv`)**.
- **Web scraping**: Paste any website link or article URL. Quizter crawls, extracts, and purifies the text to extract core facts.
- **Custom Prompts**: Enter custom target audience parameters, difficulty ranges, or specific topic directions to direct the generator.
- Powered by **Google Gemini AI (`gemini-2.5-flash`)** configured in strict structured JSON mode.

### 2. ⚡ Real-Time WebSockets Gameplay
- **Host Waiting Rooms**: Real-time participant listing as players join using a 6-digit session pin.
- **Mentimeter-Style Score Decay**: Points decay gradually over a 20-second countdown timer. Fast answers receive higher scores, creating suspenseful game show mechanics.
- **Live Syncing**: Synchronized slides so all participants see the active question, timer, and score board simultaneously.

### 3. 📊 Visual Analytics & Reports
- **Interactive Leaderboard**: Visual feedback showing player positions, scores, and instantaneous status shifts.
- **Post-Session Reports**: Analyze participant counts, average class scores, and question difficulty parameters to improve training material.

### 4. 🎨 Glassmorphic Aesthetic
- High-end curated HSL color systems, responsive flex layouts, dynamic dark modes, and fluid animations powered by **Framer Motion** and **Tailwind CSS**.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + Vanilla CSS tokens
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Router**: React Router v7

### Backend
- **Framework**: FastAPI (Python 3.13)
- **Real-Time Communication**: Async WebSockets
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: Google Generative AI Python SDK (`google-generativeai`)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Google Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

### 2. Setup the FastAPI Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set your Gemini API key in your terminal session:
   ```bash
   export GEMINI_API_KEY="your-gemini-api-key-here"
   ```
5. Start the uvicorn development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend will be running at `http://localhost:8000`.

### 3. Setup the React Frontend
1. Open a new terminal in the root directory and install npm packages:
   ```bash
   npm install
   ```
2. Start the Vite frontend dev server:
   ```bash
   npm run dev
   ```
   The app will open locally at `http://localhost:5173`.

---

## 📂 Architecture Directory Structure

```
Quizter/
├── backend/
│   ├── app/
│   │   ├── models/           # SQLAlchemy DB Models
│   │   │   └── database.py
│   │   ├── utils/            # Document parsing & Gemini AI utilities
│   │   │   ├── parsers.py    # PDF, Word, PowerPoint, Web scraping
│   │   │   └── ai.py         # Gemini API JSON schema config
│   │   └── main.py           # FastAPI routers, sockets & application setup
│   └── requirements.txt      # Python dependencies
├── src/
│   ├── components/           # Reusable UI Elements (Modals, Cards, Logo)
│   │   ├── AiGeneratorModal.tsx
│   │   └── Logo.tsx
│   ├── context/              # State Providers (Quiz, Auth)
│   ├── pages/                # Views (Dashboard, LiveHost, ParticipantView)
│   │   ├── Dashboard.tsx
│   │   └── QuizBuilder.tsx
│   ├── index.css             # Main styling system
│   └── main.tsx              # Application entrypoint
├── package.json              # NPM scripts & requirements
└── vite.config.ts            # Vite compiler configuration
```

---

## 🔒 Environment Configurations

Ensure the following environment variables are set during production deployments:
- **Frontend**:
  - `VITE_API_BASE_URL`: Sets the address of the FastAPI server (defaults to `http://localhost:8000`).
- **Backend**:
  - `GEMINI_API_KEY`: Strictly required for AI Quiz Generation.

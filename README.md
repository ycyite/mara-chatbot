# Mara - McMaster Remote Assistant Chatbot

A conversational AI chatbot designed to support McMaster University's remote students by providing accurate, contextual, and empathetic responses about academic resources, course procedures, and student services.

## 📋 Overview

Mara bridges the gap between remote students and McMaster's ecosystem, helping students who are balancing full-time work with their studies. The chatbot provides:

- **Fee Inquiries**: Information about tuition, gym fees, bus passes, and exemptions
- **Emotional Support**: Empathetic responses with appropriate escalation to wellness services
- **Academic Guidance**: Course registration, program information, and academic policies
- **Resource Navigation**: Connecting students to the right departments and contacts

## 🏗️ Architecture

### Components

1. **Session Manager**: Handles user sessions and student information
2. **Intent Detector**: Analyzes user messages to determine intent and emotional state
3. **RAG Retriever**: Searches McMaster knowledge base using semantic similarity
4. **LLM Service**: Generates empathetic responses using GPT-4
5. **Memory Manager**: Maintains conversation history and context
6. **Escalation Service**: Routes users to appropriate human support

### Technology Stack

- **Backend**: Node.js with Express
- **AI/ML**: OpenAI GPT-4 API
- **Knowledge Base**: JSON-based with semantic search
- **Session Storage**: Node-Cache (in-memory)
- **Frontend**: Vanilla HTML/CSS/JavaScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key

### Local Development

1. **Clone and navigate to the project**:
```bash
cd mara-chatbot
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create `.env` file**:
```bash
cp .env.example .env
```

4. **Add your OpenAI API key to `.env`**:
```env
OPENAI_API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
```

5. **Start the server**:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

6. **Open your browser**:
Navigate to `http://localhost:3001`

## 🚂 Railway Deployment

### Prerequisites
- Railway account ([railway.app](https://railway.app))
- GitHub repository with your code

### Deployment Steps

1. **Push code to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Deploy on Railway**:
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect Node.js

3. **Set Environment Variables**:
   - Go to your project → Variables
   - Add these variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `NODE_ENV`: `production`
     - `PORT`: Railway will auto-assign, but you can use `3001`

4. **Deploy**:
   - Railway will automatically deploy
   - Get your deployment URL from the Railway dashboard
   - Your app will be live at: `https://your-app.railway.app`

### Railway Configuration

The project includes `railway.json` for optimized deployment:
- Uses Nixpacks builder
- Auto-restart on failure
- Proper start command

## 📡 API Endpoints

### Session Management

**Create Session**
```
POST /api/session
Body: {
  "name": "Student Name",
  "studentNumber": "400123456",  // optional
  "chatId": "40067"               // optional - for continuing conversation
}
```

**Response**:
```json
{
  "sessionId": "uuid-here",
  "userType": "current" | "prospective",
  "studentInfo": { ... },
  "greeting": "Hi Student! ..."
}
```

### Chat

**Send Message**
```
POST /api/chat
Body: {
  "sessionId": "session-id",
  "message": "Why am I charged for gym fees?",
  "name": "Student Name",
  "studentNumber": "400123456"
}
```

**Response**:
```json
{
  "response": "That's a common concern...",
  "sessionId": "session-id",
  "chatId": "40067",
  "intent": "fee_inquiry",
  "emotionalState": "frustrated",
  "escalationRequired": false
}
```

### Utility Endpoints

- `GET /health` - Health check
- `GET /` - API information
- `GET /api/history/:sessionId` - Get conversation history
- `GET /api/contacts/:category` - Get contact information

## 🎯 Features

### 1. Intent Detection
Automatically detects:
- Fee inquiries
- Course questions
- Emotional support needs
- Academic policy questions
- Prospective student inquiries

### 2. Emotional Intelligence
Recognizes emotional states:
- **Crisis**: Immediate escalation to wellness services
- **Stressed**: Empathetic response with support options
- **Frustrated**: Validation and clear solutions
- **Neutral**: Standard informative responses

### 3. RAG Knowledge Retrieval
Searches curated McMaster knowledge base covering:
- Fee policies
- Course registration
- Wellness services
- Academic advising
- Technical support
- Library resources

### 4. Smart Escalation
Routes to appropriate departments:
- MSU Student Council (fees)
- Student Wellness Centre (mental health)
- Academic Advising (courses)
- IT Services (technical issues)
- Admissions (prospective students)

### 5. Conversation Memory
- Maintains context within session
- Recalls previous topics
- Continues emotional tone
- Chat ID system for multi-session continuity

## 🧪 Testing Scenarios

### Scenario 1: Fee Inquiry
```
User: "Why am I charged for gym and bus pass fees as a remote student?"
Expected: Explains policy, acknowledges frustration, provides contact for exemption
```

### Scenario 2: Emotional Support
```
User: "I'm overwhelmed balancing work and 5 courses. I can't handle this anymore."
Expected: Empathetic validation, wellness resources, escalation to counseling
```

### Scenario 3: Prospective Student
```
User: "I'm interested in the Software Engineering degree completion program"
Expected: Program info, connects to admissions advisor, creates chat ID
```

## 📚 Knowledge Base

The knowledge base (`data/knowledge.json`) contains verified McMaster information:
- Fee policies and exemption procedures
- Remote learning resources and support
- Wellness centre services and hours
- Course registration procedures
- Academic advising contacts
- Technical support information
- Library access for remote students
- Accessibility services

To add new knowledge:
1. Edit `data/knowledge.json`
2. Follow the existing structure
3. Include topic, content, source, and metadata
4. Restart the server

## 🔒 Privacy & Security

- **No persistent storage**: Session data expires after 24 hours
- **No personal data retention**: Compliant with FIPPA
- **Masked phone numbers**: Privacy-preserving contact display
- **Session-only memory**: Conversations not stored long-term

## 🛠️ Development

### Project Structure
```
mara-chatbot/
├── server.js              # Main Express server
├── services/
│   ├── sessionManager.js  # Session handling
│   ├── intentDetector.js  # Intent classification
│   ├── ragRetriever.js    # Knowledge base search
│   ├── llmService.js      # OpenAI integration
│   ├── memoryManager.js   # Conversation memory
│   └── escalationService.js # Contact routing
├── utils/
│   └── systemPrompts.js   # Mara's personality prompts
├── data/
│   └── knowledge.json     # McMaster knowledge base
├── public/
│   └── index.html         # Chat interface
└── package.json
```

### Adding New Features

**1. Add new intent type**:
Edit `services/intentDetector.js` - add to intent list and detection logic

**2. Add new contact**:
Edit `services/escalationService.js` - add to `initializeContacts()`

**3. Modify personality**:
Edit `utils/systemPrompts.js` - adjust `BASE_PROMPT` or conditions

**4. Add knowledge**:
Edit `data/knowledge.json` - add new entries with proper metadata

## 📊 Monitoring

Check server logs for:
- Intent detection results
- RAG retrieval statistics
- Escalation triggers
- Error messages

## 🤝 Contributing

This project was developed by Group 4 for SFGNTECH 3DM3:
- Akanke Walford (400547569)
- Amisha (400612546)
- Nadine Winger (400324640)

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues or questions:
1. Check server logs for errors
2. Verify OpenAI API key is valid
3. Ensure all dependencies are installed
4. Check Railway logs if deployed

## 🎓 Academic Context

Built for SFGNTECH 3DM3 - Creativity, Innovation and Technology
McMaster University, Fall 2025

Based on the Project Persona and K-Scripts documentation defining Mara's personality, knowledge architecture, and conversational patterns.

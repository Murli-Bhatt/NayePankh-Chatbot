# NayePankh Foundation AI Chatbot

An AI-powered, fully responsive chatbot web application custom-built for **NayePankh Foundation** (a UP government-registered NGO in India, 12A & 80G certified, dedicated to uplifting underprivileged communities and caring for stray animals).

This application allows students, volunteers, and donors to interact with a warm, fact-grounded assistant, offering specific personas and interactive guided workflows (such as volunteer intake).

---

## 🌟 Core Features

1. **Persona Selection System**:
   - **Student Mode**: Explore scholarships, workshops, and educational programs.
   - **Volunteer Mode**: Guide users through roles, required skills, and onboarding.
   - **Donor Mode**: Learn about Section 80G tax benefits, donation impact, and fund transparency.
2. **Quick Action Suggestions**: 
   - Instant click-to-ask chips below the greeting messages to guide first-time interactions.
3. **Automated Volunteer Intake Flow**:
   - A 4-step state-machine form that collects volunteer profile details (Name, Skills, Availability, City) and generates a downloadable summary sheet.
4. **Groq AI Integration**:
   - Fetches responses from Groq's high-speed completion server (`https://api.groq.com`) using the state-of-the-art **`llama-3.3-70b-versatile`** model.
5. **Hindi Auto-Detection**:
   - Automatically detects both Devanagari script (e.g. `हिंदी`) and Romanized Hinglish inputs, prompting the LLM to write back in Hindi as required by NGO guidelines.
6. **Mobile-Responsive Hamburger Layout**:
   - Collapses selectors on mobile devices into a clean slide-over drawer sidebar.
7. **Chat Transcript Exporter**:
   - Downloads the full formatted conversation log as a `.txt` file with active timestamps.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 19 (Modular component-based architecture)
- **Tooling/Bundler**: Vite 8 (Hot Module Replacement)
- **Styling**: Tailwind CSS v4 & PostCSS Autoprefixer
- **Backend API**: FastAPI (Python 3.10+) running uvicorn
- **API Engine**: Groq Chat Completions API
- **Typography**: Google Font 'Poppins'

### Codebase Directory Map

```text
├── backend/
│   ├── main.py                 # FastAPI backend proxy (runs synchronously in a threadpool)
│   └── requirements.txt        # Backend dependencies
├── src/
│   ├── components/
│   │   ├── ChatHeader.jsx      # Top app bar and actions
│   │   ├── ChatInput.jsx       # Custom text entry footer & workflow controls
│   │   ├── ChatMessages.jsx    # Chat bubble streams & interactive actions
│   │   ├── MobileDrawer.jsx    # Responsive slide-over panel for mobile
│   │   └── WelcomeScreen.jsx   # Initial view & persona selector
│   ├── constants/
│   │   └── chatConstants.js    # NGO rules, prompts, and persona configurations
│   ├── utils/
│   │   └── chatHelpers.js      # Language detection and text download handlers
│   ├── App.css
│   ├── App.jsx                 # Controller orchestrating child states
│   ├── index.css               # Base Tailwind theme definitions
│   └── main.jsx                # React app mounting point
├── .env                        # Local development variables (git-ignored)
├── .gitignore                  # Git credentials protection config
├── vite.config.js              # Vite packaging config with REACT_APP_ prefixing
└── package.json                # Node script runners and client dependencies
```

---

## 🚀 Installation & Local Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and Python 3.10+ installed on your machine.

### Setup Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Murli-Bhatt/NayePankh-Chatbot.git
   cd NayePankh-Chatbot
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   REACT_APP_GROQ_API_KEY=your_groq_api_key_here
   REACT_APP_API_URL=http://localhost:8000
   ```

3. **Start the Python Backend Proxy**:
   Install Python dependencies and start the FastAPI server:
   ```bash
   pip install -r backend/requirements.txt
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   The backend will run at `http://localhost:8000/` and proxy Groq requests securely.

4. **Start the React Frontend**:
   In a separate terminal, install node dependencies and launch the Vite development server:
   ```bash
   npm install
   npm run dev
   ```
   Navigate to `http://localhost:5173/` in your browser. The frontend will automatically detect and query your local backend proxy!

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🔒 Security & Deployment Guidelines

### Key Exposure Risk & Mitigation
React applications compile down to static client-side JavaScript. When building for production (`npm run build`), environment variables prefixed with `REACT_APP_` are embedded in the bundle and are inspectable by browser visitors.

To deploy the chatbot securely for public use:
1. **Secure Backend**: Set `GROQ_API_KEY` on your production FastAPI server.
2. **Restrict CORS**: Define the `ALLOWED_ORIGINS` environment variable on your backend server to only permit requests from your frontend domain (e.g. `ALLOWED_ORIGINS=https://chatbot.nayepankh.org`).
3. **Frontend build settings**: 
   - Define `REACT_APP_API_URL` to point to your deployed backend proxy (e.g. `https://api.nayepankh-chatbot.com`).
   - **Do not** define `REACT_APP_GROQ_API_KEY` in the production build environment. This leaves the API key securely hosted on the backend server only.

---

## 📞 NGO Contact Information

For official support or queries, contact the NayePankh Foundation directly:
* **Website**: [nayepankh.org](https://nayepankh.org)
* **Email**: contact@nayepankh.com
* **Mobile**: +91-8318500748
* **Headquarters**: Uttar Pradesh, India

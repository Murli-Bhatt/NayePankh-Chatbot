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

## 🛠️ Technology Stack

- **Frontend**: React 19 (Hooks, State Management)
- **Tooling/Bundler**: Vite 8 (Hot Module Replacement)
- **Styling**: Tailwind CSS v4 & PostCSS Autoprefixer
- **API Engine**: Groq Chat Completions API
- **Typography**: Google Font 'Poppins'

---

## 🚀 Installation & Local Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

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

### Key Exposure Risk
React applications run entirely in the browser. When you run `npm run build`, any exposed environment variables (prefixed with `REACT_APP_` in this project) are compiled directly into the static JS files. **Do not deploy this app to public sites with a hardcoded key in your environment settings.**

### Safe Options:
* **Option A: Internal/Coordinator Console (Zero Cost)**: Deploy the app with *no* environment variables set on the hosting server. Instruct your staff to input their own Groq keys directly into the UI (using the settings gear on the welcome page or the top warning banner). The key is stored in browser memory only and disappears on tab close.
* **Option B: Public Release (Proxy Server)**: Host a tiny middleware server (e.g., Express or serverless function) containing the Groq key, and route all requests from React through that proxy to shield the credentials from public inspect element.

*Note: Your `.env` and `.env.local` files are pre-configured in `.gitignore` to prevent accidental credential leakage to GitHub.*

---

## 📞 NGO Contact Information

For official support or queries, contact the NayePankh Foundation directly:
* **Website**: [nayepankh.org](https://nayepankh.org)
* **Email**: contact@nayepankh.com
* **Mobile**: +91-8318500748
* **Headquarters**: Uttar Pradesh, India

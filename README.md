# NayePankh Foundation AI Chatbot (Streamlit Version)

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
   - Fetches responses from Groq's high-speed completions endpoint (`https://api.groq.com`) using the state-of-the-art **`llama-3.3-70b-versatile`** model.
5. **Hindi Auto-Detection**:
   - Automatically detects both Devanagari script (e.g. `हिंदी`) and Romanized Hinglish inputs, prompting the LLM to write back in Hindi as required by NGO guidelines.
6. **Chat Transcript Exporter**:
   - Downloads the full formatted conversation log as a `.txt` file with active timestamps.

---

## 🛠️ Technology Stack & Architecture

- **Frontend & Backend UI Framework**: Streamlit (Python-native UI framework)
- **API Engine**: Groq Chat Completions API
- **Dependencies**: `requests`, `python-dotenv`

### Codebase Directory Map

```text
├── .streamlit/
│   └── config.toml             # Custom theme parameters (NayePankh primary green and accent orange)
├── app.py                      # Single unified application file containing all UI, state-machine, and API logic
├── .env                        # Local development variables (git-ignored)
├── .gitignore                  # Git credentials protection config
└── requirements.txt            # Python dependencies (Streamlit, requests, python-dotenv)
```

---

## 🚀 Installation & Local Setup

### Prerequisites
Make sure you have Python 3.11 or 3.12 installed on your machine.

### Setup Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Murli-Bhatt/NayePankh-Chatbot.git
   cd NayePankh-Chatbot
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Install Dependencies**:
   Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. **Launch the Chatbot App**:
   Start the Streamlit development server:
   ```bash
   streamlit run app.py
   ```
   Navigate to `http://localhost:8501/` in your browser to interact with the chatbot!

---

## 🔒 Security & Deployment Guidelines

Deploying a Streamlit app to Render (or Streamlit Community Cloud) is extremely simple since it runs as a single service.

### Deploying to Render (Web Service)

Create a **New Web Service** on Render:
* **Repository**: Select your chatbot repo.
* **Language**: `Python 3`
* **Root Directory**: *(Leave empty - repository root)*
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**:
  ```bash
  streamlit run app.py --server.port $PORT --server.address 0.0.0.0
  ```
* **Environment Variables**:
  * **`GROQ_API_KEY`**: Paste your valid Groq API key (`gsk_...`).
  * **`PYTHON_VERSION`**: Set to `3.11.9` or `3.12.3` (to avoid dependency build conflicts).

---

## 📞 NGO Contact Information

For official support or queries, contact the NayePankh Foundation directly:
* **Website**: [nayepankh.org](https://nayepankh.org)
* **Email**: contact@nayepankh.com
* **Mobile**: +91-8318500748
* **Headquarters**: Uttar Pradesh, India

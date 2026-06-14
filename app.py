import os
import re
import datetime
import requests
import streamlit as st
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# NGO Chatbot Rules and Configurations
SYSTEM_PROMPT = """You are a warm, helpful, and fact-grounded assistant for NayePankh Foundation, a UP government-registered NGO in India (12A & 80G certified) founded in 2021 to uplift underprivileged communities and stray animals.

CORE FACTS ABOUT NAYEPANKH FOUNDATION:
1. Impact: Supported over 200,000 (2 Lakh+) people; distributed over 100,000 sanitary pads; fed/cared for 25,000+ animals.
2. Key Programs:
   - Hunger Relief: Feeding underprivileged families and stray animals daily.
   - Women's Hygiene: Spreading menstrual hygiene awareness and distributing free sanitary pads.
   - Clothes Distribution: Providing clothes and winter wear to needy families.
   - Education: Supporting the schooling, books, and educational needs of underprivileged children.
3. Donations: Eligible for 50% tax deduction under Section 80G. 100% of public donations are used directly on the ground for food, hygiene kits, and school supplies.
4. Volunteering: Focuses on youth and student leadership. Roles include Teaching, Web Development, Social Media, Graphic Design, and other tasks.

Rules:
- If the user writes in Hindi, always reply in Hindi.
- If the user writes in English, always reply in English.
- Always be warm, encouraging, and empathetic.
- Keep answers concise and strictly fact-grounded (under 150 words).
- Never make up facts, programs, or statistics about the foundation. If you do not know something specific, say: 'For exact details, please contact NayePankh at contact@nayepankh.com or call +91- 8318500748'"""

PERSONAS = {
    "student": {
        "id": "student",
        "name": "Student",
        "icon": "🎓",
        "welcomeMsg": "Namaste! 👋 I'm here to help you explore scholarships and education programs by NayePankh. What would you like to know?"
    },
    "volunteer": {
        "id": "volunteer",
        "name": "Volunteer",
        "icon": "🙋",
        "welcomeMsg": "Hi there! 🙌 Ready to make a difference? Tell me about your skills and I'll help you find the perfect volunteer role at NayePankh!"
    },
    "donor": {
        "id": "donor",
        "name": "Donor",
        "icon": "💰",
        "welcomeMsg": "Hello! ❤️ Thank you for your interest in supporting NayePankh. Would you like to know how your donation creates impact?"
    }
}

QUICK_ACTIONS = [
    {"text": "🎓 Apply for Scholarship", "query": "How can I apply for a scholarship?"},
    {"text": "🙋 Become a Volunteer", "query": "I want to join as a volunteer"},
    {"text": "💰 How to Donate", "query": "How do I donate to NayePankh?"},
    {"text": "📞 Contact Foundation", "query": "What is the contact information for NayePankh?"}
]

# Set Streamlit Page Config
st.set_page_config(
    page_title="NayePankh Foundation AI Chatbot",
    page_icon="🎓",
    layout="centered"
)

# Helper: Detect Hindi / Hinglish inputs
def detect_hindi_language(text):
    if not text:
        return False
    # Check for Devanagari Unicode range
    if re.search(r"[\u0900-\u097F]", text):
        return True
    
    # Check common Romanized Hindi (Hinglish) words
    roman_hindi_words = [
        r"\baap\b", r"\bkaise\b", r"\bkya\b", r"\bhai\b", r"\bhoon\b", r"\bho\b", 
        r"\bnamaste\b", r"\bnamaskar\b", r"\bmujhe\b", r"\bko\b", r"\bse\b", r"\bkar\b",
        r"\bkarna\b", r"\bkrna\b", r"\bkarne\b", r"\bhain\b", r"\bhe\b", r"\btha\b", 
        r"\bthi\b", r"\bthe\b", r"\bkuch\b", r"\bhoga\b", r"\bhogi\b", r"\bshukriya\b", 
        r"\bdhanyawad\b", r"\bmera\b", r"\bmeri\b", r"\bhamara\b", r"\bhamari\b",
        r"\bchahta\b", r"\bchahti\b", r"\bchahiye\b", r"\bchahata\b", r"\bchahatee\b",
        r"\bkam\b", r"\bkaam\b", r"\bghar\b", r"\baur\b", r"\bbhi\b"
    ]
    for pattern in roman_hindi_words:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False

# Helper: Query the Groq API
def query_groq_api(messages, api_key, user_text):
    if not api_key:
        return "Sorry, I cannot access the AI server because the Groq API key is missing. Please enter your Groq API key in the sidebar configuration."
        
    is_hindi = detect_hindi_language(user_text)
    active_prompt = SYSTEM_PROMPT
    if is_hindi:
        active_prompt += "\n\n[SYSTEM DIRECTIVE: The user has written in Hindi. You MUST reply in Hindi (preferably Devanagari script) and keep the tone warm, welcoming, and under 150 words.]"
        
    # Format messages payload
    payload_messages = [{"role": "system", "content": active_prompt}]
    
    for msg in messages:
        if msg["id"] == "welcome-msg":
            payload_messages.append({"role": "assistant", "content": msg["text"]})
        elif not msg.get("isSummaryCard"):
            role = "assistant" if msg["sender"] == "bot" else "user"
            payload_messages.append({"role": role, "content": msg["text"]})
            
    # Add final query
    payload_messages.append({"role": "user", "content": user_text})
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key.strip()}"
    }
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    try:
        response = requests.post(
            url,
            headers=headers,
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": payload_messages,
                "max_tokens": 1000
            },
            timeout=30
        )
        if not response.ok:
            try:
                err_data = response.json()
                error_msg = err_data.get("error", {}).get("message", f"HTTP {response.status_code}")
            except Exception:
                error_msg = response.text or f"HTTP {response.status_code}"
            return f"Error from Groq API: {error_msg}"
            
        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Sorry, connection to the Groq API failed: {str(e)}"

# Helper: Format conversation transcript for export
def format_chat_log(messages, persona_name):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
    chat_log = f"================================================\n"
    chat_log += f"NAYEPANKH FOUNDATION CHAT LOG\n"
    chat_log += f"Exported on: {timestamp}\n"
    chat_log += f"Persona: {persona_name}\n"
    chat_log += f"================================================\n\n"
    
    for msg in messages:
        sender_label = "YOU" if msg["sender"] == "user" else "NP ASSISTANT"
        chat_log += f"[{msg['timestamp']}] {sender_label}:\n"
        if msg.get("isSummaryCard"):
            details = msg["summaryDetails"]
            chat_log += f"[Volunteer Profile Created]\n"
            chat_log += f"- Name: {details['name']}\n"
            chat_log += f"- Skills: {details['skills']}\n"
            chat_log += f"- Availability: {details['availability']}\n"
            chat_log += f"- City: {details['city']}\n"
        else:
            chat_log += f"{msg['text']}\n"
        chat_log += f"\n------------------------------------------------\n\n"
    return chat_log

# Helper: Format volunteer summary card for export
def format_volunteer_summary(details):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %I:%M:%S %p")
    summary = f"================================================\n"
    summary += f"NAYEPANKH FOUNDATION - VOLUNTEER INTAKE PROFILE\n"
    summary += f"================================================\n"
    summary += f"Generated on: {timestamp}\n\n"
    summary += f"Full Name:    {details['name']}\n"
    summary += f"Skills:       {details['skills']}\n"
    summary += f"Availability: {details['availability']}\n"
    summary += f"City:         {details['city']}\n\n"
    summary += f"Thank you for volunteering with NayePankh Foundation!\n"
    summary += f"Our team will review your profile and contact you soon.\n"
    summary += f"For direct assistance, email contact@nayepankh.com or call +91- 8318500748.\n"
    summary += f"================================================\n"
    return summary

# Inject custom brand styling overrides (Aesthetics)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Poppins', sans-serif;
    }
    
    .stApp {
        background-color: #FFFFFF;
    }
    
    h1, h2, h3 {
        color: #1F2937;
        font-weight: 700;
    }
    
    /* Welcome dashboard card style */
    .welcome-container {
        background: linear-gradient(135deg, #F1F6F1 0%, #FFFFFF 100%);
        border: 1px solid #E5E7EB;
        border-radius: 24px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        margin-bottom: 30px;
    }
    
    .badge-logo {
        background: linear-gradient(135deg, #2E7D32 0%, #FF6F00 100%);
        color: white;
        font-size: 36px;
        font-weight: bold;
        width: 80px;
        height: 80px;
        line-height: 80px;
        border-radius: 20px;
        margin: 0 auto 20px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        text-align: center;
    }
    
    .primary-green-text {
        color: #2E7D32;
    }
    
    .accent-orange-text {
        color: #FF6F00;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 2px;
        font-weight: 600;
        margin-top: -10px;
        margin-bottom: 20px;
        text-align: center;
    }
    
    /* Custom summary block card */
    .summary-card {
        background-color: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 16px;
        padding: 20px;
        margin-top: 10px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
        color: #1F2937;
    }
    
    .summary-title {
        color: #2E7D32;
        font-weight: 600;
        border-bottom: 1px solid #E5E7EB;
        padding-bottom: 8px;
        margin-bottom: 12px;
    }
    
    .intake-indicator {
        background-color: #E8F5E9;
        border-left: 4px solid #2E7D32;
        padding: 8px 12px;
        border-radius: 4px;
        color: #1B5E20;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize Session State
if "messages" not in st.session_state:
    st.session_state.messages = []
if "persona" not in st.session_state:
    st.session_state.persona = None
if "hasSentFirstMessage" not in st.session_state:
    st.session_state.hasSentFirstMessage = False
if "intake_step" not in st.session_state:
    st.session_state.intake_step = 0
if "intake_data" not in st.session_state:
    st.session_state.intake_data = {"name": "", "skills": "", "availability": "", "city": ""}
if "api_key" not in st.session_state:
    st.session_state.api_key = os.getenv("REACT_APP_GROQ_API_KEY") or os.getenv("GROQ_API_KEY") or ""

# Initialize Persona trigger
def select_persona(persona_id):
    st.session_state.persona = persona_id
    st.session_state.hasSentFirstMessage = False
    st.session_state.intake_step = 0
    st.session_state.intake_data = {"name": "", "skills": "", "availability": "", "city": ""}
    
    welcome_text = PERSONAS[persona_id]["welcomeMsg"]
    st.session_state.messages = [{
        "id": "welcome-msg",
        "sender": "bot",
        "text": welcome_text,
        "timestamp": datetime.datetime.now().strftime("%I:%M %p")
    }]

# Handle Message Send
def handle_send_message(text):
    if not text.strip():
        return
        
    timestamp = datetime.datetime.now().strftime("%I:%M %p")
    st.session_state.hasSentFirstMessage = True

    # 1. Active Volunteer Intake workflow progression
    if st.session_state.intake_step > 0:
        st.session_state.messages.append({
            "id": f"msg-{datetime.datetime.now().timestamp()}",
            "sender": "user",
            "text": text,
            "timestamp": timestamp
        })
        progress_volunteer_intake(text)
        return

    # 2. Check if starting the Volunteer Intake flow
    lower_text = text.lower()
    is_volunteer_trigger = "volunteer" in lower_text or "volunteering" in lower_text or "join as a volunteer" in lower_text
    
    if is_volunteer_trigger:
        st.session_state.messages.append({
            "id": f"msg-{datetime.datetime.now().timestamp()}",
            "sender": "user",
            "text": text,
            "timestamp": timestamp
        })
        st.session_state.intake_step = 1
        st.session_state.intake_data = {"name": "", "skills": "", "availability": "", "city": ""}
        st.session_state.messages.append({
            "id": f"msg-{datetime.datetime.now().timestamp()}",
            "sender": "bot",
            "text": "Great! Let's get you set up as a volunteer. To start, what is your full name?",
            "timestamp": timestamp
        })
        return

    # 3. Normal chat querying Groq API
    st.session_state.messages.append({
        "id": f"msg-{datetime.datetime.now().timestamp()}",
        "sender": "user",
        "text": text,
        "timestamp": timestamp
    })
    
    bot_response = query_groq_api(st.session_state.messages, st.session_state.api_key, text)
    st.session_state.messages.append({
        "id": f"msg-{datetime.datetime.now().timestamp()}",
        "sender": "bot",
        "text": bot_response,
        "timestamp": timestamp
    })

# Progress Volunteer Registration
def progress_volunteer_intake(user_input):
    timestamp = datetime.datetime.now().strftime("%I:%M %p")
    step = st.session_state.intake_step
    data = st.session_state.intake_data
    
    if step == 1:
        data["name"] = user_input
        st.session_state.intake_step = 2
        st.session_state.messages.append({
            "id": f"msg-{datetime.datetime.now().timestamp()}",
            "sender": "bot",
            "text": f"Thank you, {user_input}! What skills can you offer to NayePankh? Choose from the options below or type your own:",
            "timestamp": timestamp,
            "inputType": "skills"
        })
    elif step == 2:
        data["skills"] = user_input
        st.session_state.intake_step = 3
        st.session_state.messages.append({
            "id": f"msg-{datetime.datetime.now().timestamp()}",
            "sender": "bot",
            "text": "Great! What is your availability to volunteer? Choose from the options below:",
            "timestamp": timestamp,
            "inputType": "availability"
        })
    elif step == 3:
        data["availability"] = user_input
        st.session_state.intake_step = 4
        st.session_state.messages.append({
            "id": f"msg-{datetime.datetime.now().timestamp()}",
            "sender": "bot",
            "text": "Got it. Which city do you reside in?",
            "timestamp": timestamp
        })
    elif step == 4:
        data["city"] = user_input
        st.session_state.intake_step = 0 # reset back to inactive
        st.session_state.messages.append({
            "id": f"msg-{datetime.datetime.now().timestamp()}",
            "sender": "bot",
            "text": "Your volunteer profile is ready! Click Download Summary in the card below.",
            "timestamp": timestamp,
            "isSummaryCard": True,
            "summaryDetails": {
                "name": data["name"],
                "skills": data["skills"],
                "availability": data["availability"],
                "city": user_input
            }
        })

# --- SIDEBAR COMPONENT ---
with st.sidebar:
    st.markdown("""
    <div style='text-align: center; margin-bottom: 20px;'>
        <div style='background: linear-gradient(135deg, #2E7D32 0%, #FF6F00 100%); width: 50px; height: 50px; line-height: 50px; border-radius: 12px; font-weight: bold; color: white; font-size: 24px; margin: 0 auto 10px; text-align: center;'>NP</div>
        <h3 style='margin: 0;'>NayePankh</h3>
        <span style='color: #FF6F00; font-size: 9px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;'>Empowering Youth</span>
    </div>
    """, unsafe_allow_html=True)
    
    # API key override settings
    st.markdown("### 🔑 API Configuration")
    input_key = st.text_input(
        "Enter Groq API Key Override:",
        value=st.session_state.api_key,
        type="password",
        placeholder="gsk_..."
    )
    if input_key != st.session_state.api_key:
        st.session_state.api_key = input_key
        st.success("API key updated!")
        
    st.markdown("---")
    st.markdown("### ⚙️ Navigation Actions")
    
    # Restart to Welcome Screen button
    if st.button("🏠 Home / Welcome Screen", use_container_width=True):
        st.session_state.persona = None
        st.session_state.messages = []
        st.session_state.intake_step = 0
        st.rerun()
        
    # Download conversation transcript
    if st.session_state.persona is not None:
        chat_log_data = format_chat_log(st.session_state.messages, PERSONAS[st.session_state.persona]["name"])
        st.download_button(
            label="📥 Download Chat Log",
            data=chat_log_data,
            file_name=f"NayePankh_Chat_{datetime.date.today().isoformat()}.txt",
            mime="text/plain",
            disabled=len(st.session_state.messages) == 0,
            use_container_width=True
        )

# --- MAIN APP ROUTING ---
if st.session_state.persona is None:
    # Render Welcome/Home page
    st.markdown("""
    <div class="welcome-container">
        <div class="badge-logo">NP</div>
        <h1>NayePankh <span class="primary-green-text">Foundation</span></h1>
        <div class="accent-orange-text">Empowering Youth, Changing Lives</div>
        <p style="color: #4B5563; max-width: 500px; margin: 0 auto; font-size: 15px;">
            Welcome to our AI-powered assistant. Choose a profile below to start learning about our initiatives, volunteer opportunities, and donation channels.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # API key warning check
    if not st.session_state.api_key:
        st.warning("⚠️ Groq API key is missing. Add your key in the sidebar configuration to active the chatbot.")
        
    st.write("### Choose a Chat Profile:")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("<div style='text-align: center;'><h3>🎓 Student</h3><p style='font-size:12px; color:#6B7280; min-height: 40px;'>Explore scholarships & education.</p></div>", unsafe_allow_html=True)
        if st.button("Start as Student", key="btn_student", use_container_width=True):
            select_persona("student")
            st.rerun()
            
    with col2:
        st.markdown("<div style='text-align: center;'><h3>🙋 Volunteer</h3><p style='font-size:12px; color:#6B7280; min-height: 40px;'>Join drives & match skills.</p></div>", unsafe_allow_html=True)
        if st.button("Start as Volunteer", key="btn_volunteer", use_container_width=True):
            select_persona("volunteer")
            st.rerun()
            
    with col3:
        st.markdown("<div style='text-align: center;'><h3>💰 Donor</h3><p style='font-size:12px; color:#6B7280; min-height: 40px;'>Learn 80G benefit & tax deduction.</p></div>", unsafe_allow_html=True)
        if st.button("Start as Donor", key="btn_donor", use_container_width=True):
            select_persona("donor")
            st.rerun()

else:
    # Render Active Chat Interface
    active_persona = PERSONAS[st.session_state.persona]
    
    # Header Tabs to switch mode on the fly
    col_label, col_tab1, col_tab2, col_tab3 = st.columns([1, 2, 2, 2])
    with col_label:
        st.markdown("<div style='padding-top: 5px;'><strong>Mode:</strong></div>", unsafe_allow_html=True)
    with col_tab1:
        if st.button("🎓 Student", key="tab_student", use_container_width=True, type="primary" if st.session_state.persona == "student" else "secondary"):
            select_persona("student")
            st.rerun()
    with col_tab2:
        if st.button("🙋 Volunteer", key="tab_volunteer", use_container_width=True, type="primary" if st.session_state.persona == "volunteer" else "secondary"):
            select_persona("volunteer")
            st.rerun()
    with col_tab3:
        if st.button("💰 Donor", key="tab_donor", use_container_width=True, type="primary" if st.session_state.persona == "donor" else "secondary"):
            select_persona("donor")
            st.rerun()
            
    st.markdown("---")
    
    # Display missing key banner
    if not st.session_state.api_key:
        st.error("⚠️ Groq API key is missing. Set it in the sidebar to send messages.")

    # Render Message History
    for msg in st.session_state.messages:
        role = "assistant" if msg["sender"] == "bot" else "user"
        avatar = "🎓" if role == "assistant" and st.session_state.persona == "student" else "🙋" if role == "assistant" and st.session_state.persona == "volunteer" else "💰" if role == "assistant" else "👤"
        
        with st.chat_message(role, avatar=avatar):
            if msg.get("isSummaryCard"):
                details = msg["summaryDetails"]
                st.markdown(f"""
                <div class="summary-card">
                    <div class="summary-title">📝 Volunteer Profile Summary</div>
                    <p><strong>Name:</strong> {details['name']}</p>
                    <p><strong>Skills:</strong> {details['skills']}</p>
                    <p><strong>Availability:</strong> {details['availability']}</p>
                    <p><strong>City:</strong> {details['city']}</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Render summary download button
                summary_text = format_volunteer_summary(details)
                st.download_button(
                    label="📥 Download Summary Profile",
                    data=summary_text,
                    file_name=f"NayePankh_Volunteer_{details['name'].replace(' ', '_')}.txt",
                    mime="text/plain",
                    key=f"dl_sum_{msg['id']}"
                )
            else:
                st.write(msg["text"])
                
    # Quick action suggestions chips (Only shows if user hasn't typed anything yet)
    first_bot_message = st.session_state.messages[0] if len(st.session_state.messages) > 0 else None
    if not st.session_state.hasSentFirstMessage and first_bot_message is not None:
        st.write("💡 **Quick actions:**")
        cols = st.columns(len(QUICK_ACTIONS))
        for idx, act in enumerate(QUICK_ACTIONS):
            with cols[idx]:
                if st.button(act["text"], key=f"qa_{idx}", use_container_width=True):
                    handle_send_message(act["query"])
                    st.rerun()

    # Active Volunteer Intake Workflow UI Helpers
    if st.session_state.intake_step > 0:
        # Show step header helper
        st.markdown(f"<div class='intake-indicator'>📋 Volunteer Intake Flow (Step {st.session_state.intake_step} of 4)</div>", unsafe_allow_html=True)
        
        # Intake helper selection choices
        if st.session_state.intake_step == 2:
            st.write("💡 **Skills shortcut selection:**")
            skills = ["Teaching", "Graphic Design", "Social Media", "Web Dev", "Other"]
            s_cols = st.columns(len(skills))
            for idx, skill in enumerate(skills):
                with s_cols[idx]:
                    if st.button(skill, key=f"skill_chip_{skill}", use_container_width=True):
                        handle_send_message(skill)
                        st.rerun()
                        
        elif st.session_state.intake_step == 3:
            st.write("🗓️ **Availability shortcut selection:**")
            avails = ["Weekdays", "Weekends", "Both"]
            a_cols = st.columns(len(avails))
            for idx, avail in enumerate(avails):
                with a_cols[idx]:
                    if st.button(avail, key=f"avail_chip_{avail}", use_container_width=True):
                        handle_send_message(avail)
                        st.rerun()
                        
        # Cancel Intake option
        if st.button("❌ Cancel Registration", key="cancel_intake_workflow"):
            st.session_state.intake_step = 0
            timestamp = datetime.datetime.now().strftime("%I:%M %p")
            st.session_state.messages.append({
                "id": f"msg-{datetime.datetime.now().timestamp()}",
                "sender": "bot",
                "text": "Volunteer registration cancelled. How else can I assist you?",
                "timestamp": timestamp
            })
            st.rerun()

    # Main Chat Input bar
    placeholder = "Ask a question..."
    if st.session_state.intake_step == 1:
        placeholder = "Enter your full name..."
    elif st.session_state.intake_step == 2:
        placeholder = "Enter your skills..."
    elif st.session_state.intake_step == 3:
        placeholder = "Enter your availability..."
    elif st.session_state.intake_step == 4:
        placeholder = "Enter your city..."
        
    prompt = st.chat_input(placeholder)
    if prompt:
        handle_send_message(prompt)
        st.rerun()
        
    # Bottom footer attribution
    st.markdown("""
    <div style='text-align: center; color: #9CA3AF; font-size: 10px; margin-top: 30px;'>
        Powered by Groq AI | NayePankh Foundation 2025 | <a href='https://nayepankh.org' target='_blank' style='color:#2E7D32; font-weight:600;'>nayepankh.org</a>
    </div>
    """, unsafe_allow_html=True)

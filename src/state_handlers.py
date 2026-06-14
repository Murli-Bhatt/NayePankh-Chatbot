import datetime
import streamlit as st
from src.constants import PERSONAS
from src.utils import query_groq_api, resolve_server_api_key

def get_active_api_key():
    if st.session_state.get("api_key_override", "").strip():
        return st.session_state.api_key_override.strip()
    return resolve_server_api_key()

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
    
    bot_response = query_groq_api(st.session_state.messages, get_active_api_key(), text)
    st.session_state.messages.append({
        "id": f"msg-{datetime.datetime.now().timestamp()}",
        "sender": "bot",
        "text": bot_response,
        "timestamp": timestamp
    })

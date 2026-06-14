import os
import streamlit as st
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import modular resources
from src.constants import PERSONAS, QUICK_ACTIONS
from src.utils import format_chat_log, format_volunteer_summary, resolve_server_api_key
from src.state_handlers import select_persona, handle_send_message, get_active_api_key
from src.components.welcome import render_welcome_screen
from src.components.sidebar import render_sidebar
from src.components.chat import render_chat_interface

# Set Streamlit Page Config
st.set_page_config(
    page_title="NayePankh Foundation AI Chatbot",
    page_icon="🎓",
    layout="centered"
)

# Inject custom brand styling overrides from style.css
try:
    css_path = os.path.join(os.path.dirname(__file__), "src", "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        custom_css = f.read()
    st.markdown(f"<style>{custom_css}</style>", unsafe_allow_html=True)
except Exception as e:
    st.error(f"Error loading styles: {e}")

# Initialize Session State Variables
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
if "api_key_override" not in st.session_state:
    st.session_state.api_key_override = ""

SERVER_API_KEY = resolve_server_api_key()

# Render Sidebar Component
render_sidebar(
    SERVER_API_KEY, 
    st.session_state.persona, 
    PERSONAS, 
    st.session_state.messages, 
    format_chat_log
)

# Render Main View routing
if st.session_state.persona is None:
    render_welcome_screen(select_persona, bool(SERVER_API_KEY))
else:
    render_chat_interface(
        st.session_state.persona,
        PERSONAS,
        st.session_state.messages,
        QUICK_ACTIONS,
        st.session_state.intake_step,
        handle_send_message,
        format_volunteer_summary,
        select_persona,
        not bool(get_active_api_key())
    )

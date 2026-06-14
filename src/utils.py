import re
import datetime
import requests
from src.constants import SYSTEM_PROMPT

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

def resolve_server_api_key():
    import os
    import streamlit as st
    server_api_key = ""
    try:
        if "GROQ_API_KEY" in st.secrets:
            server_api_key = st.secrets["GROQ_API_KEY"]
        elif "REACT_APP_GROQ_API_KEY" in st.secrets:
            server_api_key = st.secrets["REACT_APP_GROQ_API_KEY"]
    except Exception:
        pass
    if not server_api_key:
        server_api_key = os.getenv("REACT_APP_GROQ_API_KEY") or os.getenv("GROQ_API_KEY") or ""
    return server_api_key

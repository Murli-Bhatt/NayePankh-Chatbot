import streamlit as st
import datetime

def render_sidebar(server_key, persona, personas, messages, format_chat_log_fn):
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
        if server_key:
            st.success("🤖 Secure Server API: Connected")
            with st.expander("🛠️ Developer Key Override"):
                override_key = st.text_input(
                    "Enter Custom Groq Key:",
                    value=st.session_state.api_key_override,
                    type="password",
                    placeholder="gsk_..."
                )
                if override_key != st.session_state.api_key_override:
                    st.session_state.api_key_override = override_key
                    st.success("Key override updated!")
        else:
            st.warning("⚠️ API Key: Missing on Server")
            input_key = st.text_input(
                "Enter Groq API Key:",
                value=st.session_state.api_key_override,
                type="password",
                placeholder="gsk_..."
            )
            if input_key != st.session_state.api_key_override:
                st.session_state.api_key_override = input_key
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
        if persona is not None:
            chat_log_data = format_chat_log_fn(messages, personas[persona]["name"])
            st.download_button(
                label="📥 Download Chat Log",
                data=chat_log_data,
                file_name=f"NayePankh_Chat_{datetime.date.today().isoformat()}.txt",
                mime="text/plain",
                disabled=len(messages) == 0,
                use_container_width=True
            )

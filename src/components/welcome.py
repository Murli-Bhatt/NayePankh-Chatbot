import streamlit as st

def render_welcome_screen(select_persona_fn, server_key_exists):
    st.markdown("""
    <div class="welcome-container">
        <div class="badge-logo">NP</div>
        <h1>NayePankh <span class="primary-green-text">Foundation</span></h1>
        <div class="accent-orange-text">Empowering Youth, Changing Lives</div>
        <p style="color: #9CA3AF; max-width: 500px; margin: 0 auto; font-size: 15px;">
            Welcome to our AI-powered assistant. Choose a profile below to start learning about our initiatives, volunteer opportunities, and donation channels.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    if not server_key_exists and not st.session_state.api_key_override:
        st.warning("⚠️ Groq API key is missing. Add your key in the sidebar configuration to active the chatbot.")
        
    st.write("### Choose a Chat Profile:")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("<div style='text-align: center;'><h3>🎓 Student</h3><p style='font-size:12px; color:#9CA3AF; min-height: 40px;'>Explore scholarships & education.</p></div>", unsafe_allow_html=True)
        if st.button("Start as Student", key="btn_student", use_container_width=True):
            select_persona_fn("student")
            st.rerun()
            
    with col2:
        st.markdown("<div style='text-align: center;'><h3>🙋 Volunteer</h3><p style='font-size:12px; color:#9CA3AF; min-height: 40px;'>Join drives & match skills.</p></div>", unsafe_allow_html=True)
        if st.button("Start as Volunteer", key="btn_volunteer", use_container_width=True):
            select_persona_fn("volunteer")
            st.rerun()
            
    with col3:
        st.markdown("<div style='text-align: center;'><h3>💰 Donor</h3><p style='font-size:12px; color:#9CA3AF; min-height: 40px;'>Learn 80G benefit & tax deduction.</p></div>", unsafe_allow_html=True)
        if st.button("Start as Donor", key="btn_donor", use_container_width=True):
            select_persona_fn("donor")
            st.rerun()

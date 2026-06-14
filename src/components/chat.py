import streamlit as st
import datetime

def render_chat_interface(
    persona,
    personas,
    messages,
    quick_actions,
    intake_step,
    handle_send_message_fn,
    format_volunteer_summary_fn,
    select_persona_fn,
    key_missing
):
    # Header Tabs to switch mode on the fly
    col_label, col_tab1, col_tab2, col_tab3 = st.columns([1, 2, 2, 2])
    with col_label:
        st.markdown("<div style='padding-top: 5px;'><strong>Mode:</strong></div>", unsafe_allow_html=True)
    with col_tab1:
        if st.button("🎓 Student", key="tab_student", use_container_width=True, type="primary" if persona == "student" else "secondary"):
            select_persona_fn("student")
            st.rerun()
    with col_tab2:
        if st.button("🙋 Volunteer", key="tab_volunteer", use_container_width=True, type="primary" if persona == "volunteer" else "secondary"):
            select_persona_fn("volunteer")
            st.rerun()
    with col_tab3:
        if st.button("💰 Donor", key="tab_donor", use_container_width=True, type="primary" if persona == "donor" else "secondary"):
            select_persona_fn("donor")
            st.rerun()
            
    st.markdown("---")
    
    # Display missing key banner
    if key_missing:
        st.error("⚠️ Groq API key is missing. Set it in the sidebar to send messages.")

    # Render Message History
    for msg in messages:
        role = "assistant" if msg["sender"] == "bot" else "user"
        avatar = "🎓" if role == "assistant" and persona == "student" else "🙋" if role == "assistant" and persona == "volunteer" else "💰" if role == "assistant" else None
        
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
                summary_text = format_volunteer_summary_fn(details)
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
    first_bot_message = messages[0] if len(messages) > 0 else None
    has_sent_first = st.session_state.get("hasSentFirstMessage", False)
    if not has_sent_first and first_bot_message is not None:
        st.write("💡 **Quick actions:**")
        cols = st.columns(len(quick_actions))
        for idx, act in enumerate(quick_actions):
            with cols[idx]:
                if st.button(act["text"], key=f"qa_{idx}", use_container_width=True):
                    handle_send_message_fn(act["query"])
                    st.rerun()

    # Active Volunteer Intake Workflow UI Helpers
    if intake_step > 0:
        # Show step header helper
        st.markdown(f"<div class='intake-indicator'>📋 Volunteer Intake Flow (Step {intake_step} of 4)</div>", unsafe_allow_html=True)
        
        # Intake helper selection choices
        if intake_step == 2:
            st.write("💡 **Skills shortcut selection:**")
            skills = ["Teaching", "Graphic Design", "Social Media", "Web Dev", "Other"]
            s_cols = st.columns(len(skills))
            for idx, skill in enumerate(skills):
                with s_cols[idx]:
                    if st.button(skill, key=f"skill_chip_{skill}", use_container_width=True):
                        handle_send_message_fn(skill)
                        st.rerun()
                        
        elif intake_step == 3:
            st.write("🗓️ **Availability shortcut selection:**")
            avails = ["Weekdays", "Weekends", "Both"]
            a_cols = st.columns(len(avails))
            for idx, avail in enumerate(avails):
                with a_cols[idx]:
                    if st.button(avail, key=f"avail_chip_{avail}", use_container_width=True):
                        handle_send_message_fn(avail)
                        st.rerun()
                        
        # Cancel Intake option
        if st.button("❌ Cancel Registration", key="cancel_intake_workflow"):
            st.session_state.intake_step = 0
            timestamp = datetime.datetime.now().strftime("%I:%M %p")
            messages.append({
                "id": f"msg-{datetime.datetime.now().timestamp()}",
                "sender": "bot",
                "text": "Volunteer registration cancelled. How else can I assist you?",
                "timestamp": timestamp
            })
            st.rerun()

    # Main Chat Input bar
    placeholder = "Ask a question..."
    if intake_step == 1:
        placeholder = "Enter your full name..."
    elif intake_step == 2:
        placeholder = "Enter your skills..."
    elif intake_step == 3:
        placeholder = "Enter your availability..."
    elif intake_step == 4:
        placeholder = "Enter your city..."
        
    prompt = st.chat_input(placeholder)
    if prompt:
        handle_send_message_fn(prompt)
        st.rerun()

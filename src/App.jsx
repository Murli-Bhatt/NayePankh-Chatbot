import React, { useState, useEffect, useRef } from 'react';

const SYSTEM_PROMPT = `You are a warm, helpful, and fact-grounded assistant for NayePankh Foundation, a UP government-registered NGO in India (12A & 80G certified) founded in 2021 to uplift underprivileged communities and stray animals.

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
- Never make up facts, programs, or statistics about the foundation. If you do not know something specific, say: 'For exact details, please contact NayePankh at contact@nayepankh.com or call +91- 8318500748'`;

const PERSONAS = {
  student: {
    id: 'student',
    name: 'Student',
    icon: '🎓',
    welcomeMsg: "Namaste! 👋 I'm here to help you explore scholarships and education programs by NayePankh. What would you like to know?"
  },
  volunteer: {
    id: 'volunteer',
    name: 'Volunteer',
    icon: '🙋',
    welcomeMsg: "Hi there! 🙌 Ready to make a difference? Tell me about your skills and I'll help you find the perfect volunteer role at NayePankh!"
  },
  donor: {
    id: 'donor',
    name: 'Donor',
    icon: '💰',
    welcomeMsg: "Hello! ❤️ Thank you for your interest in supporting NayePankh. Would you like to know how your donation creates impact?"
  }
};

const QUICK_ACTIONS = [
  { text: '🎓 Apply for Scholarship', id: 'scholarship' },
  { text: '🙋 Become a Volunteer', id: 'volunteer' },
  { text: '💰 How to Donate', id: 'donate' },
  { text: '📞 Contact Foundation', id: 'contact' }
];

const detectHindiLanguage = (text) => {
  if (!text) return false;
  // 1. Check for Devanagari Unicode character range
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return true;
  
  // 2. Check for common Romanized Hindi/Hinglish words
  const romanHindiWords = [
    /\baap\b/i, /\bkaise\b/i, /\bkya\b/i, /\bhai\b/i, /\bhoon\b/i, /\bho\b/i, 
    /\bnamaste\b/i, /\bnamaskar\b/i, /\bmujhe\b/i, /\bko\b/i, /\bse\b/i, /\bkar\b/i,
    /\bkarna\b/i, /\bkrna\b/i, /\bkarne\b/i, /\bhain\b/i, /\bhe\b/i, /\btha\b/i, 
    /\bthi\b/i, /\bthe\b/i, /\bkuch\b/i, /\bhoga\b/i, /\bhogi\b/i, /\bshukriya\b/i, 
    /\bdhanyawad\b/i, /\bmera\b/i, /\bmeri\b/i, /\bhamara\b/i, /\bhamari\b/i,
    /\bchahta\b/i, /\bchahti\b/i, /\bchahiye\b/i, /\bchahata\b/i, /\bchahatee\b/i,
    /\bkam\b/i, /\bkaam\b/i, /\bghar\b/i, /\baur\b/i, /\bbhi\b/i
  ];
  
  return romanHindiWords.some(regex => regex.test(text));
};

function App() {
  // Application State
  const [persona, setPersona] = useState(null);
  const [isWelcomeScreen, setIsWelcomeScreen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSentFirstMessage, setHasSentFirstMessage] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Volunteer Intake Flow State
  const [intakeStep, setIntakeStep] = useState(0); // 0 = inactive, 1-5 = active steps
  const [intakeData, setIntakeData] = useState({
    name: '',
    skills: '',
    availability: '',
    city: ''
  });

  // API Key override state in case env variable isn't configured
  const [apiKey, setApiKey] = useState(
    import.meta.env.REACT_APP_GROQ_API_KEY || ''
  );
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const messagesEndRef = useRef(null);

  // Helper to scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  // Set default API key from environment variable on load
  useEffect(() => {
    const envKey = import.meta.env.REACT_APP_GROQ_API_KEY;
    if (envKey) {
      setApiKey(envKey);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  // Initialize Chat with selected Persona
  const handleSelectPersona = (selectedPersonaId) => {
    const selectedPersona = PERSONAS[selectedPersonaId];
    setPersona(selectedPersonaId);
    setIsWelcomeScreen(false);
    setHasSentFirstMessage(false);
    setIntakeStep(0);
    setIntakeData({ name: '', skills: '', availability: '', city: '' });
    
    // Add default initial message
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'bot',
        text: selectedPersona.welcomeMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Reset Conversation / Switch Persona
  const handleSwitchPersona = (selectedPersonaId) => {
    handleSelectPersona(selectedPersonaId);
  };

  // Helper to append message to history
  const addMessage = (sender, text, extra = {}) => {
    const newMsg = {
      id: Math.random().toString(36).substring(2, 9),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...extra
    };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  // Check if message text triggers the volunteer intake flow
  const isVolunteerTrigger = (text) => {
    const lowerText = text.toLowerCase();
    return lowerText.includes('volunteer') || lowerText.includes('volunteering') || lowerText.includes('join as a volunteer');
  };

  // Handle Volunteer Intake Step Progression
  const progressVolunteerIntake = (userInput) => {
    // 1. Log the user response in chat
    addMessage('user', userInput);
    setHasSentFirstMessage(true);

    // Temp variables to hold updated intake data
    let updatedStep = intakeStep + 1;
    let updatedData = { ...intakeData };

    if (intakeStep === 1) {
      // User provided name
      updatedData.name = userInput;
      setIntakeData(updatedData);
      setIntakeStep(updatedStep);
      
      // Prompt for skills
      setTimeout(() => {
        addMessage('bot', `Thank you, ${userInput}! What skills can you offer to NayePankh? Choose from the options below or type your own:`, {
          inputType: 'skills'
        });
      }, 600);
    } 
    else if (intakeStep === 2) {
      // User provided skills
      updatedData.skills = userInput;
      setIntakeData(updatedData);
      setIntakeStep(updatedStep);

      // Prompt for availability
      setTimeout(() => {
        addMessage('bot', `Great! What is your availability to volunteer? Choose from the options below:`, {
          inputType: 'availability'
        });
      }, 600);
    } 
    else if (intakeStep === 3) {
      // User provided availability
      updatedData.availability = userInput;
      setIntakeData(updatedData);
      setIntakeStep(updatedStep);

      // Prompt for city
      setTimeout(() => {
        addMessage('bot', `Got it. Which city do you reside in?`);
      }, 600);
    } 
    else if (intakeStep === 4) {
      // User provided city - Final step
      updatedData.city = userInput;
      setIntakeData(updatedData);
      setIntakeStep(5);

      // Bot displays summary card and exits intake mode
      setTimeout(() => {
        addMessage('bot', `Your volunteer profile is ready! Screenshot this or click Download Summary.`, {
          isSummaryCard: true,
          summaryDetails: {
            name: updatedData.name,
            skills: updatedData.skills,
            availability: updatedData.availability,
            city: userInput
          }
        });
        // Exit intake flow back to normal
        setIntakeStep(0);
      }, 800);
    }
  };

  // Send Message to Groq API
  const callGroqAPI = async (userMsgText, currentHistory) => {
    setIsLoading(true);

    try {
      // Format conversation history for Groq
      // Exclude system message metadata and start fresh with system prompt
      const isHindiUser = detectHindiLanguage(userMsgText);
      const activeSystemPrompt = isHindiUser
        ? `${SYSTEM_PROMPT}\n\n[SYSTEM DIRECTIVE: The user has written in Hindi. You MUST reply in Hindi (preferably Devanagari script) and keep the tone warm, welcoming, and under 150 words.]`
        : SYSTEM_PROMPT;

      const formattedMessages = [
        { role: 'system', content: activeSystemPrompt }
      ];

      // Add actual messages from state (mapping bot->assistant, user->user)
      currentHistory.forEach((msg) => {
        // Skip the initial welcome message to let Llama focus on user query,
        // or include it as assistant message
        if (msg.id === 'welcome-msg') {
          formattedMessages.push({ role: 'assistant', content: msg.text });
        } else if (!msg.isSummaryCard) {
          formattedMessages.push({
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: msg.text
          });
        }
      });

      // Add the latest user message
      formattedMessages.push({ role: 'user', content: userMsgText });

      let response;
      let useProxy = true;

      // If the user entered their own API Key manually in the UI configuration,
      // bypass the proxy and query Groq directly.
      const envKey = import.meta.env.REACT_APP_GROQ_API_KEY || '';
      if (apiKey && apiKey.trim() !== envKey.strip?.() && apiKey.trim() !== envKey.trim()) {
        useProxy = false;
      }

      if (useProxy) {
        try {
          // Attempt to query the local Python FastAPI proxy server
          response = await fetch('http://localhost:8000/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: formattedMessages,
              max_tokens: 1000
            })
          });
        } catch (proxyError) {
          console.warn('FastAPI backend proxy is offline. Falling back to direct client-side Groq call.', proxyError);
          useProxy = false;
        }
      }

      // If proxy is bypassed or failed, query Groq directly from the browser
      if (!useProxy) {
        if (!apiKey || apiKey.trim() === '') {
          throw new Error('API_KEY_MISSING');
        }

        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: formattedMessages,
            max_tokens: 1000
          })
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Groq API Error:', errData);
        throw new Error(errData?.error?.message || errData?.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const botResponse = data.choices[0]?.message?.content || 'Sorry, I did not receive a response.';
      
      addMessage('bot', botResponse);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      if (error.message === 'API_KEY_MISSING') {
        addMessage('bot', 'Sorry, I cannot access the AI server because the Groq API key is missing. Please enter your Groq API key in the configuration bar at the top.');
      } else {
        addMessage('bot', 'Sorry, something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle message send
  const handleSendMessage = (textToSend = inputText) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Clear input field if sent from bottom input box
    if (textToSend === inputText) {
      setInputText('');
    }

    // A. Check if currently active in Volunteer Intake
    if (intakeStep > 0) {
      progressVolunteerIntake(trimmed);
      return;
    }

    // B. Check if starting the Volunteer Intake flow
    if (isVolunteerTrigger(trimmed)) {
      addMessage('user', trimmed);
      setHasSentFirstMessage(true);
      setIntakeStep(1);
      
      // Trigger first question
      setTimeout(() => {
        addMessage('bot', "Great! Let's get you set up as a volunteer. To start, what is your full name?");
      }, 600);
      return;
    }

    // C. Normal Chat flow with Groq API
    addMessage('user', trimmed);
    setHasSentFirstMessage(true);
    callGroqAPI(trimmed, messages);
  };

  // Quick action suggestion click handler
  const handleQuickAction = (actionText) => {
    handleSendMessage(actionText);
  };

  // Download volunteer summary helper
  const handleDownloadSummary = (details) => {
    const timestamp = new Date().toLocaleString();
    const summaryText = `================================================
NAYEPANKH FOUNDATION - VOLUNTEER INTAKE PROFILE
================================================
Generated on: ${timestamp}

Full Name:    ${details.name}
Skills:       ${details.skills}
Availability: ${details.availability}
City:         ${details.city}

Thank you for volunteering with NayePankh Foundation!
Our team will review your profile and contact you soon.
For direct assistance, email contact@nayepankh.com or call +91- 8318500748.
================================================`;

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NayePankh_Volunteer_${details.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export entire chat session as a text file
  const handleDownloadChat = () => {
    if (messages.length === 0) return;

    const timestamp = new Date().toLocaleString();
    let chatLog = `================================================
NAYEPANKH FOUNDATION CHAT LOG
Exported on: ${timestamp}
Persona: ${persona ? PERSONAS[persona].name : 'General'}
================================================\n\n`;

    messages.forEach((msg) => {
      const senderLabel = msg.sender === 'user' ? 'YOU' : 'NP ASSISTANT';
      chatLog += `[${msg.timestamp}] ${senderLabel}:\n`;
      if (msg.isSummaryCard) {
        chatLog += `[Volunteer Profile Created]\n`;
        chatLog += `- Name: ${msg.summaryDetails.name}\n`;
        chatLog += `- Skills: ${msg.summaryDetails.skills}\n`;
        chatLog += `- Availability: ${msg.summaryDetails.availability}\n`;
        chatLog += `- City: ${msg.summaryDetails.city}\n`;
      } else {
        chatLog += `${msg.text}\n`;
      }
      chatLog += `\n------------------------------------------------\n\n`;
    });

    const blob = new Blob([chatLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateFormatted = new Date().toISOString().split('T')[0];
    link.download = `NayePankh_Chat_${dateFormatted}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Welcome Screen UI Component
  if (isWelcomeScreen) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-gradient-to-tr from-green-50 via-white to-orange-50 font-sans text-gray-800">
        {/* Top bar */}
        <div className="p-4 flex justify-end">
          <button 
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-xs bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-primary-green px-3 py-1.5 rounded-full transition duration-300 font-medium"
          >
            ⚙️ {showApiKeyInput ? 'Hide Settings' : 'API Configuration'}
          </button>
        </div>

        {/* Center welcome card */}
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white/90 backdrop-blur-md border border-gray-100 rounded-3xl shadow-xl p-8 md:p-10 text-center relative overflow-hidden">
            {/* Background glowing circle decorations */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-orange/5 rounded-full -mr-8 -mt-8 blur-lg"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-green/5 rounded-full -ml-12 -mb-12 blur-lg"></div>

            {/* Logo initials badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-green to-accent-orange rounded-3xl shadow-md text-white text-3xl font-bold mb-6 transform hover:rotate-6 transition duration-300">
              NP
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
              NayePankh <span className="text-primary-green">Foundation</span>
            </h1>
            <p className="text-accent-orange font-semibold text-sm uppercase tracking-widest mb-4">
              Empowering Youth, Changing Lives
            </p>
            <p className="text-gray-600 mb-8 max-w-md mx-auto text-sm md:text-base">
              Welcome to our AI-powered assistant. Choose a profile below to start learning about our initiatives, volunteer opportunities, and donation channels.
            </p>

            {/* API Key Banner inside welcome card if not set */}
            {showApiKeyInput && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-left">
                <label className="block text-xs font-semibold text-orange-800 mb-1">
                  🔑 Enter Groq API Key:
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-grow text-xs border border-orange-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent-orange"
                  />
                  <button 
                    onClick={() => setShowApiKeyInput(false)}
                    className="bg-accent-orange hover:bg-accent-orange-dark text-white text-xs px-3 py-1.5 rounded-lg font-medium transition duration-200 shadow-sm"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  API Key is stored locally in memory. You can also save it as <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600">REACT_APP_GROQ_API_KEY</code> in a <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> file.
                </p>
              </div>
            )}

            {/* Persona Selector Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(PERSONAS).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPersona(p.id)}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary-green/30 hover:shadow-lg hover:-translate-y-1 transition duration-300 group cursor-pointer"
                >
                  <span className="text-3xl mb-2 group-hover:scale-125 transition duration-300">{p.icon}</span>
                  <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                  <span className="text-[11px] text-gray-500 mt-1">Start as {p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center text-xs text-gray-500 bg-white/50 border-t border-gray-100">
          Powered by Groq AI | NayePankh Foundation 2025 |{' '}
          <a
            href="https://nayepankh.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-green hover:underline font-semibold"
          >
            nayepankh.org
          </a>
        </div>
      </div>
    );
  }

  // Active Chat Screen UI Component
  const activePersona = PERSONAS[persona];
  const firstBotMessage = messages.find(m => m.id === 'welcome-msg');
  const showSuggestions = !hasSentFirstMessage && firstBotMessage;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800 relative">
      
      {/* Header bar */}
      <header className="bg-gradient-to-r from-primary-green to-accent-orange px-4 py-3 md:px-6 shadow-md text-white flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          {/* Hamburger button on mobile */}
          <button 
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1 rounded-lg hover:bg-white/10 block md:hidden transition cursor-pointer"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base md:text-xl tracking-tight">NayePankh Foundation</span>
              <span className="bg-white/20 text-[9px] md:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full hidden sm:inline-block">AI Chat</span>
            </div>
            <p className="text-[10px] md:text-[11px] text-green-50 font-medium">Empowering Youth, Changing Lives</p>
          </div>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleDownloadChat}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-xs md:text-sm px-3 py-1.5 rounded-xl transition font-medium border border-white/10 cursor-pointer disabled:cursor-not-allowed"
            title="Download Chat Log"
          >
            📥 <span>Download Chat</span>
          </button>
          
          <button
            onClick={() => setIsWelcomeScreen(true)}
            className="bg-white/10 hover:bg-white/20 text-xs md:text-sm px-3 py-1.5 rounded-xl transition font-medium border border-white/10 cursor-pointer"
          >
            🏠 <span>Home</span>
          </button>
        </div>

        {/* Mobile Header Active Pill */}
        <div className="block md:hidden bg-white/20 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm border border-white/15">
          <span>{activePersona.icon}</span>
          <span className="capitalize">{activePersona.name}</span>
        </div>
      </header>

      {/* API Key Panel inside Chat View (if missing) */}
      {showApiKeyInput && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-orange-800 font-medium">
            ⚠️ Groq API key is missing. Set it to activate the chatbot:
          </span>
          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <input
              type="password"
              placeholder="gsk_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full text-xs border border-orange-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-accent-orange"
            />
            <button 
              onClick={() => setShowApiKeyInput(false)}
              className="bg-accent-orange hover:bg-accent-orange-dark text-white text-xs px-3 py-1 rounded-lg font-medium transition duration-200 shrink-0"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Tabs for changing persona (Desktop only) */}
      <div className="hidden md:flex bg-white border-b border-gray-200 px-4 py-2.5 items-center justify-center gap-2 shrink-0">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider mr-2">Mode:</span>
        <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
          {Object.values(PERSONAS).map((p) => {
            const isActive = persona === p.id;
            const activeColorClass = p.id === 'donor'
              ? 'bg-accent-orange text-white shadow-md'
              : 'bg-primary-green text-white shadow-md';
            return (
              <button
                key={p.id}
                onClick={() => handleSwitchPersona(p.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? activeColorClass
                    : 'text-gray-600 hover:text-primary-green hover:bg-gray-50'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages Window */}
      <main className="flex-grow overflow-y-auto p-4 md:p-6 bg-[#F1F6F1]">
        <div className="max-w-3xl w-full mx-auto flex flex-col min-h-full space-y-4">
          <div className="flex-grow" />
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] animate-message ${
                  isBot ? 'self-start' : 'self-end flex-row-reverse'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm ${
                    isBot ? 'bg-primary-green shadow' : 'bg-accent-orange shadow'
                  }`}
                >
                  {isBot ? 'NP' : 'You'}
                </div>

                {/* Message Content */}
                <div className="flex flex-col">
                  <div
                    className={`px-4 py-3 rounded-2xl leading-relaxed ${
                      isBot
                        ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none chat-bubble-shadow'
                        : 'bg-primary-green text-white rounded-tr-none user-bubble-shadow'
                    }`}
                  >
                    {/* Render Special Volunteer Summary Card if applicable */}
                    {msg.isSummaryCard ? (
                      <div className="text-gray-800 text-sm">
                        <p className="font-semibold text-primary-green border-b border-gray-100 pb-2 mb-2 flex items-center gap-1.5">
                          📝 Volunteer Profile Summary
                        </p>
                        <div className="space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <p><strong className="text-gray-500">Name:</strong> {msg.summaryDetails.name}</p>
                          <p><strong className="text-gray-500">Skills:</strong> {msg.summaryDetails.skills}</p>
                          <p><strong className="text-gray-500">Availability:</strong> {msg.summaryDetails.availability}</p>
                          <p><strong className="text-gray-500">City:</strong> {msg.summaryDetails.city}</p>
                        </div>
                        <button
                          onClick={() => handleDownloadSummary(msg.summaryDetails)}
                          className="mt-3 w-full bg-accent-orange hover:bg-accent-orange-dark text-white font-semibold text-xs py-2 px-3 rounded-xl transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          📥 Download Summary
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Skill Buttons in intake workflow (Step 2) */}
                    {isBot && msg.inputType === 'skills' && intakeStep === 2 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        {['Teaching', 'Graphic Design', 'Social Media', 'Web Dev', 'Other'].map((skill) => (
                          <button
                            key={skill}
                            onClick={() => handleSendMessage(skill)}
                            className="bg-gray-100 hover:bg-primary-green hover:text-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm hover:shadow"
                          >
                            💡 {skill}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Availability Buttons in intake workflow (Step 3) */}
                    {isBot && msg.inputType === 'availability' && intakeStep === 3 && (
                      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                        {['Weekdays', 'Weekends', 'Both'].map((avail) => (
                          <button
                            key={avail}
                            onClick={() => handleSendMessage(avail)}
                            className="bg-gray-100 hover:bg-primary-green hover:text-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition cursor-pointer shadow-sm hover:shadow"
                          >
                            🗓️ {avail}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span
                    className={`text-[10px] text-gray-400 mt-1 ${
                      isBot ? 'self-start pl-1' : 'self-end pr-1'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] self-start animate-message">
              <div className="w-8 h-8 rounded-full bg-primary-green flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                NP
              </div>
              <div className="flex flex-col">
                <div className="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-10 chat-bubble-shadow">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-dot-1"></div>
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-dot-2"></div>
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-dot-3"></div>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 pl-1">NayePankh is typing...</span>
              </div>
            </div>
          )}

          {/* Suggestions row - Only show below first welcome message, hides after first user interaction */}
          {showSuggestions && (
            <div className="pt-2 pl-11 flex flex-wrap gap-2 self-start max-w-full">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.text)}
                  className="bg-white hover:bg-green-50 hover:text-primary-green border border-gray-200 hover:border-primary-green/30 text-gray-600 text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-sm transition duration-200 flex items-center gap-1 cursor-pointer"
                >
                  {action.text}
                </button>
              ))}
            </div>
          )}

          {/* Scroll Anchor */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input container */}
      <footer className="bg-white border-t border-gray-200 p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Volunteer intake step indicator helper (if active) */}
          {intakeStep > 0 && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-primary-green font-bold flex items-center gap-1">
                📋 Volunteer Intake Flow (Step {intakeStep} of 4)
              </span>
              <button 
                onClick={() => {
                  setIntakeStep(0);
                  addMessage('bot', 'Volunteer registration cancelled. How else can I assist you?');
                }}
                className="text-[11px] text-red-500 hover:underline font-semibold cursor-pointer"
              >
                Cancel Registration
              </button>
            </div>
          )}

          {/* Chat text box */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-primary-green focus-within:border-transparent transition duration-200">
            <input
              type="text"
              placeholder={
                intakeStep === 1 
                  ? "Enter your full name..."
                  : intakeStep === 2 
                  ? "Type your skills (or click an option above)..."
                  : intakeStep === 3 
                  ? "Type your availability (or click an option above)..."
                  : intakeStep === 4 
                  ? "Enter your city..."
                  : `Ask a question to the NayePankh ${activePersona.name} bot...`
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              disabled={isLoading}
              className="flex-grow bg-transparent text-sm md:text-base px-3 py-2 focus:outline-none text-gray-800 disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className="bg-accent-orange hover:bg-accent-orange-dark disabled:bg-gray-300 text-white font-bold p-2.5 rounded-xl transition duration-200 flex items-center justify-center shrink-0 shadow-sm hover:shadow cursor-pointer disabled:cursor-not-allowed"
            >
              {/* Send icon SVG */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </button>
          </div>

          {/* Bottom attribution footer */}
          <div className="mt-3 flex justify-between items-center text-[10px] text-gray-400">
            <span>Powered by Groq AI | NayePankh Foundation 2025</span>
            <a 
              href="https://nayepankh.org" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary-green hover:underline font-semibold"
            >
              nayepankh.org
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Drawer Sidebar */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileDrawerOpen(false)}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative flex flex-col w-72 max-w-xs bg-white h-full shadow-2xl p-5 animate-slide-in">
            {/* Close Button */}
            <button 
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>

            {/* Brand Logo & Info */}
            <div className="mb-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-green to-accent-orange text-white flex items-center justify-center font-bold text-sm">
                  NP
                </div>
                <span className="font-bold text-gray-900 text-lg">NayePankh</span>
              </div>
              <p className="text-[10px] text-accent-orange font-semibold tracking-wider uppercase mt-1">
                Empowering Youth, Changing Lives
              </p>
            </div>

            {/* Navigation / Actions */}
            <div className="flex-grow space-y-6">
              {/* Persona selection vertical list */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                  Persona Mode
                </h3>
                <div className="space-y-2">
                  {Object.values(PERSONAS).map((p) => {
                    const isActive = persona === p.id;
                    const activeColorClass = p.id === 'donor' 
                      ? 'bg-accent-orange text-white shadow-md' 
                      : 'bg-primary-green text-white shadow-md';
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleSwitchPersona(p.id);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition cursor-pointer ${
                          isActive
                            ? activeColorClass
                            : 'text-gray-600 hover:bg-gray-50 hover:text-primary-green'
                        }`}
                      >
                        <span className="text-lg">{p.icon}</span>
                        <span>{p.name} Mode</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action List */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                  Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleDownloadChat();
                      setIsMobileDrawerOpen(false);
                    }}
                    disabled={messages.length === 0}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary-green border border-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Download Chat</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsWelcomeScreen(true);
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary-green border border-gray-100 cursor-pointer"
                  >
                    <span>🏠</span>
                    <span>Go to Welcome Screen</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer inside drawer */}
            <div className="border-t border-gray-100 pt-4 text-center">
              <a
                href="https://nayepankh.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-primary-green hover:underline"
              >
                Visit nayepankh.org
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

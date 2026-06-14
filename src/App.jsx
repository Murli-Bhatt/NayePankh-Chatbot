import { useState, useEffect, useRef } from 'react';
import { SYSTEM_PROMPT, PERSONAS, QUICK_ACTIONS } from './constants/chatConstants.js';
import {
  detectHindiLanguage,
  createMessage,
  downloadChatLog,
  downloadVolunteerSummary
} from './utils/chatHelpers.js';
import WelcomeScreen from './components/WelcomeScreen.jsx';
import ChatHeader from './components/ChatHeader.jsx';
import ChatMessages from './components/ChatMessages.jsx';
import ChatInput from './components/ChatInput.jsx';
import MobileDrawer from './components/MobileDrawer.jsx';

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

  // API Key override state in case env variable isn't configured (lazy initialization)
  const [apiKey, setApiKey] = useState(() => import.meta.env.REACT_APP_GROQ_API_KEY || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(() => !import.meta.env.REACT_APP_GROQ_API_KEY);

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
    const newMsg = createMessage(sender, text, extra);
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
      if (apiKey && apiKey.trim() !== envKey.trim()) {
        useProxy = false;
      }

      if (useProxy) {
        try {
          // Query the configured API URL or fallback to local port 8000
          const apiBaseUrl = import.meta.env.REACT_APP_API_URL || 'http://localhost:8000';
          response = await fetch(`${apiBaseUrl}/api/chat`, {
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

  // Export entire chat session as a text file
  const handleDownloadChatLog = () => {
    const personaName = persona ? PERSONAS[persona].name : 'General';
    downloadChatLog(messages, personaName);
  };

  // Welcome Screen Rendering
  if (isWelcomeScreen) {
    return (
      <WelcomeScreen
        personas={PERSONAS}
        onSelectPersona={handleSelectPersona}
        apiKey={apiKey}
        setApiKey={setApiKey}
        showApiKeyInput={showApiKeyInput}
        setShowApiKeyInput={setShowApiKeyInput}
      />
    );
  }

  const activePersona = PERSONAS[persona];
  const firstBotMessage = messages.find(m => m.id === 'welcome-msg');
  const showSuggestions = !hasSentFirstMessage && firstBotMessage;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800 relative">
      
      {/* Header bar */}
      <ChatHeader
        activePersona={activePersona}
        messages={messages}
        handleDownloadChat={handleDownloadChatLog}
        setIsWelcomeScreen={setIsWelcomeScreen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
      />

      {/* API Key Panel inside Chat View (if missing) */}
      {showApiKeyInput && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
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
              className="bg-accent-orange hover:bg-accent-orange-dark text-white text-xs px-3 py-1 rounded-lg font-medium transition duration-200 shrink-0 cursor-pointer"
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
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        showSuggestions={showSuggestions}
        quickActions={QUICK_ACTIONS}
        intakeStep={intakeStep}
        handleSendMessage={handleSendMessage}
        handleQuickAction={handleQuickAction}
        handleDownloadSummary={downloadVolunteerSummary}
        messagesEndRef={messagesEndRef}
      />

      {/* Input container */}
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        isLoading={isLoading}
        intakeStep={intakeStep}
        setIntakeStep={setIntakeStep}
        activePersona={activePersona}
        handleSendMessage={handleSendMessage}
        addMessage={addMessage}
      />

      {/* Mobile Drawer Sidebar */}
      <MobileDrawer
        isMobileDrawerOpen={isMobileDrawerOpen}
        setIsMobileDrawerOpen={setIsMobileDrawerOpen}
        personas={PERSONAS}
        persona={persona}
        handleSwitchPersona={handleSwitchPersona}
        handleDownloadChat={handleDownloadChatLog}
        messages={messages}
        setIsWelcomeScreen={setIsWelcomeScreen}
      />
    </div>
  );
}

export default App;

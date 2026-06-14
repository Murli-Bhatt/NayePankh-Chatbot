export default function ChatInput({
  inputText,
  setInputText,
  isLoading,
  intakeStep,
  setIntakeStep,
  activePersona,
  handleSendMessage,
  addMessage
}) {
  return (
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
  );
}

export default function ChatMessages({
  messages,
  isLoading,
  showSuggestions,
  quickActions,
  intakeStep,
  handleSendMessage,
  handleQuickAction,
  handleDownloadSummary,
  messagesEndRef
}) {
  return (
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
            {quickActions.map((action) => (
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
  );
}

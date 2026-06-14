export default function WelcomeScreen({
  personas,
  onSelectPersona,
  apiKey,
  setApiKey,
  showApiKeyInput,
  setShowApiKeyInput
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-tr from-green-50 via-white to-orange-50 font-sans text-gray-800">
      {/* Top bar */}
      <div className="p-4 flex justify-end">
        <button 
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className="text-xs bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-primary-green px-3 py-1.5 rounded-full transition duration-300 font-medium cursor-pointer"
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
                  className="bg-accent-orange hover:bg-accent-orange-dark text-white text-xs px-3 py-1.5 rounded-lg font-medium transition duration-200 shadow-sm cursor-pointer"
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
            {Object.values(personas).map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPersona(p.id)}
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

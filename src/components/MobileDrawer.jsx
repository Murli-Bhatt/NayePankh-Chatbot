export default function MobileDrawer({
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  personas,
  persona,
  handleSwitchPersona,
  handleDownloadChat,
  messages,
  setIsWelcomeScreen
}) {
  if (!isMobileDrawerOpen) return null;

  return (
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
              {Object.values(personas).map((p) => {
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary-green border border-gray-100 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
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
  );
}

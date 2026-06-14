export default function ChatHeader({
  activePersona,
  messages,
  handleDownloadChat,
  setIsWelcomeScreen,
  setIsMobileDrawerOpen
}) {
  return (
    <header className="bg-gradient-to-r from-primary-green to-accent-orange px-4 py-3 md:px-6 shadow-md text-white flex justify-between items-center z-10 shrink-0">
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
  );
}

export const detectHindiLanguage = (text) => {
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

export const createMessage = (sender, text, extra = {}) => {
  return {
    id: `msg-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    ...extra
  };
};

export const downloadVolunteerSummary = (details) => {
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

export const downloadChatLog = (messages, personaName) => {
  if (messages.length === 0) return;

  const timestamp = new Date().toLocaleString();
  let chatLog = `================================================
NAYEPANKH FOUNDATION CHAT LOG
Exported on: ${timestamp}
Persona: ${personaName}
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

/**
 * Smart voice command parser
 * Extracts target (contact/group) and message from natural speech
 * Handles Indian English, Hindi-English mix
 */

const TRIGGER_WORDS = ['tell', 'send', 'message', 'to', 'inform', 'notify', 'ping', 'whatsapp', 'ask'];

const MSG_STARTERS = [
  'i ', 'the ', 'a ', 'an ', 'we ', 'our ', 'my ', 'your ',
  'please ', 'can ', 'is ', 'are ', 'was ', 'were ',
  'hi ', 'hey ', 'hello ', 'meeting ', 'call ', 'let ',
  'will ', "won't ", 'gonna ', 'going ', 'that ', 'this ',
  'there ', 'it ', 'she ', 'he ', 'they ', 'you ',
  'just ', 'come ', "don't ", 'do ', 'did ', 'has ',
  'have ', 'had ', 'how ', 'what ', 'when ', 'where ',
  'today ', 'tomorrow ', 'tonight ', 'morning ', 'evening ',
  'schedule', 'cancel', 'postpone', 'confirm', 'reminder',
  'bhai ', 'yaar ', 'sir ', 'okay ', 'ok ',
];

/**
 * Parse a voice transcript into { contacts, message, confidence }
 * contacts: array of spoken names (before fuzzy matching)
 * message: the message body
 */
export function parseVoiceCommand(transcript) {
  if (!transcript?.trim()) return { contacts: [], message: '', confidence: 0 };

  let working = transcript.trim();

  // Remove wake word if present
  working = working.replace(/^hey\s+voco\s*/i, '').trim();

  // Remove trigger word from start
  for (const trigger of TRIGGER_WORDS) {
    const re = new RegExp(`^${trigger}\\s+`, 'i');
    if (re.test(working)) {
      working = working.replace(re, '').trim();
      break;
    }
  }

  // Find where message starts
  const workingLower = working.toLowerCase();
  let msgStartIndex = -1;

  for (const starter of MSG_STARTERS) {
    const idx = workingLower.indexOf(starter);
    if (idx > 2) {
      if (msgStartIndex === -1 || idx < msgStartIndex) {
        msgStartIndex = idx;
      }
    }
  }

  if (msgStartIndex > 0) {
    const namesPart = working.slice(0, msgStartIndex).trim();
    const messagePart = working.slice(msgStartIndex).trim();
    if (namesPart && messagePart) {
      const contacts = extractNames(namesPart);
      if (contacts.length > 0 && messagePart.length > 2) {
        return { contacts, message: messagePart, confidence: 0.85 };
      }
    }
  }

  // Fallback: "and" boundary
  const words = working.split(' ');
  if (words.length >= 3) {
    // Try first 1-3 words as name, rest as message
    for (let nameLen = 3; nameLen >= 1; nameLen--) {
      const namePart = words.slice(0, nameLen).join(' ');
      const msgPart = words.slice(nameLen).join(' ');
      if (msgPart.length > 5) {
        return {
          contacts: extractNames(namePart),
          message: msgPart,
          confidence: 0.5,
        };
      }
    }
  }

  return { contacts: [], message: working, confidence: 0.1 };
}

function extractNames(part) {
  return part
    .replace(/,/g, ' ')
    .replace(/\band\b/gi, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 1 && !/^(the|a|an|to|for|of|in|on|at|i|my|our)$/i.test(w))
    .map(capitalize);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

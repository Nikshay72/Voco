/**
 * Fuzzy contact/group matcher
 * No external library needed — custom implementation
 */
import { CONTACTS, GROUPS, ALIASES } from '../data/contacts';

// Get all searchable names
function getAllNames() {
  return [
    ...Object.keys(CONTACTS),
    ...Object.keys(GROUPS),
    ...Object.keys(ALIASES),
  ];
}

// Simple fuzzy score — higher = better match
function fuzzyScore(query, target) {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (t === q) return 1.0;
  if (t.includes(q) || q.includes(t)) return 0.9;

  // Word overlap score
  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);
  let matchedWords = 0;
  for (const qw of qWords) {
    for (const tw of tWords) {
      if (tw.includes(qw) || qw.includes(tw)) {
        matchedWords++;
        break;
      }
    }
  }
  const wordScore = matchedWords / Math.max(qWords.length, tWords.length);
  if (wordScore > 0.5) return wordScore;

  // Character overlap
  let charMatches = 0;
  for (const ch of q) {
    if (t.includes(ch)) charMatches++;
  }
  return charMatches / Math.max(q.length, t.length) * 0.5;
}

/**
 * Find best matching contact or group for a spoken name
 * @param {string} spokenName - What the user said
 * @returns {{ name: string, type: 'contact'|'group', numbers: string[], score: number } | null}
 */
export function findBestMatch(spokenName) {
  if (!spokenName) return null;

  const query = spokenName.toLowerCase().trim();

  // Check aliases first (exact)
  for (const [alias, realName] of Object.entries(ALIASES)) {
    if (alias.toLowerCase() === query || query.includes(alias.toLowerCase())) {
      return resolveByName(realName, 1.0);
    }
  }

  // Score all names
  const allNames = getAllNames();
  let bestScore = 0;
  let bestName = null;

  for (const name of allNames) {
    const score = fuzzyScore(query, name);
    if (score > bestScore) {
      bestScore = score;
      bestName = name;
    }
  }

  if (bestScore < 0.3) return null; // no good match

  // Resolve alias if needed
  if (ALIASES[bestName]) {
    return resolveByName(ALIASES[bestName], bestScore);
  }

  return resolveByName(bestName, bestScore);
}

function resolveByName(name, score) {
  if (GROUPS[name]) {
    return { name, type: 'group', numbers: GROUPS[name], score };
  }
  if (CONTACTS[name]) {
    return { name, type: 'contact', numbers: [CONTACTS[name]], score };
  }
  return null;
}

/**
 * Get all contacts and groups for the Settings UI
 */
export function getAllContacts() {
  return Object.entries(CONTACTS).map(([name, number]) => ({ name, number, type: 'contact' }));
}

export function getAllGroups() {
  return Object.entries(GROUPS).map(([name, members]) => ({ name, members, type: 'group' }));
}

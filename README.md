# Voco — AI Voice WhatsApp Assistant

> Say **"Hey Voco"** → Speak your command → Message sent automatically

---

## What is Voco?

Voco is a hands-free AI voice assistant that lets you send WhatsApp messages just by speaking. No typing, no tapping — just talk.

**Example:**
> You say: *"Hey Voco"*
> Voco activates and says: *"Yes, I'm listening"*
> You say: *"To Systrans Interns hello everyone meeting is at 10"*
> Voco sends the message to all group members and confirms: *"Message sent to Systrans Interns successfully"*

---

## Features

- 🎙️ **Hey Voco wake word** — hands-free activation
- 🔇 **Auto silence detection** — stops recording automatically after 2 seconds of silence
- 🧠 **Smart parser** — understands natural Indian English speech
- 👥 **Group broadcast** — send to multiple people at once
- 🔍 **Fuzzy name matching** — "sys interns", "systrans", "intern group" all work
- 📤 **WhatsApp API** — sends directly, no manual WhatsApp needed
- 🗣️ **Voice feedback (TTS)** — Voco speaks back to confirm
- 📋 **Message history** — see all sent messages
- 🌙 **Dark glassmorphism UI** — beautiful purple/pink gradient design

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native + Expo SDK 51 |
| Voice Recording | expo-av |
| Transcription | AssemblyAI API |
| Text-to-Speech | expo-speech |
| WhatsApp Sending | syswhatsapp.syspaisa.com API |
| Navigation | @react-navigation/bottom-tabs |
| Storage | AsyncStorage |
| UI | expo-linear-gradient + react-native-svg |

---

## Project Structure

```
VocoNew/
├── App.js                          # Root app, navigation setup
├── app.json                        # Expo config
├── package.json                    # Dependencies
└── src/
    ├── screens/
    │   ├── HomeScreen.js           # Main voice screen
    │   ├── HistoryScreen.js        # Message history
    │   └── SettingsScreen.js       # Settings & contact list
    ├── hooks/
    │   └── useRecorder.js          # Audio recording + silence detection
    ├── services/
    │   ├── transcription.js        # AssemblyAI API
    │   ├── whatsapp.js             # WhatsApp send API
    │   └── tts.js                  # Text-to-speech
    ├── utils/
    │   ├── parser.js               # Voice command parser
    │   ├── fuzzyMatcher.js         # Contact/group name matching
    │   └── storage.js              # AsyncStorage helpers
    └── data/
        └── contacts.js             # ⭐ YOUR CONTACTS & GROUPS GO HERE
```

---

## Setup Instructions

### Step 1 — Prerequisites

- Windows PC with Node.js installed
- Android phone with **Expo Go SDK 51** installed
- Both devices on the **same WiFi network**

Install Expo Go SDK 51:
```
https://expo.dev/go?sdkVersion=51&platform=android&device=true
```

### Step 2 — Install & Run

```bash
# 1. Extract the VocoNew zip to D:\vs code\
# 2. Open Command Prompt and navigate to folder
cd "D:\vs code\Voco_Final\VocoNew"

# 3. Install dependencies
npm install

# 4. Start the development server
npx expo start

# 5. Scan QR code with Expo Go (SDK 51) on your phone
```

### Step 3 — Add Your Contacts

Open `src/data/contacts.js` in Notepad:

```bash
notepad "D:\vs code\Voco_Final\VocoNew\src\data\contacts.js"
```

Add your contacts and groups with real phone numbers:

```javascript
export const CONTACTS = {
  "Rahul": "919876543210",    // 91 + 10 digit number
  "Priya": "919765432109",
  // Add more...
};

export const GROUPS = {
  "Group name": [
    "919876543210",
    "919765432109",
    "919654321098",
    // Add all member numbers...
  ],
  // Add more groups...
};

export const ALIASES = {
  "Group": "Group name",
  "group send": "Group name",
  "all group": "Group name",
  // Add alternate names you might say...
};
```

**Number format:** Always use country code + number (no spaces/dashes)
- India: `91` + 10 digits = `"919414123456"`

---

## How to Use

### Manual Mode (tap to speak)
1. Open Voco app
2. Tap the **glass orb**
3. Speak: *"Tell Rahul the meeting is at 10"*
4. Wait for silence detection (2 seconds)
5. App transcribes, matches contact, sends message

### Wake Word Mode (hands-free)
1. Tap **"Enable Wake Mode"** button
2. Say **"Hey Voco"** — orb activates (yellow glow)
3. Speak your command: *"To Systrans Interns hello everyone"*
4. App automatically sends and confirms via voice
5. Returns to listening mode automatically

### Speaking Tips

| What you want | What to say |
|---------------|-------------|
| Single contact | *"Tell Rahul I will be late"* |
| Multiple contacts | *"Send Priya and Amit meeting cancelled"* |
| Group | *"To Systrans Interns hello everyone"* |
| Casual | *"Message Komal how are you"* |

**No need to say comma** — the app figures out where the name ends and message begins automatically.

---

## API Configuration

### AssemblyAI (Transcription)
- **Key:** `e25476c2dbd74cfd965eb2143a614814`
- **File:** `src/services/transcription.js`
- Free tier: 100 hours/month
- Get new key: https://assemblyai.com

### WhatsApp API
- **URL:** `to be added`
- **Username:** ``
- **Token:** ``
- **File:** ``

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Project incompatible with Expo Go" | Use SDK 51 Expo Go from the special link above, NOT Play Store |
| App stuck on loading screen | `npx expo start --clear` |
| "Network response timed out" | Use `npx expo start --tunnel` instead |
| Upload failed | Check AssemblyAI key in `transcription.js` |
| Message going to wrong number | Update real numbers in `src/data/contacts.js` |
| Contact not found | Add aliases in `ALIASES` in `contacts.js` |
| Wake word not detected | Speak clearly, say "Hey Voco" slowly |
| App slow in wake mode | Normal — each chunk takes 3-4 seconds to process |

---

## Known Limitations

1. **Wake word delay** — 3-4 second delay per detection chunk (AssemblyAI upload time). True instant wake word requires a native Android build.
2. **WhatsApp groups** — Cannot read real WhatsApp groups. Groups must be defined manually in `contacts.js`.
3. **Contact sync** — Cannot auto-sync phone contacts. Must be added manually.
4. **Background mode** — App must be open and screen on for wake word to work.

---

## Developer

**Nikshay**
JIET Jodhpur, Rajasthan
Built with React Native + Expo + AssemblyAI

---

## Version History

| Version | Changes |
|---------|---------|
| v1.0 | Initial build — basic voice to WhatsApp |
| v1.1 | Added group broadcast support |
| v1.2 | Added Hey Voco wake word |
| v1.3 | Improved silence detection, wake log display |
| v1.4 | Switched to AssemblyAI, fixed upload issues |


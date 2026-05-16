/**
 * HomeScreen — Voco AI Voice Assistant
 * Wake word: uses Android SpeechRecognizer (on-device, instant, free)
 * Command: records audio → AssemblyAI transcription → parse → send
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Animated, Dimensions, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useRecorder } from '../hooks/useRecorder';
import { transcribeAudio } from '../services/transcription';
import { sendWhatsAppBroadcast } from '../services/whatsapp';
import { parseVoiceCommand } from '../utils/parser';
import { findBestMatch } from '../utils/fuzzyMatcher';
import { speak, stopSpeaking, PHRASES } from '../services/tts';
import { saveMessage, createHistoryEntry } from '../utils/storage';

const { width } = Dimensions.get('window');
const BUBBLE = width * 0.60;

const S = {
  STANDBY: 'STANDBY',
  WAKE_MODE: 'WAKE_MODE',
  WAKE_DETECTED: 'WAKE_DETECTED',
  LISTENING: 'LISTENING',
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  SENDING: 'SENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

const WAKE_PHRASES = ['hey voco', 'hey poco', 'a voco', 'hey boco', 'voco', 'hey woco', 'ok voco'];

// ─── Glass Orb ─────────────────────────────────────────────────────────────
function GlassOrb({ status, levels, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const wakeAnim = useRef(new Animated.Value(1)).current;

  const isListening = status === S.LISTENING;
  const isWake = status === S.WAKE_MODE;
  const isWakeDetected = status === S.WAKE_DETECTED;
  const isProcessing = [S.UPLOADING, S.PROCESSING, S.SENDING].includes(status);
  const isSuccess = status === S.SUCCESS;

  useEffect(() => {
    if (isListening) {
      Animated.loop(Animated.sequence([
        Animated.timing(scale, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.97, duration: 900, useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.timing(rot, { toValue: 1, duration: 4000, useNativeDriver: true })).start();
      Animated.timing(glow, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else if (isWake) {
      Animated.loop(Animated.sequence([
        Animated.timing(wakeAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(wakeAnim, { toValue: 0.99, duration: 2000, useNativeDriver: true }),
      ])).start();
      Animated.timing(glow, { toValue: 0.4, duration: 400, useNativeDriver: false }).start();
    } else if (isWakeDetected) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 200, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 200, useNativeDriver: true }),
      ]).start();
      Animated.timing(glow, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    } else {
      [scale, rot, wakeAnim].forEach(a => a.stopAnimation());
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(wakeAnim, { toValue: 1, useNativeDriver: true }).start();
      Animated.timing(glow, { toValue: 0, duration: 400, useNativeDriver: false }).start();
    }
  }, [isListening, isWake, isWakeDetected]);

  const spin = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] });
  const glowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 35] });

  const colors = isSuccess ? ['#86efac', '#22c55e', '#16a34a']
    : isWakeDetected ? ['#fde68a', '#f59e0b', '#f9a8d4']
    : isWake ? ['#fde68a', '#f59e0b', '#fb923c']
    : isListening ? ['#f9a8d4', '#c084fc', '#67e8f9']
    : ['#e879f9', '#a78bfa', '#60a5fa'];

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || isWake} activeOpacity={0.9}>
      <Animated.View style={[ST.orbWrapper, { transform: [{ scale: isWake ? wakeAnim : scale }] }]}>
        <Animated.View style={[ST.orbGlow, { shadowRadius: glowRadius, shadowOpacity: glowOpacity }]} />
        <View style={ST.orbRing} />
        <LinearGradient colors={colors} style={ST.orb} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
          <LinearGradient colors={['rgba(255,255,255,0.60)', 'rgba(255,255,255,0.18)', 'transparent']}
            style={ST.shineA} start={{ x: 0, y: 0 }} end={{ x: 0.65, y: 0.65 }} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.10)']}
            style={ST.shineB} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} pointerEvents="none" />
          <Animated.View style={[ST.innerSpin, { transform: [{ rotate: spin }], opacity: isListening ? 0.45 : 0.12 }]}>
            <LinearGradient colors={['rgba(255,255,255,0.7)', 'transparent', 'rgba(255,255,255,0.3)', 'transparent']}
              style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          </Animated.View>
          <View style={ST.orbCenter}>
            {isSuccess ? <Text style={{ fontSize: 48, color: '#fff' }}>✓</Text>
              : isProcessing ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 34, color: 'rgba(255,255,255,0.9)' }}>◌</Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 }}>
                    {status === S.SENDING ? 'SENDING' : 'PROCESSING'}
                  </Text>
                </View>
              ) : isListening ? (
                <View style={ST.waveBars}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const lv = levels[Math.floor((i / 7) * levels.length)] || 0.15;
                    return <View key={i} style={[ST.waveBar, { height: 10 + lv * 55 }]} />;
                  })}
                </View>
              ) : isWakeDetected ? (
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 32 }}>⚡</Text>
                  <Text style={{ fontSize: 10, color: '#fff', letterSpacing: 1 }}>ACTIVATED</Text>
                </View>
              ) : isWake ? (
                <View style={{ alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 30 }}>👂</Text>
                  <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>WAITING</Text>
                </View>
              ) : (
                <Svg width={52} height={52} viewBox="0 0 24 24" fill="none"
                  stroke="rgba(255,255,255,0.95)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="rgba(255,255,255,0.18)" />
                  <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19L12 22M8 22L16 22" />
                </Svg>
              )}
          </View>
        </LinearGradient>
        <View style={ST.orbReflection} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [status, setStatus] = useState(S.STANDBY);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState({ contacts: [], message: '' });
  const [matchedTarget, setMatchedTarget] = useState(null);
  const [sendResults, setSendResults] = useState([]);
  const [wakeMode, setWakeMode] = useState(false);
  const [wakeLog, setWakeLog] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const wakeModeRef = useRef(false);
  const wakeRecordingRef = useRef(null);
  const wakeLoopRef = useRef(null);
  const isProcessingRef = useRef(false);

  const { isRecording, durationLabel, levels, startRecording, stopRecording } = useRecorder();
  const ASSEMBLYAI_KEY = 'e25476c2dbd74cfd965eb2143a614814';

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  // ── Full command pipeline ──────────────────────────────────────────────
  const handleCommandAudio = useCallback(async (uri) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setStatus(S.UPLOADING);
    try {
      const text = await transcribeAudio(ASSEMBLYAI_KEY, uri, s => {
        if (s === 'processing') setStatus(S.PROCESSING);
      });
      setTranscript(text);

      const result = parseVoiceCommand(text);
      setParsed(result);

      if (!result.contacts.length || !result.message) {
        await speak('Sorry, I could not understand. Please try again.');
        setStatus(S.ERROR);
        isProcessingRef.current = false;
        if (wakeModeRef.current) setTimeout(startWakeLoop, 1000);
        return;
      }

      const spokenName = result.contacts.join(' ');
      const match = findBestMatch(spokenName);
      setMatchedTarget(match);

      if (!match) {
        await speak(`Sorry, I could not find ${spokenName} in your contacts.`);
        setStatus(S.ERROR);
        isProcessingRef.current = false;
        if (wakeModeRef.current) setTimeout(startWakeLoop, 1000);
        return;
      }

      setStatus(S.SENDING);
      await speak(`Sending message to ${match.name}`);

      const results = await sendWhatsAppBroadcast(match.numbers, result.message);
      setSendResults(results);

      const allOk = results.every(r => r.success);
      setStatus(allOk ? S.SUCCESS : S.ERROR);

      if (allOk) {
        const msg = match.type === 'group'
          ? `Message sent to ${match.numbers.length} members of ${match.name} successfully`
          : `Message sent to ${match.name} successfully`;
        await speak(msg);
        const entry = createHistoryEntry(match.name, result.message, text);
        await saveMessage(entry);
      } else {
        await speak('Sorry, sending failed. Please try again.');
      }

      setTimeout(() => {
        setStatus(wakeModeRef.current ? S.WAKE_MODE : S.STANDBY);
        if (wakeModeRef.current) startWakeLoop();
        isProcessingRef.current = false;
      }, 2500);

    } catch (e) {
      setStatus(S.ERROR);
      await speak('Something went wrong. Please try again.');
      isProcessingRef.current = false;
      if (wakeModeRef.current) setTimeout(startWakeLoop, 2000);
    }
  }, []);

  // ── Wake word loop using short audio chunks ───────────────────────────
  const startWakeLoop = useCallback(async () => {
    if (!wakeModeRef.current || isProcessingRef.current) return;
    setWakeLog('Listening for "Hey Voco"…');

    try {
      const { status: perm } = await Audio.requestPermissionsAsync();
      if (perm !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      wakeRecordingRef.current = recording;

      // Record for 3 seconds
      await new Promise(r => {
        wakeLoopRef.current = setTimeout(r, 3000);
      });

      if (!wakeModeRef.current) {
        await recording.stopAndUnloadAsync().catch(() => {});
        return;
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      wakeRecordingRef.current = null;

      const uri = recording.getURI();
      if (!uri) {
        if (wakeModeRef.current) startWakeLoop();
        return;
      }

      setWakeLog('Checking…');
      // Quick transcription to check for wake word
      const text = await transcribeAudio(ASSEMBLYAI_KEY, uri).catch(() => '');
      const lower = text.toLowerCase().trim();
      const detected = WAKE_PHRASES.some(p => lower.includes(p));

      if (detected && wakeModeRef.current && !isProcessingRef.current) {
        // Wake word detected!
        setStatus(S.WAKE_DETECTED);
        setWakeLog('Wake word detected! Listening for command…');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await speak('Yes');

        // Now listen for the actual command
        setTimeout(async () => {
          if (!wakeModeRef.current) return;
          setTranscript(''); setParsed({ contacts: [], message: '' });
          setMatchedTarget(null); setSendResults([]);
          setStatus(S.LISTENING);
          await startRecording(async (cmdUri) => {
            await handleCommandAudio(cmdUri);
          });
        }, 600);
      } else {
        setWakeLog(text ? `Heard: "${text.slice(0, 30)}"` : 'Listening…');
        if (wakeModeRef.current && !isProcessingRef.current) {
          startWakeLoop(); // keep looping
        }
      }
    } catch (e) {
      wakeRecordingRef.current = null;
      if (wakeModeRef.current && !isProcessingRef.current) {
        setTimeout(startWakeLoop, 1500);
      }
    }
  }, [startRecording, handleCommandAudio]);

  // ── Toggle wake mode ──────────────────────────────────────────────────
  const toggleWakeMode = useCallback(async () => {
    if (wakeMode) {
      // Turn OFF
      wakeModeRef.current = false;
      setWakeMode(false);
      setStatus(S.STANDBY);
      setWakeLog('');
      clearTimeout(wakeLoopRef.current);
      try {
        if (wakeRecordingRef.current) {
          await wakeRecordingRef.current.stopAndUnloadAsync();
          wakeRecordingRef.current = null;
        }
        if (isRecording) await stopRecording();
      } catch (e) {}
      await stopSpeaking();
    } else {
      // Turn ON
      wakeModeRef.current = true;
      setWakeMode(true);
      setStatus(S.WAKE_MODE);
      isProcessingRef.current = false;
      await speak('Voco is ready. Say Hey Voco to start.');
      setTimeout(startWakeLoop, 2500);
    }
  }, [wakeMode, isRecording, stopRecording, startWakeLoop]);

  // ── Manual mic press ──────────────────────────────────────────────────
  const handleMicPress = useCallback(async () => {
    if (wakeMode) return;
    if (isRecording) {
      setStatus(S.UPLOADING);
      const uri = await stopRecording();
      if (uri) await handleCommandAudio(uri);
    } else {
      setTranscript(''); setParsed({ contacts: [], message: '' });
      setMatchedTarget(null); setSendResults([]);
      setStatus(S.LISTENING);
      await startRecording(async (uri) => {
        await handleCommandAudio(uri);
      });
    }
  }, [wakeMode, isRecording, startRecording, stopRecording, handleCommandAudio]);

  const reset = () => {
    setTranscript(''); setParsed({ contacts: [], message: '' });
    setMatchedTarget(null); setSendResults([]);
    setStatus(wakeMode ? S.WAKE_MODE : S.STANDBY);
    if (wakeMode && !isProcessingRef.current) startWakeLoop();
  };

  const isProcessingUI = [S.UPLOADING, S.PROCESSING, S.SENDING].includes(status);

  const statusMap = {
    [S.STANDBY]: { text: 'Tap the orb to speak', color: 'rgba(255,255,255,0.38)' },
    [S.WAKE_MODE]: { text: 'Say "Hey Voco" anytime…', color: '#fde68a' },
    [S.WAKE_DETECTED]: { text: '⚡ Wake word detected! Speak your command now', color: '#f9a8d4' },
    [S.LISTENING]: { text: 'Listening… speak your command', color: '#f0abfc' },
    [S.UPLOADING]: { text: 'Uploading audio…', color: '#fde68a' },
    [S.PROCESSING]: { text: 'Transcribing…', color: '#fde68a' },
    [S.SENDING]: { text: matchedTarget ? `Sending to ${matchedTarget.name}…` : 'Sending…', color: '#fde68a' },
    [S.SUCCESS]: { text: matchedTarget ? `✓ Sent to ${matchedTarget.name}!` : '✓ Sent!', color: '#86efac' },
    [S.ERROR]: { text: 'Could not process — try again', color: '#fca5a5' },
  };
  const { text: statusText, color: statusColor } = statusMap[status] || statusMap[S.STANDBY];

  return (
    <SafeAreaView style={ST.safe}>
      <LinearGradient colors={['#130028', '#0c0e28', '#070d1c']} style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} />
      <LinearGradient colors={['rgba(168,85,247,0.25)', 'rgba(99,102,241,0.08)', 'transparent']}
        style={[StyleSheet.absoluteFill, { height: '55%' }]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} pointerEvents="none" />

      <ScrollView contentContainerStyle={ST.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header */}
          <View style={ST.header}>
            <View>
              <Text style={ST.title}>Voco</Text>
              <Text style={ST.subtitle}>AI Voice Assistant</Text>
            </View>
            <View style={[ST.badge, {
              backgroundColor: isRecording ? 'rgba(240,171,252,0.15)'
                : wakeMode ? 'rgba(253,230,138,0.12)' : 'rgba(255,255,255,0.06)'
            }]}>
              <View style={[ST.dot, {
                backgroundColor: isRecording ? '#f0abfc'
                  : wakeMode ? '#fde68a'
                  : status === S.SUCCESS ? '#86efac' : 'rgba(255,255,255,0.2)'
              }]} />
              <Text style={[ST.badgeText, {
                color: isRecording ? '#f0abfc'
                  : wakeMode ? '#fde68a'
                  : status === S.SUCCESS ? '#86efac' : 'rgba(255,255,255,0.35)'
              }]}>
                {isRecording ? 'LIVE' : wakeMode ? 'AWAKE' : status === S.SUCCESS ? 'SENT' : 'IDLE'}
              </Text>
            </View>
          </View>

          {/* Orb */}
          <View style={ST.orbSection}>
            <GlassOrb status={status} levels={levels} onPress={handleMicPress}
              disabled={isProcessingUI} />
            {!wakeMode && status === S.STANDBY && (
              <Text style={ST.orbHint}>Tap to speak</Text>
            )}
          </View>

          {/* Status */}
          <Text style={[ST.statusText, { color: statusColor }]}>{statusText}</Text>
          {isRecording && <Text style={ST.timer}>{durationLabel}</Text>}

          {/* Wake log */}
          {wakeMode && wakeLog ? (
            <View style={ST.wakeLogBox}>
              <Text style={ST.wakeLogText}>🎙 {wakeLog}</Text>
            </View>
          ) : null}

          {/* Wake Mode Toggle */}
          <TouchableOpacity
            style={[ST.wakeBtn, wakeMode && ST.wakeBtnActive]}
            onPress={toggleWakeMode}
            disabled={isProcessingUI}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={wakeMode ? ['#f59e0b', '#d97706'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
              style={ST.wakeBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={ST.wakeBtnIcon}>{wakeMode ? '🔴' : '🎙️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[ST.wakeBtnText, wakeMode && { color: '#fff' }]}>
                  {wakeMode ? 'Wake Mode ON — tap to disable' : 'Enable Wake Mode'}
                </Text>
                <Text style={ST.wakeBtnSub}>
                  {wakeMode
                    ? 'Just say "Hey Voco" then your command'
                    : 'Hands-free · say "Hey Voco" to activate'}
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Result card */}
          {(transcript || isProcessingUI) && (
            <View style={ST.card}>
              <LinearGradient colors={['rgba(168,85,247,0.09)', 'rgba(99,102,241,0.04)']}
                style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              {transcript ? (
                <>
                  <Text style={ST.cardLabel}>TRANSCRIPT</Text>
                  <Text style={ST.transcriptText}>{transcript}</Text>

                  {matchedTarget && (
                    <View style={ST.matchedRow}>
                      <Text style={ST.cardLabel}>{matchedTarget.type === 'group' ? '👥 GROUP' : '👤 CONTACT'}</Text>
                      <View style={ST.matchedChip}>
                        <Text style={ST.matchedName}>{matchedTarget.name}</Text>
                        <Text style={ST.matchedSub}>
                          {matchedTarget.type === 'group'
                            ? `${matchedTarget.numbers.length} members`
                            : matchedTarget.numbers[0]}
                        </Text>
                      </View>
                    </View>
                  )}

                  {parsed.message ? (
                    <View style={ST.msgChip}>
                      <Text style={ST.cardLabel}>MESSAGE</Text>
                      <Text style={ST.msgText}>{parsed.message}</Text>
                    </View>
                  ) : null}

                  {sendResults.length > 0 && (
                    <View style={ST.resultsRow}>
                      {sendResults.map((r, i) => (
                        <View key={i} style={[ST.resultPill, r.success ? ST.resultOk : ST.resultFail]}>
                          <Text style={ST.resultPillText}>{r.success ? '✓' : '✗'} {r.number.slice(-4)}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {!matchedTarget && parsed.contacts.length > 0 && (
                    <View style={ST.hint}>
                      <Text style={ST.hintText}>
                        ⚠️ "{parsed.contacts.join(', ')}" not found in contacts.{'\n'}
                        Add them in Settings → Contacts.
                      </Text>
                    </View>
                  )}
                  {parsed.contacts.length === 0 && (
                    <View style={ST.hint}>
                      <Text style={ST.hintText}>
                        💡 Say: <Text style={ST.hintEx}>"To Systrans Interns hello everyone"</Text>
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={ST.processingText}>
                  {status === S.UPLOADING ? '⟳  Uploading…'
                    : status === S.SENDING ? '📤  Sending via WhatsApp API…'
                    : '◌  Transcribing…'}
                </Text>
              )}
            </View>
          )}

          {/* Try Again */}
          {transcript && !isProcessingUI && (
            <TouchableOpacity style={ST.retryBtn} onPress={reset}>
              <Text style={ST.retryText}>Try Again</Text>
            </TouchableOpacity>
          )}

          {/* Examples */}
          {status === S.STANDBY && !transcript && (
            <View style={ST.examplesCard}>
              <Text style={ST.examplesTitle}>Try saying…</Text>
              {[
                { ex: '"Hey Voco" → "To Systrans Interns hello everyone"', note: 'Wake + group send' },
                { ex: '"Tell Rahul the meeting is at 10"', note: 'Single contact' },
                { ex: '"Send Priya and Amit I will be late"', note: 'Multiple contacts' },
              ].map((item, i) => (
                <View key={i} style={ST.exRow}>
                  <View style={ST.exDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={ST.exText}>{item.ex}</Text>
                    <Text style={ST.exNote}>{item.note}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ST = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0015' },
  scroll: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.32)', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  orbSection: { alignItems: 'center', marginVertical: 8 },
  orbWrapper: { width: BUBBLE + 24, height: BUBBLE + 24, alignItems: 'center', justifyContent: 'center' },
  orbGlow: { position: 'absolute', width: BUBBLE + 50, height: BUBBLE + 50, borderRadius: (BUBBLE + 50) / 2, backgroundColor: 'rgba(216,100,255,0.18)', shadowColor: '#c080ff', shadowOffset: { width: 0, height: 0 } },
  orbRing: { position: 'absolute', width: BUBBLE + 12, height: BUBBLE + 12, borderRadius: (BUBBLE + 12) / 2, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  orb: { width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  shineA: { position: 'absolute', top: 0, left: 0, width: BUBBLE * 0.68, height: BUBBLE * 0.68, borderRadius: BUBBLE / 2 },
  shineB: { position: 'absolute', bottom: 0, left: 0, right: 0, height: BUBBLE * 0.3, borderRadius: BUBBLE / 2 },
  innerSpin: { position: 'absolute', width: BUBBLE * 0.88, height: BUBBLE * 0.88, borderRadius: BUBBLE, overflow: 'hidden' },
  orbCenter: { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  orbReflection: { position: 'absolute', bottom: -10, width: BUBBLE * 0.38, height: 10, borderRadius: 5, backgroundColor: 'rgba(168,85,247,0.22)' },
  waveBars: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  waveBar: { width: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.93)' },
  orbHint: { marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
  statusText: { textAlign: 'center', fontSize: 14, marginTop: 10, marginBottom: 6 },
  timer: { textAlign: 'center', fontSize: 26, color: '#e879f9', fontWeight: '700', letterSpacing: 4, marginBottom: 4 },
  wakeLogBox: { backgroundColor: 'rgba(253,230,138,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(253,230,138,0.2)', padding: 10, marginBottom: 8 },
  wakeLogText: { fontSize: 12, color: 'rgba(253,230,138,0.8)', textAlign: 'center' },
  wakeBtn: { borderRadius: 18, overflow: 'hidden', marginVertical: 6 },
  wakeBtnActive: {},
  wakeBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  wakeBtnIcon: { fontSize: 22 },
  wakeBtnText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.65)' },
  wakeBtnSub: { fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 2 },
  card: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', padding: 18, marginTop: 10, gap: 12, overflow: 'hidden' },
  cardLabel: { fontSize: 9, color: 'rgba(216,180,254,0.55)', letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase' },
  transcriptText: { fontSize: 15, color: 'rgba(255,255,255,0.88)', lineHeight: 24 },
  matchedRow: { gap: 8 },
  matchedChip: { backgroundColor: 'rgba(217,70,239,0.18)', borderWidth: 1, borderColor: 'rgba(217,70,239,0.35)', borderRadius: 14, padding: 12 },
  matchedName: { fontSize: 16, color: '#f5d0fe', fontWeight: '800' },
  matchedSub: { fontSize: 11, color: 'rgba(245,208,254,0.55)', marginTop: 2 },
  msgChip: { backgroundColor: 'rgba(99,102,241,0.12)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)', padding: 12, gap: 6 },
  msgText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 22 },
  resultsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resultPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  resultOk: { backgroundColor: 'rgba(134,239,172,0.15)', borderWidth: 1, borderColor: 'rgba(134,239,172,0.3)' },
  resultFail: { backgroundColor: 'rgba(252,165,165,0.15)', borderWidth: 1, borderColor: 'rgba(252,165,165,0.3)' },
  resultPillText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  hint: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  hintText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 18 },
  hintEx: { color: 'rgba(216,180,254,0.75)', fontStyle: 'italic' },
  processingText: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingVertical: 10 },
  retryBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 13, marginTop: 10 },
  retryText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  examplesCard: { marginTop: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 16, gap: 10 },
  examplesTitle: { fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: '700' },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(168,85,247,0.6)', marginTop: 5 },
  exText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 18 },
  exNote: { fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 },
});

/**
 * MicButton.js — Animated mic button with pulse rings
 * FIX: Replaced Line SVG component with Path (Line not in react-native-svg 15.2.0)
 */

import { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

export default function MicButton({ isRecording, onPress, disabled }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]));
      const ring = Animated.loop(Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]));
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      pulse.start();
      ring.start();
      return () => {
        pulse.stop();
        ring.stop();
        pulseAnim.setValue(1);
        ringAnim.setValue(1);
        Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
      };
    }
  }, [isRecording]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const activeColor = isRecording ? '#ff4d6d' : '#c084fc';
  const activeDim = isRecording ? 'rgba(255,77,109,0.15)' : 'rgba(192,132,252,0.15)';

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.outerRing, {
        borderColor: isRecording ? 'rgba(255,77,109,0.2)' : 'rgba(192,132,252,0.1)',
        transform: [{ scale: ringAnim }],
      }]} />
      <Animated.View style={[styles.innerRing, {
        borderColor: isRecording ? 'rgba(255,77,109,0.4)' : 'rgba(192,132,252,0.25)',
        transform: [{ scale: pulseAnim }],
      }]} />
      <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={0.85} style={styles.button}>
        <View style={[styles.inner, {
          backgroundColor: activeDim,
          borderColor: activeColor + '40',
          shadowColor: activeColor,
          shadowRadius: isRecording ? 20 : 8,
          shadowOpacity: isRecording ? 0.5 : 0.2,
          shadowOffset: { width: 0, height: 0 },
          elevation: isRecording ? 12 : 4,
        }]}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none"
            stroke={activeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isRecording ? (
              <Rect x="6" y="6" width="12" height="12" rx="2" />
            ) : (
              <>
                <Rect x="9" y="2" width="6" height="11" rx="3" />
                <Path d="M5 10a7 7 0 0 0 14 0" />
                {/* FIX: was Line x1="12" y1="19" x2="12" y2="22" */}
                <Path d="M12 19L12 22" />
                <Path d="M8 22L16 22" />
              </>
            )}
          </Svg>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1 },
  innerRing: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 1.5 },
  button: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  inner: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

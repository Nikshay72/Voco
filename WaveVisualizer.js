import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/theme';

const BAR_COUNT = 36;

export default function WaveVisualizer({ levels = [], isActive = false }) {
  const animations = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))
  ).current;

  const idleAnimations = useRef([]);

  useEffect(() => {
    if (!isActive) {
      // Stop any running animations
      idleAnimations.current.forEach(a => a.stop());

      // Start idle breathing animation
      idleAnimations.current = animations.map((anim, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 0.1 + Math.random() * 0.15,
              duration: 1200 + Math.random() * 800,
              delay: i * 30,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0.05,
              duration: 1000 + Math.random() * 600,
              useNativeDriver: false,
            }),
          ])
        );
        loop.start();
        return loop;
      });

      return () => idleAnimations.current.forEach(a => a.stop());
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive || !levels.length) return;

    idleAnimations.current.forEach(a => a.stop());

    animations.forEach((anim, i) => {
      const idx = Math.floor(i * (levels.length / BAR_COUNT));
      const targetValue = Math.max(0.05, Math.min(1, levels[idx] || 0.1));
      Animated.timing(anim, {
        toValue: targetValue,
        duration: 80,
        useNativeDriver: false,
      }).start();
    });
  }, [levels, isActive]);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => {
        const heightInterpolation = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [3, 70],
        });
        const opacityInterpolation = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 1],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                height: heightInterpolation,
                opacity: opacityInterpolation,
                backgroundColor: isActive ? COLORS.green : COLORS.muted2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 80,
    width: '100%',
  },
  bar: {
    width: 3,
    borderRadius: 3,
  },
});

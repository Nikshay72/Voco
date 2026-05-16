import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import { getConfidenceColor, getConfidenceLabel } from '../utils/parser';

export default function ParsedOutput({ contact, message, confidence }) {
  const hasData = contact || message;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Parsed output</Text>
        {hasData && confidence > 0 && (
          <View style={[styles.badge, { backgroundColor: getConfidenceColor(confidence) + '20', borderColor: getConfidenceColor(confidence) + '40' }]}>
            <Text style={[styles.badgeText, { color: getConfidenceColor(confidence) }]}>
              {getConfidenceLabel(confidence)} CONFIDENCE
            </Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <Text style={styles.key}>contact</Text>
        <Text style={[styles.value, !contact && styles.empty]}>
          {contact || 'waiting…'}
        </Text>
      </View>

      <View style={[styles.row, styles.lastRow]}>
        <Text style={styles.key}>message</Text>
        <Text style={[styles.value, !message && styles.empty]} numberOfLines={3}>
          {message || 'waiting…'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted2,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  badge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.glassBorder,
    gap: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  key: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.green,
    minWidth: 68,
    letterSpacing: 0.5,
    paddingTop: 2,
  },
  value: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },
  empty: {
    fontFamily: FONTS.monoLight,
    fontSize: 13,
    color: COLORS.muted2,
    fontStyle: 'italic',
  },
});

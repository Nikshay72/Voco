/**
 * HistoryScreen.js — Message history with avatars and relative time
 * FIX: No Line SVG component — uses Path only
 */

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { loadHistory, clearHistory } from '../utils/storage';

const AVATAR_COLORS = ['#d946ef', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days === 1) return 'yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function HistoryItem({ item }) {
  const color = getAvatarColor(item.contact);
  return (
    <View style={S.item}>
      <View style={[S.avatar, { backgroundColor: color + '22', borderColor: color + '44' }]}>
        <Text style={[S.avatarText, { color }]}>{getInitials(item.contact)}</Text>
      </View>
      <View style={S.itemBody}>
        <View style={S.itemHeader}>
          <Text style={S.contact}>{item.contact || 'Unknown'}</Text>
          <Text style={S.time}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={S.message} numberOfLines={2}>{item.message}</Text>
        {item.transcript && (
          <Text style={S.transcript} numberOfLines={1}>🎤 {item.transcript}</Text>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then(h => { setHistory(h); setLoading(false); });
    }, [])
  );

  const handleClearAll = () => {
    Alert.alert('Clear History', 'Delete all message history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
        await clearHistory();
        setHistory([]);
      }},
    ]);
  };

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <LinearGradient colors={['#130028', '#0c0e28', '#070d1c']} style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} />

      <View style={S.header}>
        <View>
          <Text style={S.title}>History</Text>
          <Text style={S.sub}>{history.length} message{history.length !== 1 ? 's' : ''}</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={S.clearBtn}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none"
              stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Trash icon using Path only — no Line component */}
              <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
            </Svg>
            <Text style={S.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {!loading && history.length === 0 ? (
        <View style={S.empty}>
          <Text style={S.emptyIcon}>🎙</Text>
          <Text style={S.emptyTitle}>No messages yet</Text>
          <Text style={S.emptyText}>Record a voice command to get started</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <HistoryItem item={item} />}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0015' },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 4 },
  clearBtnText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },

  list: { padding: 16, gap: 8, paddingBottom: 40 },

  item: { flexDirection: 'row', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', padding: 14 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 14, fontWeight: '800' },
  itemBody: { flex: 1, gap: 4 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contact: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.88)' },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.25)' },
  message: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  transcript: { fontSize: 11, color: 'rgba(255,255,255,0.22)', marginTop: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.4)' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.22)', textAlign: 'center' },
});

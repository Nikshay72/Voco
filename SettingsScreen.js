import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllContacts, getAllGroups } from '../utils/fuzzyMatcher';
import { clearHistory } from '../utils/storage';

export default function SettingsScreen() {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    setContacts(getAllContacts());
    setGroups(getAllGroups());
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <LinearGradient colors={['#130028', '#0c0e28', '#070d1c']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>Settings</Text>

        {/* API Info */}
        <Text style={s.sectionLabel}>API CONFIGURATION</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>AssemblyAI Key</Text>
            <View style={s.pill}><Text style={s.pillText}>Active ✓</Text></View>
          </View>
          <Text style={s.rowSub}>e254...4814 · Indian English enabled</Text>
          <View style={[s.row, { marginTop: 10 }]}>
            <Text style={s.rowLabel}>WhatsApp API</Text>
            <View style={s.pill}><Text style={s.pillText}>Active ✓</Text></View>
          </View>
          <Text style={s.rowSub}>syswhatsapp.syspaisa.com · Sales account</Text>
        </View>

        {/* Contacts */}
        <Text style={s.sectionLabel}>CONTACTS ({contacts.length})</Text>
        <View style={s.card}>
          <Text style={s.rowSub}>To add contacts, edit src/data/contacts.js</Text>
          {contacts.map((c, i) => (
            <View key={i} style={s.row}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{c.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{c.name}</Text>
                <Text style={s.rowSub}>{c.number}</Text>
              </View>
            </View>
          ))}
          {contacts.length === 0 && (
            <Text style={s.emptyText}>No contacts yet. Add to src/data/contacts.js</Text>
          )}
        </View>

        {/* Groups */}
        <Text style={s.sectionLabel}>GROUPS ({groups.length})</Text>
        <View style={s.card}>
          <Text style={s.rowSub}>To add groups, edit src/data/contacts.js</Text>
          {groups.map((g, i) => (
            <View key={i} style={[s.row, { alignItems: 'flex-start' }]}>
              <View style={[s.avatar, { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)' }]}>
                <Text style={s.avatarText}>G</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{g.name}</Text>
                <Text style={s.rowSub}>{g.members.length} members</Text>
                {g.members.map((m, j) => (
                  <Text key={j} style={[s.rowSub, { fontSize: 10, marginTop: 1 }]}>· {m}</Text>
                ))}
              </View>
            </View>
          ))}
          {groups.length === 0 && (
            <Text style={s.emptyText}>No groups yet. Add to src/data/contacts.js</Text>
          )}
        </View>

        {/* How to speak */}
        <Text style={s.sectionLabel}>HOW TO USE</Text>
        <View style={s.card}>
          {[
            { ex: 'Say "Hey Voco" → Enable Wake Mode first', note: 'Hands-free activation' },
            { ex: '"To Systrans Interns hello everyone"', note: 'Send to group' },
            { ex: '"Tell Rahul the meeting is at 10"', note: 'Single contact' },
            { ex: '"Send Priya and Amit I will be late"', note: 'Multiple contacts' },
          ].map((item, i) => (
            <View key={i} style={s.exRow}>
              <View style={s.exDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.exText}>{item.ex}</Text>
                <Text style={[s.rowSub, { fontSize: 10 }]}>{item.note}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Data */}
        <Text style={s.sectionLabel}>DATA</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Clear message history</Text>
              <Text style={s.rowSub}>Removes all local history</Text>
            </View>
            <TouchableOpacity style={s.dangerBtn} onPress={() =>
              Alert.alert('Clear History', 'Delete all?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => clearHistory() },
              ])}>
              <Text style={s.dangerText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.footer}>Voco v1.0 · Made by Nikshay · JIET Jodhpur</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0015' },
  scroll: { padding: 22, paddingBottom: 60, gap: 8 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 16 },
  sectionLabel: { fontSize: 10, color: 'rgba(216,180,254,0.5)', letterSpacing: 2, fontWeight: '700', marginTop: 8, marginBottom: 6, paddingLeft: 4 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.18)', borderRadius: 18, padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  rowSub: { fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  pill: { backgroundColor: 'rgba(134,239,172,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(134,239,172,0.3)' },
  pillText: { fontSize: 10, color: '#86efac', fontWeight: '700' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(217,70,239,0.2)', borderWidth: 1, borderColor: 'rgba(217,70,239,0.4)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, color: '#f5d0fe', fontWeight: '700' },
  emptyText: { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' },
  exRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  exDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(168,85,247,0.7)', marginTop: 5 },
  exText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  dangerBtn: { borderWidth: 1, borderColor: 'rgba(255,77,109,0.35)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,77,109,0.1)' },
  dangerText: { fontSize: 12, color: '#ff6b8a' },
  footer: { fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingTop: 8 },
});

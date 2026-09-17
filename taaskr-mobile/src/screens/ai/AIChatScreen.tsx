import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TextInput, 
  TouchableOpacity, ActivityIndicator 
} from 'react-native';
import { colors } from '../../theme/colors';
import { api } from '../../services/api';
import { ServiceItem, Booking } from '../../types';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  services?: ServiceItem[];
  bookings?: Booking[];
  quickReplies?: string[];
  isError?: boolean;
}

export default function AIChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hi there! I am Taasky, your intelligent AI assistant on Taaskr. Ask me to diagnose home repair issues, check service prices, or track active orders!',
      quickReplies: [
        'AC is not cooling properly',
        'Kitchen sink pipe is leaking',
        'Send parcel across city',
        'Show my active bookings'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res: any = await api.ai.chat(prompt);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.reply || res.message || res.response || 'Here is what I found in our service catalog:',
        services: res.services || res.recommendedServices || [],
        bookings: res.bookings || res.userBookings || [],
        quickReplies: res.quickReplies || res.suggestedPrompts || []
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `⚠️ ${e.message || 'Could not reach AI assistant service. Please check your network or server URL.'}`,
        isError: true,
        quickReplies: ['AC Repair', 'Send Parcel', 'Plumbing', 'Electrician']
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🤖 Taasky AI Assistant</Text>
        <Text style={styles.sub}>Instant diagnostics, pricing, and live catalog search</Text>
      </View>

      <ScrollView style={styles.chatBox} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((m) => (
          <View key={m.id} style={{ marginBottom: 12 }}>
            <View 
              style={[
                styles.msgBubble, 
                m.sender === 'user' ? styles.userBubble : styles.aiBubble
              ]}
            >
              <Text style={m.sender === 'user' ? styles.userText : styles.aiText}>
                {m.text}
              </Text>

              {/* Recommended Services Cards */}
              {m.services && m.services.length > 0 ? (
                <View style={styles.cardContainer}>
                  {m.services.map((srv) => (
                    <View key={srv.id} style={styles.serviceCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.srvName}>{srv.name}</Text>
                        <Text style={styles.srvPrice}>₹{srv.price}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.bookBtn}
                        onPress={() => navigation?.navigate('BookingFlow', { service: srv })}
                      >
                        <Text style={styles.bookBtnText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* User Active Bookings Cards */}
              {m.bookings && m.bookings.length > 0 ? (
                <View style={styles.cardContainer}>
                  {m.bookings.map((b) => (
                    <View key={b.id} style={styles.bookingCard}>
                      <Text style={styles.srvName}>Booking #{b.bookingCode || b.id}</Text>
                      <Text style={{ color: '#A1A1AA', fontSize: 12 }}>{b.serviceName} • Status: {b.status}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Quick Reply Prompt Chips */}
            {m.quickReplies && m.quickReplies.length > 0 ? (
              <View style={styles.quickReplyRow}>
                {m.quickReplies.map((qr, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.chip}
                    onPress={() => sendMessage(qr)}
                  >
                    <Text style={styles.chipText}>⚡ {qr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {loading ? (
          <View style={styles.loadingBubble}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={{ color: '#AAA', fontSize: 12, marginLeft: 8 }}>Taasky is analyzing catalog...</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask AI e.g. Kitchen sink pipe is leaking..."
          placeholderTextColor="#666"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()} disabled={loading}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPage, paddingTop: 54 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  sub: { fontSize: 12, color: colors.dark.textMuted, marginTop: 2 },
  chatBox: { flex: 1, paddingHorizontal: 20 },
  msgBubble: { padding: 14, borderRadius: 14, maxWidth: '85%' },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: colors.dark.bgCard, alignSelf: 'flex-start', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: colors.dark.borderLight },
  userText: { color: '#000', fontWeight: '600', fontSize: 14 },
  aiText: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  inputRow: { flexDirection: 'row', padding: 16, backgroundColor: colors.dark.bgCard, borderTopWidth: 1, borderTopColor: colors.dark.borderLight, gap: 10 },
  input: { flex: 1, backgroundColor: '#09090B', borderWidth: 1, borderColor: '#3F3F46', borderRadius: 10, paddingHorizontal: 14, color: '#FFF', fontSize: 14 },
  sendBtn: { backgroundColor: colors.primary, paddingHorizontal: 18, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#000', fontWeight: '800' },
  quickReplyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginLeft: 4 },
  chip: { backgroundColor: '#27272A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#3F3F46' },
  chipText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  cardContainer: { marginTop: 10, gap: 8 },
  serviceCard: { backgroundColor: '#18181B', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center' },
  srvName: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  srvPrice: { color: colors.primary, fontSize: 14, fontWeight: '800', marginTop: 2 },
  bookBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  bookBtnText: { color: '#000', fontWeight: '800', fontSize: 11 },
  bookingCard: { backgroundColor: '#18181B', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#3F3F46' }
});

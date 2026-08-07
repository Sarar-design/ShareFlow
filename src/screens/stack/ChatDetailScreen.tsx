import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { db } from '../../config/firebase';
import { RootState } from '../../store';

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  chatId: string;
  timestamp: any;
  read?: boolean;
}

export default function ChatDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { chatId, receiverId, userName, itemId } = route.params as {
    chatId: string;
    receiverId: string;
    userName: string;
    itemId?: string;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  
  useEffect(() => {
    if (!chatId) {
      Alert.alert('Napaka', 'Klepet ni bil najden.');
      navigation.goBack();
      return;
    }

    console.log('📡 ChatDetail: Začenjam poslušanje sporočil za chatId:', chatId);

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📩 ChatDetail: Prejetih sporočil:', snapshot.docs.length);
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as Message);
        });
        setMessages(msgs);
        setLoading(false);
        if (user?.id) {
          markMessagesAsRead(msgs);
        }
      },
      (error) => {
        console.error('❌ ChatDetail: Napaka pri onSnapshot:', error);
        setLoading(false);
        if (!error.message.includes('index')) {
          Alert.alert('Napaka', 'Sporočil ni bilo mogoče naložiti.');
        }
      }
    );

    return () => {
      console.log('📡 ChatDetail: Ustavljam poslušanje sporočil');
      unsubscribe();
    };
  }, [chatId, navigation, user?.id]);

  
  const markMessagesAsRead = async (msgs: Message[]) => {
    if (!user?.id) return;
    const unreadMessages = msgs.filter(
      (msg) => msg.senderId !== user.id && !msg.read
    );
    if (unreadMessages.length === 0) return;

    console.log(`📖 ChatDetail: Označujem ${unreadMessages.length} sporočil kot prebranih`);

    for (const msg of unreadMessages) {
      try {
        await updateDoc(doc(db, 'messages', msg.id), { read: true });
      } catch (error) {
        console.error('❌ ChatDetail: Napaka pri označevanju sporočila:', error);
      }
    }
  };

  
  const sendMessage = async () => {
    if (!inputText.trim() || !user || !chatId) {
      console.log('⚠️ ChatDetail: Preprečeno pošiljanje - manjkajo podatki');
      return;
    }

    console.log('📤 ChatDetail: Pošiljam sporočilo:', {
      chatId,
      text: inputText.trim(),
      senderId: user.id,
      receiverId,
    });

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        text: inputText.trim(),
        senderId: user.id,
        receiverId: receiverId || '',
        itemId: itemId || '',
        timestamp: serverTimestamp(),
        read: false,
      });

      const chatRef = doc(db, 'chats', chatId);
      const updateData: any = {
        lastMessage: inputText.trim(),
        lastMessageTime: serverTimestamp(),
      };
      if (receiverId) {
        updateData[`unreadCount.${receiverId}`] = 0;
      }
      await updateDoc(chatRef, updateData);

      setInputText('');
      Keyboard.dismiss();
    } catch (error: any) {
      console.error('❌ ChatDetail: Napaka pri pošiljanju:', error);
      Alert.alert('Napaka', 'Sporočila ni bilo mogoče poslati: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  
  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;
    return (
      <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
          <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
            {item.text}
          </Text>
          <Text style={styles.messageTime}>
            {formatTime(item.timestamp)}
            {isMine && item.read && <Text style={styles.readReceipt}> ✓✓</Text>}
            {isMine && !item.read && <Text style={styles.readReceipt}> ✓</Text>}
          </Text>
        </View>
      </View>
    );
  };

  
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje klepeta...</Text>
      </View>
    );
  }

  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="chevron-back" size={28} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{userName || 'Uporabnik'}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>Ni še sporočil</Text>
            <Text style={styles.emptySubtext}>Začni klepet!</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Napiši sporočilo..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={22} color="#fff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
  errorText: { fontSize: 18, color: '#d32f2f', marginTop: 12, textAlign: 'center' },
  retryButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 4, marginRight: 8 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  messageWrapper: { marginBottom: 8, maxWidth: '80%' },
  myMessageWrapper: { alignSelf: 'flex-end' },
  otherMessageWrapper: { alignSelf: 'flex-start' },
  messageBubble: { padding: 12, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  myMessage: { backgroundColor: '#4CAF50', borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#eee' },
  messageText: { fontSize: 16, lineHeight: 22 },
  myMessageText: { color: '#fff' },
  otherMessageText: { color: '#1a1a1a' },
  messageTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
  readReceipt: { fontSize: 10, color: '#4CAF50' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, color: '#888', marginTop: 8 },
  emptySubtext: { fontSize: 14, color: '#aaa', marginTop: 4 },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'flex-end' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, paddingRight: 40, fontSize: 16, maxHeight: 100, backgroundColor: '#fafafa' },
  sendButton: { backgroundColor: '#4CAF50', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 8 },
  sendButtonDisabled: { backgroundColor: '#a5d6a7' },
});
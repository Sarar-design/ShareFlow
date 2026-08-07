import Icon from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { db } from '../../config/firebase';
import { RootState } from '../../store';


type RootStackParamList = {
  ChatDetail: {
    chatId: string;
    receiverId: string;
    userName: string;
    itemId?: string;
  };
  ItemDetail: { id: string };
  
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: any;
  itemId?: string;
  unreadCount?: { [key: string]: number };
}


export default function MessagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useSelector((state: RootState) => state.auth);
  const [chats, setChats] = useState<Chat[]>([]);
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.id),
      
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatList: Chat[] = [];
        snapshot.forEach((doc) => {
          chatList.push({ id: doc.id, ...doc.data() } as Chat);
        });
        setChats(chatList);
        setLoading(false);
      },
      (error) => {
        console.error('Napaka pri nalaganju klepetov:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  
  useEffect(() => {
    if (!user?.id || chats.length === 0) return;

    const fetchUserNames = async () => {
      const names: { [key: string]: string } = {};
      for (const chat of chats) {
        const otherId = chat.participants.find((id) => id !== user.id);
        if (otherId && !names[otherId]) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherId));
            if (userDoc.exists()) {
              const data = userDoc.data();
              names[otherId] = data.name || 'Uporabnik';
            } else {
              names[otherId] = 'Uporabnik';
            }
          } catch (error) {
            console.error('Napaka pri nalaganju uporabnika:', error);
            names[otherId] = 'Uporabnik';
          }
        }
      }
      setUserNames(names);
    };

    fetchUserNames();
  }, [chats, user]);

  
  const getOtherUserId = (chat: Chat) => {
    if (!user) return '';
    return chat.participants.find((id) => id !== user.id) || '';
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) {
      // manj kot 24 ur
      return date.toLocaleTimeString('sl-SI', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diff < 172800000) {
      // manj kot 48 ur
      return 'Včeraj';
    } else {
      return date.toLocaleDateString('sl-SI', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      });
    }
  };

  
  const renderChatItem = ({ item }: { item: Chat }) => {
    const otherUserId = getOtherUserId(item);
    const displayName = userNames[otherUserId] || 'Uporabnik';
    const unreadCount = item.unreadCount?.[user?.id || ''] || 0;

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          navigation.navigate('ChatDetail', {
            chatId: item.id,
            receiverId: otherUserId,
            userName: displayName,
            itemId: item.itemId || '',
          });
        }}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: `https://picsum.photos/seed/${otherUserId}/100/100` }}
          style={styles.avatar}
        />
        <View style={styles.chatInfo}>
          <Text style={styles.chatName}>{displayName}</Text>
          <Text style={styles.lastMsg} numberOfLines={1}>
            {item.lastMessage || 'Ni še sporočil'}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Nalaganje klepetov...</Text>
      </View>
    );
  }

  
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sporočila</Text>
      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="chatbubbles-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>Ni še klepetov</Text>
            <Text style={styles.emptySubtitle}>
              Ko boš začel/a klepet z nekom, se bo pojavil tukaj.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ----- SLOGI -----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  lastMsg: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  badge: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
});
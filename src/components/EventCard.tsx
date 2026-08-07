import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Event } from '../types';

export default function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Image source={{ uri: event.imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.location}>{event.location}</Text>
        <Text style={styles.date}>{event.date} {event.time}</Text>
        {event.interestedFriends > 0 && <Text style={styles.interested}>❤️ {event.interestedFriends} prijateljev se zanima</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  image: { width: '100%', height: 120 },
  info: { padding: 12 },
  title: { fontSize: 16, fontWeight: 'bold' },
  location: { color: '#666' },
  date: { color: '#4CAF50' },
  interested: { color: '#f5a623', marginTop: 4 },
});
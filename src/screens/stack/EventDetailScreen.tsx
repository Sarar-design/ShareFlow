import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useGetEventByIdQuery } from '../../api/api';

export default function EventDetailScreen({ route }: any) {
  const { id } = route.params;
  const { data: event, isLoading } = useGetEventByIdQuery(id);

  if (isLoading || !event) return <View><Text>Nalaganje...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: event.imageUrl }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.location}>📍 {event.location}</Text>
        <Text style={styles.date}>{event.date} ob {event.time}</Text>
        <Text style={styles.description}>{event.description}</Text>
        {event.spotsLeft !== undefined && <Text style={styles.spots}>Število prostih mest: {event.spotsLeft}</Text>}
        <Text style={styles.interested}>❤️ {event.interestedFriends} prijateljev se zanima</Text>
        <TouchableOpacity style={styles.button}><Text style={styles.buttonText}>Prijavi se</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  image: { width: '100%', height: 200 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  location: { color: '#666', marginTop: 4 },
  date: { color: '#4CAF50', marginTop: 4 },
  description: { marginVertical: 12, fontSize: 15, lineHeight: 22 },
  spots: { fontSize: 14, color: '#333', marginBottom: 4 },
  interested: { fontSize: 14, color: '#f5a623', marginBottom: 12 },
  button: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
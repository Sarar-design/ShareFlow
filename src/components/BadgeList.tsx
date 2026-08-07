import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BadgeList({ badges }: { badges: string[] }) {
  if (!badges || badges.length === 0) return null;
  return (
    <View style={styles.container}>
      {badges.map((badge, index) => (
        <View key={index} style={styles.badge}>
          <Text style={styles.badgeText}>🏅 {badge}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 8 },
  badge: { backgroundColor: '#fff3e0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#ffcc80' },
  badgeText: { fontSize: 14, color: '#e65100' },
});
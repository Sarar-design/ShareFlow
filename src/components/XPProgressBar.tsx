import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  xp: number;
  maxXp: number;
  label?: string;
}

export default function XPProgressBar({ xp, maxXp, label }: Props) {
  const progress = Math.min(xp / maxXp, 1);
  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.text}>{label || `${xp}/${maxXp} XP`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 8, width: '100%' },
  barBackground: { height: 12, backgroundColor: '#e0e0e0', borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 6 },
  text: { fontSize: 12, color: '#333', marginTop: 4, textAlign: 'center' },
});
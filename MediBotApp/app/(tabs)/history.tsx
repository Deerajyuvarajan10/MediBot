// @ts-nocheck
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import Constants from "expo-constants";
import { useFocusEffect } from "@react-navigation/native";

const BACKEND = Constants.expoConfig?.extra?.backend;

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${BACKEND}/history`);
      const data = await res.json();
      setHistory(data);
    } catch {
      alert("Failed to load history");
    }
  };

  const clearHistory = async () => {
    try {
      await fetch(`${BACKEND}/clear-history`, { method: "DELETE" });
      setHistory([]);
      alert("History cleared");
    } catch {
      alert("Failed to clear history");
    }
  };

  // 🔥 Refresh every time user opens History tab
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
        <Text style={styles.clearTxt}>Clear History</Text>
      </TouchableOpacity>

      <FlatList
        data={history}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.q}>Q: {item.question}</Text>
            <Text style={styles.a}>A: {item.answer}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 10 },
  clearBtn: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 8,
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  clearTxt: { color: "white", fontWeight: "bold" },
  card: {
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  q: { color: "#60a5fa", fontWeight: "bold" },
  a: { color: "white", marginTop: 5 },
  time: { color: "#9ca3af", fontSize: 12, marginTop: 5 },
});

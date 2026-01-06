// @ts-nocheck
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import Constants from "expo-constants";

const BACKEND = Constants.expoConfig?.extra?.backend;

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 I'm MediBot. Ask me any health question!" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.answer || "⚠️ Unable to reply now." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ Server not reachable." },
      ]);
    }

    setInput("");
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.msgBox, item.from === "user" ? styles.user : styles.bot]}>
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a medical question..."
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={styles.sendTxt}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 10 },
  msgBox: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    maxWidth: "80%",
  },
  user: { backgroundColor: "#2563eb", alignSelf: "flex-end" },
  bot: { backgroundColor: "#374151", alignSelf: "flex-start" },
  msgText: { color: "white", fontSize: 16 },
  inputBar: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
  },
  input: { flex: 1, color: "white" },
  sendBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
  },
  sendTxt: { color: "white", fontWeight: "bold" },
});

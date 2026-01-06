// @ts-nocheck
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from "react-native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";

const BACKEND = Constants.expoConfig?.extra?.backend;

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 I'm MediBot. Ask me any health question!" }
  ]);
  const [input, setInput] = useState("");

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input })
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { from: "bot", text: data.answer || "⚠️ Unable to reply now." }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ Server not reachable." }
      ]);
    }

    setInput("");
  };

  // ---------------- OCR SCAN PRESCRIPTION ----------------
  const scanPrescription = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1
      });

      if (result.canceled) return;

      const image = result.assets[0];

      let formData = new FormData();
      formData.append("image", {
        uri: image.uri,
        name: "prescription.jpg",
        type: "image/jpg"
      });

      const res = await fetch(`${BACKEND}/ocr`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: data.answer || "⚠️ Could not read prescription"
        }
      ]);
    } catch (err) {
      console.log(err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ OCR Failed" }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Chat List */}
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msgBox,
              item.from === "user" ? styles.user : styles.bot
            ]}
          >
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        )}
      />

      {/* Input + Buttons */}
      <View style={styles.inputBar}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask a medical question..."
          placeholderTextColor="#888"
          style={styles.input}
        />

        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={styles.sendTxt}>Send</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={scanPrescription} style={styles.scanBtn}>
          <Text style={styles.sendTxt}>Scan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 10 },

  msgBox: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    maxWidth: "80%"
  },

  user: { backgroundColor: "#2563eb", alignSelf: "flex-end" },
  bot: { backgroundColor: "#374151", alignSelf: "flex-start" },

  msgText: { color: "white", fontSize: 16 },

  inputBar: {
    flexDirection: "row",
    padding: 8,
    backgroundColor: "#111827",
    borderRadius: 12,
    alignItems: "center"
  },

  input: { flex: 1, color: "white" },

  sendBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
    marginLeft: 6
  },

  scanBtn: {
    backgroundColor: "orange",
    paddingHorizontal: 12,
    justifyContent: "center",
    borderRadius: 8,
    marginLeft: 6
  },

  sendTxt: { color: "white", fontWeight: "bold" }
});

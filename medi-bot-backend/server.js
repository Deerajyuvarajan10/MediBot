import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import fs from "fs-extra";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OLLAMA Local API
const OLLAMA_URL = "http://localhost:11434/api/chat";

// History file
const HISTORY_FILE = "medi_history.json";

// Make sure file exists
if (!fs.existsSync(HISTORY_FILE)) {
  fs.writeJsonSync(HISTORY_FILE, []);
}

const MEDICAL_RULES = `
You are MediBot, a friendly medical assistant.
Rules:
• Provide educational info only
• Do NOT diagnose diseases
• Do NOT prescribe medication
• Encourage consulting a doctor
• Keep language simple
`;

// ⭐ CHAT
app.post("/chat", async (req, res) => {
  try {
    const question = req.body.question;

    const payload = {
      model: "llama3",
      messages: [
        { role: "system", content: MEDICAL_RULES },
        { role: "user", content: question }
      ],
      stream: false
    };

    const response = await axios.post(OLLAMA_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    let answer =
      response.data?.message?.content ||
      "Sorry, I cannot answer right now.";

    answer = answer.replace(/\s+/g, " ").trim();

    // ⭐ SAVE HISTORY
    const history = await fs.readJson(HISTORY_FILE);
    history.push({
      question,
      answer,
      time: new Date().toISOString()
    });
    await fs.writeJson(HISTORY_FILE, history, { spaces: 2 });

    res.json({ answer });

  } catch (err) {
    console.log("❌ Backend Error:", err.response?.data || err.message);

    res.json({
      answer:
        "⚠️ Local AI not responding. Make sure Ollama is running."
    });
  }
});

// ⭐ GET HISTORY
app.get("/history", async (req, res) => {
  try {
    const history = await fs.readJson(HISTORY_FILE);
    res.json(history);
  } catch (err) {
    res.json([]);
  }
});

// ⭐ CLEAR HISTORY
app.post("/clear-history", async (req, res) => {
  try {
    await fs.writeJson(HISTORY_FILE, [], { spaces: 2 });
    res.json({ success: true, message: "History cleared" });
  } catch (err) {
    res.json({ success: false, message: "Failed to clear history" });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("🚀 MediBot LLaMA + History Backend Running on Port", process.env.PORT);
});


import multer from "multer";
import Tesseract from "tesseract.js";

const upload = multer({ storage: multer.memoryStorage() });

// ⭐ OCR + AI Meaning Route
app.post("/ocr", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.json({ text: "", answer: "No file received" });

    console.log("🧾 Running OCR...");

    const result = await Tesseract.recognize(req.file.buffer, "eng");

    const extractedText = result.data.text;
    console.log("OCR Result:", extractedText);

    // Send to LLaMA
    const payload = {
      model: "llama3",
      messages: [
        {
          role: "system",
          content: `
You are MediBot. Extract medicine names from text.
For each medicine explain:
• What it is used for
• Simple meaning
• Safety note
Do NOT prescribe.`
        },
        {
          role: "user",
          content: extractedText
        }
      ],
      stream: false
    };

    const response = await axios.post(OLLAMA_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const answer = response.data?.message?.content || "No response";

    res.json({
      text: extractedText,
      answer
    });

  } catch (err) {
    console.log("OCR ERROR:", err);
    res.json({ text: "", answer: "OCR Failed" });
  }
});

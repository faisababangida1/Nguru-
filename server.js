const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// For PAID users, gemini-1.5-pro-latest is the strongest model
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

app.get('/', (req, res) => res.send('Nguru Paid Engine is Online!'));

app.post('/api/lecture', async (req, res) => {
  try {
    const { topic } = req.body;
    console.log("LOG: Generating deep lecture for:", topic);
    
    const prompt = `You are Nguru, an expert educator. Provide a deep, fundamental HTML-formatted lecture on: ${topic}. Explain the WHY and HOW. Use <h4> and <p> tags.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("LOG: Generation successful!");
    res.json({ success: true, lecture: text, topic: topic });

  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => console.log(`Nguru running on port ${PORT}`));

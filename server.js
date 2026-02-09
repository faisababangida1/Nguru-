const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// SECURITY CHECK: This pulls the key from Railway Variables
// Do NOT paste your actual key here. Let the system do the work.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We use "gemini-1.5-flash" because it is the FASTEST and works everywhere
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get('/', (req, res) => {
  res.send('Nguru Backend is Online and Secure!');
});

app.post('/api/lecture', async (req, res) => {
  try {
    const { topic } = req.body;
    console.log(`Generating lecture for: ${topic}`);
    
    // The Prompt
    const prompt = `You are Nguru. Explain "${topic}" deeply but simply. 
    Use HTML tags: <h4> for titles, <p> for text, <ul> for lists.`;
    
    // Ask Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Send answer back to Frontend
    res.json({ success: true, lecture: text, topic: topic });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Nguru Server running on port ${PORT}`);
});

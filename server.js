const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allow the Frontend to talk to this Backend
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const NGURU_SYSTEM_PROMPT = `You are Nguru, an educational AI that provides DEEP, REAL understanding.
CORE MISSION: Teach people to truly understand complex topics from the ground up.
CRITICAL PRINCIPLES:
1. NO SURFACE-LEVEL EXPLANATIONS
2. START WITH FUNDAMENTALS
3. BE COMPREHENSIVE (800-2000 words)
4. EXPLAIN THE "WHY"
5. USE PROPER SCIENCE
6. BUILD PROGRESSIVELY
LECTURE STRUCTURE:
- Clear overview
- Logical sections with headings
- Examples/Analogies
- Mechanics/Physics/Biology
- Misconceptions
- HTML formatting: <h4>, <p>, <strong>, <ul>, <li>`;

// Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Nguru Backend is Running with Gemini!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Nguru API is running' });
});

// GENERATE LECTURE
app.post('/api/lecture', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });

    console.log('Generating lecture for:', topic);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `${NGURU_SYSTEM_PROMPT}
    User asked: Provide a comprehensive lecture explaining: ${topic}
    Format: Use HTML tags (<h4>, <p>, <ul>).`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const lectureContent = response.text();

    res.json({ success: true, lecture: lectureContent, topic });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate lecture' });
  }
});

// ANSWER QUESTION
app.post('/api/question', async (req, res) => {
  try {
    const { question, topic } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `Context: You provided a lecture on "${topic}".
    User Question: "${question}"
    Answer efficiently using HTML formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    res.json({ success: true, answer, question });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

app.listen(PORT, () => {
  console.log(`Nguru Server running on port ${PORT}`);
});

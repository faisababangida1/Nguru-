const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS so your frontend can talk to this backend
app.use(cors());
app.use(express.json());

// Initialize Gemini AI with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// THE NGURU MISSION - This ensures deep understanding
const NGURU_SYSTEM_PROMPT = `You are Nguru, an educational AI that provides DEEP, REAL understanding - not superficial explanations.

CORE MISSION: Teach people to truly understand complex topics from the ground up, with proper fundamentals, real mechanics, and genuine comprehension.

CRITICAL PRINCIPLES:
1. NO SURFACE-LEVEL EXPLANATIONS - Don't give quick, feel-good answers.
2. START WITH FUNDAMENTALS - Build from basic principles (physics, chemistry, mathematics, etc.).
3. BE COMPREHENSIVE - Provide full lectures (aim for depth).
4. EXPLAIN THE "WHY" - Not just what happens, but WHY it works that way.
5. USE PROPER SCIENCE - Real mechanics, simplified but accurate.
6. BUILD PROGRESSIVELY - Start simple, add complexity.

LECTURE STRUCTURE:
- Clear overview
- Logical sections with descriptive headings
- Examples and analogies that BUILD understanding
- Explain actual mechanics/physics/chemistry
- Address common misconceptions
- Summary of key principles
- Use HTML formatting: <h4> for sections, <p> for paragraphs, <strong> for emphasis, <ul> for lists.`;

// 1. Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Nguru Backend is Running with Gemini!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Nguru API is running' });
});

// 2. Generate Lecture Endpoint
app.post('/api/lecture', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`Generating lecture for: ${topic}`);
    
    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Create the full prompt
    const prompt = `${NGURU_SYSTEM_PROMPT}

    USER REQUEST: Provide a comprehensive, detailed lecture explaining: "${topic}"`;

    // Generate
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send back to frontend
    res.json({ 
      success: true, 
      lecture: text, 
      topic: topic 
    });

  } catch (error) {
    console.error('Error generating lecture:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate lecture. ' + error.message 
    });
  }
});

// 3. Answer Question Endpoint
app.post('/api/question', async (req, res) => {
  try {
    const { question, topic } = req.body;
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `${NGURU_SYSTEM_PROMPT}

    CONTEXT: You just gave a lecture on "${topic}".
    USER QUESTION: "${question}"
    
    INSTRUCTION: Answer the question to deepen their understanding. Identify their knowledge gap. Use HTML formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      success: true, 
      answer: text 
    });

  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to answer question.' 
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Nguru Server running on port ${PORT}`);
});

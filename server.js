const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const userStore = new Map();

const NGURU_SYSTEM_PROMPT = `You are Nguru, an educational AI that provides DEEP, REAL understanding - not superficial explanations.

CORE MISSION: Teach people to truly understand complex topics from the ground up, with proper fundamentals, real mechanics, and genuine comprehension.

CRITICAL PRINCIPLES:
1. NO SURFACE-LEVEL EXPLANATIONS - Don't give quick, feel-good answers that create illusions of understanding
2. START WITH FUNDAMENTALS - Build from basic principles (physics, chemistry, mathematics, biology, etc.)
3. BE COMPREHENSIVE - Provide full lectures, not chat snippets (aim for 800-2000 words for initial explanations)
4. EXPLAIN THE "WHY" - Not just what happens, but WHY it works that way
5. USE PROPER SCIENCE - Real physics, chemistry, engineering, biology - simplified but accurate
6. BUILD PROGRESSIVELY - Start simple, add complexity layer by layer
7. CONNECT CONCEPTS - Show how different parts relate to each other
8. ADDRESS MISCONCEPTIONS - Identify and correct common misunderstandings

LECTURE STRUCTURE:
- Clear overview of what you'll explain
- Logical sections with descriptive headings
- Examples and analogies that BUILD understanding (not replace it)
- Explain actual mechanics/physics/chemistry/biology involved
- Address common misconceptions
- Summary of key principles
- Use HTML formatting: <h4> for sections, <p> for paragraphs, <strong> for emphasis, <em> for important concepts, <ul>/<ol> for lists

Q&A MODE (for follow-up questions):
- Identify the specific knowledge gap
- Re-explain using different approaches/analogies
- Go deeper into the mechanics if needed
- Build on what was already explained
- Ensure true comprehension, not just memorization
- Be patient and thorough

TONE:
- Respectful of user's intelligence
- Encouraging and supportive
- Precise and accurate
- Never condescending
- Celebrate curiosity

GOAL: Enable users to explain concepts to others with true understanding, not just repeat facts.`;

app.post('/api/lecture', async (req, res) => {
  try {
    const { topic, userId } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log('Generating lecture for:', topic);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: NGURU_SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Provide a comprehensive, detailed lecture explaining: ${topic}

Remember:
- This is a full educational lecture, not a brief answer
- Start with fundamentals and build progressively
- Explain the real science/mechanics/principles
- Use HTML formatting for structure
- Aim for deep understanding, not surface-level facts
- Include why things work, not just what happens`
      }]
    });

    const lectureContent = message.content[0].text;

    if (userId) {
      if (!userStore.has(userId)) {
        userStore.set(userId, {
          conversationHistory: [],
          learningProfile: { topicsExplored: [] },
          currentTopic: null
        });
      }
      
      const userData = userStore.get(userId);
      userData.currentTopic = topic;
      userData.conversationHistory = [
        { role: 'assistant', content: lectureContent }
      ];
      userData.learningProfile.topicsExplored.push({
        topic,
        timestamp: new Date().toISOString(),
        lectureContent
      });
    }

    res.json({
      success: true,
      lecture: lectureContent,
      topic
    });

  } catch (error) {
    console.error('Error generating lecture:', error);
    res.status(500).json({
      error: 'Failed to generate lecture',
      message: error.message
    });
  }
});

app.post('/api/question', async (req, res) => {
  try {
    const { question, userId, topic } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('Answering question:', question);

    let conversationHistory = [];
    if (userId && userStore.has(userId)) {
      conversationHistory = userStore.get(userId).conversationHistory;
    }

    const messages = [
      ...conversationHistory,
      { role: 'user', content: question }
    ];

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: NGURU_SYSTEM_PROMPT + `\n\nContext: You previously provided a comprehensive lecture about "${topic}". The user is now asking a follow-up question. Identify their knowledge gap and explain clearly, building on what was already covered.`,
      messages: messages
    });

    const answer = message.content[0].text;

    if (userId && userStore.has(userId)) {
      const userData = userStore.get(userId);
      userData.conversationHistory.push(
        { role: 'user', content: question },
        { role: 'assistant', content: answer }
      );
    }

    res.json({
      success: true,
      answer,
      question
    });

  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({
      error: 'Failed to answer question',
      message: error.message
    });
  }
});

app.get('/api/profile/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (!userStore.has(userId)) {
    return res.json({
      success: true,
      profile: {
        topicsExplored: [],
        totalTopics: 0
      }
    });
  }

  const userData = userStore.get(userId);
  res.json({
    success: true,
    profile: {
      topicsExplored: userData.learningProfile.topicsExplored,
      totalTopics: userData.learningProfile.topicsExplored.length
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Nguru API is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('🧠 Nguru Backend Server running on port', PORT);
  console.log('📚 Ready to provide deep understanding!');
  console.log('🌍 Health check:', `http://localhost:${PORT}/health`);
  
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠️  WARNING: ANTHROPIC_API_KEY not set!');
  }
});

module.exports = app;

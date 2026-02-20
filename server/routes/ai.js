const express = require('express');
const router = express.Router();

// AI analysis endpoint using OpenAI
router.post('/analyze', async (req, res) => {
  try {
    const { symptoms, history, language } = req.body;

    // Check if OpenAI key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      // Fallback severity analysis without OpenAI
      const severity = fallbackSeverityAnalysis(symptoms);
      return res.json({
        success: true,
        analysis: {
          severity,
          recommendations: `Based on symptoms: ${symptoms}. Please consult a doctor for proper diagnosis.`,
          aiPowered: false,
        },
      });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = language === 'hi-IN'
      ? `आप एक मेडिकल ट्राइएज AI हैं। रोगी के लक्षण: "${symptoms}". चिकित्सा इतिहास: "${history}". कृपया गंभीरता स्तर (Low/Medium/High/Critical) और संक्षिप्त सिफारिशें JSON प्रारूप में दें: {"severity": "...", "recommendations": "..."}`
      : `You are a medical triage AI assistant. Patient symptoms: "${symptoms}". Medical history: "${history}". Provide severity level (Low/Medium/High/Critical) and brief recommendations in JSON format: {"severity": "...", "recommendations": "..."}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch {
      analysis = {
        severity: 'Medium',
        recommendations: completion.choices[0].message.content,
      };
    }

    res.json({
      success: true,
      analysis: { ...analysis, aiPowered: true },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function fallbackSeverityAnalysis(symptoms) {
  const lower = (symptoms || '').toLowerCase();
  const critical = ['chest pain', 'breathing difficulty', 'unconscious', 'severe bleeding', 'seizure', 'stroke', 'heart attack'];
  const high = ['fracture', 'high fever', 'severe pain', 'head injury', 'burn', 'allergic reaction'];
  const medium = ['fever', 'vomiting', 'diarrhea', 'moderate pain', 'infection', 'sprain'];

  if (critical.some(k => lower.includes(k))) return 'Critical';
  if (high.some(k => lower.includes(k))) return 'High';
  if (medium.some(k => lower.includes(k))) return 'Medium';
  return 'Low';
}

// ChatGPT-like medical conversation endpoint
router.post('/chat', async (req, res) => {
  try {
    const { messages, language } = req.body;

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      return res.json({
        success: true,
        reply: language === 'hi-IN'
          ? 'मैं एक AI मेडिकल सहायक हूँ। कृपया अपना प्रश्न पूछें। (AI कुंजी कॉन्फ़िगर नहीं है, यह एक फ़ॉलबैक प्रतिक्रिया है।)'
          : 'I am an AI medical assistant. Please ask your question. (AI key not configured, this is a fallback response.)',
        aiPowered: false,
      });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemMsg = language === 'hi-IN'
      ? 'आप एक सहायक और ज्ञानपूर्ण AI मेडिकल सहायक हैं। आप स्वास्थ्य संबंधी प्रश्नों का उत्तर हिंदी में देते हैं। आप निदान नहीं करते बल्कि सामान्य चिकित्सा जानकारी और सलाह देते हैं। हमेशा गंभीर मामलों में डॉक्टर से मिलने की सलाह दें।'
      : 'You are a helpful and knowledgeable AI medical assistant. You answer health-related questions clearly and concisely. You do not diagnose but provide general medical information and advice. Always recommend consulting a doctor for serious concerns. You can also help with general wellness, nutrition, exercise, and mental health questions.';

    const chatMessages = [
      { role: 'system', content: systemMsg },
      ...(messages || []).slice(-10), // Keep last 10 messages for context
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content,
      aiPowered: true,
    });
  } catch (err) {
    // Graceful fallback for API errors (429 quota, etc.)
    const lastUserMsg = (req.body.messages || []).filter(m => m.role === 'user').pop();
    const userQ = lastUserMsg?.content || '';
    res.json({
      success: true,
      reply: req.body.language === 'hi-IN'
        ? `आपके प्रश्न "${userQ.slice(0, 50)}" के लिए: कृपया इस विषय पर डॉक्टर से परामर्श लें। AI सेवा अस्थायी रूप से अनुपलब्ध है।`
        : `Regarding your question "${userQ.slice(0, 50)}": I recommend consulting a healthcare professional for personalized advice. The AI service is temporarily unavailable.`,
      aiPowered: false,
    });
  }
});

// Generate comprehensive patient report from intake data
router.post('/report', async (req, res) => {
  try {
    const { name, age, symptoms, history, language } = req.body;

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      const severity = fallbackSeverityAnalysis(symptoms);
      return res.json({
        success: true,
        report: {
          severity,
          summary: `Patient ${name}, age ${age}. Symptoms: ${symptoms}. History: ${history || 'None reported'}.`,
          possibleConditions: ['Please consult a doctor for proper diagnosis'],
          recommendations: ['Visit a healthcare professional for a thorough examination'],
          medications: ['No medications can be suggested without a proper diagnosis'],
          nextSteps: ['Schedule an appointment with a specialist', 'Get lab tests if recommended by a doctor'],
          aiPowered: false,
        },
      });
    }

    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = language === 'hi-IN'
      ? `एक चिकित्सा ट्राइएज AI के रूप में, निम्नलिखित रोगी डेटा का विश्लेषण करें:
नाम: ${name}, उम्र: ${age}
लक्षण: ${symptoms}
चिकित्सा इतिहास: ${history || 'कोई नहीं'}

कृपया JSON प्रारूप में एक व्यापक रिपोर्ट दें:
{"severity": "Low/Medium/High/Critical", "summary": "संक्षिप्त सारांश", "possibleConditions": ["संभावित स्थिति 1", "संभावित स्थिति 2"], "recommendations": ["सिफारिश 1", "सिफारिश 2"], "medications": ["दवा सुझाव 1"], "nextSteps": ["अगला कदम 1", "अगला कदम 2"]}`
      : `As a medical triage AI, analyze the following patient data:
Name: ${name}, Age: ${age}
Symptoms: ${symptoms}
Medical History: ${history || 'None reported'}

Provide a comprehensive report in JSON format:
{"severity": "Low/Medium/High/Critical", "summary": "Brief summary of assessment", "possibleConditions": ["Possible condition 1", "Possible condition 2"], "recommendations": ["Recommendation 1", "Recommendation 2"], "medications": ["Medication suggestion 1"], "nextSteps": ["Next step 1", "Next step 2"]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    let report;
    try {
      report = JSON.parse(completion.choices[0].message.content);
    } catch {
      report = {
        severity: 'Medium',
        summary: completion.choices[0].message.content,
        possibleConditions: [],
        recommendations: [],
        medications: [],
        nextSteps: [],
      };
    }

    res.json({
      success: true,
      report: { ...report, aiPowered: true },
    });
  } catch (err) {
    // Graceful fallback for API errors (429, etc.)
    const { name: pName, age: pAge, symptoms: pSymptoms, history: pHistory } = req.body || {};
    const severity = fallbackSeverityAnalysis(pSymptoms);
    res.json({
      success: true,
      report: {
        severity,
        summary: `Patient ${pName || 'Unknown'}, age ${pAge || 'Unknown'}. Symptoms: ${pSymptoms || 'Not specified'}. History: ${pHistory || 'None reported'}.`,
        possibleConditions: ['Please consult a doctor for proper diagnosis'],
        recommendations: ['Visit a healthcare professional for a thorough examination'],
        medications: ['No medications can be suggested without a proper diagnosis'],
        nextSteps: ['Schedule an appointment with a specialist', 'Get lab tests if recommended by a doctor'],
        aiPowered: false,
      },
    });
  }
});

module.exports = router;

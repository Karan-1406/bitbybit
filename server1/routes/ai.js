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

module.exports = router;

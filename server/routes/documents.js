const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads  
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Accepted: PDF, JPG, PNG, WEBP, DOC, DOCX, TXT'));
    }
  },
});

// Upload document and analyze with AI
router.post('/analyze', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { language } = req.body;
    const fileInfo = {
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      path: req.file.path,
    };

    // Check if OpenAI key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
      // Fallback analysis
      return res.json({
        success: true,
        analysis: {
          summary: language === 'hi-IN'
            ? `दस्तावेज़ "${fileInfo.originalName}" सफलतापूर्वक अपलोड किया गया। AI विश्लेषण के लिए OpenAI API कुंजी कॉन्फ़िगर करें। कृपया डॉक्टर से रिपोर्ट की समीक्षा करवाएं।`
            : `Document "${fileInfo.originalName}" uploaded successfully. Configure OpenAI API key for AI analysis. Please have a doctor review the report.`,
          findings: language === 'hi-IN'
            ? 'AI विश्लेषण उपलब्ध नहीं (API कुंजी कॉन्फ़िगर नहीं है)। डॉक्टर रिपोर्ट की समीक्षा करेंगे।'
            : 'AI analysis unavailable (API key not configured). A doctor will review the report.',
          recommendations: language === 'hi-IN'
            ? 'कृपया अपने नजदीकी अस्पताल में डॉक्टर से मिलें और यह रिपोर्ट दिखाएं।'
            : 'Please visit your nearest hospital and show this report to a doctor.',
          aiPowered: false,
        },
        file: fileInfo,
      });
    }

    // Use OpenAI for analysis
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const ext = path.extname(fileInfo.originalName).toLowerCase();
    let fileContent = '';

    // For text-based files, read content
    if (['.txt', '.doc', '.docx'].includes(ext)) {
      try {
        fileContent = fs.readFileSync(req.file.path, 'utf-8').substring(0, 2000);
      } catch {
        fileContent = '[File content could not be read]';
      }
    }

    const prompt = language === 'hi-IN'
      ? `आप एक मेडिकल AI सहायक हैं। रोगी ने "${fileInfo.originalName}" (${fileInfo.type}, ${(fileInfo.size / 1024).toFixed(1)}KB) नामक एक मेडिकल रिपोर्ट अपलोड की है। ${fileContent ? `फ़ाइल सामग्री: "${fileContent}"` : 'फ़ाइल एक छवि/PDF है।'} कृपया JSON प्रारूप में जवाब दें: {"summary": "रिपोर्ट का सारांश", "findings": "प्रमुख निष्कर्ष", "recommendations": "सिफारिशें"}`
      : `You are a medical AI assistant. A patient uploaded a medical report "${fileInfo.originalName}" (${fileInfo.type}, ${(fileInfo.size / 1024).toFixed(1)}KB). ${fileContent ? `File content: "${fileContent}"` : 'File is an image/PDF.'} Provide analysis in JSON: {"summary": "report summary", "findings": "key findings", "recommendations": "recommendations"}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch {
      analysis = {
        summary: completion.choices[0].message.content,
        findings: '',
        recommendations: '',
      };
    }

    res.json({
      success: true,
      analysis: { ...analysis, aiPowered: true },
      file: fileInfo,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

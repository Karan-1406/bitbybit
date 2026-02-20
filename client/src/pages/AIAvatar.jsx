import { useState, useEffect, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { TalkingHead } from '@met4citizen/talkinghead';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Globe,
  Send,
  CheckCircle,
  Loader2,
  User,
  Calendar,
  Stethoscope,
  FileText,
  RotateCcw,
  Upload,
  File,
  X,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';

const STEPS = [
  { key: 'name', label: 'Patient Name', labelHi: 'रोगी का नाम', icon: User, prompt: "What is the patient's name?", promptHi: 'रोगी का नाम क्या है?' },
  { key: 'age', label: 'Age', labelHi: 'उम्र', icon: Calendar, prompt: "What is the patient's age?", promptHi: 'रोगी की उम्र क्या है?' },
  { key: 'symptoms', label: 'Symptoms', labelHi: 'लक्षण', icon: Stethoscope, prompt: 'Please describe the symptoms.', promptHi: 'कृपया लक्षण बताएं।' },
  { key: 'history', label: 'Medical History', labelHi: 'चिकित्सा इतिहास', icon: FileText, prompt: 'Any relevant medical history?', promptHi: 'कोई प्रासंगिक चिकित्सा इतिहास?' },
];

function SoundWave({ active }) {
  if (!active) return null;
  return (
    <div className="flex items-center gap-1 h-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="sound-bar w-1 bg-primary-400 rounded-full"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// Document Upload Component
function DocumentUpload({ language }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const isHindi = language === 'hi-IN';

  const handleFile = (f) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.txt'];
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setError(isHindi ? 'यह फ़ाइल प्रकार अनुमत नहीं है' : 'File type not allowed');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError(isHindi ? 'फ़ाइल 10MB से छोटी होनी चाहिए' : 'File must be under 10MB');
      return;
    }
    setError('');
    setFile(f);
    setAnalysis(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const uploadAndAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('language', language);

      const res = await axios.post('/api/documents/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setAnalysis(res.data.analysis);
      }
    } catch (err) {
      setError(err.response?.data?.error || (isHindi ? 'अपलोड विफल' : 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary-400" />
        {isHindi ? 'रिपोर्ट अपलोड करें' : 'Upload Medical Report'}
      </h3>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragOver
          ? 'border-primary-500 bg-primary-500/10'
          : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
          }`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <File className="w-8 h-8 text-primary-400" />
            <div className="text-left">
              <p className="text-sm text-white font-medium">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => { setFile(null); setAnalysis(null); }}
              className="p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {isHindi
                ? 'फ़ाइल यहाँ खींचें या क्लिक करें'
                : 'Drag & drop or click to select'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              PDF, JPG, PNG, DOC, TXT (max 10MB)
            </p>
          </div>
        )}

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          style={{ position: 'absolute', inset: 0 }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {file && !analysis && (
        <button
          onClick={uploadAndAnalyze}
          disabled={uploading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isHindi ? 'विश्लेषण हो रहा है...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <Stethoscope className="w-4 h-4" />
              {isHindi ? 'AI विश्लेषण शुरू करें' : 'Analyze with AI'}
            </>
          )}
        </button>
      )}

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h4 className="font-semibold text-white">
              {isHindi ? 'AI विश्लेषण' : 'AI Analysis'}
            </h4>
            {!analysis.aiPowered && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                {isHindi ? 'बेसिक' : 'Basic'}
              </span>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">{isHindi ? 'सारांश' : 'Summary'}</p>
            <p className="text-sm text-white">{analysis.summary}</p>
          </div>

          {analysis.findings && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{isHindi ? 'निष्कर्ष' : 'Findings'}</p>
              <p className="text-sm text-accent-300">{analysis.findings}</p>
            </div>
          )}

          {analysis.recommendations && (
            <div>
              <p className="text-xs text-gray-500 mb-1">{isHindi ? 'सिफारिशें' : 'Recommendations'}</p>
              <p className="text-sm text-primary-300">{analysis.recommendations}</p>
            </div>
          )}

          <button
            onClick={() => { setFile(null); setAnalysis(null); }}
            className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {isHindi ? 'और रिपोर्ट अपलोड करें' : 'Upload Another Report'}
          </button>
        </motion.div>
      )}
    </div >
  );
}

// 3D Avatar Container
function AvatarViewer({ isSpeaking, avatarState, onHeadInit }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.dataset.initialized) {
      containerRef.current.dataset.initialized = "true";
      const node = containerRef.current;

      const head = new TalkingHead(node, {
        showCues: false,
        cameraView: "upper",
        ttsLang: "hi-IN",
        lipsyncModules: ["en"],
      });

      const initAvatar = async () => {
        try {
          await head.showAvatar({
            url: "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb?morphTargets=ARKit,Oculus+Visemes,mouthOpen,mouthSmile,eyesClosed,eyesLookUp,eyesLookDown&textureSizeLimit=1024&textureFormat=png",
            body: 'F',
            avatarMood: 'neutral',
            lipsyncLang: 'en'
          });
          onHeadInit(head);
        } catch (err) {
          console.error("Avatar init error:", err);
        }
      };

      initAvatar();
    }
  }, [onHeadInit]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#050b18]"
      style={{ minHeight: '400px' }}
    />
  );
}

export default function AIAvatar() {
  const [language, setLanguage] = useState('en-US');
  const [currentStep, setCurrentStep] = useState(0);
  const [patientData, setPatientData] = useState({ name: '', age: '', symptoms: '', history: '' });
  const [avatarState, setAvatarState] = useState('idle'); // idle, listening, thinking, speaking, done
  const [result, setResult] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [activeTab, setActiveTab] = useState('intake'); // intake, upload

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const isHindi = language === 'hi-IN';

  // Speak text using Web Speech API — select a Hindi voice explicitly
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;

      // For Hindi, try to find a Hindi voice explicitly
      if (language === 'hi-IN') {
        const voices = window.speechSynthesis.getVoices();
        const hindiVoice = voices.find(
          (v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')
        );
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
      }

      utterance.onstart = () => { setSpeaking(true); setAvatarState('speaking'); };
      utterance.onend = () => { setSpeaking(false); setAvatarState('idle'); };
      window.speechSynthesis.speak(utterance);
    }
  }, [language]);

  // Load voices (browsers load them asynchronously)
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Speak current step prompt on step change
  useEffect(() => {
    if (currentStep < STEPS.length && avatarState !== 'done' && activeTab === 'intake') {
      const step = STEPS[currentStep];
      const prompt = isHindi ? step.promptHi : step.prompt;
      setTimeout(() => speak(prompt), 500);
    }
  }, [currentStep, language]);

  // Update avatar state based on listening
  useEffect(() => {
    if (listening) {
      setAvatarState('listening');
    }
  }, [listening]);

  const startListening = () => {
    resetTranscript();
    // Explicitly pass language and ensure interimResults for Hindi
    SpeechRecognition.startListening({
      language: language,
      continuous: true,
      interimResults: true,
    });
  };

  const stopAndAccept = () => {
    SpeechRecognition.stopListening();
    if (transcript.trim()) {
      acceptInput(transcript.trim());
    }
  };

  const acceptInput = (value) => {
    const step = STEPS[currentStep];
    setPatientData((prev) => ({ ...prev, [step.key]: value }));
    resetTranscript();
    setManualInput('');

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitPatient({ ...patientData, [step.key]: value });
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      acceptInput(manualInput.trim());
    }
  };

  const submitPatient = async (data) => {
    setAvatarState('thinking');
    try {
      let analysis = { severity: 'Medium', recommendations: '' };
      try {
        const aiRes = await axios.post('/api/ai/analyze', {
          symptoms: data.symptoms,
          history: data.history,
          language,
        });
        if (aiRes.data.success) {
          analysis = aiRes.data.analysis;
        }
      } catch {
        // fallback
      }

      const res = await axios.post('/api/patients', {
        name: data.name,
        age: parseInt(data.age) || 0,
        symptoms: data.symptoms,
        history: data.history,
        severity: analysis.severity,
        languageUsed: language,
        aiAnalysis: analysis.recommendations || '',
      });

      if (res.data.success) {
        setResult({ patient: res.data.patient, analysis });
        setAvatarState('done');
        const doneMsg = isHindi
          ? `रोगी ${data.name} पंजीकृत।  ID: ${res.data.patient.patientID}. गंभीरता: ${analysis.severity}.`
          : `Patient ${data.name} registered. ID: ${res.data.patient.patientID}. Severity: ${analysis.severity}.`;
        speak(doneMsg);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setAvatarState('idle');
    }
  };

  const headRef = useRef(null);

  const onHeadInit = useCallback((head) => {
    headRef.current = head;
  }, []);

  const askMedicalQuestion = useCallback((text, lang) => {
    if (headRef.current) {
      setAvatarState('speaking');
      setSpeaking(true);
      headRef.current.speakText(text, {
        ttsLang: lang,
        lipsyncLang: 'en'
      });
      headRef.current.speakMarker(() => {
        setSpeaking(false);
        setAvatarState('idle');
      });
    } else {
      // Fallback to browser TTS if avatar head isn't ready
      speak(text);
    }
  }, [speak]);

  // Handle "Start Session"
  const startSession = () => {
    askMedicalQuestion('नमस्ते, मैं आपकी कैसे मदद कर सकता हूँ?', 'hi-IN');
  };

  const resetAll = () => {
    setCurrentStep(0);
    setPatientData({ name: '', age: '', symptoms: '', history: '' });
    setAvatarState('idle');
    setResult(null);
    resetTranscript();
    setManualInput('');
    window.speechSynthesis?.cancel();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-white"
          >
            {isHindi ? 'AI अवतार - रोगी प्रवेश' : 'AI Avatar - Patient Intake'}
          </motion.h1>
          <p className="text-sm text-gray-500 mt-1">
            {isHindi ? 'आवाज़ या टाइप से जानकारी दें' : 'Voice or text-based patient data collection'}
          </p>
        </div>

        {/* Language toggle */}
        <button
          onClick={() => {
            SpeechRecognition.stopListening();
            window.speechSynthesis?.cancel();
            setLanguage((prev) => (prev === 'en-US' ? 'hi-IN' : 'en-US'));
          }}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Globe className="w-4 h-4" />
          {isHindi ? 'English' : 'हिंदी'}
        </button>
      </div>

      {/* 3D AI Avatar - Medical Theme Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group focus-within:ring-2 focus-within:ring-primary-500/50 rounded-2xl overflow-hidden border-2 border-primary-500/30 bg-black/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
      >
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${avatarState === 'speaking' ? 'bg-green-500 animate-pulse' : 'bg-primary-500'}`} />
          <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">AI Medical Assistant</span>
        </div>

        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={startSession}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 group"
          >
            <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            Start Session
          </button>
        </div>

        <AvatarViewer
          isSpeaking={speaking}
          avatarState={avatarState}
          onHeadInit={onHeadInit}
        />

        {/* Medical Overlay Decoration */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </motion.div>

      {/* Tab navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('intake')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'intake'
            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
            }`}
        >
          <Stethoscope className="w-4 h-4" />
          {isHindi ? 'रोगी प्रवेश' : 'Patient Intake'}
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'upload'
            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-transparent'
            }`}
        >
          <Upload className="w-4 h-4" />
          {isHindi ? 'रिपोर्ट अपलोड' : 'Upload Report'}
        </button>
      </div>

      {/* Tab: Document Upload */}
      {activeTab === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative"
        >
          <DocumentUpload language={language} />
        </motion.div>
      )}

      {/* Tab: Patient Intake */}
      {activeTab === 'intake' && (
        <>
          {/* Step progress */}
          {avatarState !== 'done' && (
            <div className="flex items-center gap-2">
              {STEPS.map((step, i) => (
                <div key={step.key} className="flex-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${i < currentStep
                      ? 'bg-primary-500'
                      : i === currentStep
                        ? 'bg-primary-500/50'
                        : 'bg-white/10'
                      }`}
                  />
                  <p className={`text-[10px] mt-1 text-center ${i <= currentStep ? 'text-primary-400' : 'text-gray-600'}`}>
                    {isHindi ? step.labelHi : step.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Current question */}
          {avatarState !== 'done' && currentStep < STEPS.length && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const StepIcon = STEPS[currentStep].icon;
                  return <StepIcon className="w-5 h-5 text-primary-400" />;
                })()}
                <h3 className="font-semibold text-white">
                  {isHindi ? STEPS[currentStep].promptHi : STEPS[currentStep].prompt}
                </h3>
              </div>

              {/* Transcript display */}
              {transcript && (
                <div className="mb-4 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
                  <p className="text-sm text-primary-300">{transcript}</p>
                </div>
              )}

              {/* Voice controls */}
              <div className="flex items-center gap-3 mb-4">
                {browserSupportsSpeechRecognition ? (
                  <>
                    <button
                      onClick={listening ? stopAndAccept : startListening}
                      className={`p-4 rounded-full transition-all duration-300 ${listening
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-primary-500 hover:bg-primary-600'
                        }`}
                    >
                      {listening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                    </button>
                    <div>
                      <span className="text-sm text-gray-400">
                        {listening
                          ? isHindi ? 'बोलें... रोकने के लिए क्लिक करें' : 'Speak... Click to stop'
                          : isHindi ? 'माइक्रोफ़ोन शुरू करें' : 'Start microphone'}
                      </span>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {isHindi ? `भाषा: हिंदी (hi-IN)` : `Language: English (en-US)`}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-yellow-400">
                    {isHindi ? 'ब्राउज़र में स्पीच रिकग्निशन उपलब्ध नहीं है। कृपया Chrome उपयोग करें।' : 'Speech recognition not available. Please use Chrome.'}
                  </p>
                )}
              </div>

              {/* Sound wave */}
              <div className="flex justify-center mb-4">
                <SoundWave active={listening || speaking} />
              </div>

              {/* Manual text input */}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder={isHindi ? 'या यहाँ टाइप करें...' : 'Or type here...'}
                  className="input-field flex-1"
                />
                <button type="submit" className="btn-primary px-4">
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Previously entered data */}
              {Object.entries(patientData).some(([, v]) => v) && (
                <div className="mt-4 space-y-1">
                  {STEPS.slice(0, currentStep).map((step) => (
                    <p key={step.key} className="text-xs text-gray-500">
                      <span className="text-gray-400">{isHindi ? step.labelHi : step.label}:</span>{' '}
                      {patientData[step.key]}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Thinking state */}
          {avatarState === 'thinking' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-6 flex items-center justify-center gap-3"
            >
              <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
              <p className="text-sm text-gray-400">
                {isHindi ? 'AI विश्लेषण चल रहा है...' : 'AI analysis in progress...'}
              </p>
            </motion.div>
          )}

          {/* Result */}
          {avatarState === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold text-white">
                    {isHindi ? 'रोगी पंजीकृत!' : 'Patient Registered!'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{isHindi ? 'रोगी ID' : 'Patient ID'}</p>
                    <p className="text-lg font-bold text-primary-400">
                      {result.patient.patientID}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{isHindi ? 'गंभीरता' : 'Severity'}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${`severity-${result.analysis.severity?.toLowerCase()}`
                        }`}
                    >
                      {result.analysis.severity}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{isHindi ? 'नाम' : 'Name'}</p>
                    <p className="text-white">{result.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{isHindi ? 'उम्र' : 'Age'}</p>
                    <p className="text-white">{result.patient.age}</p>
                  </div>
                </div>

                {result.analysis.recommendations && (
                  <div className="mt-4 p-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
                    <p className="text-xs text-gray-500 mb-1">
                      {isHindi ? 'AI सिफारिशें' : 'AI Recommendations'}
                    </p>
                    <p className="text-sm text-accent-300">
                      {result.analysis.recommendations}
                    </p>
                  </div>
                )}
              </div>

              <button onClick={resetAll} className="btn-primary w-full flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                {isHindi ? 'नया रोगी' : 'New Patient'}
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

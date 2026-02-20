import React, { useState, useEffect, useCallback, useRef } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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
  MessageCircle,
  Bot,
  Activity,
  Pill,
  ClipboardList,
  ArrowRight,
  Download,
} from 'lucide-react';
import axios from 'axios';

// ─── Intake Questions ───
const STEPS = [
  { key: 'name', label: 'Patient Name', labelHi: 'रोगी का नाम', icon: User, prompt: "Hello! I'm your AI medical assistant. Let's start — what is your name?", promptHi: 'नमस्ते! मैं आपकी AI मेडिकल सहायक हूँ। चलिए शुरू करते हैं — आपका नाम क्या है?' },
  { key: 'age', label: 'Age', labelHi: 'उम्र', icon: Calendar, prompt: "Thank you! How old are you?", promptHi: 'धन्यवाद! आपकी उम्र क्या है?' },
  { key: 'symptoms', label: 'Symptoms', labelHi: 'लक्षण', icon: Stethoscope, prompt: 'Can you describe the symptoms you are experiencing?', promptHi: 'कृपया बताएं कि आपको क्या लक्षण हो रहे हैं?' },
  { key: 'history', label: 'Medical History', labelHi: 'चिकित्सा इतिहास', icon: FileText, prompt: 'Do you have any relevant medical history or ongoing conditions?', promptHi: 'क्या आपकी कोई पुरानी बीमारी या चिकित्सा इतिहास है?' },
];

// ─── Sound Wave ───
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

// ─── Document Upload Component ───
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

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${dragOver
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
              {isHindi ? 'फ़ाइल यहाँ खींचें या क्लिक करें' : 'Drag & drop or click to select'}
            </p>
            <p className="text-xs text-gray-600 mt-1">PDF, JPG, PNG, DOC, TXT (max 10MB)</p>
          </div>
        )}

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
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
    </div>
  );
}

// ─── Three.js 3D Avatar Viewer with Jaw-based Lip-Sync ───
// ─── Three.js 3D Avatar Viewer with Jaw-based Lip-Sync ───
function AvatarViewer({ isSpeaking, avatarState, onLog, onError }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const jawBoneRef = useRef(null);
  const modelGroupRef = useRef(null);
  const animFrameRef = useRef(null);
  const lipSyncIntervalRef = useRef(null);
  const mouthOpenRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.dataset.initialized === 'true') return;
    container.dataset.initialized = 'true';

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b18);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(30, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3.5);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 1.8;
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0); // Brighter
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 3.0); // Brighter
    mainLight.position.set(3, 5, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 1.0);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x6644cc, 1.0);
    rimLight.position.set(0, 3, -5);
    scene.add(rimLight);

    // Axes Helper for debugging
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Subtle ground plane glow
    const groundGeometry = new THREE.CircleGeometry(2, 64);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x1a3a5c,
      transparent: true,
      opacity: 0.15,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    scene.add(ground);

    onLog?.(`Three.js initialized. Version: ${THREE.REVISION}`);

    // Load OBJ model
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/models/');
    mtlLoader.load('Matt_Smith_likeness.mtl', (materials) => {
      materials.preload();

      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.setPath('/models/');
      onLog?.('Loading OBJ model...');
      objLoader.load('Matt_Smith_likeness.obj', (object) => {
        onLog?.('OBJ model loaded successfully');
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Scale to roughly 3.5 units tall (larger)
        const scale = 3.5 / size.y;
        object.scale.setScalar(scale);

        // Re-center after scale
        const scaledBox = new THREE.Box3().setFromObject(object);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        object.position.sub(scaledCenter);
        object.position.y += scaledBox.getSize(new THREE.Vector3()).y / 2;

        // Find the jaw/chin mesh for lip-sync
        let jawMesh = null;
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            // Look for head/jaw related meshes
            const name = (child.name || '').toLowerCase();
            if (name.includes('jaw') || name.includes('chin') || name.includes('mouth') || name.includes('lip') || name.includes('teeth')) {
              jawMesh = child;
            }
          }
        });

        jawBoneRef.current = jawMesh;
        modelGroupRef.current = object;
        scene.add(object);

        // Focus camera on head area
        camera.position.set(0, scaledBox.max.y - 0.3, 2.5);
        camera.lookAt(0, scaledBox.max.y - 0.5, 0);
        controls.target.set(0, scaledBox.max.y - 0.5, 0);
        controls.update();
      },
        (progress) => {
          // Loading progress
        },
        (error) => {
          console.error('Error loading OBJ model:', error);
          onError?.(`Error loading OBJ model: ${error.message}`);
        });
    },
      (progress) => { },
      (error) => {
        console.error('Error loading MTL:', error);
        onError?.(`Error loading MTL: ${error.message}. Trying OBJ only...`);
        // Try loading OBJ without materials
        const objLoader = new OBJLoader();
        objLoader.setPath('/models/');
        objLoader.load('Matt_Smith_likeness.obj', (object) => {
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const scale = 2.0 / size.y;
          object.scale.setScalar(scale);
          const scaledBox = new THREE.Box3().setFromObject(object);
          const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
          object.position.sub(scaledCenter);
          object.position.y += scaledBox.getSize(new THREE.Vector3()).y / 2;

          // Apply a default material
          object.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xd4a574,
                roughness: 0.7,
                metalness: 0.1,
              });
            }
          });

          modelGroupRef.current = object;
          scene.add(object);

          camera.position.set(0, scaledBox.max.y - 0.3, 2.5);
          camera.lookAt(0, scaledBox.max.y - 0.5, 0);
          controls.target.set(0, scaledBox.max.y - 0.5, 0);
          controls.update();
        });
      });

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();

      // Lip-sync animation on model
      if (modelGroupRef.current) {
        const targetMouth = mouthOpenRef.current;
        // Subtle idle breathing animation
        const breathe = Math.sin(Date.now() * 0.002) * 0.003;
        modelGroupRef.current.position.y += breathe * 0.1;

        // Jaw animation for lip sync
        if (jawBoneRef.current) {
          const currentRot = jawBoneRef.current.rotation.x;
          const targetRot = targetMouth * 0.15; // max jaw open rotation
          jawBoneRef.current.rotation.x = currentRot + (targetRot - currentRot) * 0.3;
        }

        // Subtle head micro-movement when speaking
        if (targetMouth > 0) {
          modelGroupRef.current.rotation.y = Math.sin(Date.now() * 0.003) * 0.02;
          modelGroupRef.current.rotation.x = Math.sin(Date.now() * 0.002) * 0.008;
        } else {
          // Gentle idle sway
          modelGroupRef.current.rotation.y *= 0.95;
          modelGroupRef.current.rotation.x *= 0.95;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Lip-sync: animate mouth open/close when speaking
  useEffect(() => {
    if (isSpeaking) {
      lipSyncIntervalRef.current = setInterval(() => {
        // Random mouth shapes to simulate speech
        mouthOpenRef.current = 0.3 + Math.random() * 0.7;
      }, 100); // ~10Hz mouth updates
    } else {
      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = null;
      mouthOpenRef.current = 0;
    }

    return () => {
      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
    };
  }, [isSpeaking]);

  // Glow effect based on avatar state
  const borderColor = avatarState === 'speaking'
    ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]'
    : avatarState === 'listening'
      ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
      : avatarState === 'thinking'
        ? 'border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.15)]'
        : 'border-primary-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]';

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-500 ${borderColor} bg-black/40`}>
      {/* Status badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${avatarState === 'speaking' ? 'bg-green-500 animate-pulse' :
          avatarState === 'listening' ? 'bg-blue-500 animate-pulse' :
            avatarState === 'thinking' ? 'bg-yellow-500 animate-pulse' :
              'bg-primary-500'
          }`} />
        <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">
          {avatarState === 'speaking' ? 'Speaking' :
            avatarState === 'listening' ? 'Listening' :
              avatarState === 'thinking' ? 'Thinking...' :
                'AI Medical Assistant'}
        </span>
      </div>

      {/* 3D Canvas container */}
      <div
        ref={containerRef}
        className="w-full bg-[#050b18]"
        style={{ minHeight: '420px', height: '420px' }}
      />

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

      {/* Sound wave overlay when speaking */}
      {isSpeaking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <SoundWave active={true} />
        </div>
      )}
    </div>
  );
}

// ─── Chat Message Bubble ───
function ChatBubble({ message, isBot, isHindi }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-primary-500/20 text-primary-400' : 'bg-accent-500/20 text-accent-400'
        }`}>
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${isBot
        ? 'bg-white/[0.06] text-gray-200 rounded-bl-md border border-white/5'
        : 'bg-primary-500/20 text-primary-200 rounded-br-md border border-primary-500/20'
        }`}>
        {message}
      </div>
    </motion.div>
  );
}

// ─── Patient Report Card ───
function PatientReport({ report, patientData, isHindi, onContinueChat }) {
  if (!report) return null;

  const severityColors = {
    Low: 'bg-green-500/20 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Report Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary-400" />
            <h3 className="font-bold text-white text-lg">
              {isHindi ? 'रोगी रिपोर्ट' : 'Patient Report'}
            </h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${severityColors[report.severity] || severityColors.Medium}`}>
            {report.severity}
          </span>
        </div>

        {/* Patient Details Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{isHindi ? 'नाम' : 'Name'}</p>
            <p className="text-white font-medium">{patientData.name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{isHindi ? 'उम्र' : 'Age'}</p>
            <p className="text-white font-medium">{patientData.age}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{isHindi ? 'लक्षण' : 'Symptoms'}</p>
            <p className="text-gray-300 text-sm">{patientData.symptoms}</p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 mb-4">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <Activity className="w-3 h-3" />
            {isHindi ? 'AI सारांश' : 'AI Assessment'}
          </p>
          <p className="text-sm text-white">{report.summary}</p>
        </div>

        {/* Possible Conditions */}
        {report.possibleConditions?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              {isHindi ? 'संभावित स्थितियाँ' : 'Possible Conditions'}
            </p>
            <div className="flex flex-wrap gap-2">
              {report.possibleConditions.map((c, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs bg-white/[0.06] text-gray-300 border border-white/10">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {isHindi ? 'सिफारिशें' : 'Recommendations'}
            </p>
            <ul className="space-y-1">
              {report.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-accent-300 flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0 text-accent-500" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Medications */}
        {report.medications?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <Pill className="w-3 h-3" />
              {isHindi ? 'दवा सुझाव' : 'Medication Suggestions'}
            </p>
            <ul className="space-y-1">
              {report.medications.map((m, i) => (
                <li key={i} className="text-sm text-primary-300 flex items-start gap-2">
                  <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0 text-primary-500" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {report.nextSteps?.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {isHindi ? 'अगला कदम' : 'Next Steps'}
            </p>
            <ul className="space-y-1">
              {report.nextSteps.map((s, i) => (
                <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                  <span className="text-primary-500 font-bold text-xs mt-0.5">{i + 1}.</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!report.aiPowered && (
          <p className="text-[10px] text-yellow-500/60 mt-3 text-center">
            {isHindi ? '⚠️ बेसिक विश्लेषण (AI विश्लेषण के लिए OpenAI कुंजी आवश्यक)' : '⚠️ Basic analysis (OpenAI key required for AI-powered analysis)'}
          </p>
        )}
      </div>

      {/* Continue to Chat */}
      <button
        onClick={onContinueChat}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        <MessageCircle className="w-4 h-4" />
        {isHindi ? 'AI से और बात करें' : 'Continue Chatting with AI'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Debug Console Overlay ───
function DebugOverlay({ logs }) {
  if (logs.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-60 overflow-y-auto bg-black/80 text-green-400 p-4 rounded-lg text-xs font-mono z-50 border border-green-500/30 shadow-lg">
      <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-1">
        <span className="font-bold">Debug Console</span>
        <span className="text-[10px] opacity-70">Latest 20 logs</span>
      </div>
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div key={i} className={`break-words ${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
            <span className="opacity-50">[{log.time}]</span> {log.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main AIAvatar Component ───
// ─── Main AIAvatar Component Content ───
function AIAvatarContent() {
  const [language, setLanguage] = useState('en-US');
  const [phase, setPhase] = useState('intake'); // intake, report, chat
  const [currentStep, setCurrentStep] = useState(-1); // -1 = not started
  const [patientData, setPatientData] = useState({ name: '', age: '', symptoms: '', history: '' });
  const [avatarState, setAvatarState] = useState('idle');
  const [speaking, setSpeaking] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [activeTab, setActiveTab] = useState('intake');
  const [report, setReport] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [logs, setLogs] = useState([]);
  const chatEndRef = useRef(null);

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-19), { time, msg, type }]);
    if (type === 'error') console.error(msg);
    else console.log(msg);
  }, []);

  useEffect(() => {
    const handleError = (event) => {
      addLog(`Global Error: ${event.message}`, 'error');
    };
    const handleRejection = (event) => {
      addLog(`Unhandled Promise Rejection: ${event.reason}`, 'error');
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [addLog]);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Log speech recognition status
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      addLog('Browser does not support Speech Recognition', 'error');
    }
  }, [browserSupportsSpeechRecognition, addLog]);

  // Pass addLog to AvatarViewer
  const AvatarViewerWithLog = useCallback((props) => (
    <AvatarViewer {...props} onLog={addLog} onError={(err) => addLog(err, 'error')} />
  ), [addLog]);

  const isHindi = language === 'hi-IN';
  // ... rest of component ...

  // ── Speak with lip-sync (single TTS engine) ──
  // ── Speak with lip-sync (single TTS engine) ──
  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = 0.9;

        // Log available voices to help debug
        const voices = window.speechSynthesis.getVoices();
        addLog(`Available voices: ${voices.length}`);

        if (language === 'hi-IN') {
          const hindiVoice = voices.find(
            (v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')
          );
          if (hindiVoice) {
            utterance.voice = hindiVoice;
            addLog(`Selected Hindi Voice: ${hindiVoice.name}`);
          } else {
            addLog('No specific Hindi voice found, using system default', 'warn');
          }
        }

        utterance.onstart = () => { setSpeaking(true); setAvatarState('speaking'); };
        utterance.onend = () => {
          setSpeaking(false);
          setAvatarState('idle');

          // Auto-listen during intake
          if (phase === 'intake' && !report) {
            resetTranscript();
            SpeechRecognition.startListening({ continuous: false, language: language });
          }

          resolve();
        };
        utterance.onerror = (e) => {
          addLog(`TTS Error: ${e.error}`, 'error');
          setSpeaking(false);
          setAvatarState('idle');
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      } else {
        addLog('Speech Synthesis not supported in this browser', 'error');
        resolve();
      }
    });
  }, [language, addLog, phase, report, resetTranscript]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis?.getVoices();
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Update avatar state based on listening
  useEffect(() => {
    if (listening) setAvatarState('listening');
  }, [listening]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── Start Session: greet and ask first question ──
  const startSession = useCallback(async () => {
    if (sessionStarted) return;
    setSessionStarted(true);
    setCurrentStep(0);
    setPhase('intake');

    const greeting = isHindi ? STEPS[0].promptHi : STEPS[0].prompt;
    await speak(greeting);
  }, [sessionStarted, isHindi, speak]);

  // ── Speak current step question on step change ──
  useEffect(() => {
    if (currentStep > 0 && currentStep < STEPS.length && phase === 'intake') {
      const step = STEPS[currentStep];
      const prompt = isHindi ? step.promptHi : step.prompt;
      setTimeout(() => speak(prompt), 400);
    }
  }, [currentStep]);

  // ── Voice controls ──
  const startListening = () => {
    resetTranscript();
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

  // ── Accept user input for intake or chat ──
  const acceptInput = (value) => {
    if (phase === 'intake' && currentStep >= 0 && currentStep < STEPS.length) {
      const step = STEPS[currentStep];
      const newData = { ...patientData, [step.key]: value };
      setPatientData(newData);
      resetTranscript();
      setManualInput('');

      if (currentStep < STEPS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // All questions answered — generate report
        generateReport(newData);
      }
    } else if (phase === 'chat') {
      // Free chat mode
      sendChatMessage(value);
      resetTranscript();
      setManualInput('');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      acceptInput(manualInput.trim());
    }
  };

  // ── Generate Patient Report ──
  const generateReport = async (data) => {
    setAvatarState('thinking');
    setPhase('report');

    try {
      // Also register the patient
      let analysis = { severity: 'Medium', recommendations: '' };
      try {
        const aiRes = await axios.post('/api/ai/analyze', {
          symptoms: data.symptoms,
          history: data.history,
          language,
        });
        if (aiRes.data.success) analysis = aiRes.data.analysis;
      } catch { /* fallback */ }

      try {
        await axios.post('/api/patients', {
          name: data.name,
          age: parseInt(data.age) || 0,
          symptoms: data.symptoms,
          history: data.history,
          severity: analysis.severity,
          languageUsed: language,
          aiAnalysis: analysis.recommendations || '',
        });
      } catch { /* patient save not critical for report */ }

      // Generate comprehensive report
      const reportRes = await axios.post('/api/ai/report', {
        name: data.name,
        age: data.age,
        symptoms: data.symptoms,
        history: data.history,
        language,
      });

      if (reportRes.data.success) {
        setReport(reportRes.data.report);
        const summaryMsg = isHindi
          ? `आपकी रिपोर्ट तैयार है। गंभीरता स्तर: ${reportRes.data.report.severity}। कृपया नीचे पूरी रिपोर्ट देखें।`
          : `Your report is ready. Severity level: ${reportRes.data.report.severity}. Please review the full report below.`;
        await speak(summaryMsg);
      }
    } catch (err) {
      console.error('Report generation error:', err);
      setReport({
        severity: 'Medium',
        summary: `Patient ${data.name}, age ${data.age}. Symptoms: ${data.symptoms}`,
        possibleConditions: [],
        recommendations: ['Please consult a healthcare professional'],
        medications: [],
        nextSteps: ['Visit a doctor for proper diagnosis'],
        aiPowered: false,
      });
    }

    setAvatarState('idle');
  };

  // ── Free Chat ──
  const sendChatMessage = async (userMessage) => {
    const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setChatLoading(true);
    setAvatarState('thinking');

    try {
      const res = await axios.post('/api/ai/chat', {
        messages: newMessages,
        language,
      });

      if (res.data.success) {
        const botReply = res.data.reply;
        setChatMessages([...newMessages, { role: 'assistant', content: botReply }]);
        await speak(botReply);
      }
    } catch (err) {
      const errorMsg = isHindi ? 'क्षमा करें, कुछ गलत हो गया।' : 'Sorry, something went wrong.';
      setChatMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
    }

    setChatLoading(false);
    setAvatarState('idle');
  };

  const continueToChat = () => {
    setPhase('chat');
    const welcomeMsg = isHindi
      ? 'अब आप मुझसे कोई भी स्वास्थ्य संबंधी प्रश्न पूछ सकते हैं। मैं आपकी मदद के लिए यहाँ हूँ!'
      : 'You can now ask me any health-related questions. I\'m here to help!';
    setChatMessages([{ role: 'assistant', content: welcomeMsg }]);
    speak(welcomeMsg);
  };

  // ── Reset ──
  const resetAll = () => {
    setCurrentStep(-1);
    setPhase('intake');
    setPatientData({ name: '', age: '', symptoms: '', history: '' });
    setAvatarState('idle');
    setReport(null);
    setChatMessages([]);
    setSessionStarted(false);
    resetTranscript();
    setManualInput('');
    window.speechSynthesis?.cancel();
    setSpeaking(false);
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
            {isHindi ? 'AI मेडिकल सहायक' : 'AI Medical Assistant'}
          </motion.h1>
          <p className="text-sm text-gray-500 mt-1">
            {phase === 'chat'
              ? (isHindi ? 'कोई भी स्वास्थ्य प्रश्न पूछें' : 'Ask any health question — powered by AI')
              : (isHindi ? 'आवाज़ या टाइप से जानकारी दें' : 'Voice or text-based medical consultation')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={() => {
              SpeechRecognition.stopListening();
              window.speechSynthesis?.cancel();
              setSpeaking(false);
              setLanguage((prev) => (prev === 'en-US' ? 'hi-IN' : 'en-US'));
            }}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Globe className="w-4 h-4" />
            {isHindi ? 'English' : 'हिंदी'}
          </button>

          {/* Reset */}
          {sessionStarted && (
            <button onClick={resetAll} className="btn-secondary flex items-center gap-2 text-sm">
              <RotateCcw className="w-4 h-4" />
              {isHindi ? 'रीसेट' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* 3D Avatar */}
      <div className="relative">
        <AvatarViewerWithLog isSpeaking={speaking} avatarState={avatarState} />

        {/* Start Session button (only before session starts) */}
        {!sessionStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-sm">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl shadow-2xl shadow-primary-500/30 transition-all flex items-center gap-3 text-lg"
            >
              <Stethoscope className="w-6 h-6" />
              {isHindi ? 'सत्र शुरू करें' : 'Start Consultation'}
            </motion.button>
          </div>
        )}
      </div>

      {/* Tab navigation (only during intake phase) */}
      {phase === 'intake' && sessionStarted && (
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
      )}

      {/* Tab: Document Upload */}
      {activeTab === 'upload' && phase === 'intake' && sessionStarted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 relative"
        >
          <DocumentUpload language={language} />
        </motion.div>
      )}

      {/* ─── Phase: Intake Questions ─── */}
      {phase === 'intake' && activeTab === 'intake' && sessionStarted && currentStep >= 0 && currentStep < STEPS.length && (
        <>
          {/* Step progress */}
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

          {/* Current question card */}
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
                    disabled={speaking}
                    className={`p-4 rounded-full transition-all duration-300 ${listening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : speaking
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-primary-500 hover:bg-primary-600'
                      }`}
                  >
                    {listening ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                  </button>
                  <div>
                    <span className="text-sm text-gray-400">
                      {speaking
                        ? (isHindi ? 'सुन रहा हूँ...' : 'Avatar is speaking...')
                        : listening
                          ? (isHindi ? 'बोलें... रोकने के लिए क्लिक करें' : 'Speak... Click to stop')
                          : (isHindi ? 'माइक्रोफ़ोन शुरू करें' : 'Start microphone')}
                    </span>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {isHindi ? 'भाषा: हिंदी (hi-IN)' : 'Language: English (en-US)'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-yellow-400">
                  {isHindi ? 'स्पीच रिकग्निशन उपलब्ध नहीं है। कृपया Chrome उपयोग करें।' : 'Speech recognition not available. Please use Chrome.'}
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
                disabled={speaking}
              />
              <button type="submit" className="btn-primary px-4" disabled={speaking || !manualInput.trim()}>
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
        </>
      )}

      {/* ─── Phase: Thinking / Generating Report ─── */}
      {phase === 'report' && avatarState === 'thinking' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 flex flex-col items-center justify-center gap-4"
        >
          <div className="relative">
            <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
            <div className="absolute inset-0 w-10 h-10 rounded-full bg-primary-400/20 animate-ping" />
          </div>
          <p className="text-sm text-gray-400 text-center">
            {isHindi ? 'AI आपकी रिपोर्ट तैयार कर रहा है...' : 'AI is generating your comprehensive report...'}
          </p>
        </motion.div>
      )}

      {/* ─── Phase: Report Display ─── */}
      {phase === 'report' && report && (
        <PatientReport
          report={report}
          patientData={patientData}
          isHindi={isHindi}
          onContinueChat={continueToChat}
        />
      )}

      {/* ─── Phase: Free Chat (ChatGPT-like) ─── */}
      {phase === 'chat' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Chat header */}
          <div className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-400" />
              <h3 className="font-semibold text-white">
                {isHindi ? 'AI चैट — कुछ भी पूछें' : 'AI Chat — Ask Anything'}
              </h3>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              {isHindi ? 'ऑनलाइन' : 'Online'}
            </span>
          </div>

          {/* Messages */}
          <div className="glass-card p-4 h-[400px] overflow-y-auto space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {chatMessages.map((msg, i) => (
              <ChatBubble
                key={i}
                message={msg.content}
                isBot={msg.role === 'assistant'}
                isHindi={isHindi}
              />
            ))}

            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.06] border border-white/5">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="glass-card p-4">
            {/* Voice button for chat */}
            <div className="flex items-center gap-3 mb-3">
              {browserSupportsSpeechRecognition && (
                <button
                  onClick={listening ? stopAndAccept : startListening}
                  disabled={speaking || chatLoading}
                  className={`p-3 rounded-full transition-all duration-300 ${listening
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-white/10 hover:bg-white/20'
                    }`}
                >
                  {listening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-gray-400" />}
                </button>
              )}
              {transcript && (
                <p className="text-sm text-primary-300 flex-1">{transcript}</p>
              )}
              {(listening || speaking) && <SoundWave active={true} />}
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={isHindi ? 'कोई भी स्वास्थ्य प्रश्न पूछें...' : 'Ask any health question...'}
                className="input-field flex-1"
                disabled={speaking || chatLoading}
              />
              <button
                type="submit"
                className="btn-primary px-4"
                disabled={speaking || chatLoading || !manualInput.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </motion.div>
      )}

      <DebugOverlay logs={logs} />
    </div>
  );
}

// ─── Error Boundary ───
class AIAvatarErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AIAvatar Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-black/90 text-red-400 font-mono h-full overflow-auto rounded-2xl border border-red-500/50">
          <h2 className="text-xl font-bold mb-4">Something went wrong in the Avatar component.</h2>
          <p className="mb-2 text-white/80">Please recreate this error and check the console logs.</p>
          <div className="bg-black p-4 rounded border border-red-900 overflow-x-auto text-xs">
            <p className="font-bold text-red-500">{this.state.error?.toString()}</p>
            <pre className="mt-2 opacity-70">{this.state.errorInfo?.componentStack}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main Export ───
export default function AIAvatar() {
  return (
    <AIAvatarErrorBoundary>
      <AIAvatarContent />
    </AIAvatarErrorBoundary>
  );
}

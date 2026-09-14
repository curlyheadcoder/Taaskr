import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, Sparkles, 
  CheckCircle2, Clock, FileText, UserCheck, Star, Award, ChevronRight, AlertCircle
} from 'lucide-react';

export default function ExpertCallBridgeModal({ isOpen, onClose, expert, categoryName, bookingInfo, onCallFinished }) {
  const [callStatus, setCallStatus] = useState('DIALING'); // 'DIALING' | 'RINGING' | 'CONNECTED' | 'ENDED' | 'REPORT_FINALIZED'
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [expertSpeechText, setExpertSpeechText] = useState('');
  const [selectedIssuePrompt, setSelectedIssuePrompt] = useState('');
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const timerRef = useRef(null);

  const activeExpert = expert || {
    name: 'Vikramaditya Sharma',
    title: 'Senior Automotive Diagnostics Lead',
    experienceYears: 14,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=250&q=80',
    rating: 4.9,
    phoneMasked: '+91 98765-43210'
  };

  // Play connection Web Audio synth beep
  const playCallChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  // Web Speech synthesis for Expert Voice
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Google US English'));
      if (maleVoice) utterance.voice = maleVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  useEffect(() => {
    if (!isOpen) {
      setCallStatus('DIALING');
      setCallDuration(0);
      setExpertSpeechText('');
      setDiagnosticReport(null);
      if (timerRef.current) clearInterval(timerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }

    // Step 1: Dialing (0-2s)
    setCallStatus('DIALING');
    playCallChime();

    // Step 2: Ringing (2-4s)
    const ringTimeout = setTimeout(() => {
      setCallStatus('RINGING');
      playCallChime();
    }, 2200);

    // Step 3: Connected (4s+)
    const connectTimeout = setTimeout(() => {
      setCallStatus('CONNECTED');
      playCallChime();
      const welcomeMsg = `Hello! This is ${activeExpert.name}, ${activeExpert.title} at Taaskr. I am reviewing your consultation request for ${categoryName || 'your service'}. Please share the issue details or select a diagnostic topic below.`;
      setExpertSpeechText(welcomeMsg);
      speakText(welcomeMsg);

      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }, 4500);

    return () => {
      clearTimeout(ringTimeout);
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [isOpen]);

  const handleSelectPrompt = (promptText, issueCategory) => {
    setSelectedIssuePrompt(promptText);
    let reply = '';
    let reportObj = null;

    if (categoryName?.toLowerCase().includes('vehicle') || issueCategory === 'car') {
      reply = `Thank you for specifying. Based on "${promptText}", I suspect a potential sensor or ignition fault. I recommend a doorstep computerized ECU scan and terminal check. Est. ₹499.`;
      reportObj = {
        diagnosedIssue: promptText,
        recommendedAction: 'Doorstep Computerized ECU Diagnostics & Sensor Calibration',
        estimatedCost: '₹499',
        assignedProviderCategory: 'Vehicle & Auto Care Senior Technician'
      };
    } else if (categoryName?.toLowerCase().includes('appliance') || issueCategory === 'appliance') {
      reply = `Understood. For "${promptText}", we should check the power capacitor and PCB board. Upfront estimate is ₹399.`;
      reportObj = {
        diagnosedIssue: promptText,
        recommendedAction: 'Inverter PCB Diagnostic & Voltage Test',
        estimatedCost: '₹399',
        assignedProviderCategory: 'Electrical Systems Senior Specialist'
      };
    } else {
      reply = `Noted your issue: "${promptText}". I am issuing a formal diagnostic sheet for ₹299.`;
      reportObj = {
        diagnosedIssue: promptText,
        recommendedAction: 'Detailed On-Site Inspection & Diagnostic Remediation',
        estimatedCost: '₹299',
        assignedProviderCategory: 'Taaskr Certified Domain Provider'
      };
    }

    setExpertSpeechText(reply);
    speakText(reply);
    setDiagnosticReport(reportObj);
  };

  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setCallStatus('ENDED');

    if (!diagnosticReport) {
      setDiagnosticReport({
        diagnosedIssue: 'General On-Call Technical Consultation',
        recommendedAction: 'Full Diagnostic Audit & Upfront Written Quote',
        estimatedCost: 'Flat ₹99 Consultation',
        assignedProviderCategory: 'Assigned Category Specialist'
      });
    }
  };

  const handleFinalizeReport = () => {
    setCallStatus('REPORT_FINALIZED');
    if (onCallFinished) {
      onCallFinished({
        expert: activeExpert,
        durationSeconds: callDuration,
        report: diagnosticReport
      });
    }
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(245, 158, 11, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.25s ease'
        }}
      >
        {/* Header Bar */}
        <div 
          style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: callStatus === 'CONNECTED' ? '#10b981' : '#f59e0b', boxShadow: '0 0 8px currentColor' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
              TAASKR LIVE EXPERT CALL BRIDGE
            </span>
          </div>
          {callStatus === 'CONNECTED' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
              <Clock size={14} />
              <span>{formatTimer(callDuration)}</span>
            </div>
          )}
        </div>

        {/* Call Main Body */}
        <div style={{ padding: '1.75rem 1.5rem', textAlign: 'center', backgroundColor: '#0f172a' }}>
          {/* Avatar & Pulse Waveform */}
          <div style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto 1.25rem auto' }}>
            {callStatus === 'CONNECTED' && (
              <div 
                style={{
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: '50%',
                  border: '2px solid rgba(245, 158, 11, 0.5)',
                  animation: 'pulse 1.8s infinite'
                }}
              />
            )}
            <img 
              src={activeExpert.avatar} 
              alt={activeExpert.name} 
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #f59e0b',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)'
              }} 
            />
            <div 
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                backgroundColor: '#10b981',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '3px solid #0f172a'
              }} 
            />
          </div>

          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
            {activeExpert.name}
          </h3>
          <p style={{ margin: '0.2rem 0 0.75rem 0', fontSize: '0.85rem', color: '#fbbf24', fontWeight: 700 }}>
            {activeExpert.title} ({activeExpert.experienceYears}+ Yrs Exp)
          </p>

          {/* Status Label */}
          <div style={{ marginBottom: '1.25rem' }}>
            {callStatus === 'DIALING' && (
              <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={16} className="animate-spin" /> Dialing Expert Line ({activeExpert.phoneMasked})...
              </span>
            )}
            {callStatus === 'RINGING' && (
              <span style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Volume2 size={16} /> Expert Line Ringing...
              </span>
            )}
            {callStatus === 'CONNECTED' && (
              <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                <CheckCircle2 size={15} /> Encrypted Audio Bridge Active
              </span>
            )}
            {callStatus === 'ENDED' && (
              <span style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 700 }}>
                Consultation Finished • Duration: {formatTimer(callDuration)}
              </span>
            )}
            {callStatus === 'REPORT_FINALIZED' && (
              <span style={{ fontSize: '0.88rem', color: '#34d399', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} /> Diagnostic Report Saved & Provider Mapped!
              </span>
            )}
          </div>

          {/* Live Expert Speech Box */}
          {callStatus === 'CONNECTED' && (
            <div 
              style={{
                padding: '1rem',
                borderRadius: '16px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                textAlign: 'left',
                marginBottom: '1.25rem',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                <Volume2 size={15} />
                <span>EXPERT SPEECH (AUDIO STREAMING)</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#f8fafc', lineHeight: 1.5, fontWeight: 500 }}>
                "{expertSpeechText}"
              </p>
            </div>
          )}

          {/* Quick Issue Prompts for Customer */}
          {callStatus === 'CONNECTED' && (
            <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Select / Speak Your Issue Topic:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleSelectPrompt('Engine Check Light & Unusual Vibration', 'car')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    backgroundColor: selectedIssuePrompt.includes('Engine') ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🚗 Engine Check Light / Vibration
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPrompt('Car AC Cooling Insufficient & Warm Air', 'car')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    backgroundColor: selectedIssuePrompt.includes('AC') ? 'rgba(56, 189, 248, 0.2)' : '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ❄️ AC Cooling & Gas Leakage
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPrompt('Battery Click Sound & No Start', 'car')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    backgroundColor: selectedIssuePrompt.includes('Battery') ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  🔋 Dead Battery / Jumpstart
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPrompt('Power Surge / Tripping MCB Electrical Fault', 'appliance')}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #334155',
                    backgroundColor: selectedIssuePrompt.includes('Surge') ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Electrical & Appliance Issue
                </button>
              </div>
            </div>
          )}

          {/* Diagnostic Report Result (Call Ended) */}
          {(callStatus === 'ENDED' || callStatus === 'REPORT_FINALIZED') && diagnosticReport && (
            <div 
              style={{
                padding: '1rem',
                borderRadius: '16px',
                backgroundColor: '#1e293b',
                border: '1px solid #f59e0b',
                textAlign: 'left',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <FileText size={16} />
                <span>EXPERT DIAGNOSTIC SHEET</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div><strong>Issue:</strong> {diagnosticReport.diagnosedIssue}</div>
                <div><strong>Recommended Job:</strong> {diagnosticReport.recommendedAction}</div>
                <div><strong>Upfront Quotation:</strong> <span style={{ color: '#34d399', fontWeight: 800 }}>{diagnosticReport.estimatedCost}</span></div>
                <div><strong>Task Category:</strong> {diagnosticReport.assignedProviderCategory}</div>
              </div>
            </div>
          )}

          {/* Action Buttons Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            {callStatus === 'CONNECTED' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: isMuted ? '#ef4444' : '#334155',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <button
                  type="button"
                  onClick={handleEndCall}
                  style={{
                    padding: '0.75rem 1.75rem',
                    borderRadius: '30px',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  <PhoneOff size={18} />
                  <span>End Consultation Call</span>
                </button>
              </>
            )}

            {callStatus === 'ENDED' && (
              <button
                type="button"
                onClick={handleFinalizeReport}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
                }}
              >
                <span>Save Diagnostic Report & Map Field Provider</span>
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

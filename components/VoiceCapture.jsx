'use client';

import { useEffect, useRef, useState } from 'react';
import OBELIX_FOODS from '../lib/foodDb';

const DEMO_SENTENCE = 'un sandwich au poulet avec de la mayo et de la salade';
const DEMO_FOODS = ['Pain', 'Poulet', 'Mayonnaise', 'Salade'];

function Waveform({ animated }) {
  const bars = [16, 32, 42, 24, 36, 14];
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 42 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: h,
            borderRadius: 2,
            background: '#fff',
            transformOrigin: 'center',
            animation: animated ? `obwave 0.9s ease-in-out ${i * 0.12}s infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// Real speech-to-text via the Web Speech API (fr-FR). The transcript is parsed
// against the Obélix food base to pull out ingredients. When the browser has no
// SpeechRecognition (e.g. Firefox, some iOS versions) we fall back to the
// scripted demo so the screen still works end-to-end.
export default function VoiceCapture({ onResult }) {
  const recRef = useRef(null);
  const finalRef = useRef('');
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [foods, setFoods] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const SR =
      typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      // Unsupported: seed the parent with the demo so the CTA still works.
      setSupported(false);
      onResult({ transcript: DEMO_SENTENCE, foodNames: DEMO_FOODS, demo: true });
      return;
    }
    onResult(null); // fresh screen
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let interim = '';
      let finalTxt = finalRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTxt += t + ' ';
        else interim += t;
      }
      finalRef.current = finalTxt;
      setTranscript((finalTxt + interim).trim());
    };
    rec.onerror = () => {};
    rec.onend = () => {
      setListening(false);
      finalize();
    };
    recRef.current = rec;
    return () => {
      try {
        rec.onend = null;
        rec.abort();
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finalize() {
    const text = (finalRef.current || transcript || '').trim();
    if (!text) return;
    const detected = OBELIX_FOODS.extract(text);
    const names = detected.map((f) => f.name);
    setFoods(detected);
    setDone(true);
    onResult({ transcript: text, foodNames: names });
  }

  function toggle() {
    if (!supported) return;
    const rec = recRef.current;
    if (!rec) return;
    if (listening) {
      try {
        rec.stop();
      } catch (e) {}
      return;
    }
    // reset for a new dictation
    finalRef.current = '';
    setTranscript('');
    setFoods([]);
    setDone(false);
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      // start() throws if already running — ignore
    }
  }

  const showDemo = !supported;
  const bubbleText = showDemo
    ? `« ${DEMO_SENTENCE} »`
    : listening
    ? transcript
      ? transcript
      : 'À l\'écoute…'
    : done
    ? transcript
      ? `« ${transcript} »`
      : ''
    : 'Touche le micro et décris ton repas — l\'IA identifie les ingrédients';
  const chips = showDemo ? DEMO_FOODS.map((n) => ({ name: n })) : foods.map((f) => ({ name: f.name }));

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '0 20px',
      }}
    >
      <div
        style={{
          font: 'var(--fw-regular) 12.5px/1.4 var(--font-body)',
          color: 'var(--taupe-600)',
          textAlign: 'center',
        }}
      >
        {showDemo
          ? 'Reconnaissance vocale indisponible sur ce navigateur — voici un exemple. Tu peux corriger à l\'étape suivante.'
          : 'Parle, ou choisis une autre méthode — l\'IA identifie les ingrédients'}
      </div>

      <div
        onClick={toggle}
        style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 40%,var(--coral-200),var(--coral-400))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: listening
            ? '0 0 0 10px rgba(216,104,22,.16),0 0 0 22px rgba(216,104,22,.08)'
            : '0 0 0 10px rgba(216,104,22,.10),0 0 0 22px rgba(216,104,22,.05)',
          cursor: showDemo ? 'default' : 'pointer',
          position: 'relative',
        }}
      >
        {listening ? (
          <Waveform animated />
        ) : done || showDemo ? (
          <Waveform animated={false} />
        ) : (
          <i className="ph-fill ph-microphone" style={{ fontSize: 46, color: '#fff' }}></i>
        )}
      </div>

      {!showDemo && (
        <div
          style={{
            font: 'var(--fw-bold) 11.5px var(--font-body)',
            color: listening ? 'var(--coral-600)' : 'var(--taupe-600)',
          }}
        >
          {listening ? 'Touche pour arrêter' : done ? 'Touche pour recommencer' : 'Touche pour parler'}
        </div>
      )}

      {bubbleText && (
        <div
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
            font: 'var(--fw-regular) 13px/1.4 var(--font-body)',
            color: 'var(--cocoa-800)',
            textAlign: 'center',
            maxWidth: '100%',
          }}
        >
          {bubbleText}
        </div>
      )}

      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
          {chips.map((c, i) => (
            <span
              key={i}
              style={{
                background: 'var(--coral-50)',
                borderRadius: 'var(--radius-pill)',
                padding: '7px 13px',
                font: 'var(--fw-bold) 12px var(--font-body)',
                color: 'var(--coral-600)',
              }}
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      {!showDemo && done && chips.length === 0 && (
        <div
          style={{
            font: 'var(--fw-regular) 11px/1.4 var(--font-body)',
            color: 'var(--taupe-600)',
            textAlign: 'center',
          }}
        >
          Aucun aliment reconnu automatiquement — tu pourras les ajouter à l&apos;étape suivante.
        </div>
      )}
    </div>
  );
}

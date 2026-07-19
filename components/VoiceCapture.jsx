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

function clean(s) {
  return (s || '').replace(/\s+/g, ' ').trim();
}

// Reconnaissance vocale réelle (Web Speech API, fr-FR). Le texte reconnu est
// analysé contre la base d'aliments Obélix pour en extraire les ingrédients.
//
// Comportement voulu :
//  - on peut RE-parler pour AJOUTER à ce qui est déjà là (pas d'écrasement) ;
//  - le texte est ÉDITABLE à la main avant validation (ajout/correction) ;
//  - pas de phrase dupliquée : on reconstruit le texte à partir de l'ensemble
//    des résultats à chaque événement plutôt que de concaténer aveuglément.
export default function VoiceCapture({ onResult }) {
  const recRef = useRef(null);
  const committedRef = useRef(''); // texte des sessions terminées + éditions manuelles
  const sessionRef = useRef(''); // texte final de la session d'écoute en cours
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [foods, setFoods] = useState([]);

  // Remonte le texte + les aliments détectés au parent.
  function emit(text) {
    const t = clean(text);
    if (!t) {
      setFoods([]);
      onResult(null);
      return;
    }
    const detected = OBELIX_FOODS.extract(t);
    setFoods(detected);
    onResult({ transcript: t, foodNames: detected.map((f) => f.name) });
  }

  useEffect(() => {
    const SR =
      typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      // Navigateur sans reconnaissance vocale : on amorce avec la démo pour que
      // l'écran reste utilisable de bout en bout.
      setSupported(false);
      onResult({ transcript: DEMO_SENTENCE, foodNames: DEMO_FOODS, demo: true });
      return;
    }
    onResult(null);
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.interimResults = true;
    rec.continuous = true;

    rec.onresult = (e) => {
      // Reconstruit tout depuis le début de la session → aucune duplication.
      let fin = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t + ' ';
        else interim += t;
      }
      sessionRef.current = clean(fin);
      const base = committedRef.current;
      setTranscript(clean(base + ' ' + fin + ' ' + interim));
    };
    rec.onerror = () => {};
    rec.onend = () => {
      // Fige la session dans le texte cumulé — un nouveau « parler » s'y ajoute.
      const merged = clean(committedRef.current + ' ' + sessionRef.current);
      committedRef.current = merged;
      sessionRef.current = '';
      setListening(false);
      setTranscript(merged);
      emit(merged);
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

  function start() {
    const rec = recRef.current;
    if (!rec) return;
    sessionRef.current = '';
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      // start() lève si déjà en cours — on ignore
    }
  }
  function stop() {
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch (e) {}
  }
  function toggle() {
    if (!supported) return;
    if (listening) stop();
    else start();
  }

  // Édition manuelle du texte (ajout / correction avant validation).
  function onEdit(e) {
    const v = e.target.value;
    committedRef.current = v;
    setTranscript(v);
    emit(v);
  }
  function clearAll() {
    committedRef.current = '';
    sessionRef.current = '';
    setTranscript('');
    setFoods([]);
    onResult(null);
  }

  const chips = supported ? foods.map((f) => ({ name: f.name })) : DEMO_FOODS.map((n) => ({ name: n }));
  const hasText = clean(transcript).length > 0;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
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
        {supported
          ? 'Parle pour décrire ton repas — tu peux re-parler pour compléter, ou corriger le texte à la main.'
          : "Reconnaissance vocale indisponible sur ce navigateur — voici un exemple. Tu peux corriger à l'étape suivante."}
      </div>

      <div
        onClick={toggle}
        style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 40%,var(--coral-200),var(--coral-400))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: listening
            ? '0 0 0 10px rgba(216,104,22,.16),0 0 0 22px rgba(216,104,22,.08)'
            : '0 0 0 10px rgba(216,104,22,.10),0 0 0 22px rgba(216,104,22,.05)',
          cursor: supported ? 'pointer' : 'default',
          position: 'relative',
        }}
      >
        {listening ? (
          <Waveform animated />
        ) : hasText || !supported ? (
          <i className="ph-fill ph-microphone" style={{ fontSize: 40, color: '#fff' }}></i>
        ) : (
          <i className="ph-fill ph-microphone" style={{ fontSize: 40, color: '#fff' }}></i>
        )}
      </div>

      {supported && (
        <div
          style={{
            font: 'var(--fw-bold) 11.5px var(--font-body)',
            color: listening ? 'var(--coral-600)' : 'var(--taupe-600)',
          }}
        >
          {listening ? 'À l\'écoute — touche pour mettre en pause' : hasText ? 'Touche pour ajouter à ta description' : 'Touche pour parler'}
        </div>
      )}

      {supported ? (
        <textarea
          value={transcript}
          onChange={onEdit}
          readOnly={listening}
          placeholder="Ton repas apparaîtra ici — tu peux aussi écrire directement…"
          rows={3}
          style={{
            width: '100%',
            maxWidth: 340,
            background: '#fff',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            boxShadow: 'var(--shadow-sm)',
            font: 'var(--fw-regular) 13px/1.45 var(--font-body)',
            color: 'var(--cocoa-800)',
            resize: 'none',
            outline: 'none',
            opacity: listening ? 0.85 : 1,
          }}
        />
      ) : (
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
          {`« ${DEMO_SENTENCE} »`}
        </div>
      )}

      {supported && hasText && (
        <div
          onClick={clearAll}
          style={{
            font: 'var(--fw-semibold) 11.5px var(--font-body)',
            color: 'var(--taupe-600)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <i className="ph ph-eraser" style={{ fontSize: 14 }}></i>
          Effacer
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

      {supported && hasText && chips.length === 0 && (
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

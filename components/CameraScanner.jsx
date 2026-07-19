'use client';

import { useEffect, useRef, useState } from 'react';

// Real barcode scanner: opens the rear camera via getUserMedia and decodes
// EAN/UPC codes with ZXing. Falls back to a clear message when the camera
// isn't available (no permission, no device, or an insecure http:// context).
// The video stream stays on the device — nothing is uploaded.
export default function CameraScanner({ onDetected }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const doneRef = useRef(false);
  // idle | starting | scanning | denied | nodevice | insecure | error
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop() {
    try {
      if (controlsRef.current) controlsRef.current.stop();
    } catch (e) {}
    controlsRef.current = null;
  }

  async function start() {
    doneRef.current = false;
    // getUserMedia needs a secure context (https or localhost).
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus(window.isSecureContext === false ? 'insecure' : 'error');
      return;
    }
    setStatus('starting');
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      controlsRef.current = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current,
        (result) => {
          if (result && !doneRef.current) {
            doneRef.current = true;
            const code = result.getText();
            stop();
            onDetected(code);
          }
        }
      );
      setStatus('scanning');
    } catch (e) {
      const name = e && e.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') setStatus('denied');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setStatus('nodevice');
      else setStatus('error');
    }
  }

  const live = status === 'scanning' || status === 'starting';

  const message = {
    denied: 'Accès caméra refusé — autorise-la dans les réglages du navigateur, ou saisis le code à la main.',
    nodevice: "Aucune caméra détectée sur cet appareil — saisis le code à la main.",
    insecure: 'La caméra nécessite une connexion sécurisée (HTTPS) — saisis le code à la main.',
    error: 'Caméra indisponible — saisis le code à la main.',
  }[status];

  return (
    <div
      style={{
        marginTop: 14,
        height: 178,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--cocoa-800)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        padding: '0 18px',
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: live ? 'block' : 'none',
        }}
      />

      {live && (
        <>
          {/* framing viewfinder + moving scan line */}
          <div
            style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              top: '28%',
              bottom: '28%',
              border: '2px solid rgba(255,255,255,.85)',
              borderRadius: 12,
              boxShadow: '0 0 0 2000px rgba(20,15,12,.32)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '12%',
              right: '12%',
              height: 2,
              background: 'var(--coral-500)',
              boxShadow: '0 0 8px var(--coral-500)',
              animation: 'obscan 1.8s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              font: '600 10.5px var(--font-body)',
              color: 'rgba(255,255,255,.85)',
            }}
          >
            {status === 'starting' ? 'Démarrage de la caméra…' : 'Vise le code-barres'}
          </div>
        </>
      )}

      {!live && !message && (
        <>
          <i className="ph ph-barcode" style={{ fontSize: 38, color: 'rgba(255,255,255,.85)' }}></i>
          <div
            onClick={start}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'var(--coral-500)',
              color: '#fff',
              borderRadius: 'var(--radius-pill)',
              padding: '9px 16px',
              font: 'var(--fw-bold) 12px var(--font-body)',
              cursor: 'pointer',
            }}
          >
            <i className="ph-fill ph-camera" style={{ fontSize: 15 }}></i>Scanner avec la caméra
          </div>
        </>
      )}

      {!live && message && (
        <>
          <i className="ph ph-camera-slash" style={{ fontSize: 30, color: 'rgba(255,255,255,.7)' }}></i>
          <div style={{ font: '500 11px/1.45 var(--font-body)', color: 'rgba(255,255,255,.82)' }}>{message}</div>
          <div
            onClick={start}
            style={{
              font: 'var(--fw-bold) 11px var(--font-body)',
              color: 'var(--coral-300)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Réessayer
          </div>
        </>
      )}
    </div>
  );
}

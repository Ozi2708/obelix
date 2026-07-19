'use client';

import { useRef, useState } from 'react';

// Drag-and-drop / tap-to-pick photo zone, used for meal & label photos.
// Adapted from image-slot.js of the design handoff (kept purely client-side —
// the picked image never leaves the browser).
export default function ImageSlot({
  placeholder = 'Dépose une photo ou capture · ou touche pour choisir',
  compact = false,
}) {
  const inputRef = useRef(null);
  const [src, setSrc] = useState(null);
  const [over, setOver] = useState(false);

  const handleFiles = (files) => {
    const file = files && files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
  };

  return (
    <div
      onClick={() => inputRef.current && inputRef.current.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: compact ? 'var(--radius-sm)' : 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        background: src ? '#000' : over ? 'var(--coral-50)' : 'var(--cream-100)',
        border: src ? 'none' : `1.5px dashed ${over ? 'var(--coral-400)' : 'var(--border-strong)'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textAlign: 'center',
        padding: compact ? 0 : '0 16px',
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <>
          {!compact && (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(216,104,22,.1)',
                color: 'var(--coral-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className="ph ph-image-square" style={{ fontSize: 22 }} />
            </div>
          )}
          <div
            style={{
              font: `600 ${compact ? '9px' : '11.5px'} var(--font-body)`,
              color: 'var(--taupe-600)',
              lineHeight: 1.4,
            }}
          >
            {placeholder}
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

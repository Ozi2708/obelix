'use client';

import { useEffect, useRef, useState } from 'react';
import OBELIX_FOODS from '../lib/foodDb';

// OCR photo réelle : l'utilisateur dépose une photo (liste d'ingrédients,
// étiquette, capture d'écran), Tesseract.js lit le texte sur l'appareil, puis
// on croise le texte avec la base pour en extraire les aliments + composés.
// Rien n'est envoyé en ligne (le moteur OCR tourne dans le navigateur).
export default function PhotoCapture({ onConfirm, onClose, onBack }) {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [file, setFile] = useState(null);
  const [imgUrl, setImgUrl] = useState(null);
  const [over, setOver] = useState(false);
  const [stage, setStage] = useState('pick'); // pick | scan | done
  const [progress, setProgress] = useState(0);
  const [foods, setFoods] = useState([]);
  const [ocrText, setOcrText] = useState('');
  const [showText, setShowText] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => () => { if (imgUrl) URL.revokeObjectURL(imgUrl); }, [imgUrl]);

  function pick(files) {
    const f = files && files[0];
    if (!f || !f.type.startsWith('image/')) return;
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setFile(f);
    setImgUrl(URL.createObjectURL(f));
    setError(null);
  }

  async function runOcr() {
    if (!file) { setError('Ajoute d\'abord une photo à analyser.'); return; }
    setStage('scan'); setProgress(0); setError(null); setShowText(false);
    try {
      const Tesseract = (await import('tesseract.js')).default;
      const { data } = await Tesseract.recognize(file, 'fra', {
        logger: (m) => { if (m.status === 'recognizing text') setProgress(Math.round((m.progress || 0) * 100)); },
      });
      const text = (data && data.text) || '';
      const detected = OBELIX_FOODS.extract(text);
      setOcrText(text.trim());
      setFoods(detected);
      setStage('done');
    } catch (e) {
      setError("Lecture impossible (hors ligne, ou texte illisible). Tu peux saisir les ingrédients à la main à l'étape suivante.");
      setStage('pick');
    }
  }

  const detected = foods.map((f) => ({
    name: f.name,
    tags: (f.compounds || []).map((c) => c.id),
  }));

  const tagStyle = 'background:var(--cream-200);color:var(--cocoa-700);border-radius:var(--radius-xs);padding:3px 9px;font:600 10.5px var(--font-body)';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', flexShrink: 0, borderBottom: '1px solid var(--border-soft)' }}>
        <div onClick={onBack} style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cocoa-700)' }}><i className="ph ph-caret-left" style={{ fontSize: 22 }}></i></div>
        <div style={{ font: 'var(--fw-bold) 14px var(--font-body)', color: 'var(--ink)', whiteSpace: 'nowrap' }}>Photo &amp; capture d&apos;écran</div>
        <div onClick={onClose} style={{ width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--taupe-600)' }}><i className="ph ph-x" style={{ fontSize: 19 }}></i></div>
      </div>

      {stage === 'pick' && (
        <>
          <div className="ob-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 0' }}>
            <div style={{ font: 'var(--fw-bold) 18px/1.2 var(--font-display)', color: 'var(--ink)' }}>Prends ton plat ou une recette en photo</div>
            <div style={{ font: 'var(--fw-regular) 12px/1.5 var(--font-body)', color: 'var(--taupe-600)', marginTop: 6 }}>
              Photographie ton plat, une liste d&apos;ingrédients (livre, étiquette) ou dépose une <strong>capture d&apos;écran</strong>. L&apos;OCR lit le texte sur ton téléphone et en <strong>extrait les ingrédients</strong> + leurs composés.
            </div>
            <div
              onClick={() => cameraRef.current && cameraRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setOver(true); }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files); }}
              style={{
                marginTop: 14, height: 196, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8, textAlign: 'center', padding: '0 16px',
                background: imgUrl ? '#000' : over ? 'var(--coral-50)' : 'var(--cream-100)',
                border: imgUrl ? 'none' : `1.5px dashed ${over ? 'var(--coral-400)' : 'var(--border-strong)'}`,
              }}
            >
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt="Aperçu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(216,104,22,.1)', color: 'var(--coral-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="ph ph-camera" style={{ fontSize: 22 }}></i>
                  </div>
                  <div style={{ font: '600 11.5px var(--font-body)', color: 'var(--taupe-600)', lineHeight: 1.4 }}>Touche pour ouvrir l&apos;appareil photo</div>
                </>
              )}
              {/* Ouvre directement l'appareil photo sur mobile (capture) */}
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => pick(e.target.files)} />
              {/* Sélection depuis la galerie / les fichiers */}
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pick(e.target.files)} />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <div
                onClick={() => cameraRef.current && cameraRef.current.click()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: 'var(--coral-500)', color: '#fff', borderRadius: 'var(--radius-md)', padding: '12px 0', font: 'var(--fw-bold) 12.5px var(--font-body)', cursor: 'pointer', boxShadow: 'var(--shadow-brand)' }}
              >
                <i className="ph ph-camera" style={{ fontSize: 16 }}></i>Prendre une photo
              </div>
              <div
                onClick={() => inputRef.current && inputRef.current.click()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff', color: 'var(--cocoa-700)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', padding: '12px 0', font: 'var(--fw-bold) 12.5px var(--font-body)', cursor: 'pointer' }}
              >
                <i className="ph ph-image-square" style={{ fontSize: 16 }}></i>Galerie / fichier
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
              {[['ph-book-open', 'Livre de cuisine'], ['ph-device-mobile', 'Capture d\'écran'], ['ph-tag', 'Étiquette produit']].map((t, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--cream-100)', borderRadius: 'var(--radius-pill)', padding: '6px 11px', font: '600 11px var(--font-body)', color: 'var(--cocoa-700)' }}>
                  <i className={'ph ' + t[0]} style={{ fontSize: 13, color: 'var(--coral-500)' }}></i>{t[1]}
                </span>
              ))}
            </div>
            {error ? (
              <div style={{ marginTop: 12, display: 'flex', gap: 9, background: 'var(--tol-watch-50)', borderRadius: 'var(--radius-sm)', padding: '11px 13px', font: 'var(--fw-regular) 11px/1.45 var(--font-body)', color: 'var(--tol-watch-700)' }}>
                <i className="ph-fill ph-warning" style={{ fontSize: 15, color: 'var(--tol-watch-500)', flexShrink: 0, marginTop: 1 }}></i>
                <div>{error}</div>
              </div>
            ) : (
              <div style={{ marginTop: 12, display: 'flex', gap: 9, background: 'var(--cream-100)', borderRadius: 'var(--radius-sm)', padding: '11px 13px', font: 'var(--fw-regular) 11px/1.45 var(--font-body)', color: 'var(--taupe-600)' }}>
                <i className="ph-fill ph-lock-key" style={{ fontSize: 15, color: 'var(--tol-good-500)', flexShrink: 0, marginTop: 1 }}></i>
                <div>L&apos;image est analysée sur ton téléphone — rien n&apos;est envoyé ni stocké en ligne.</div>
              </div>
            )}
          </div>
          <div style={{ padding: '12px 18px 20px', flexShrink: 0 }}>
            <div onClick={runOcr} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: file ? 'var(--coral-500)' : 'var(--sand-400)', color: '#fff', textAlign: 'center', borderRadius: 'var(--radius-md)', padding: '15px 0', font: 'var(--fw-bold) 14px var(--font-display)', cursor: 'pointer', boxShadow: file ? 'var(--shadow-brand)' : 'none' }}>
              <i className="ph ph-scan" style={{ fontSize: 17 }}></i>Identifier les aliments
            </div>
          </div>
        </>
      )}

      {stage === 'scan' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '0 30px', textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--coral-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral-500)' }}>
            <i className="ph ph-scan" style={{ fontSize: 44 }}></i>
          </div>
          <div>
            <div style={{ font: 'var(--fw-bold) 17px var(--font-display)', color: 'var(--ink)' }}>Lecture de la liste…</div>
            <div style={{ font: 'var(--fw-regular) 12px/1.5 var(--font-body)', color: 'var(--taupe-600)', marginTop: 6 }}>Reconnaissance du texte (OCR), puis correspondance aliment → composés.</div>
          </div>
          <div style={{ width: 180, height: 6, borderRadius: 3, background: 'var(--cream-200)', overflow: 'hidden' }}>
            <div style={{ width: Math.max(6, progress) + '%', height: '100%', background: 'var(--coral-500)', borderRadius: 3, transition: 'width .2s' }}></div>
          </div>
          <div style={{ font: '500 11px var(--font-mono)', color: 'var(--coral-600)' }}>{progress}%</div>
        </div>
      )}

      {stage === 'done' && (
        <>
          <div className="ob-scroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 'var(--radius-lg)', padding: '12px 14px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: 'var(--coral-50)' }}>
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: 'var(--fw-bold) 15px var(--font-display)', color: 'var(--ink)' }}>Repas photographié</div>
                <div style={{ font: 'var(--fw-regular) 11px var(--font-body)', color: 'var(--taupe-600)', marginTop: 2 }}>{detected.length} aliment{detected.length > 1 ? 's' : ''} détecté{detected.length > 1 ? 's' : ''}</div>
              </div>
              <div style={{ background: detected.length ? 'var(--tol-good-50)' : 'var(--tol-watch-50)', color: detected.length ? 'var(--tol-good-700)' : 'var(--tol-watch-700)', borderRadius: 'var(--radius-pill)', padding: '4px 9px', font: '700 10px var(--font-body)', flexShrink: 0 }}>{detected.length ? 'lecture OK' : 'à compléter'}</div>
            </div>

            {detected.length > 0 ? (
              <>
                <div style={{ font: 'var(--fw-bold) 12px var(--font-body)', color: 'var(--cocoa-700)', margin: '16px 2px 8px' }}>Aliments identifiés</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {detected.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 'var(--radius-sm)', padding: '11px 13px', boxShadow: 'var(--shadow-xs)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ font: 'var(--fw-bold) 13px var(--font-body)', color: 'var(--ink)' }}>{d.name}</div>
                        {d.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
                            {d.tags.map((t, j) => (<span key={j} style={css(tagStyle)}>{t}</span>))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ marginTop: 14, display: 'flex', gap: 9, background: 'var(--tol-watch-50)', borderRadius: 'var(--radius-sm)', padding: '12px 13px', font: 'var(--fw-regular) 11px/1.45 var(--font-body)', color: 'var(--tol-watch-700)' }}>
                <i className="ph-fill ph-info" style={{ fontSize: 15, color: 'var(--tol-watch-500)', flexShrink: 0, marginTop: 1 }}></i>
                <div>Aucun aliment de la base reconnu dans le texte lu. Continue quand même — tu ajouteras les ingrédients à la main à l&apos;étape suivante.</div>
              </div>
            )}

            {ocrText && (
              <>
                <div
                  onClick={() => setShowText((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px 2px 8px', cursor: 'pointer', color: 'var(--taupe-600)' }}
                >
                  <i className={showText ? 'ph ph-caret-down' : 'ph ph-caret-right'} style={{ fontSize: 14 }}></i>
                  <span style={{ font: 'var(--fw-bold) 12px var(--font-body)' }}>Voir le texte lu par l&apos;OCR</span>
                </div>
                {showText && (
                  <div style={{ background: '#fff', borderRadius: 'var(--radius-sm)', padding: '11px 13px', boxShadow: 'var(--shadow-xs)', font: 'var(--fw-regular) 11px/1.5 var(--font-body)', color: 'var(--taupe-600)', maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap' }} className="ob-scroll">{ocrText}</div>
                )}
              </>
            )}
          </div>
          <div style={{ padding: '12px 18px 20px', flexShrink: 0, display: 'flex', gap: 8 }}>
            <div onClick={() => { setStage('pick'); }} style={{ flex: 1, textAlign: 'center', background: '#fff', border: '1px solid var(--border-strong)', color: 'var(--cocoa-700)', borderRadius: 'var(--radius-md)', padding: '14px 0', font: 'var(--fw-bold) 13px var(--font-body)', cursor: 'pointer' }}>Reprendre</div>
            <div onClick={() => onConfirm({ foods: detected.map((d) => d.name), title: 'Repas photographié' })} style={{ flex: 1.5, textAlign: 'center', background: 'var(--coral-500)', color: '#fff', borderRadius: 'var(--radius-md)', padding: '14px 0', font: 'var(--fw-bold) 13.5px var(--font-display)', cursor: 'pointer', boxShadow: 'var(--shadow-brand)' }}>{detected.length ? 'Vérifier ces ' + detected.length + ' aliments' : 'Continuer'}</div>
          </div>
        </>
      )}
    </div>
  );
}

// petit helper local pour convertir une chaîne CSS en objet React
function css(str) {
  const obj = {};
  String(str).split(';').forEach((decl) => {
    const i = decl.indexOf(':');
    if (i < 0) return;
    const p = decl.slice(0, i).trim();
    const v = decl.slice(i + 1).trim();
    if (!p) return;
    obj[p.startsWith('--') ? p : p.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v;
  });
  return obj;
}

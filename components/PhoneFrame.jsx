'use client';

// Android (Material 3) device bezel — status bar + gesture nav wrapping the app.
// Adapted from android-frame.jsx of the design handoff. No image assets.

const MD_C = {
  surface: '#f4fbf8',
  onSurface: '#171d1b',
  frameBorder: 'rgba(116,119,117,0.5)',
};

function AndroidStatusBar() {
  const c = MD_C.onSurface;
  return (
    <div
      style={{
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        position: 'relative',
        fontFamily: 'Roboto, system-ui, sans-serif',
        background: 'var(--cream-50)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.25, color: c }}>9:30</span>
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 7,
          transform: 'translateX(-50%)',
          width: 20,
          height: 20,
          borderRadius: 100,
          background: '#2e2e2e',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: c }}>
        <i className="ph-fill ph-cell-signal-full" style={{ fontSize: 13 }} />
        <i className="ph-fill ph-wifi-high" style={{ fontSize: 13 }} />
        <i className="ph-fill ph-battery-high" style={{ fontSize: 15 }} />
      </div>
    </div>
  );
}

function AndroidNavBar() {
  return (
    <div
      style={{
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cream-50)',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 108, height: 4, borderRadius: 2, background: MD_C.onSurface, opacity: 0.35 }} />
    </div>
  );
}

export default function PhoneFrame({ children }) {
  return (
    <div
      style={{
        width: 396,
        maxWidth: '100vw',
        height: 812,
        maxHeight: '100dvh',
        borderRadius: 40,
        overflow: 'hidden',
        background: 'var(--cream-50)',
        border: `8px solid ${MD_C.frameBorder}`,
        boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <AndroidStatusBar />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
      <AndroidNavBar />
    </div>
  );
}

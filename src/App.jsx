import { useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard   from './pages/Dashboard.jsx'

/* ── Change this to your own password ─────────────────────────── */
const CLINIC_PASSWORD = 'physio2026'

const S = {
  forest:  '#12382A',
  saffron: '#D4510E',
  teal:    '#0A6B5E',
  gray:    '#5C6878',
  border:  '#DDE4EF',
  light:   '#F3F6FA',
}

/* ── Login Screen ────────────────────────────────────────────── */
function LoginScreen({ onLogin }) {
  const [pw,    setPw]    = useState('')
  const [error, setError] = useState(false)
  const [show,  setShow]  = useState(false)

  const attempt = () => {
    if (pw === CLINIC_PASSWORD) {
      onLogin()
    } else {
      setError(true)
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${S.forest} 0%, #0D3828 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Background circles */}
      {[400, 280, 160].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', width: s, height: s, borderRadius: '50%',
          border: `1px solid rgba(58,154,107,${0.05 + i * 0.04})`,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }}/>
      ))}

      {/* Card */}
      <div style={{
        background: '#fff', borderRadius: 20, padding: '44px 40px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        animation: 'fadeUp .5s ease',
        position: 'relative',
      }}>
        {/* Logo + brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: `linear-gradient(135deg, ${S.forest}, #0E3222)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
            boxShadow: `0 8px 24px rgba(18,56,42,0.3)`,
          }}>🌿</div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900, fontSize: '1.6rem', color: S.forest,
            marginBottom: 4,
          }}>PhysioDrishti</div>
          <div style={{
            fontSize: 12, color: S.gray, fontWeight: 600,
            letterSpacing: 2, textTransform: 'uppercase',
          }}>Clinic Dashboard</div>
        </div>

        {/* Label */}
        <div style={{
          fontSize: 13, color: S.gray, marginBottom: 20,
          textAlign: 'center', lineHeight: 1.6,
        }}>
          🔒 Staff access only. Enter your clinic password to continue.
        </div>

        {/* Password input */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input
            type={show ? 'text' : 'password'}
            placeholder="Enter password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            autoFocus
            style={{
              width: '100%', padding: '13px 48px 13px 16px',
              border: `1.5px solid ${error ? '#B83232' : S.border}`,
              borderRadius: 10, fontSize: 15, outline: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              color: S.forest, background: S.light,
              transition: 'border-color .2s',
              animation: error ? 'shake .4s ease' : 'none',
            }}
          />
          {/* Show/hide toggle */}
          <button
            onClick={() => setShow(p => !p)}
            style={{
              position: 'absolute', right: 14, top: '50%',
              transform: 'translateY(-50%)',
              background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 16, color: S.gray,
            }}>
            {show ? '🙈' : '👁'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            fontSize: 12, color: '#B83232', marginBottom: 12,
            textAlign: 'center', fontWeight: 600,
          }}>
            Incorrect password. Please try again.
          </div>
        )}

        {/* Login button */}
        <button
          onClick={attempt}
          disabled={!pw}
          style={{
            width: '100%', padding: 14,
            background: pw ? S.saffron : S.border,
            color: pw ? '#fff' : S.gray,
            border: 'none', borderRadius: 10,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 15, fontWeight: 700,
            cursor: pw ? 'pointer' : 'default',
            transition: 'all .2s',
            boxShadow: pw ? `0 6px 20px rgba(212,81,14,0.3)` : 'none',
          }}>
          Enter dashboard →
        </button>

        {/* Back to site */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'none', border: 'none',
              color: S.teal, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', textDecoration: 'underline',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
            ← Back to patient site
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Root App ────────────────────────────────────────────────── */
export default function App() {
  const [view,       setView]       = useState('landing')
  const [mapplsKey,  setMapplsKey]  = useState('')
  const [authed,     setAuthed]     = useState(false)

  /* When navigating to dashboard, require login */
  const goToDashboard = () => {
    setView('dashboard')
    // authed stays as is — once logged in, stays logged in for the session
  }

  return (
    <>
      {view === 'landing' && (
        <LandingPage
          onGoToDashboard={goToDashboard}
          mapplsKey={mapplsKey}
          setMapplsKey={setMapplsKey}
        />
      )}

      {view === 'dashboard' && !authed && (
        <LoginScreen onLogin={() => setAuthed(true)} />
      )}

      {view === 'dashboard' && authed && (
        <Dashboard
          onGoToLanding={() => { setView('landing'); setAuthed(false) }}
          mapplsKey={mapplsKey}
          setMapplsKey={setMapplsKey}
        />
      )}
    </>
  )
}

import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DoctorProfile from './pages/DoctorProfile.jsx'

/* ── Dashboard Login Gate ─────────────────────────────────────── */
const DEFAULT_PIN = '1234'
const PIN_KEY     = 'pd_dashboard_pin'
const AUTH_KEY    = 'pd_authed'

const CSS_LOGIN = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .login-card{animation:fadeIn .45s ease both}
`

function LoginGate({ onAuth }) {
  const [pin,  setPin]  = useState('')
  const [err,  setErr]  = useState('')
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS_LOGIN
    document.head.appendChild(el)
    return () => { try { document.head.removeChild(el) } catch {} }
  }, [])

  const attempt = () => {
    const stored = localStorage.getItem(PIN_KEY) || DEFAULT_PIN
    if (pin === stored) {
      sessionStorage.setItem(AUTH_KEY, '1')
      onAuth()
    } else {
      setErr('Incorrect PIN — try again.')
      setPin('')
    }
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(140deg,#12382A 0%,#1E4D35 60%,#0D3828 100%)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }}>
      <div className="login-card" style={{
        background:'#fff', borderRadius:18, padding:'40px 36px',
        width:'100%', maxWidth:380,
        boxShadow:'0 24px 72px rgba(0,0,0,.35)',
        textAlign:'center',
      }}>
        <div style={{ fontSize:44, marginBottom:12 }}>🌿</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.55rem', fontWeight:900, color:'#12382A', marginBottom:4 }}>
          PhysioDrishti
        </div>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, color:'#5C6878', marginBottom:32, letterSpacing:1.5, textTransform:'uppercase' }}>
          Clinic Dashboard
        </div>

        <div style={{ textAlign:'left', marginBottom:16 }}>
          <label style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:6 }}>
            Dashboard PIN
          </label>
          <div style={{ position:'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={e => { setPin(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && pin && attempt()}
              placeholder="Enter your PIN"
              autoFocus
              style={{
                width:'100%', padding:'12px 44px 12px 16px',
                border:`1.5px solid ${err ? '#F5C6C6' : '#DDE4EF'}`,
                borderRadius:9, fontSize:15, outline:'none',
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                letterSpacing: pin ? 6 : 0,
                transition:'border-color .2s',
                color:'#0D1520',
              }}
              onFocus={e => { if (!err) e.target.style.borderColor = '#3A9A6B' }}
              onBlur={e => { if (!err) e.target.style.borderColor = '#DDE4EF' }}
            />
            <button
              onClick={() => setShow(p => !p)}
              style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9BA8B5', padding:0 }}
              tabIndex={-1}
            >
              {show ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {err && (
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, color:'#B83232', background:'#FFF0F0', border:'1px solid #F5C6C6', borderRadius:7, padding:'9px 14px', marginBottom:14, textAlign:'left' }}>
            ⚠️ {err}
          </div>
        )}

        <button
          onClick={attempt}
          disabled={!pin}
          style={{
            width:'100%', padding:'13px',
            background: pin ? '#12382A' : '#E5E9EF',
            color: pin ? '#fff' : '#9BA8B5',
            border:'none', borderRadius:9,
            fontFamily:"'Plus Jakarta Sans',sans-serif",
            fontSize:15, fontWeight:700,
            cursor: pin ? 'pointer' : 'default',
            transition:'all .2s',
          }}
        >
          Enter dashboard →
        </button>

        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", marginTop:18, fontSize:11, color:'#9BA8B5', lineHeight:1.6 }}>
          Default PIN: <strong>1234</strong><br/>Change it any time in Dashboard → Settings
        </div>
      </div>
    </div>
  )
}

/* ── App ─────────────────────────────────────────────────────── */
export default function App() {
  const [view,       setView]       = useState('landing')
  const [mapplsKey,  setMapplsKey]  = useState('')
  const [authed,     setAuthed]     = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')

  const logout = () => {
    sessionStorage.removeItem(AUTH_KEY)
    setAuthed(false)
    setView('landing')
  }

  return (
    <>
      {view === 'doctor' ? (
        <DoctorProfile onBack={() => setView('landing')} />
      ) : view === 'landing' ? (
        <LandingPage
          onGoToDashboard={() => setView('dashboard')}
          onShowDoctor={() => setView('doctor')}
          mapplsKey={mapplsKey}
          setMapplsKey={setMapplsKey}
        />
      ) : authed ? (
        <Dashboard
          onGoToLanding={() => setView('landing')}
          onLogout={logout}
          mapplsKey={mapplsKey}
          setMapplsKey={setMapplsKey}
        />
      ) : (
        <LoginGate onAuth={() => setAuthed(true)} />
      )}
    </>
  )
}

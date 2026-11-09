import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DoctorProfile from './pages/DoctorProfile.jsx'
import { supabase } from './supabase.js'

/* ── Dashboard Login Gate (Supabase Auth) ─────────────────────── */
const CSS_LOGIN = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .login-card{animation:fadeIn .45s ease both}
`

function LoginGate({ onAuth }) {
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [err,     setErr]     = useState('')
  const [loading, setLoading] = useState(false)
  const [show,    setShow]    = useState(false)

  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = CSS_LOGIN
    document.head.appendChild(el)
    return () => { try { document.head.removeChild(el) } catch {} }
  }, [])

  const attempt = async () => {
    if (!email || !pass) return
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    if (error) {
      setErr(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
      setPass('')
    } else {
      onAuth()
    }
    setLoading(false)
  }

  const F = { fontFamily:"'Plus Jakarta Sans',sans-serif" }

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
        <div style={{ ...F, fontFamily:"'Playfair Display',serif", fontSize:'1.55rem', fontWeight:900, color:'#12382A', marginBottom:4 }}>
          PhysioDrishti
        </div>
        <div style={{ ...F, fontSize:12, color:'#5C6878', marginBottom:32, letterSpacing:1.5, textTransform:'uppercase' }}>
          Clinic Dashboard
        </div>

        <div style={{ textAlign:'left', marginBottom:14 }}>
          <label style={{ ...F, fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
            placeholder="staff@yourclinic.com"
            autoFocus
            style={{
              width:'100%', padding:'12px 16px',
              border:`1.5px solid ${err ? '#F5C6C6' : '#DDE4EF'}`,
              borderRadius:9, fontSize:15, outline:'none', ...F,
              transition:'border-color .2s', color:'#0D1520',
            }}
            onFocus={e => { if (!err) e.target.style.borderColor = '#3A9A6B' }}
            onBlur={e => { if (!err) e.target.style.borderColor = '#DDE4EF' }}
          />
        </div>

        <div style={{ textAlign:'left', marginBottom:16 }}>
          <label style={{ ...F, fontSize:12, fontWeight:700, color:'#0A6B5E', display:'block', marginBottom:6 }}>
            Password
          </label>
          <div style={{ position:'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pass}
              onChange={e => { setPass(e.target.value); setErr('') }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              placeholder="••••••••"
              style={{
                width:'100%', padding:'12px 44px 12px 16px',
                border:`1.5px solid ${err ? '#F5C6C6' : '#DDE4EF'}`,
                borderRadius:9, fontSize:15, outline:'none', ...F,
                transition:'border-color .2s', color:'#0D1520',
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
          <div style={{ ...F, fontSize:12, color:'#B83232', background:'#FFF0F0', border:'1px solid #F5C6C6', borderRadius:7, padding:'9px 14px', marginBottom:14, textAlign:'left' }}>
            ⚠️ {err}
          </div>
        )}

        <button
          onClick={attempt}
          disabled={!email || !pass || loading}
          style={{
            width:'100%', padding:'13px',
            background: (email && pass && !loading) ? '#12382A' : '#E5E9EF',
            color: (email && pass && !loading) ? '#fff' : '#9BA8B5',
            border:'none', borderRadius:9, ...F,
            fontSize:15, fontWeight:700,
            cursor: (email && pass && !loading) ? 'pointer' : 'default',
            transition:'all .2s',
          }}
        >
          {loading ? 'Signing in…' : 'Enter dashboard →'}
        </button>

        <div style={{ ...F, marginTop:18, fontSize:11, color:'#9BA8B5', lineHeight:1.6 }}>
          Staff accounts are managed in Supabase Auth.<br/>
          Contact your admin if you need access.
        </div>
      </div>
    </div>
  )
}

/* ── App ─────────────────────────────────────────────────────── */
export default function App() {
  const [view,      setView]      = useState('landing')
  const [mapplsKey, setMapplsKey] = useState('')
  const [authed,    setAuthed]    = useState(false)
  const [checking,  setChecking]  = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setAuthed(false)
    setView('landing')
  }

  if (checking) return null

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

import { useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const [view, setView]           = useState('landing')
  const [mapplsKey, setMapplsKey] = useState('')

  return (
    <>
      {view === 'landing' ? (
        <LandingPage
          onGoToDashboard={() => setView('dashboard')}
          mapplsKey={mapplsKey}
          setMapplsKey={setMapplsKey}
        />
      ) : (
        <Dashboard
          onGoToLanding={() => setView('landing')}
          mapplsKey={mapplsKey}
          setMapplsKey={setMapplsKey}
        />
      )}
    </>
  )
}

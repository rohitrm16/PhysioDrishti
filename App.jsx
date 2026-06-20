import { useState } from 'react'
import LandingPage from './pages/LandingPage.jsx'
import Dashboard from './pages/Dashboard.jsx'

/**
 * PhysioDrishti — Root App
 * Controls navigation between the Landing Page and the Admin Dashboard.
 *
 * Props passed down:
 *   onGoToDashboard  — navigates to dashboard (landing → dashboard)
 *   onGoToLanding    — navigates to landing   (dashboard → landing)
 *   mapplsKey / setMapplsKey — shared Mappls API key across both pages
 */
export default function App() {
  const [view, setView]           = useState('landing') // 'landing' | 'dashboard'
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

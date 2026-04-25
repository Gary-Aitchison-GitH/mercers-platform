import { Routes, Route } from 'react-router-dom'
import { LanguageProvider } from './components/LanguageContext'
import Home from './views/Home'
import Listings from './views/Listings'
import Agents from './views/Agents'
import Contact from './views/Contact'
import Welcome from './views/Welcome'
import Admin from './views/Admin'

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </LanguageProvider>
  )
}

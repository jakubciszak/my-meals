import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MealsPage from './pages/MealsPage'
import MealsListPage from './pages/MealsListPage'
import FamilyPage from './pages/FamilyPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="meals" element={<MealsPage />} />
        <Route path="meals-list" element={<MealsListPage />} />
        <Route path="family" element={<FamilyPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App

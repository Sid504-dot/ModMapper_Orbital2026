import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModuleSearch from './pages/ModuleSearch'
import TimetableBuilder from './pages/TimetableBuilder'
import SUOptimiser from './pages/SUOptimiser'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/modules" element={<ModuleSearch />} />
        <Route path="/timetable" element={<TimetableBuilder />} />
        <Route path="/su-optimiser" element={<SUOptimiser />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

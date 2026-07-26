import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModuleSearch from './pages/ModuleSearch'
import TimetableBuilder from './pages/TimetableBuilder'
import SUOptimiser from './pages/SUOptimiser'
import QnAHub from './pages/QnAHub'
import ModuleQnA from './pages/ModuleQnA'
import GroupFinder from './pages/GroupFinder'
import JoinGroup from './pages/JoinGroup'
import BiddingHeatmap from './pages/BiddingHeatmap'
import AuthGuard from './components/AuthGuard'
import UERecommender from './pages/UERecommender'
import Profile from './pages/Profile'
import YearPlanner from './pages/YearPlanner'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/modules" element={<AuthGuard><ModuleSearch /></AuthGuard>} />
        <Route path="/timetable" element={<AuthGuard><TimetableBuilder /></AuthGuard>} />
        <Route path="/su-optimiser" element={<AuthGuard><SUOptimiser /></AuthGuard>} />
        <Route path="/qna-hub" element={<AuthGuard><QnAHub /></AuthGuard>} />
        <Route path="/qna-hub/:moduleCode" element={<AuthGuard><ModuleQnA /></AuthGuard>} />
        <Route path="/group-finder" element={<AuthGuard><GroupFinder /></AuthGuard>} />
        <Route path="/group-finder/join/:inviteToken" element={<AuthGuard><JoinGroup /></AuthGuard>} />
        <Route path="/bidding-heatmap" element={<AuthGuard><BiddingHeatmap /></AuthGuard>} />
        <Route path="/ue-recommender" element={<AuthGuard><UERecommender /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="/year-planner" element={<AuthGuard><YearPlanner /></AuthGuard>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
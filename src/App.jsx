import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/AuthGuard';

// Pages
import Landing from './pages/Landing';
import TeacherAuth from './pages/TeacherAuth';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherProfile from './pages/TeacherProfile';
import RoomDetail from './pages/RoomDetail';
import ExamCreate from './pages/ExamCreate';
import ExamView from './pages/ExamView';
import ResultCard from './pages/ResultCard';
import TeacherResults from './pages/TeacherResults';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/teacher/auth" element={<TeacherAuth />} />

          {/* Student exam routes — no auth needed */}
          <Route path="/exam/:examId" element={<ExamView />} />
          <Route path="/exam/:examId/result/:submissionId" element={<ResultCard />} />

          {/* Protected teacher routes */}
          <Route path="/teacher/dashboard" element={<AuthGuard><TeacherDashboard /></AuthGuard>} />
          <Route path="/teacher/profile"   element={<AuthGuard><TeacherProfile /></AuthGuard>} />
          <Route path="/teacher/room/:id"  element={<AuthGuard><RoomDetail /></AuthGuard>} />

          {/* Exam create — shared component used for both create and edit */}
          <Route path="/teacher/exam/create"     element={<AuthGuard><ExamCreate /></AuthGuard>} />
          <Route path="/teacher/exam/:id/edit"   element={<AuthGuard><ExamCreate /></AuthGuard>} />
          <Route path="/teacher/exam/:id/results" element={<AuthGuard><TeacherResults /></AuthGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

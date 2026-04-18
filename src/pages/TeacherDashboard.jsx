import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, getDocs, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor, getRoomColor, ROOM_COLORS } from '../utils/helpers';
import StatCard from '../components/StatCard';
import RoomCard from '../components/RoomCard';
import ExamCard from '../components/ExamCard';
import Modal from '../components/Modal';
import Footer from '../components/Footer';
import {
  Plus, LogOut, BookOpen, FileText, Users, TrendingUp, CheckCircle, AlertTriangle
} from 'lucide-react';

export default function TeacherDashboard() {
  const { user, teacher, signOut } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Modals
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [renameRoom, setRenameRoom] = useState(null);
  const [deleteRoomTarget, setDeleteRoomTarget] = useState(null);
  const [deleteExamTarget, setDeleteExamTarget] = useState(null);

  const [roomForm, setRoomForm] = useState({ name: '', subject: '', color_tag: 'teal' });
  // BUG FIX #6: Added actionError state to show user-facing errors from all handlers
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'rooms'), where('teacher_id', '==', user.uid));
    return onSnapshot(q, snap => setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'exams'), where('teacher_id', '==', user.uid));
    return onSnapshot(q, snap => setExams(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'submissions'), where('teacher_id', '==', user.uid));
    return onSnapshot(q, snap => setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Enrich rooms with exam count
  const enrichedRooms = rooms.map(r => ({
    ...r,
    examCount: exams.filter(e => e.room_id === r.id).length,
  }));

  // Recent exams (last 6)
  const recentExams = [...exams]
    .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0))
    .slice(0, 6)
    .map(e => ({
      ...e,
      submissionCount: submissions.filter(s => s.exam_id === e.id).length,
    }));

  // Stats
  const avgScore = submissions.length
    ? Math.round(submissions.reduce((s, sub) => s + (sub.percentage || 0), 0) / submissions.length)
    : null;

  // BUG FIX #6: All handlers now wrapped in try/catch with user-facing error feedback
  const handleCreateRoom = async () => {
    if (!roomForm.name.trim()) return;
    setActionError('');
    try {
      await addDoc(collection(db, 'rooms'), {
        teacher_id: user.uid,
        name: roomForm.name.trim(),
        subject: roomForm.subject.trim(),
        color_tag: roomForm.color_tag,
        created_at: serverTimestamp(),
      });
      setRoomForm({ name: '', subject: '', color_tag: 'teal' });
      setNewRoomOpen(false);
    } catch (err) {
      console.error('Failed to create room:', err);
      setActionError('Failed to create room. Please try again.');
    }
  };

  const handleRenameRoom = async () => {
    if (!renameRoom || !roomForm.name.trim()) return;
    setActionError('');
    try {
      await updateDoc(doc(db, 'rooms', renameRoom.id), {
        name: roomForm.name.trim(),
        subject: roomForm.subject.trim(),
        color_tag: roomForm.color_tag,
      });
      setRenameRoom(null);
    } catch (err) {
      console.error('Failed to rename room:', err);
      setActionError('Failed to update room. Please try again.');
    }
  };

  const handleDeleteRoom = async () => {
    if (!deleteRoomTarget) return;
    setActionError('');
    try {
      await deleteDoc(doc(db, 'rooms', deleteRoomTarget.id));
      setDeleteRoomTarget(null);
    } catch (err) {
      console.error('Failed to delete room:', err);
      setActionError('Failed to delete room. Please try again.');
    }
  };

  // BUG FIX #5: Delete exam now also deletes all associated submissions.
  // Previously the modal said "All student submissions will also be removed"
  // but only the exam document was being deleted — submissions were orphaned.
  const handleDeleteExam = async () => {
    if (!deleteExamTarget) return;
    setActionError('');
    try {
      // First delete all associated submissions
      const subsSnap = await getDocs(
        query(collection(db, 'submissions'), where('exam_id', '==', deleteExamTarget.id))
      );
      await Promise.all(subsSnap.docs.map(d => deleteDoc(doc(db, 'submissions', d.id))));
      // Then delete the exam itself
      await deleteDoc(doc(db, 'exams', deleteExamTarget.id));
      setDeleteExamTarget(null);
    } catch (err) {
      console.error('Failed to delete exam:', err);
      setActionError('Failed to delete exam. Please try again.');
    }
  };

  const initials = getInitials(teacher?.name || user?.email || 'T');
  const avatarBg = getAvatarColor(teacher?.name || '');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">ExamDesk</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/teacher/profile')}
              className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-colors"
            >
              <div className={`w-7 h-7 rounded-lg ${avatarBg} flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">{initials}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {teacher?.name || 'Profile'}
              </span>
            </button>
            <button
              onClick={() => { signOut(); navigate('/'); }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Log out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Welcome */}
        <div>
          <h1 className="font-display font-bold text-gray-900 text-2xl sm:text-3xl">
            Good day, {teacher?.name?.split(' ')[0] || 'Teacher'}
          </h1>
          {teacher?.school && <p className="text-sm text-gray-400 mt-1">{teacher.school}</p>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen}    label="Rooms"       value={rooms.length}       color="teal" />
          <StatCard icon={FileText}    label="Exams"       value={exams.length}       color="indigo" />
          <StatCard icon={Users}       label="Submissions" value={submissions.length} color="violet" />
          <StatCard icon={TrendingUp}  label="Avg Score"   value={avgScore !== null ? `${avgScore}%` : '—'} color="amber" />
        </div>

        {/* Rooms */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-xl">Your Rooms</h2>
            <button
              onClick={() => { setRoomForm({ name: '', subject: '', color_tag: 'teal' }); setNewRoomOpen(true); }}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Plus size={16} /> New Room
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {enrichedRooms.map(room => (
              <RoomCard
                key={room.id} room={room}
                onRename={(r) => {
                  setRoomForm({ name: r.name, subject: r.subject || '', color_tag: r.color_tag || 'teal' });
                  setRenameRoom(r);
                }}
                onDelete={setDeleteRoomTarget}
              />
            ))}
            <button
              onClick={() => { setRoomForm({ name: '', subject: '', color_tag: 'teal' }); setNewRoomOpen(true); }}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-5 hover:border-teal-300 hover:bg-teal-50/30 transition-all group flex flex-col items-center justify-center gap-2 min-h-[140px]"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <Plus size={20} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-teal-600 transition-colors">New Room</span>
            </button>
          </div>
        </section>

        {/* Recent Exams */}
        {recentExams.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-gray-900 text-xl">Recent Exams</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentExams.map(exam => (
                <ExamCard
                  key={exam.id} exam={exam}
                  onEdit={(e) => navigate(`/teacher/exam/${e.id}/edit`)}
                  onDelete={setDeleteExamTarget}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* FAB */}
      <button
        onClick={() => navigate('/teacher/exam/create')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-20"
        title="Create Exam"
      >
        <Plus size={24} />
      </button>

      {/* New/Edit Room Modal */}
      <Modal
        open={newRoomOpen || !!renameRoom}
        onClose={() => { setNewRoomOpen(false); setRenameRoom(null); setActionError(''); }}
        title={renameRoom ? 'Edit Room' : 'New Room'}
        size="sm"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} /> {actionError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Room Name *</label>
            <input
              type="text" value={roomForm.name}
              onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Class 10 Science"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject</label>
            <input
              type="text" value={roomForm.subject}
              onChange={e => setRoomForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Physics"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {ROOM_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setRoomForm(f => ({ ...f, color_tag: c.value }))}
                  className={`w-7 h-7 rounded-lg ${c.bg} transition-all ${roomForm.color_tag === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setNewRoomOpen(false); setRenameRoom(null); setActionError(''); }}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={renameRoom ? handleRenameRoom : handleCreateRoom}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              {renameRoom ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Room Confirm */}
      <Modal open={!!deleteRoomTarget} onClose={() => { setDeleteRoomTarget(null); setActionError(''); }} title="Delete Room" size="sm">
        {actionError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5 mb-4">
            <AlertTriangle size={14} /> {actionError}
          </div>
        )}
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete <strong>{deleteRoomTarget?.name}</strong>? This won't delete exams inside it.
        </p>
        <div className="flex gap-3">
          <button onClick={() => { setDeleteRoomTarget(null); setActionError(''); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleDeleteRoom} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
        </div>
      </Modal>

      {/* Delete Exam Confirm */}
      <Modal open={!!deleteExamTarget} onClose={() => { setDeleteExamTarget(null); setActionError(''); }} title="Delete Exam" size="sm">
        {actionError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2.5 mb-4">
            <AlertTriangle size={14} /> {actionError}
          </div>
        )}
        <p className="text-sm text-gray-600 mb-5">
          Delete <strong>{deleteExamTarget?.title}</strong>? All student submissions will also be permanently removed.
        </p>
        <div className="flex gap-3">
          <button onClick={() => { setDeleteExamTarget(null); setActionError(''); }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleDeleteExam} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

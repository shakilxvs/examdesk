import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, collection, query, where, onSnapshot, deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getRoomColor, getExamLink, copyToClipboard } from '../utils/helpers';
import ExamCard from '../components/ExamCard';
import Modal from '../components/Modal';
import Footer from '../components/Footer';
import { ArrowLeft, Plus, CheckCircle, Share2 } from 'lucide-react';

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'rooms', id)).then(snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() });
    });
  }, [id]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'exams'), where('room_id', '==', id), where('teacher_id', '==', user.uid));
    return onSnapshot(q, snap => setExams(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'submissions'), where('teacher_id', '==', user.uid));
    return onSnapshot(q, snap => setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, 'exams', deleteTarget.id));
    setDeleteTarget(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const enrichedExams = exams.map(e => ({
    ...e,
    submissionCount: submissions.filter(s => s.exam_id === e.id).length,
  }));

  const color = room ? getRoomColor(room.color_tag) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/teacher/dashboard')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center">
              <CheckCircle size={13} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">ExamDesk</span>
          </div>
          <span className="text-gray-300 hidden sm:block">›</span>
          <span className="text-sm text-gray-500 hidden sm:block">Dashboard</span>
          <span className="text-gray-300 hidden sm:block">›</span>
          <span className="text-sm font-medium text-gray-900 hidden sm:block">{room?.name || '...'}</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Room header */}
        {room && color && (
          <div className={`rounded-2xl p-6 ${color.light} border ${color.border} flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white font-display font-bold text-xl">{room.name[0]}</span>
            </div>
            <div>
              <h1 className={`font-display font-bold text-2xl ${color.text}`}>{room.name}</h1>
              {room.subject && <p className="text-sm text-gray-500 mt-0.5">{room.subject}</p>}
            </div>
            <div className="ml-auto">
              <span className="text-sm text-gray-400">{enrichedExams.length} exam{enrichedExams.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {/* Exams */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-gray-900 text-xl">Exams</h2>
            <button
              onClick={() => navigate(`/teacher/exam/create?room=${id}`)}
              className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Plus size={16} /> New Exam
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrichedExams.map(exam => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onEdit={(e) => navigate(`/teacher/exam/${e.id}/edit`)}
                onDelete={setDeleteTarget}
              />
            ))}
            <button
              onClick={() => navigate(`/teacher/exam/create?room=${id}`)}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-5 hover:border-teal-300 hover:bg-teal-50/30 transition-all group flex flex-col items-center justify-center gap-2 min-h-[160px]"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                <Plus size={20} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-teal-600 transition-colors">New Exam</span>
            </button>
          </div>
        </section>
      </main>

      <Footer />

      {/* FAB */}
      <button
        onClick={() => navigate(`/teacher/exam/create?room=${id}`)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-20"
      >
        <Plus size={24} />
      </button>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Exam" size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Delete <strong>{deleteTarget?.title}</strong>? All submissions will be lost.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">Delete</button>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg animate-fade-in z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, query, where, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import QuestionBuilder from '../components/QuestionBuilder';
import Footer from '../components/Footer';
import { ArrowLeft, ArrowRight, CheckCircle, Eye, Clock, Lock, Globe, AlignLeft, LayoutGrid, BookOpen, Send, Save } from 'lucide-react';
import { generatePin } from '../utils/helpers';

const STEPS = ['Setup', 'Questions', 'Review'];

const emptyExam = {
  title: '',
  description: '',
  type: 'mcq',
  timed: false,
  duration_minutes: 30,
  display_mode: 'one_at_a_time',
  access: 'open',
  pin: '',
  one_time_access: false,
  notes: '',
  grading_system: 'bd',
  questions: [],
};

export default function ExamCreate() {
  const { id } = useParams(); // for edit mode
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [exam, setExam] = useState({ ...emptyExam });
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(searchParams.get('room') || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(false);

  const isEdit = !!id;

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'rooms'), where('teacher_id', '==', user.uid)))
      .then(snap => {
        const rs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRooms(rs);
        if (!selectedRoom && rs.length > 0) setSelectedRoom(rs[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!isEdit) return;
    getDoc(doc(db, 'exams', id)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setExam({ ...emptyExam, ...data });
        setSelectedRoom(data.room_id || '');
      }
    });
  }, [id]);

  const set = (k, v) => setExam(e => ({ ...e, [k]: v }));

  const validateStep0 = () => {
    const errs = {};
    if (!exam.title.trim()) errs.title = 'Exam title is required.';
    if (!selectedRoom) errs.room = 'Please select a room.';
    if (exam.timed && (!exam.duration_minutes || exam.duration_minutes < 1)) errs.duration = 'Enter a valid duration.';
    if (exam.access === 'pin_protected' && exam.pin.length < 4) errs.pin = 'PIN must be 4–6 digits.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep1 = () => {
    const errs = {};
    if (exam.questions.length === 0) errs.questions = 'Add at least one question.';
    exam.questions.forEach((q, i) => {
      if (!q.text?.trim()) errs[`q_${i}`] = `Question ${i + 1} text is required.`;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    setStep(s => Math.min(s + 1, 2));
  };

  const handleSave = async (status) => {
    setLoading(true);
    try {
      const data = {
        ...exam,
        room_id: selectedRoom,
        teacher_id: user.uid,
        status,
      };
      if (isEdit) {
        await updateDoc(doc(db, 'exams', id), data);
      } else {
        await addDoc(collection(db, 'exams'), { ...data, created_at: serverTimestamp() });
      }
      navigate(selectedRoom ? `/teacher/room/${selectedRoom}` : '/teacher/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = exam.questions.reduce((s, q) => s + (parseFloat(q.marks) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center">
              <CheckCircle size={13} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">{isEdit ? 'Edit Exam' : 'New Exam'}</span>
          </div>
        </div>
      </nav>

      {/* Step indicator */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  i === step ? 'bg-teal-600 text-white' :
                  i < step ? 'bg-teal-50 text-teal-700 cursor-pointer hover:bg-teal-100' :
                  'bg-gray-100 text-gray-400'
                }`}
              >
                <span>{i + 1}</span> {s}
              </button>
              {i < STEPS.length - 1 && <div className="w-6 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* ── STEP 0: Setup ── */}
        {step === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="font-display font-bold text-gray-900 text-lg">Exam Details</h2>

              <Field label="Exam Title" error={errors.title} required>
                <input
                  type="text" value={exam.title} onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Chapter 5 — Photosynthesis Quiz"
                  className="input"
                />
              </Field>

              <Field label="Room" error={errors.room} required>
                <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="input">
                  <option value="">— Select a room —</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Field>

              <Field label="Description / Instructions">
                <textarea
                  value={exam.description} onChange={e => set('description', e.target.value)}
                  placeholder="Instructions shown before the exam starts..."
                  rows={3} className="input resize-none"
                />
              </Field>

              <Field label="Notice for Students">
                <textarea
                  value={exam.notes} onChange={e => set('notes', e.target.value)}
                  placeholder="Any extra message students will see on the start screen..."
                  rows={2} className="input resize-none"
                />
              </Field>
            </div>

            {/* Type */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Exam Type</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: 'mcq',   label: 'MCQ Only',  icon: CheckCircle, desc: 'Multiple choice' },
                  { v: 'cq',    label: 'Written',   icon: AlignLeft,   desc: 'Free text answers' },
                  { v: 'mixed', label: 'Mixed',      icon: LayoutGrid,  desc: 'MCQ + Written' },
                ].map(({ v, label, icon: Icon, desc }) => (
                  <button
                    key={v}
                    onClick={() => set('type', v)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      exam.type === v ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} className={exam.type === v ? 'text-teal-600' : 'text-gray-400'} />
                    <p className={`text-sm font-semibold mt-2 ${exam.type === v ? 'text-teal-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Display & Timing */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="font-display font-bold text-gray-900 text-lg">Display & Timing</h2>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Question Display</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'one_at_a_time', label: 'One at a time', icon: ArrowRight },
                    { v: 'all_at_once',   label: 'All at once',   icon: LayoutGrid },
                  ].map(({ v, label, icon: Icon }) => (
                    <button
                      key={v}
                      onClick={() => set('display_mode', v)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        exam.display_mode === v ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Clock size={15} /> Timed Exam</p>
                  <p className="text-xs text-gray-400 mt-0.5">Auto-submits when timer reaches zero</p>
                </div>
                <Toggle value={exam.timed} onChange={v => set('timed', v)} />
              </div>

              {exam.timed && (
                <Field label="Duration (minutes)" error={errors.duration}>
                  <input
                    type="number" min={1} max={180}
                    value={exam.duration_minutes}
                    onChange={e => set('duration_minutes', parseInt(e.target.value) || 30)}
                    className="input w-32"
                  />
                </Field>
              )}
            </div>

            {/* Access */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
              <h2 className="font-display font-bold text-gray-900 text-lg">Access Control</h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'open',          label: 'Open Access', icon: Globe, desc: 'Anyone with the link' },
                  { v: 'pin_protected', label: 'PIN Protected', icon: Lock,  desc: 'Students need a PIN' },
                ].map(({ v, label, icon: Icon, desc }) => (
                  <button
                    key={v}
                    onClick={() => { set('access', v); if (v === 'pin_protected' && !exam.pin) set('pin', generatePin()); }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      exam.access === v ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} className={exam.access === v ? 'text-teal-600' : 'text-gray-400'} />
                    <p className={`text-sm font-semibold mt-2 ${exam.access === v ? 'text-teal-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>

              {exam.access === 'pin_protected' && (
                <Field label="Exam PIN" error={errors.pin} hint="4–6 digits">
                  <div className="flex gap-2">
                    <input
                      type="text" value={exam.pin} onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 1234"
                      className="input w-32 font-mono text-center tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => set('pin', generatePin())}
                      className="px-3 py-2 text-xs font-semibold text-teal-600 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
                    >
                      Random
                    </button>
                  </div>
                </Field>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">One-Time Access</p>
                  <p className="text-xs text-gray-400 mt-0.5">Each student can only take this exam once</p>
                </div>
                <Toggle value={exam.one_time_access} onChange={v => set('one_time_access', v)} />
              </div>
            </div>

            {/* Grading */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-display font-bold text-gray-900 text-lg mb-4">Grading System</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { v: 'bd',   label: 'Bangladeshi', desc: 'A+/A/A-/B/C/D/F' },
                  { v: 'intl', label: 'International', desc: 'A/B/C/D/F' },
                ].map(({ v, label, desc }) => (
                  <button
                    key={v}
                    onClick={() => set('grading_system', v)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      exam.grading_system === v ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <BookOpen size={18} className={exam.grading_system === v ? 'text-teal-600' : 'text-gray-400'} />
                    <p className={`text-sm font-semibold mt-2 ${exam.grading_system === v ? 'text-teal-700' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Questions ── */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-gray-900 text-xl">Questions</h2>
              <span className="text-sm text-gray-400">{exam.questions.length} question{exam.questions.length !== 1 ? 's' : ''} · {totalMarks} marks</span>
            </div>
            {errors.questions && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{errors.questions}</div>
            )}
            <QuestionBuilder
              questions={exam.questions}
              onChange={qs => set('questions', qs)}
              type={exam.type}
            />
          </div>
        )}

        {/* ── STEP 2: Review ── */}
        {step === 2 && (
          <div className="animate-fade-in space-y-5">
            <h2 className="font-display font-bold text-gray-900 text-xl">Review & Publish</h2>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <Row label="Title" value={exam.title} />
              <Row label="Type" value={{ mcq: 'MCQ Only', cq: 'Written Only', mixed: 'Mixed' }[exam.type]} />
              <Row label="Questions" value={`${exam.questions.length} questions · ${totalMarks} marks`} />
              <Row label="Timed" value={exam.timed ? `Yes — ${exam.duration_minutes} min` : 'No'} />
              <Row label="Access" value={exam.access === 'pin_protected' ? `PIN Protected (${exam.pin})` : 'Open'} />
              <Row label="One-Time" value={exam.one_time_access ? 'Yes' : 'No'} />
              <Row label="Grading" value={exam.grading_system === 'bd' ? 'Bangladeshi' : 'International'} />
              <Row label="Display" value={{ one_at_a_time: 'One at a time', all_at_once: 'All at once' }[exam.display_mode]} />
            </div>

            {/* Question preview */}
            <button
              onClick={() => setPreview(v => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <Eye size={15} /> {preview ? 'Hide' : 'Preview'} student view
            </button>

            {preview && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                {exam.questions.map((q, i) => (
                  <div key={q.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Q{i + 1}. {q.text}</p>
                    {q.type === 'mcq' && (q.options || []).map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{String.fromCharCode(65 + oi)}. {opt}</span>
                      </div>
                    ))}
                    {q.type === 'cq' && (
                      <div className="h-16 border border-gray-200 rounded-xl bg-gray-50" />
                    )}
                    <p className="text-xs text-gray-400 mt-2">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleSave('draft')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                <Save size={16} /> Save as Draft
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : <Send size={16} />}
                Publish Exam
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {step < 2 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(s - 1, 0))}
              disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft size={15} /> Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              Next <ArrowRight size={15} />
            </button>
          </div>
        )}
      </main>

      <Footer />
      <style>{`.input { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; background: white; } .input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }`}</style>
    </div>
  );
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-gray-900 font-semibold">{value || '—'}</span>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-teal-500' : 'bg-gray-200'}`}
    >
      <span style={{ transform: value ? 'translateX(1.35rem)' : 'translateX(0.125rem)' }} className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
    </button>
  );
}

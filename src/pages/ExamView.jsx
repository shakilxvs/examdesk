import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import { attachAntiCheat, requestFullscreen, exitFullscreen } from '../utils/anticheat';
import { isAnswerCorrect, parseAcceptedAnswers } from '../utils/answerMatcher';
import { calculateGrade } from '../utils/grading';
import { useTimer } from '../hooks/useTimer';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import PinInput from '../components/PinInput';
import ViolationBanner from '../components/ViolationBanner';
import { CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, Send } from 'lucide-react';

const PHASE = { PRE: 'pre', PIN: 'pin', EXAM: 'exam', SUBMITTING: 'submitting' };

export default function ExamView() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState(PHASE.PRE);
  const [error, setError] = useState('');

  // Student info
  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  // BUG FIX #2: Track whether PIN has been verified so the Start button
  // doesn't re-open the PIN screen on every click (was an infinite loop).
  const [pinVerified, setPinVerified] = useState(false);

  // Exam state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [violations, setViolations] = useState(0);
  const [violationLog, setViolationLog] = useState([]);
  const [violationMsg, setViolationMsg] = useState('');
  const [violationFlash, setViolationFlash] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [oneTimeWarned, setOneTimeWarned] = useState(false);
  const startTimeRef = useRef(null);

  const studentUid = useRef(sessionStorage.getItem(`examdesk_uid_${examId}`) || (() => {
    const uid = uuidv4();
    sessionStorage.setItem(`examdesk_uid_${examId}`, uid);
    return uid;
  })());

  // Load exam and teacher info
  useEffect(() => {
    getDoc(doc(db, 'exams', examId)).then(async snap => {
      if (!snap.exists() || snap.data().status !== 'published') {
        setError('This exam is not available.');
        setLoading(false);
        return;
      }
      const data = { id: snap.id, ...snap.data() };
      setExam(data);
      if (data.teacher_id) {
        const ts = await getDoc(doc(db, 'teachers', data.teacher_id));
        if (ts.exists()) setTeacher(ts.data());
      }
      setLoading(false);
    }).catch(() => {
      setError('Could not load exam. Check your link.');
      setLoading(false);
    });
  }, [examId]);

  const handleViolation = useCallback((type) => {
    const msg = {
      window_blur: 'Window switch detected!',
      tab_switch: 'Tab switch detected!',
      right_click: 'Right-click is disabled!',
      keyboard_shortcut: 'Keyboard shortcut blocked!',
    }[type] || 'Violation detected!';
    setViolations(v => v + 1);
    setViolationLog(l => [...l, { type, time: new Date().toISOString() }]);
    setViolationMsg(msg);
    setViolationFlash(v => v + 1);
  }, []);

  useEffect(() => {
    if (phase !== PHASE.EXAM) return;
    const cleanup = attachAntiCheat(handleViolation);
    return cleanup;
  }, [phase, handleViolation]);

  const { remaining, pct: timerPct, formatted, start: startTimer } = useTimer(
    exam?.timed ? exam.duration_minutes * 60 : 0,
    () => submitExam(true)
  );

  // BUG FIX #8: Wrapped in try/catch — the Firestore one-time access query
  // previously had no error handling, causing an unhandled rejection on network issues.
  const startExam = async () => {
    if (!studentName.trim()) return setError('Please enter your name.');
    setError('');
    try {
      if (exam.one_time_access) {
        const q = query(
          collection(db, 'submissions'),
          where('exam_id', '==', examId),
          where('student_uid', '==', studentUid.current)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          return navigate(`/exam/${examId}/result/${snap.docs[0].id}`);
        }
      }
      startTimeRef.current = Date.now();
      setPhase(PHASE.EXAM);
      requestFullscreen();
      if (exam.timed) startTimer();
    } catch (err) {
      console.error('Failed to start exam:', err);
      setError('Could not start exam. Please check your connection and try again.');
    }
  };

  // BUG FIX #2 (continued): After correct PIN, set pinVerified = true so the
  // Start button handler skips the PIN screen on subsequent clicks.
  const handlePinSubmit = () => {
    if (pin.replace(/\s/g, '') !== String(exam.pin)) {
      setPinError('Incorrect PIN. Please try again.');
      return;
    }
    setPinError('');
    setPinVerified(true);
    setPhase(PHASE.PRE);
  };

  const setAnswer = (qIdx, value) => {
    setAnswers(prev => ({ ...prev, [qIdx]: value }));
  };

  const toggleMCQ = (qIdx, optIdx, multi = false) => {
    const curr = answers[qIdx] || [];
    if (multi) {
      const next = curr.includes(optIdx) ? curr.filter(x => x !== optIdx) : [...curr, optIdx];
      setAnswer(qIdx, next);
    } else {
      const next = curr.includes(optIdx) ? [] : [optIdx];
      setAnswer(qIdx, next);
    }
  };

  const answeredCount = Object.keys(answers).filter(k => {
    const a = answers[k];
    if (Array.isArray(a)) return a.length > 0;
    return a && String(a).trim();
  }).length;

  const submitExam = async (autoSubmit = false) => {
    if (!autoSubmit && answeredCount < exam.questions.length) {
      setShowConfirm(true);
      return;
    }
    doSubmit();
  };

  const doSubmit = async () => {
    setShowConfirm(false);
    setPhase(PHASE.SUBMITTING);
    exitFullscreen();

    const timeTaken = Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);
    let score = 0;
    const detailedAnswers = exam.questions.map((q, i) => {
      const studentAns = answers[i];
      let correct = false;
      let marksAwarded = 0;

      if (q.type === 'mcq') {
        const selected = studentAns || [];
        const correctIdxs = q.correct_indices || [];
        correct = selected.length === correctIdxs.length &&
          selected.every(s => correctIdxs.includes(s));
        if (correct) marksAwarded = parseFloat(q.marks) || 0;
      } else {
        const accepted = parseAcceptedAnswers(q.accepted_answers || '');
        correct = isAnswerCorrect(studentAns || '', accepted);
        if (correct) marksAwarded = parseFloat(q.marks) || 0;
      }

      score += marksAwarded;
      return { questionIdx: i, studentAnswer: studentAns, correct, marksAwarded };
    });

    const totalMarks = exam.questions.reduce((s, q) => s + (parseFloat(q.marks) || 0), 0);
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const gradeObj = calculateGrade(percentage, exam.grading_system || 'bd');

    try {
      const submissionRef = await addDoc(collection(db, 'submissions'), {
        exam_id: examId,
        teacher_id: exam.teacher_id,
        student_name: studentName.trim(),
        roll_no: rollNo.trim(),
        student_uid: studentUid.current,
        answers: detailedAnswers,
        score,
        total_marks: totalMarks,
        percentage,
        grade: gradeObj.grade,
        violations,
        violation_log: violationLog,
        started_at: new Date(startTimeRef.current).toISOString(),
        submitted_at: serverTimestamp(),
        time_taken_seconds: timeTaken,
      });
      navigate(`/exam/${examId}/result/${submissionRef.id}`);
    } catch (err) {
      console.error(err);
      setError('Submission failed. Please try again.');
      setPhase(PHASE.EXAM);
    }
  };

  // ── Loading / Error ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading exam...</p>
      </div>
    </div>
  );

  if (error && phase === PHASE.PRE && !exam) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-4" />
        <h2 className="font-display font-bold text-gray-900 text-xl mb-2">Exam Not Available</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  );

  // ── PIN screen ──
  if (phase === PHASE.PIN) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm text-center shadow-sm">
        <div className="w-12 h-12 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={22} className="text-teal-600" />
        </div>
        <h2 className="font-display font-bold text-gray-900 text-xl mb-1">Enter Exam PIN</h2>
        <p className="text-sm text-gray-400 mb-6">{exam.title}</p>
        <PinInput length={exam.pin?.length || 6} value={pin} onChange={setPin} />
        {pinError && <p className="text-red-500 text-sm mt-3">{pinError}</p>}
        <button
          onClick={handlePinSubmit}
          className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Verify PIN
        </button>
      </div>
    </div>
  );

  // ── Submitting ──
  if (phase === PHASE.SUBMITTING) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-700 font-semibold">Submitting your exam...</p>
        <p className="text-gray-400 text-sm mt-1">Please don't close this window.</p>
      </div>
    </div>
  );

  // ── Pre-exam screen ──
  if (phase === PHASE.PRE) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-teal-600 p-6 text-white text-center">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={20} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-xl">{exam.title}</h1>
            {teacher?.school && <p className="text-teal-100 text-sm mt-1">{teacher.school}</p>}
            {teacher?.name && <p className="text-teal-200 text-xs mt-0.5">by {teacher.name}</p>}
          </div>

          <div className="p-6 space-y-5">
            {/* Exam info chips */}
            <div className="flex flex-wrap gap-2 justify-center">
              {exam.timed && (
                <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                  {exam.duration_minutes} min timed
                </span>
              )}
              <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                {exam.questions?.length || 0} questions
              </span>
              <span className="text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full">
                {{ mcq: 'MCQ', cq: 'Written', mixed: 'Mixed' }[exam.type] || 'Exam'}
              </span>
              {exam.one_time_access && (
                <span className="text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">
                  One-time only
                </span>
              )}
              {pinVerified && (
                <span className="text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full">
                  PIN verified
                </span>
              )}
            </div>

            {exam.description && (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                {exam.description}
              </div>
            )}

            {exam.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5 text-amber-500" />
                {exam.notes}
              </div>
            )}

            {exam.one_time_access && !oneTimeWarned && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex gap-2">
                <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                <span><strong>Warning:</strong> You can only take this exam once. Make sure you're ready before starting.</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Your Full Name *</label>
                <input
                  type="text" value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Roll Number (optional)</label>
                <input
                  type="text" value={rollNo}
                  onChange={e => setRollNo(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={async () => {
                if (!studentName.trim()) return setError('Please enter your name.');
                setError('');
                // BUG FIX #2: Check pinVerified so we don't re-open the PIN screen
                // after it has already been verified. Old code always went to PIN for
                // pin_protected exams, creating an infinite PRE → PIN → PRE loop.
                if (exam.access === 'pin_protected' && !pinVerified) {
                  setPhase(PHASE.PIN);
                } else if (exam.one_time_access && !oneTimeWarned) {
                  setOneTimeWarned(true);
                  await startExam();
                } else {
                  await startExam();
                }
              }}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              Start Exam <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Active Exam ──
  const questions = exam.questions || [];
  const q = questions[currentQ];
  const isOneAtATime = exam.display_mode === 'one_at_a_time';

  return (
    <div className="min-h-screen bg-gray-50 select-none">
      {/* Violation banner */}
      <ViolationBanner count={violationFlash} message={violationMsg} onDismiss={() => {}} />

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px] sm:max-w-xs">{exam.title}</p>
            <p className="text-xs text-gray-400">{studentName}</p>
          </div>
          <div className="flex items-center gap-3">
            {violations > 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg flex items-center gap-1">
                <AlertTriangle size={11} /> {violations}
              </span>
            )}
            {exam.timed && <Timer formatted={formatted} pct={timerPct} />}
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-3">
          <ProgressBar answered={answeredCount} total={questions.length} />
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {isOneAtATime ? (
          <div className="animate-fade-in">
            <QuestionCard
              q={q} idx={currentQ} total={questions.length}
              answer={answers[currentQ]}
              onChange={(v) => setAnswer(currentQ, v)}
              onToggleMCQ={(oi) => toggleMCQ(currentQ, oi, (q.correct_indices || []).length > 1)}
            />
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentQ(c => Math.max(c - 1, 0))}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={15} /> Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ(c => c + 1)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  Next <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={() => submitExam(false)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                >
                  <Send size={15} /> Submit
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((question, i) => (
              <QuestionCard
                key={question.id || i}
                q={question} idx={i} total={questions.length}
                answer={answers[i]}
                onChange={(v) => setAnswer(i, v)}
                onToggleMCQ={(oi) => toggleMCQ(i, oi, (question.correct_indices || []).length > 1)}
              />
            ))}
            <button
              onClick={() => submitExam(false)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
            >
              <Send size={17} /> Submit Exam
            </button>
          </div>
        )}
      </main>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-scale-in">
            <h3 className="font-display font-bold text-gray-900 text-lg mb-2">Submit Exam?</h3>
            <p className="text-sm text-gray-500 mb-1">
              You've answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
            </p>
            <p className="text-sm text-amber-600 mb-5">
              {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? 's' : ''} left unanswered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50"
              >
                Keep Going
              </button>
              <button
                onClick={doSubmit}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionCard({ q, idx, total, answer, onChange, onToggleMCQ }) {
  if (!q) return null;
  const selected = answer || [];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <span className="flex-shrink-0 w-7 h-7 bg-teal-50 border border-teal-200 rounded-lg text-teal-700 text-xs font-bold flex items-center justify-center">
          {idx + 1}
        </span>
        <div className="flex-1">
          <p className="text-gray-900 font-medium leading-relaxed">{q.text}</p>
          <p className="text-xs text-gray-400 mt-1">{q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {q.type === 'mcq' ? (
        <div className="space-y-2">
          {(q.options || []).map((opt, oi) => (
            <button
              key={oi}
              onClick={() => onToggleMCQ(oi)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                selected.includes(oi)
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-colors ${
                selected.includes(oi) ? 'border-teal-500 bg-teal-500 text-white' : 'border-gray-300'
              }`}>
                {selected.includes(oi) && '✓'}
              </span>
              <span className="text-sm text-gray-700">
                <span className="font-semibold mr-2 text-gray-400">{String.fromCharCode(65 + oi)}.</span>
                {opt}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={answer || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Write your answer here..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none resize-none transition-all"
        />
      )}
    </div>
  );
}

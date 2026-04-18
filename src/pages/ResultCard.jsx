import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { calculateGrade, getPerformanceLabel } from '../utils/grading';
import { formatDuration, formatDateTime } from '../utils/helpers';
import { exportResultPDF } from '../utils/pdfExport';
import { exportResultImage } from '../utils/imageExport';
import ResultDonut from '../components/ResultDonut';
import GradeBadge from '../components/GradeBadge';
import {
  CheckCircle, X, FileDown, Image, AlertTriangle, Star, ThumbsUp,
  CheckCircle2, Minus, AlertCircle, Clock, Calendar, Shield
} from 'lucide-react';

export default function ResultCard() {
  const { examId, submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [exam, setExam] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const subSnap = await getDoc(doc(db, 'submissions', submissionId));
        if (!subSnap.exists()) return;
        const sub = { id: subSnap.id, ...subSnap.data() };
        setSubmission(sub);

        try {
          const examSnap = await getDoc(doc(db, 'exams', sub.exam_id));
          if (examSnap.exists()) {
            const examData = { id: examSnap.id, ...examSnap.data() };
            setExam(examData);
            try {
              const tSnap = await getDoc(doc(db, 'teachers', examData.teacher_id));
              if (tSnap.exists()) setTeacher(tSnap.data());
            } catch {
              // Students cannot read teacher profiles — safe to skip, decorative only.
            }
          }
        } catch {
          // Exam read failed (e.g. closed/draft status) — score & grade still show.
        }
      } catch (err) {
        console.error('ResultCard load error:', err);
      } finally {
        setLoading(false); // ← ALWAYS runs, no matter what. Fixes infinite spinner.
      }
    })();
  }, [submissionId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!submission || !exam) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
      Result not found.
    </div>
  );

  const pct = submission.percentage || 0;
  const gradeObj = calculateGrade(pct, exam.grading_system || 'bd');
  const perf = getPerformanceLabel(pct);
  const timeTakenStr = formatDuration(submission.time_taken_seconds);
  const submittedStr = formatDateTime(submission.submitted_at);

  const handlePDF = async () => {
    setExporting('pdf');
    try {
      await exportResultPDF({
        studentName: submission.student_name,
        examTitle: exam.title,
        schoolName: teacher?.school,
        teacherName: teacher?.name,
        score: submission.score,
        totalMarks: submission.total_marks,
        percentage: pct,
        grade: gradeObj.grade,
        timeTaken: timeTakenStr,
        submittedAt: submittedStr,
        violations: submission.violations,
        questions: exam.questions,
        answers: submission.answers,
      });
    } finally {
      setExporting('');
    }
  };

  const handleImage = async () => {
    setExporting('img');
    try {
      await exportResultImage('result-card', `ExamDesk_${submission.student_name?.replace(/\s+/g, '_')}`, {
        examTitle: exam.title,
        schoolName: teacher?.school,
        teacherName: teacher?.name,
        studentName: submission.student_name,
        rollNo: submission.roll_no,
        score: submission.score,
        totalMarks: submission.total_marks,
        percentage: submission.percentage,
        grade: gradeObj.grade,
        timeTaken: timeTakenStr,
        submittedAt: submittedStr,
        violations: submission.violations,
        questions: exam.questions,
        answers: submission.answers,
      });
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Action buttons */}
      <div className="max-w-xl mx-auto mb-4 flex justify-end gap-2">
        <button
          onClick={handlePDF}
          disabled={!!exporting}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <FileDown size={14} /> {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
        </button>
        <button
          onClick={handleImage}
          disabled={!!exporting}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Image size={14} /> {exporting === 'img' ? 'Exporting...' : 'Image'}
        </button>
      </div>

      {/* Result Card */}
      <div id="result-card" className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm animate-slide-up">
        {/* Header */}
        <div className="bg-teal-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
              <span className="font-display font-bold text-lg">ExamDesk</span>
            </div>
            {teacher?.school && <span className="text-teal-100 text-sm text-right max-w-[180px]">{teacher.school}</span>}
          </div>
          <h1 className="font-display font-bold text-xl">{exam.title}</h1>
          {teacher?.name && <p className="text-teal-200 text-sm mt-0.5">by {teacher.name}</p>}
        </div>

        <div className="px-8 py-7 space-y-7">
          {/* Student name */}
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Student</p>
            <h2 className="font-display font-bold text-gray-900 text-3xl">{submission.student_name}</h2>
            {submission.roll_no && <p className="text-sm text-gray-400 mt-0.5">Roll: {submission.roll_no}</p>}
          </div>

          {/* Donut + score */}
          <div className="flex flex-col items-center gap-4">
            <ResultDonut percentage={pct} size={180} />
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-gray-900">
                {submission.score} <span className="text-gray-300">/</span> {submission.total_marks}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">marks</p>
            </div>
            <GradeBadge grade={gradeObj.grade} pct={pct} size="lg" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Time Taken', value: timeTakenStr, icon: Clock },
              { label: 'Submitted', value: submittedStr?.split(',')[0] || '—', icon: Calendar },
              { label: 'Violations', value: submission.violations || 0, icon: Shield },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-3">
                <Icon size={14} className="text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-display font-bold text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Q breakdown */}
          <div>
            <h3 className="font-display font-semibold text-gray-900 mb-3">Question Breakdown</h3>
            <div className="space-y-2">
              {exam.questions?.map((q, i) => {
                const ans = submission.answers?.[i];
                const correct = ans?.correct;
                const studentAns = ans?.studentAnswer;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                      correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs mt-0.5 ${correct ? 'bg-green-500' : 'bg-red-400'}`}>
                      {correct ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-snug">Q{i + 1}. {q.text}</p>
                      <div className="mt-1.5 space-y-0.5">
                        {q.type === 'mcq' && (
                          <>
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Your answer: </span>
                              {Array.isArray(studentAns) && studentAns.length > 0
                                ? studentAns.map(idx => q.options?.[idx]).filter(Boolean).join(', ') || 'None'
                                : 'None'}
                            </p>
                            {!correct && (
                              <p className="text-xs text-green-700">
                                <span className="font-medium">Correct: </span>
                                {(q.correct_indices || []).map(idx => q.options?.[idx]).filter(Boolean).join(', ')}
                              </p>
                            )}
                            {q.explanation && (
                              <p className="text-xs text-gray-400 mt-1 italic">{q.explanation}</p>
                            )}
                          </>
                        )}
                        {q.type === 'cq' && (
                          <>
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Your answer: </span>{studentAns || '(no answer)'}
                            </p>
                            {!correct && q.accepted_answers && (
                              <p className="text-xs text-green-700">
                                <span className="font-medium">Expected: </span>{q.accepted_answers}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                      {ans?.marksAwarded || 0}/{q.marks}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-100 text-center text-xs text-gray-400">
          Generated by <span className="font-semibold text-teal-600">ExamDesk</span> — Free forever. by{' '}
          <a href="https://shakilxvs.com" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">@shakilxvs</a>
        </div>
      </div>
    </div>
  );
}

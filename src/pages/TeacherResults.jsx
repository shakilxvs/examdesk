import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { calculateGrade } from '../utils/grading';
import { formatDuration, formatDateTime } from '../utils/helpers';
import GradeBadge from '../components/GradeBadge';
import Footer from '../components/Footer';
import {
  ArrowLeft, CheckCircle, Users, TrendingUp, Award, AlertTriangle,
  ChevronDown, ChevronUp, Download, BarChart2, Filter
} from 'lucide-react';

export default function TeacherResults() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortDir, setSortDir] = useState('desc');
  const [filterGrade, setFilterGrade] = useState('all');

  useEffect(() => {
    getDoc(doc(db, 'exams', examId)).then(snap => {
      if (snap.exists()) setExam({ id: snap.id, ...snap.data() });
    });
  }, [examId]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'submissions'),
      where('exam_id', '==', examId),
      where('teacher_id', '==', user.uid)
    );
    return onSnapshot(q, snap => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [examId, user]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const sorted = [...submissions]
    .filter(s => {
      if (filterGrade === 'all') return true;
      if (filterGrade === 'pass') return (s.percentage || 0) >= 33;
      if (filterGrade === 'fail') return (s.percentage || 0) < 33;
      const g = calculateGrade(s.percentage || 0, exam?.grading_system || 'bd');
      return g.grade === filterGrade;
    })
    .sort((a, b) => {
      let va, vb;
      if (sortBy === 'score') { va = a.percentage || 0; vb = b.percentage || 0; }
      else if (sortBy === 'name') { va = a.student_name || ''; vb = b.student_name || ''; }
      else if (sortBy === 'violations') { va = a.violations || 0; vb = b.violations || 0; }
      else { va = a.submitted_at?.seconds || 0; vb = b.submitted_at?.seconds || 0; }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  // Analytics
  const total = submissions.length;
  const avg = total ? Math.round(submissions.reduce((s, x) => s + (x.percentage || 0), 0) / total) : 0;
  const highest = total ? Math.max(...submissions.map(s => s.percentage || 0)) : 0;
  const lowest = total ? Math.min(...submissions.map(s => s.percentage || 0)) : 0;
  const passRate = total ? Math.round((submissions.filter(s => (s.percentage || 0) >= 33).length / total) * 100) : 0;

  // Score distribution (10 buckets)
  const buckets = Array(10).fill(0);
  submissions.forEach(s => {
    const idx = Math.min(9, Math.floor((s.percentage || 0) / 10));
    buckets[idx]++;
  });
  const maxBucket = Math.max(...buckets, 1);

  const exportCSV = () => {
    const header = ['Name', 'Roll No', 'Score', 'Total', 'Percentage', 'Grade', 'Time Taken', 'Violations', 'Submitted'];
    const rows = submissions.map(s => {
      const g = calculateGrade(s.percentage || 0, exam?.grading_system || 'bd');
      return [
        s.student_name || '',
        s.roll_no || '',
        s.score || 0,
        s.total_marks || 0,
        `${(s.percentage || 0).toFixed(1)}%`,
        g.grade,
        formatDuration(s.time_taken_seconds),
        s.violations || 0,
        formatDateTime(s.submitted_at),
      ];
    });
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam?.title || 'results'}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center">
              <CheckCircle size={13} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">Results</span>
          </div>
          {exam && (
            <>
              <span className="text-gray-300 hidden sm:block">›</span>
              <span className="text-sm font-medium text-gray-700 hidden sm:block truncate max-w-xs">{exam.title}</span>
            </>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Submissions', value: total, icon: Users, color: 'teal' },
            { label: 'Avg Score',   value: `${avg}%`,     icon: TrendingUp, color: 'indigo' },
            { label: 'Highest',     value: `${Math.round(highest)}%`, icon: Award, color: 'amber' },
            { label: 'Lowest',      value: `${Math.round(lowest)}%`,  icon: BarChart2, color: 'violet' },
            { label: 'Pass Rate',   value: `${passRate}%`, icon: CheckCircle, color: 'rose' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                { teal: 'bg-teal-50 text-teal-600', indigo: 'bg-indigo-50 text-indigo-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600', rose: 'bg-rose-50 text-rose-600' }[color]
              }`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="font-display font-bold text-gray-900 text-xl leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Distribution chart */}
        {total > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-display font-semibold text-gray-900 mb-4">Score Distribution</h3>
            <div className="flex items-end gap-2 h-24">
              {buckets.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">{count > 0 ? count : ''}</span>
                  <div
                    className="w-full bg-teal-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(count / maxBucket) * 64}px`, minHeight: count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-gray-400">{i * 10}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
            >
              <option value="all">All students</option>
              <option value="pass">Pass only</option>
              <option value="fail">Fail only</option>
              <option value="A+">Grade A+</option>
              <option value="A">Grade A</option>
              <option value="A-">Grade A-</option>
              <option value="B">Grade B</option>
              <option value="C">Grade C</option>
              <option value="D">Grade D</option>
              <option value="F">Grade F</option>
            </select>
            <span className="text-sm text-gray-400">{sorted.length} shown</span>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No submissions yet</p>
            <p className="text-sm text-gray-400 mt-1">Share your exam link with students to get started.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <SortHeader col="name" label="Name" current={sortBy} dir={sortDir} onClick={toggleSort} span={3} />
              <SortHeader col="score" label="Score" current={sortBy} dir={sortDir} onClick={toggleSort} span={2} />
              <div className="col-span-2">Grade</div>
              <div className="col-span-2">Time</div>
              <SortHeader col="violations" label="Violations" current={sortBy} dir={sortDir} onClick={toggleSort} span={1} />
              <SortHeader col="submitted_at" label="Date" current={sortBy} dir={sortDir} onClick={toggleSort} span={2} />
            </div>

            {sorted.map((sub, idx) => {
              const g = calculateGrade(sub.percentage || 0, exam?.grading_system || 'bd');
              const isOpen = expanded === sub.id;
              return (
                <div key={sub.id} className={`border-b border-gray-50 last:border-0 ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <button
                    className="w-full grid grid-cols-12 gap-2 px-5 py-3.5 text-left hover:bg-gray-50 transition-colors items-center"
                    onClick={() => setExpanded(isOpen ? null : sub.id)}
                  >
                    <div className="col-span-3">
                      <p className="text-sm font-semibold text-gray-900 truncate">{sub.student_name}</p>
                      {sub.roll_no && <p className="text-xs text-gray-400">Roll: {sub.roll_no}</p>}
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-bold text-gray-900">{sub.score}/{sub.total_marks}</p>
                      <p className="text-xs text-gray-400">{(sub.percentage || 0).toFixed(1)}%</p>
                    </div>
                    <div className="col-span-2">
                      <GradeBadge grade={g.grade} pct={sub.percentage || 0} size="sm" />
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">
                      {formatDuration(sub.time_taken_seconds)}
                    </div>
                    <div className="col-span-1">
                      {sub.violations > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                          <AlertTriangle size={11} /> {sub.violations}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center gap-1 text-xs text-gray-400">
                      <span className="hidden lg:block">{formatDateTime(sub.submitted_at)?.split(',')[0]}</span>
                      {isOpen ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
                    </div>
                  </button>

                  {/* Expanded answer breakdown */}
                  {isOpen && (
                    <div className="px-5 pb-5 animate-fade-in">
                      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Answer Breakdown</p>
                        {exam?.questions?.map((q, i) => {
                          const ans = sub.answers?.[i];
                          const correct = ans?.correct;
                          const studentAns = ans?.studentAnswer;
                          return (
                            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                              correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                              <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs mt-0.5 ${correct ? 'bg-green-500' : 'bg-red-400'}`}>
                                {correct ? '✓' : '✗'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-xs">Q{i + 1}. {q.text}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Answer: {
                                    q.type === 'mcq'
                                      ? (Array.isArray(studentAns) && studentAns.length > 0 ? studentAns.map(idx => q.options?.[idx]).filter(Boolean).join(', ') : 'No answer')
                                      : (studentAns || 'No answer')
                                  }
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{ans?.marksAwarded || 0}/{q.marks}</span>
                            </div>
                          );
                        })}
                        {sub.violation_log?.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs font-semibold text-red-600 mb-1">Violation Log</p>
                            {sub.violation_log.map((v, i) => (
                              <p key={i} className="text-xs text-red-500">{v.type} — {new Date(v.time).toLocaleTimeString()}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SortHeader({ col, label, current, dir, onClick, span }) {
  const active = current === col;
  const spanMap = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4' };
  return (
    <button
      className={`${spanMap[span] || 'col-span-2'} flex items-center gap-1 hover:text-gray-600 transition-colors ${active ? 'text-teal-600' : ''}`}
      onClick={() => onClick(col)}
    >
      {label}
      {active && (dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
    </button>
  );
}

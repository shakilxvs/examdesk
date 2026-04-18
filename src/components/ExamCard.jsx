import { useState } from 'react';
import { MoreVertical, Pencil, Trash2, Share2, BarChart2, Clock, Shield, Users, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { copyToClipboard, getExamLink } from '../utils/helpers';

const TYPE_STYLES = {
  mcq:   { label: 'MCQ',   bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  cq:    { label: 'CQ',    bg: 'bg-violet-50 text-violet-700 border-violet-200' },
  mixed: { label: 'Mixed', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const STATUS_STYLES = {
  draft:     { label: 'Draft',     bg: 'bg-gray-100 text-gray-600' },
  published: { label: 'Live',      bg: 'bg-green-100 text-green-700' },
  closed:    { label: 'Closed',    bg: 'bg-red-100 text-red-600' },
};

export default function ExamCard({ exam, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const type = TYPE_STYLES[exam.type] || TYPE_STYLES.mcq;
  const status = STATUS_STYLES[exam.status] || STATUS_STYLES.draft;
  const qCount = exam.questions?.length ?? 0;

  const handleShare = async (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    try {
      await copyToClipboard(getExamLink(exam.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${type.bg}`}>{type.label}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg}`}>{status.label}</span>
          {exam.timed && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock size={10} /> {exam.duration_minutes}m
            </span>
          )}
          {exam.access === 'pin_protected' && (
            <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock size={10} /> PIN
            </span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreVertical size={16} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 w-44 animate-scale-in">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(exam); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil size={14} /> Edit Exam
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share2 size={14} /> {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate(`/teacher/exam/${exam.id}/results`); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <BarChart2 size={14} /> View Results
                </button>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(exam); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3 className="font-display font-semibold text-gray-900 text-base leading-snug mb-1">{exam.title}</h3>
      {exam.description && (
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{exam.description}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Shield size={11} /> {qCount} Qs</span>
          <span className="flex items-center gap-1"><Users size={11} /> {exam.submissionCount ?? 0}</span>
        </div>
        <button
          onClick={() => navigate(`/teacher/exam/${exam.id}/results`)}
          className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
        >
          <BarChart2 size={12} /> Results
        </button>
      </div>
    </div>
  );
}

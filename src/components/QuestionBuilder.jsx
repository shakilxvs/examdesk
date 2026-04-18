import { useState } from 'react';
import { GripVertical, Trash2, Copy, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

function MCQQuestion({ q, idx, onChange, onDelete, onDuplicate }) {
  const [collapsed, setCollapsed] = useState(false);

  const updateOption = (i, val) => {
    const opts = [...(q.options || [])];
    opts[i] = val;
    onChange({ ...q, options: opts });
  };

  const addOption = () => {
    if ((q.options || []).length >= 6) return;
    onChange({ ...q, options: [...(q.options || []), ''] });
  };

  const removeOption = (i) => {
    const opts = q.options.filter((_, idx) => idx !== i);
    const correct = (q.correct_indices || []).filter(ci => ci !== i).map(ci => ci > i ? ci - 1 : ci);
    onChange({ ...q, options: opts, correct_indices: correct });
  };

  const toggleCorrect = (i) => {
    const curr = q.correct_indices || [];
    const next = curr.includes(i) ? curr.filter(x => x !== i) : [...curr, i];
    onChange({ ...q, correct_indices: next });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <GripVertical size={16} className="text-gray-300 cursor-grab" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Q{idx + 1} · MCQ</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setCollapsed(v => !v)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors">
            <Copy size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Question Text *</label>
            <textarea
              value={q.text || ''}
              onChange={(e) => onChange({ ...q, text: e.target.value })}
              placeholder="Enter your question..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
              Options <span className="text-gray-400 font-normal">(tick correct answer(s))</span>
            </label>
            <div className="space-y-2">
              {(q.options || ['', '', '', '']).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCorrect(i)}
                    className={`w-5 h-5 rounded flex-shrink-0 border-2 transition-colors ${
                      (q.correct_indices || []).includes(i)
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'border-gray-300 hover:border-teal-400'
                    } flex items-center justify-center text-xs font-bold`}
                  >
                    {(q.correct_indices || []).includes(i) && '✓'}
                  </button>
                  <span className="text-xs font-bold text-gray-400 w-4">{String.fromCharCode(65 + i)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
                  />
                  {(q.options || []).length > 2 && (
                    <button onClick={() => removeOption(i)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {(q.options || []).length < 6 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-2 flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                <Plus size={13} /> Add Option
              </button>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Marks</label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={q.marks || 1}
                onChange={(e) => onChange({ ...q, marks: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Explanation (optional)</label>
              <input
                type="text"
                value={q.explanation || ''}
                onChange={(e) => onChange({ ...q, explanation: e.target.value })}
                placeholder="Shown after submission..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CQQuestion({ q, idx, onChange, onDelete, onDuplicate }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <GripVertical size={16} className="text-gray-300 cursor-grab" />
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Q{idx + 1} · Written</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setCollapsed(v => !v)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button onClick={onDuplicate} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400">
            <Copy size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Question Text *</label>
            <textarea
              value={q.text || ''}
              onChange={(e) => onChange({ ...q, text: e.target.value })}
              placeholder="Enter your question..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Accepted Answers <span className="text-gray-400 font-normal">(comma-separated variants)</span>
            </label>
            <input
              type="text"
              value={q.accepted_answers || ''}
              onChange={(e) => onChange({ ...q, accepted_answers: e.target.value })}
              placeholder="e.g. Dhaka, dhaka, ঢাকা"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
            />
          </div>

          <div className="flex gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Marks</label>
              <input
                type="number"
                min={1}
                value={q.marks || 5}
                onChange={(e) => onChange({ ...q, marks: parseFloat(e.target.value) || 5 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Teacher Hint (private)</label>
              <input
                type="text"
                value={q.hint || ''}
                onChange={(e) => onChange({ ...q, hint: e.target.value })}
                placeholder="Internal note for grading..."
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestionBuilder({ questions, onChange, type }) {
  const addQuestion = (qtype) => {
    const base = { id: Date.now().toString(), type: qtype, text: '', marks: qtype === 'mcq' ? 1 : 5 };
    const extra = qtype === 'mcq'
      ? { options: ['', '', '', ''], correct_indices: [] }
      : { accepted_answers: '', hint: '' };
    onChange([...questions, { ...base, ...extra }]);
  };

  const updateQuestion = (i, updated) => {
    const arr = [...questions];
    arr[i] = updated;
    onChange(arr);
  };

  const deleteQuestion = (i) => onChange(questions.filter((_, idx) => idx !== i));

  const duplicateQuestion = (i) => {
    const dupe = { ...questions[i], id: Date.now().toString() };
    const arr = [...questions];
    arr.splice(i + 1, 0, dupe);
    onChange(arr);
  };

  const totalMarks = questions.reduce((sum, q) => sum + (parseFloat(q.marks) || 0), 0);

  return (
    <div className="space-y-4">
      {questions.map((q, i) =>
        q.type === 'mcq' ? (
          <MCQQuestion
            key={q.id}
            q={q} idx={i}
            onChange={(u) => updateQuestion(i, u)}
            onDelete={() => deleteQuestion(i)}
            onDuplicate={() => duplicateQuestion(i)}
          />
        ) : (
          <CQQuestion
            key={q.id}
            q={q} idx={i}
            onChange={(u) => updateQuestion(i, u)}
            onDelete={() => deleteQuestion(i)}
            onDuplicate={() => duplicateQuestion(i)}
          />
        )
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        {(type === 'mcq' || type === 'mixed') && (
          <button
            type="button"
            onClick={() => addQuestion('mcq')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors"
          >
            <Plus size={15} /> Add MCQ
          </button>
        )}
        {(type === 'cq' || type === 'mixed') && (
          <button
            type="button"
            onClick={() => addQuestion('cq')}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl text-sm font-semibold hover:bg-violet-100 transition-colors"
          >
            <Plus size={15} /> Add Written
          </button>
        )}
        {questions.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl">
            <span className="text-xs text-gray-400 font-medium">Total:</span>
            <span className="text-sm font-display font-bold text-gray-900">{totalMarks} marks</span>
          </div>
        )}
      </div>
    </div>
  );
}

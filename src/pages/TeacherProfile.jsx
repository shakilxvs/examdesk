import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getInitials, getAvatarColor } from '../utils/helpers';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import Footer from '../components/Footer';

export default function TeacherProfile() {
  const { user, teacher, refreshTeacher } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '', school: '', phone: '', whatsapp: '', website: '', bio: '',
  });

  useEffect(() => {
    if (teacher) {
      setForm({
        name: teacher.name || '',
        school: teacher.school || '',
        phone: teacher.phone || '',
        whatsapp: teacher.whatsapp || '',
        website: teacher.website || '',
        bio: teacher.bio || '',
      });
    }
  }, [teacher]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, 'teachers', user.uid), {
        ...form,
        avatar_initials: getInitials(form.name),
      });
      await refreshTeacher();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const initials = getInitials(form.name || teacher?.name || 'T');
  const avatarBg = getAvatarColor(form.name || teacher?.name || '');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/teacher/dashboard')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center">
              <CheckCircle size={13} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">Profile Settings</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Avatar */}
        <div className="flex justify-center mb-8">
          <div className={`w-20 h-20 rounded-2xl ${avatarBg} flex items-center justify-center shadow-sm`}>
            <span className="text-white text-2xl font-display font-bold">{initials}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
          {saved && (
            <div className="mb-5 bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle size={15} /> Profile saved successfully!
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name" required>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Your full name" required className="input" />
              </Field>
              <Field label="School / Institute">
                <input type="text" value={form.school} onChange={e => set('school', e.target.value)}
                  placeholder="Where you teach" className="input" />
              </Field>
              <Field label="Phone">
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+880..." className="input" />
              </Field>
              <Field label="WhatsApp">
                <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  placeholder="+880..." className="input" />
              </Field>
              <Field label="Email" hint="Cannot be changed">
                <input type="email" value={user?.email || ''} readOnly
                  className="input bg-gray-50 text-gray-400 cursor-not-allowed" />
              </Field>
              <Field label="Website">
                <input type="url" value={form.website} onChange={e => set('website', e.target.value)}
                  placeholder="https://..." className="input" />
              </Field>
            </div>

            <Field label="Bio">
              <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                placeholder="A short bio shown to students on your exams..."
                rows={3} className="input resize-none" />
            </Field>

            <button
              type="submit" disabled={loading}
              className="w-full sm:w-auto flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-7 py-3 rounded-xl transition-colors"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} /> Save Profile</>
              )}
            </button>
          </form>
        </div>
      </div>

      <Footer />
      <style>{`.input { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; } .input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }`}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

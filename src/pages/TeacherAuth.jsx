import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { friendlyFirebaseError, getInitials } from '../utils/helpers';
import { CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function TeacherAuth() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', school: '', email: '', password: '', confirm: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!form.name.trim()) return setError('Please enter your full name.');
      if (form.password !== form.confirm) return setError('Passwords do not match.');
      if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
        await setDoc(doc(db, 'teachers', cred.user.uid), {
          name: form.name.trim(),
          school: form.school.trim(),
          email: form.email.trim(),
          avatar_initials: getInitials(form.name),
          created_at: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      }
      navigate('/teacher/dashboard');
    } catch (err) {
      setError(friendlyFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-600 rounded-md flex items-center justify-center">
              <CheckCircle size={13} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">ExamDesk</span>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {/* Mode toggle */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-7">
              {['login', 'signup'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h1 className="font-display font-bold text-gray-900 text-2xl mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              {mode === 'login' ? 'Log in to your teacher dashboard.' : 'Free forever — no credit card needed.'}
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <Field label="Full Name" required>
                    <input
                      type="text" value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Your full name" required
                      className="input"
                    />
                  </Field>
                  <Field label="School / Institute / Coaching Centre">
                    <input
                      type="text" value={form.school} onChange={e => set('school', e.target.value)}
                      placeholder="Where do you teach?"
                      className="input"
                    />
                  </Field>
                </>
              )}

              <Field label="Email Address" required>
                <input
                  type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com" required
                  className="input"
                />
              </Field>

              <Field label="Password" required>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                    required className="input pr-10"
                  />
                  <button
                    type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>

              {mode === 'signup' && (
                <Field label="Confirm Password" required>
                  <input
                    type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                    placeholder="Repeat password" required className="input"
                  />
                </Field>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Please wait...</>
                ) : mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-teal-600 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Sign Up free' : 'Log in'}
            </button>
          </p>
        </div>
      </div>

      <Footer />

      <style>{`.input { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #e5e7eb; border-radius: 0.75rem; font-size: 0.875rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; } .input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }`}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

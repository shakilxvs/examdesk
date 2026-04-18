import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { friendlyFirebaseError, getInitials } from '../utils/helpers';
import { CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const googleProvider = new GoogleAuthProvider();

export default function TeacherAuth() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', school: '', email: '', password: '', confirm: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Google Sign-In ──
  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if teacher profile already exists
      const snap = await getDoc(doc(db, 'teachers', user.uid));
      if (!snap.exists()) {
        // First time — create profile from Google account data
        await setDoc(doc(db, 'teachers', user.uid), {
          name: user.displayName || '',
          school: '',
          email: user.email || '',
          avatar_initials: getInitials(user.displayName || user.email || 'T'),
          created_at: serverTimestamp(),
        });
      }
      navigate('/teacher/dashboard');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyFirebaseError(err.code));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Email/Password Submit ──
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
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all disabled:opacity-50 mb-5"
            >
              {googleLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-medium">or with email</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <Field label="Full Name" required>
                    <input
                      type="text" value={form.name} onChange={e => set('name', e.target.value)}
                      placeholder="Your full name" required className="input"
                    />
                  </Field>
                  <Field label="School / Institute / Coaching Centre">
                    <input
                      type="text" value={form.school} onChange={e => set('school', e.target.value)}
                      placeholder="Where do you teach?" className="input"
                    />
                  </Field>
                </>
              )}

              <Field label="Email Address" required>
                <input
                  type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com" required className="input"
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
                type="submit" disabled={loading || googleLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-1 flex items-center justify-center gap-2"
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

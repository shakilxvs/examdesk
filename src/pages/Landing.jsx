import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Clock, Lock, Zap, FileDown, Brain,
  ArrowRight, BookOpen, CheckCircle
} from 'lucide-react';
import Footer from '../components/Footer';

const FEATURES = [
  { icon: ClipboardList, title: 'MCQ & Written Exams', desc: 'Build any exam type — multiple choice, written answers, or mix both.' },
  { icon: Clock,         title: 'Timed or Open',       desc: 'Set a countdown timer or let students take their time.' },
  { icon: Lock,          title: 'PIN Protection',       desc: 'Secure your exams with a PIN so only your students can enter.' },
  { icon: Zap,           title: 'Instant Results',      desc: 'Auto-graded results with grade badges the moment students submit.' },
  { icon: FileDown,      title: 'PDF Reports',          desc: 'Download beautiful A4 result cards and full exam reports.' },
  { icon: Brain,         title: 'Smart Matching',       desc: 'Handles "50" = "50.0", fractions, spelling variants and more.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center">
              <CheckCircle size={15} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">ExamDesk</span>
          </div>
          <button
            onClick={() => navigate('/teacher/auth')}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            Teacher Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <BookOpen size={12} /> Free for teachers — forever
        </div>

        <h1 className="font-display font-extrabold text-gray-900 text-5xl sm:text-6xl leading-tight mb-6">
          Run smarter exams.<br />
          <span className="text-teal-600">Get instant results.</span>
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Create MCQ and written tests in minutes. Share a link. Students take it on any device. Results appear instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/teacher/auth')}
            className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors text-base shadow-sm"
          >
            I'm a Teacher — Get Started <ArrowRight size={17} />
          </button>
          <button
            onClick={() => {
              const code = prompt('Enter your exam code or paste the full link:');
              if (code) {
                const match = code.match(/exam\/([a-zA-Z0-9]+)/);
                if (match) navigate(`/exam/${match[1]}`);
                else navigate(`/exam/${code.trim()}`);
              }
            }}
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold px-6 py-3.5 rounded-xl transition-colors text-base"
          >
            <ClipboardList size={17} /> I'm a Student — Enter Exam Code
          </button>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:border-teal-200 hover:bg-teal-50/30 transition-all duration-200">
              <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                <Icon size={18} className="text-teal-600" />
              </div>
              <h3 className="font-display font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA bottom */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="bg-teal-600 rounded-3xl p-10 sm:p-14 text-center">
          <h2 className="font-display font-bold text-white text-3xl sm:text-4xl mb-4">
            Ready to transform your exams?
          </h2>
          <p className="text-teal-100 mb-8 text-base">No credit card. No downloads. Just sign up and start.</p>
          <button
            onClick={() => navigate('/teacher/auth')}
            className="inline-flex items-center gap-2 bg-white text-teal-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-teal-50 transition-colors shadow-sm"
          >
            Create Free Account <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

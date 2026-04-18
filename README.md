# ExamDesk

**Run smarter exams. Get instant results.**

ExamDesk is a free, open-source exam platform for teachers. Create MCQ and written tests, share a link, students take it on any device, results appear instantly — all powered by Firebase's free Spark plan.

---

## Features

- **MCQ, Written (CQ), or Mixed** exam types
- **Timed or open** exams with auto-submit
- **PIN-protected** access or open links
- **One-time access** enforcement per student
- **Anti-cheat**: fullscreen lock, tab/window violation tracking, blocked shortcuts
- **Smart answer matching**: "50" = "50.0" = "1/2" for "0.5", case-insensitive, Unicode
- **Instant results** with animated donut chart and grade badges
- **PDF & Image export** of result cards
- **Bangladeshi and International grading** systems
- **Real-time dashboard** with Firestore live listeners
- **No student accounts needed** — students access via link only

---

## Tech Stack

| Layer       | Tech                            |
|-------------|----------------------------------|
| Frontend    | React 18 + Vite                  |
| Styling     | Tailwind CSS                     |
| Icons       | Lucide React                     |
| Auth        | Firebase Authentication          |
| Database    | Firebase Firestore               |
| Export      | jsPDF + html2canvas              |
| Routing     | React Router v6                  |

---

## Quick Start

### 1. Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. `examdesk`)
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database** (start in test mode)
5. Go to **Project Settings → Your apps → Web** and copy your config

### 2. Environment Variables

Create a `.env.local` file in the project root (**never commit this file**):

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Firestore Security Rules

Apply these rules in **Firestore → Rules** before going live:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /teachers/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /rooms/{roomId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.teacher_id;
      allow create: if request.auth != null;
    }

    match /exams/{examId} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth != null
        && request.auth.uid == resource.data.teacher_id;
      allow create: if request.auth != null;
    }

    match /submissions/{subId} {
      allow create: if true;
      allow read: if request.auth != null
        && request.auth.uid == resource.data.teacher_id;
    }
  }
}
```

---

## Deploy Free on Vercel (Recommended)

1. Push your project to GitHub (make sure `.env.local` is in `.gitignore`)
2. Go to [vercel.com](https://vercel.com) and import your repo
3. In **Project Settings → Environment Variables**, add all 6 `VITE_FIREBASE_*` variables
4. Click **Deploy** — live in ~1 minute

Free forever on Vercel Hobby plan.

---

## Deploy Free on Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Set public directory to: dist
# Configure as SPA: Yes
npm run build
firebase deploy
```

---

## Project Structure

```
src/
├── components/
│   ├── AuthGuard.jsx        — Redirects unauthenticated users
│   ├── ExamCard.jsx         — Exam card with actions menu
│   ├── Footer.jsx           — Shared footer
│   ├── GradeBadge.jsx       — Grade + performance badge
│   ├── Modal.jsx            — Reusable modal dialog
│   ├── PinInput.jsx         — 4-6 digit PIN input
│   ├── ProgressBar.jsx      — Answered/total progress bar
│   ├── QuestionBuilder.jsx  — MCQ + CQ question editor
│   ├── ResultDonut.jsx      — Animated SVG score donut
│   ├── RoomCard.jsx         — Room card with color accent
│   ├── StatCard.jsx         — Dashboard stat widget
│   ├── Timer.jsx            — Countdown timer widget
│   └── ViolationBanner.jsx  — Anti-cheat violation toast
│
├── context/
│   └── AuthContext.jsx      — Firebase auth state + teacher profile
│
├── hooks/
│   └── useTimer.js          — Countdown timer hook
│
├── pages/
│   ├── Landing.jsx          — Marketing homepage
│   ├── TeacherAuth.jsx      — Login + Signup
│   ├── TeacherDashboard.jsx — Rooms, exams, stats
│   ├── TeacherProfile.jsx   — Edit teacher profile
│   ├── RoomDetail.jsx       — Room exam list
│   ├── ExamCreate.jsx       — 3-step exam wizard (create + edit)
│   ├── ExamView.jsx         — Student exam page with anti-cheat
│   ├── ResultCard.jsx       — Certificate-style result card
│   └── TeacherResults.jsx   — Submission analytics + CSV export
│
├── utils/
│   ├── answerMatcher.js     — Smart CQ answer normalizer
│   ├── anticheat.js         — Event listeners for anti-cheat
│   ├── grading.js           — BD + international grade tables
│   ├── helpers.js           — Dates, colors, clipboard, errors
│   ├── imageExport.js       — html2canvas PNG export
│   └── pdfExport.js         — jsPDF A4 result PDF
│
├── firebase.js              — Firebase app init
├── App.jsx                  — React Router routes
├── main.jsx                 — React entry point
└── index.css                — Tailwind + global styles
```

---

## Data Model

```
/teachers/{uid}
  name, school, phone, whatsapp, email, website, bio, avatar_initials, created_at

/rooms/{roomId}
  teacher_id, name, subject, color_tag, created_at

/exams/{examId}
  room_id, teacher_id, title, description
  type: "mcq" | "cq" | "mixed"
  timed: bool, duration_minutes: int
  display_mode: "one_at_a_time" | "all_at_once"
  access: "open" | "pin_protected", pin: string|null
  one_time_access: bool
  notes: string
  grading_system: "bd" | "intl"
  status: "draft" | "published" | "closed"
  questions: [{ id, type, text, options, correct_indices, marks, explanation, accepted_answers, hint }]
  created_at

/submissions/{submissionId}
  exam_id, teacher_id, student_name, roll_no, student_uid
  answers: [{ questionIdx, studentAnswer, correct, marksAwarded }]
  score, total_marks, percentage, grade
  violations: int, violation_log: [{ type, time }]
  started_at, submitted_at, time_taken_seconds
```

---

## Grading Systems

### Bangladeshi (default)
| Grade | Range  |
|-------|--------|
| A+    | 80–100 |
| A     | 70–79  |
| A-    | 60–69  |
| B     | 50–59  |
| C     | 40–49  |
| D     | 33–39  |
| F     | 0–32   |

### International
| Grade | Range  |
|-------|--------|
| A     | 90–100 |
| B     | 75–89  |
| C     | 60–74  |
| D     | 45–59  |
| F     | 0–44   |

---

## Built by

Free forever. by [@shakilxvs](https://shakilxvs.com)

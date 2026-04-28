# StudyGenie AI 🧞‍♂️

**The first cognitive learning engine that understands your intent through Socratic dialogue and verified mastery.**

StudyGenie AI moves beyond passive content consumption. It employs the Socratic method to guide you through complex topics, identifying logical gaps in real-time and pushing you toward true conceptual mastery.

---

## 🚀 Vision

Most learning platforms focus on *what* to memorize. StudyGenie AI focuses on *how* you think. By engaging in a guided internal dialogue with an AI tutor, you build structural knowledge instead of fragile memory blocks.

---

## ✨ Key Features

### 🧠 Socratic Tutor
The heart of StudyGenie. Engage in a deep-dive conversation where the AI doesn't just give answers, but asks the right questions to lead you to discovery.
- **Dynamic Mastery Score:** Tracks your level of understanding in real-time.
- **Solution Unlocking:** Comprehensive solutions stay hidden until you prove your logic.
- **Multi-modal Support:** Seamlessly switch between text and voice logic sessions.

### 📊 Performance Dashboard
Visualize your cognitive journey with precision:
- **Topic Mastery Trends:** Watch your proficiency grow across different subjects.
- **Progress Tracking:** Interactive charts powered by `recharts`.
- **Knowledge Gaps:** Identify exactly which concepts need more focus.

### 🏆 Verified Mastery (Certificates)
Earn cryptographically-signed PDF certificates once you achieve 80%+ mastery in a topic. 
- **Proof of Logic:** Certificates include a unique QR code for verification.
- **Downloadable:** Export your achievements as high-quality PDFs using `jspdf` and `html2canvas`.

### 🛡️ Exam Mode
Test your limits under pressure. No guidance, no hints—just you and the problem. Achieving mastery here is the ultimate proof of proficiency.

### 👥 Collaborative Teams & Leaderboard
- **Logic Teams:** Join or create teams to track collective progress.
- **Global Rankings:** Compete on the leaderboard based on your verified mastery scores.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **AI Engine:** [Google Gemini API](https://ai.google.dev/) (via `@google/genai`)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Animations:** [Motion](https://motion.dev/) (Framer Motion)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Charts:** [Recharts](https://recharts.org/)
- **Visualization:** Three.js / React Force Graph (for knowledge mapping)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 📂 Project Structure

- `/app`: Next.js App Router (Dashboard, Tutor, Exam, Profiles).
- `/components`: Reusable UI components (Modals, Charts, Sidebars).
- `/context`: Global state management for sessions and authentication.
- `/lib`: Supabase client and utility helpers.
- `/public`: Static assets and branding.

---

## 🛠️ Setup & Local Development

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up Environment Variables:**
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Run the development server:**
   ```bash
   npm run dev
   ```
5. **Build for production:**
   ```bash
   npm run build
   ```

---



## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
---

## 📄 License
**This project is licensed under the MIT License - see the LICENSE file for details.
Built with ❤️ by the StudyGenie Team.**
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDfHxDx1hG-kSCNGl6AecgoE_KC6YY_Wmc",
  authDomain: "smart-quiz-system-12c68.firebaseapp.com",
  projectId: "smart-quiz-system-12c68",
  storageBucket: "smart-quiz-system-12c68.firebasestorage.app",
  messagingSenderId: "738008992865",
  appId: "1:738008992865:web:51e70d8ee85b4bf3326e20"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= STATE ================= */
let questions = [];
let index = 0;
let answers = [];
let timeLeft = 1800;
let timer = null;
let examStarted = false;

const EXAM_KEY = "exam_active";
const STATE_KEY = "exam_state";

/* ================= TAB SWITCH CONTROL ================= */
let tabSwitchCount = 0;

/* ================= LOGIN ================= */
window.login = async function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  const studentName = document.getElementById("studentName")?.value || "Unknown";

  try {
    await signInWithEmailAndPassword(auth, email, pass);

    sessionStorage.setItem(EXAM_KEY, "1");
    sessionStorage.setItem("studentName", studentName);

    showRules();
  } catch (e) {
    alert(e.message);
  }
};

/* ================= RULES ================= */
function showRules() {
  document.getElementById("loginBox").style.display = "none";

  const box = document.createElement("div");
  box.innerHTML = `
    <div style="padding:20px;background:#111;color:white;text-align:center">
      <h2>Exam Rules</h2>
      <p>No tab switching allowed</p>
      <p>No copy/paste allowed</p>
      <p>Auto submit after 2 warnings</p>
      <h3>Starting in <span id="c">5</span></h3>
    </div>
  `;
  document.body.appendChild(box);

  let c = 5;
  const i = setInterval(() => {
    c--;
    const el = document.getElementById("c");
    if (el) el.innerText = c;

    if (c <= 0) {
      clearInterval(i);
      box.remove();
      startExam();
    }
  }, 1000);
}

/* ================= START ================= */
async function startExam() {
  if (examStarted) return;
  examStarted = true;

  document.querySelector(".quiz-container").style.display = "block";

  const snap = await getDocs(collection(db, "questions"));
  questions = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  const saved = JSON.parse(localStorage.getItem(STATE_KEY));

  if (saved) {
    index = saved.index || 0;
    answers = saved.answers || [];
    timeLeft = saved.timeLeft || 1800;
  }

  render();
  buildSidebar();
  startTimer();

  setTimeout(() => {
    document.documentElement.requestFullscreen?.();
  }, 300);

  bindButtons();
}

/* ================= RENDER ================= */
function render() {
  const q = questions[index];
  if (!q) return;

  document.getElementById("qCounter").innerText =
    `Q ${index + 1} / ${questions.length}`;

  document.getElementById("question").innerText = q.question;

if (q.type === "mcq") {
  document.getElementById("options").innerHTML = `
    <div style="
      display: grid;
      gap: 12px;
      margin-top: 15px;
    ">
      ${q.options.map((opt, i) => `
        <div onclick="selectMCQ('${opt}')"
          style="
            padding: 14px 16px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            color: white;
            background: ${
              answers[index]?.answer === opt
                ? 'linear-gradient(135deg,#00c853,#009624)'
                : 'linear-gradient(135deg,#2b2b2b,#1c1c1c)'
            };
            border: 1px solid ${
              answers[index]?.answer === opt ? '#00e676' : '#444'
            };
            transition: all 0.2s ease;
            box-shadow: ${
              answers[index]?.answer === opt
                ? '0 0 12px rgba(0,255,100,0.4)'
                : 'none'
            };
          "
          onmouseover="this.style.transform='scale(1.02)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          <span style="
            display:inline-block;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            text-align:center;
            line-height:26px;
            margin-right:10px;
            font-size:13px;
          ">
            ${String.fromCharCode(65 + i)}
          </span>

          ${opt}
        </div>
      `).join("")}
    </div>
  `;
} else {
    document.getElementById("options").innerHTML =
      `<textarea id="ans">${answers[index]?.answer || ""}</textarea>`;
  }

  saveState();
}

/* ================= MCQ FIXED ================= */
window.selectMCQ = function (value) {
  answers[index] = {
    question: questions[index].question,
    answer: value
  };

  render();
  buildSidebar();
  saveState();
};

/* ================= SAVE ================= */
function save() {
  const q = questions[index];
  if (!q) return;

  answers[index] = {
    question: q.question,
    answer: q.type === "mcq"
      ? answers[index]?.answer || ""
      : document.getElementById("ans")?.value || ""
  };

  saveState();
}

/* ================= NAV ================= */
function nextQuestion() {
  save();

  if (index < questions.length - 1) {
    index++;
    render();
    buildSidebar();
  } else {
    finishExam();
  }
}

function prevQuestion() {
  save();

  if (index > 0) {
    index--;
    render();
    buildSidebar();
  }
}

/* ================= BUTTON BIND ================= */
function bindButtons() {
  document.getElementById("nextBtn").onclick = nextQuestion;
  document.getElementById("backBtn").onclick = prevQuestion;
}

/* ================= SIDEBAR ================= */
function buildSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";

  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.innerText = i + 1;
    btn.style.background = answers[i]?.answer ? "green" : "#333";

    btn.onclick = () => {
      save();
      index = i;
      render();
    };

    sidebar.appendChild(btn);
  });
}

/* ================= TIMER ================= */
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;

    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;

    document.getElementById("timeText").innerText =
      `Time: ${m}:${s < 10 ? "0" + s : s}`;

    saveState();

    if (timeLeft <= 0) finishExam();
  }, 1000);
}

/* ================= FINISH ================= */
function finishExam() {
  clearInterval(timer);

  document.getElementById("question").innerText = "Exam Finished";
  document.getElementById("options").innerHTML = "";

  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  const exitBtn = document.getElementById("exitBtn");

  nextBtn.innerText = "Download PDF";
  nextBtn.onclick = downloadPDF;

  backBtn.disabled = true;
  if (exitBtn) exitBtn.disabled = true;
}

/* ================= PDF ================= */
window.downloadPDF = function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const name = sessionStorage.getItem("studentName") || "Unknown";

  let y = 20;

  doc.text("OFFICIAL EXAM PAPER", 60, 10);
  doc.text("Student: " + name, 10, y);
  y += 10;

  answers.forEach((a, i) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(`Q${i + 1}: ${a.question}`, 10, y);
    y += 7;

    doc.text(`Ans: ${a.answer}`, 10, y);
    y += 10;
  });

  doc.save("exam.pdf");

  const exitBtn = document.getElementById("exitBtn");
  if (exitBtn) {
    exitBtn.disabled = false;
    exitBtn.onclick = exitExam;
  }
};

/* ================= EXIT ================= */
window.exitExam = async function () {
  await signOut(auth);

  localStorage.clear();
  sessionStorage.clear();

  location.reload();
};

/* ================= SAVE ================= */
function saveState() {
  localStorage.setItem(STATE_KEY, JSON.stringify({
    index,
    answers,
    timeLeft
  }));
}

/* ================= TAB SWITCH AUTO SUBMIT ================= */
document.addEventListener("visibilitychange", () => {
  if (!examStarted) return;

  if (document.hidden) {
    tabSwitchCount++;

    if (tabSwitchCount >= 2) {
      alert("Auto submit triggered!");
      finishExam();
    } else {
      alert("Warning: Tab switch detected!");
    }
  }
});

/* ================= COPY PASTE BLOCK ================= */
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());
document.addEventListener("cut", e => e.preventDefault());

/* ================= AUTH ================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    examStarted = false;
    document.getElementById("loginBox").style.display = "block";
    document.querySelector(".quiz-container").style.display = "none";
  }
});
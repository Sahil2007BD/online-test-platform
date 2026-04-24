import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
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
let timeLeft = 0;
let totalTime = 0;
let timer = null;
let examStarted = false;
let tabSwitchCount = 0;

/* ================= FULLSCREEN ================= */
function enterFullscreen() {
  const el = document.documentElement;

  if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {});
  } 
  else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } 
  else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}

/* ================= LOGIN ================= */
window.login = async function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  const studentName = document.getElementById("studentName")?.value || "Student";
  const examMinutes = parseInt(document.getElementById("examTime").value);

  if (!examMinutes) return alert("Enter valid time");

  try {
    await signInWithEmailAndPassword(auth, email, pass);

    sessionStorage.setItem("studentName", studentName);

    totalTime = examMinutes * 60;
    timeLeft = totalTime;

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
    <div style="padding:20px;background:#111;color:#fff;text-align:center">
      <h2>Exam Rules</h2>
      <p>No tab switching</p>
      <p>No copy/paste</p>
      <p>Auto Submit after 2 violations</p>
      <h3>Starting in <span id="c">5</span></h3>
    </div>
  `;
  document.body.appendChild(box);

  let c = 5;
  const i = setInterval(() => {
    c--;
    document.getElementById("c").innerText = c;
    if (c <= 0) {
      clearInterval(i);
      box.remove();
      startExam();
    }
  }, 1000);
}

/* ================= START ================= */
async function startExam() {
  examStarted = true;

  document.querySelector(".quiz-container").style.display = "block";

  const snap = await getDocs(collection(db, "questions"));
  questions = snap.docs.map(d => d.data());

  answers = new Array(questions.length).fill(null);

  index = 0;

  render();
  buildSidebar();
  bindButtons();
  startTimer();

  document.getElementById("exitBtn").disabled = true;

  setTimeout(() => enterFullscreen(), 300);
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && examStarted) {
    alert("Please stay in fullscreen!");
    enterFullscreen();
  }
});

/* ================= RENDER ================= */
function render() {
  const q = questions[index];
  if (!q) return;

  document.getElementById("qCounter").innerText =
    `Q ${index + 1} / ${questions.length}`;

  document.getElementById("question").innerText = q.question;

  const optBox = document.getElementById("options");

  if (q.type === "mcq") {
    optBox.innerHTML = q.options.map((opt, i) => `
      <div onclick="selectMCQ('${opt}')"
        style="padding:12px;margin:8px 0;cursor:pointer;
        background:${answers[index] === opt ? 'green' : '#222'}">
        ${String.fromCharCode(65 + i)}. ${opt}
      </div>
    `).join("");
  } else {
    optBox.innerHTML = `<textarea id="ans">${answers[index] || ""}</textarea>`;
  }

  updateButtons();
}

/* ================= MCQ ================= */
window.selectMCQ = function (v) {
  answers[index] = v;
  render();
  buildSidebar();
};

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

/* ================= SAVE ================= */
function save() {
  const q = questions[index];
  if (!q) return;

  answers[index] =
    q.type === "mcq"
      ? answers[index]
      : document.getElementById("ans")?.value || "";
}

/* ================= BUTTON CONTROL ================= */
function bindButtons() {
  document.getElementById("nextBtn").onclick = nextQuestion;
  document.getElementById("backBtn").onclick = prevQuestion;
  document.getElementById("exitBtn").onclick = exitExam;
}

/* ================= UPDATE BUTTON STATE ================= */
function updateButtons() {
  const nextBtn = document.getElementById("nextBtn");

  if (index === questions.length - 1) {
    nextBtn.innerText = "Download";
    nextBtn.onclick = downloadPDF;
  } else {
    nextBtn.innerText = "Next";
    nextBtn.onclick = nextQuestion;
  }
}

/* ================= SIDEBAR ================= */
function buildSidebar() {
  const side = document.getElementById("sidebar");
  side.innerHTML = "";

  questions.forEach((_, i) => {
    const b = document.createElement("button");
    b.innerText = i + 1;
    b.style.background = answers[i] ? "green" : "#333";

    b.onclick = () => {
      save();
      index = i;
      render();
      buildSidebar();
    };

    side.appendChild(b);
  });
}

/* ================= TIMER ================= */
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;

    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;

    const timeText = document.getElementById("timeText");
    timeText.innerText = `Time: ${m}:${s < 10 ? "0" + s : s}`;

    // 🔴 LAST 10 MIN WARNING
    if (timeLeft <= 600) {
      timeText.style.color = "red";
      timeText.style.fontWeight = "bold";
    } else {
      timeText.style.color = "white";
      timeText.style.fontWeight = "normal";
    }

    if (timeLeft <= 0) {
      finishExam();
    }
  }, 1000);
}

/* ================= FINISH ================= */
function finishExam() {
  clearInterval(timer);

  document.getElementById("question").innerText = "Exam Finished";
  document.getElementById("options").innerHTML = "";

  document.getElementById("nextBtn").innerText = "Download";
  document.getElementById("nextBtn").onclick = downloadPDF;

  document.getElementById("exitBtn").disabled = false;
}

/* ================= DOWNLOAD ================= */
window.downloadPDF = function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const name = sessionStorage.getItem("studentName");

  let y = 20;

  doc.text("EXAM RESULT", 10, 10);
  doc.text("Student: " + name, 10, y);
  y += 10;

  answers.forEach((a, i) => {
    doc.text(`Q${i + 1}: ${questions[i].question}`, 10, y);
    y += 7;

    doc.text(`Ans: ${a || ""}`, 10, y);
    y += 10;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("exam.pdf");

  setTimeout(() => {
    document.getElementById("exitBtn").disabled = false;
  }, 1000);
};

/* ================= EXIT ================= */
function exitExam() {
  exitFullscreen();
  location.reload();
}

/* ================= TAB SWITCH ================= */
document.addEventListener("visibilitychange", () => {
  if (!examStarted) return;

  if (document.hidden) {
    tabSwitchCount++;
    if (tabSwitchCount >= 2) finishExam();
  }
});

/* ================= COPY BLOCK ================= */
document.addEventListener("copy", e => e.preventDefault());
document.addEventListener("paste", e => e.preventDefault());

/* ================= AUTH ================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    examStarted = false;
    document.getElementById("loginBox").style.display = "block";
    document.querySelector(".quiz-container").style.display = "none";
  }
});
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
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDfHxDx1hG-kSCNGl6AecgoE_KC6YY_Wmc",
  authDomain: "smart-quiz-system-12c68.firebaseapp.com",
  projectId: "smart-quiz-system-12c68",
  storageBucket: "smart-quiz-system-12c68.firebasestorage.app",
  messagingSenderId: "738008992865",
  appId: "1:738008992865:web:51e70d8ee85b4bf3326e20",
  measurementId: "G-R561C2HHLM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let isAdmin = false;

/* ================= STATE ================= */
let questions = [];
let index = 0;
let answers = [];
let totalTime = 0;
let timeLeft = 0;
let timer = null;
let examSubmitted = false;

const STORAGE_KEY = "exam_data";

/* ================= ADMIN POPUP ================= */
window.openAdmin = () => {
  document.getElementById("adminModal").style.display = "flex";
};

window.closeAdmin = () => {
  document.getElementById("adminModal").style.display = "none";
};

/* ================= ADMIN LOGIN ================= */
window.adminLogin = async function () {
  const email = document.getElementById("adminEmail").value;
  const pass = document.getElementById("adminPass").value;

  if (email !== "admin@gmail.com") {
    alert("Not authorized");
    return;
  }

  try {
    isAdmin = true; // 🔥 mark as admin

    await signInWithEmailAndPassword(auth, email, pass);

    window.location.href = "admin.html"; // go to dashboard
  } catch (err) {
    alert(err.message);
  }
};

/* ================= LOGIN ================= */
window.login = async function () {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();
  const inputTime = Number(document.getElementById("examTime").value);

  if (!email || !pass) return alert("Enter login details");
  if (!inputTime || inputTime <= 0) return alert("Enter valid time");

  totalTime = inputTime * 60;
  timeLeft = totalTime;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    startExam();
  } catch (err) {
    alert(err.message);
  }
};

/* ================= AUTH ================= */
onAuthStateChanged(auth, user => {
  if (!user) showLogin();
});

/* ================= UI ================= */
function showLogin() {
  document.getElementById("loginBox").style.display = "block";
  document.querySelector(".quiz-container").style.display = "none";
}

function showQuiz() {
  document.getElementById("loginBox").style.display = "none";
  document.querySelector(".quiz-container").style.display = "block";
}

/* ================= START EXAM ================= */
async function startExam() {
  showQuiz();

  const snap = await getDocs(collection(db, "questions"));
  questions = snap.docs.map(d => d.data());

  loadFromLocal();

  examSubmitted = false;

  enterFullScreen();
  startTimer();
  showQuestion();
  createSidebar();
}

/* ================= LOCAL STORAGE ================= */
function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    answers,
    index,
    timeLeft
  }));
}

function loadFromLocal() {
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (data) {
    answers = data.answers || [];
    index = data.index || 0;
    timeLeft = data.timeLeft || timeLeft;
  }
}

/* ================= SHOW QUESTION ================= */
function showQuestion() {
  const q = questions[index];
  if (!q) return;

  document.getElementById("question").innerText = q.question;

  document.getElementById("options").innerHTML = `
    <textarea id="ans" placeholder="Write your answer..."></textarea>
  `;

  if (answers[index]) {
    document.getElementById("ans").value = answers[index].answer;
  }

  document.getElementById("qCounter").innerText =
    `Q ${index + 1} / ${questions.length}`;

  document.getElementById("backBtn").disabled = index === 0;

  document.getElementById("nextBtn").innerText = "Next";
  document.getElementById("nextBtn").onclick = nextQuestion;
}

/* ================= SAVE ================= */
function saveCurrentAnswer() {
  answers[index] = {
    question: questions[index].question,
    answer: document.getElementById("ans").value
  };
  saveToLocal();
}

/* ================= NEXT ================= */
function nextQuestion() {
  saveCurrentAnswer();
  index++;

  if (index >= questions.length) finishExam();
  else showQuestion();
}

/* ================= BACK ================= */
document.getElementById("backBtn").onclick = () => {
  saveCurrentAnswer();
  if (index > 0) {
    index--;
    showQuestion();
  }
};

/* ================= SIDEBAR ================= */
function createSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = "";

  questions.forEach((_, i) => {
    const btn = document.createElement("button");
    btn.innerText = i + 1;

    if (answers[i]) btn.classList.add("answered");

    btn.onclick = () => {
      saveCurrentAnswer();
      index = i;
      showQuestion();
    };

    sidebar.appendChild(btn);
  });
}

/* ================= FINISH ================= */
async function finishExam() {
  if (examSubmitted) return;

  examSubmitted = true;
  clearInterval(timer);

  document.getElementById("question").innerText = "Exam Finished ✅";
  document.getElementById("options").innerHTML = "";

  await addDoc(collection(db, "results"), {
    answers,
    time: new Date().toISOString()
  });

  const btn = document.getElementById("nextBtn");
  btn.innerText = "Download PDF";
  btn.onclick = downloadPDF;

  document.getElementById("exitBtn").disabled = true;
}

/* ================= PDF ================= */
window.downloadPDF = function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;
  doc.text("Exam Results", 10, y);
  y += 10;

  answers.forEach((a, i) => {
    doc.text(`Q${i + 1}: ${a.question}`, 10, y);
    y += 7;
    doc.text(`A: ${a.answer}`, 10, y);
    y += 10;
  });

  doc.save("exam.pdf");

  document.getElementById("exitBtn").disabled = false;
};

/* ================= TIMER ================= */
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;

    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;

    document.getElementById("timeText").innerText =
      `Time Left: ${min}:${sec < 10 ? "0" + sec : sec}`;

    saveToLocal();

    if (timeLeft <= 0) {
      clearInterval(timer);
      finishExam();
    }
  }, 1000);
}

/* ================= EXIT ================= */
window.exitExam = async function () {
  await signOut(auth);
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
};

/* ================= FULLSCREEN ================= */
function enterFullScreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen();
}
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
  storageBucket: "smart-quiz-system-12c68.appspot.com",
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

let totalTime = 0;
let timeLeft = 0;
let timer = null;

let examSubmitted = false;

/* ================= UI ================= */
function showLogin() {
  document.getElementById("loginBox").style.display = "block";
  document.querySelector(".quiz-container").style.display = "none";
}

function showQuiz() {
  document.getElementById("loginBox").style.display = "none";
  document.querySelector(".quiz-container").style.display = "block";
}

/* ================= LOGIN ================= */
window.login = async function () {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  const inputTime = Number(document.getElementById("examTime").value);

  if (!email || !pass) return alert("Enter login details");
  if (!inputTime || inputTime <= 0) return alert("Enter valid time");

  totalTime = inputTime * 60;
  timeLeft = totalTime;

  await signInWithEmailAndPassword(auth, email, pass);

  startExam();
};

/* ================= AUTH CHECK ================= */
onAuthStateChanged(auth, user => {
  if (user) showLogin();
  else showLogin();
});

/* ================= START EXAM ================= */
async function startExam() {
  showQuiz();

  const snap = await getDocs(collection(db, "questions"));
  questions = snap.docs.map(d => d.data());

  index = 0;
  answers = [];
  examSubmitted = false;

  enterFullScreen(); // 🔥 ADD THIS

  startTimer();
  showQuestion();
}

/* ================= SHOW QUESTION ================= */
function showQuestion() {
  const q = questions[index];
  if (!q) return;

  document.getElementById("question").innerText = q.question;

  document.getElementById("options").innerHTML = `
    <textarea id="ans" placeholder="Write your answer..."></textarea>
  `;

  const btn = document.getElementById("nextBtn");
  btn.innerText = "Next";
  btn.onclick = nextQuestion;
}

/* ================= NEXT ================= */
function nextQuestion() {
  answers[index] = {
    question: questions[index].question,
    answer: document.getElementById("ans").value
  };

  index++;

  if (index >= questions.length) {
    finishExam();
  } else {
    showQuestion();
  }
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

  // 🚫 EXIT STILL DISABLED HERE
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

  // ✅ NOW ENABLE EXIT AFTER DOWNLOAD
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

    if (timeLeft <= 0) {
      clearInterval(timer);
      finishExam();
    }
  }, 1000);
}

/* ================= EXIT ================= */
window.exitExam = async function () {
  await signOut(auth);

  answers = [];
  index = 0;
  questions = [];
  examSubmitted = false;

  document.getElementById("nextBtn").innerText = "Next";
  document.getElementById("exitBtn").disabled = true;

  showLogin();
};

function enterFullScreen() {
  const el = document.documentElement;

  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && examSubmitted === false) {
    alert("⚠️ You exited full screen. Please return to exam mode.");

    // try forcing back again
    setTimeout(() => {
      enterFullScreen();
    }, 1000);
  }
});
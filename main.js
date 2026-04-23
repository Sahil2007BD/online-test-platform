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
let isExamStarted = false;

const STORAGE_KEY = "exam_data";

/* ================= UI ================= */
function showLogin() {
  document.getElementById("loginBox").style.display = "block";
  document.querySelector(".quiz-container").style.display = "none";
}

function showQuiz() {
  document.getElementById("loginBox").style.display = "none";
  document.querySelector(".quiz-container").style.display = "block";
}

/* ================= ADMIN ================= */
window.openAdmin = () => {
  document.getElementById("adminModal").style.display = "flex";
};

window.closeAdmin = () => {
  document.getElementById("adminModal").style.display = "none";
};

window.adminLogin = async function () {
  const email = document.getElementById("adminEmail").value;
  const pass = document.getElementById("adminPass").value;

  if (email !== "admin@gmail.com") {
    return alert("Not authorized");
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = "admin.html";
  } catch (err) {
    alert(err.message);
  }
};

/* ================= STUDENT LOGIN ================= */
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

    if (!isExamStarted) {
      startExam();
      isExamStarted = true;
    }

  } catch (err) {
    alert(err.message);
  }
};

/* ================= AUTH ================= */
onAuthStateChanged(auth, user => {
  if (!user) {
    showLogin();
    isExamStarted = false;
  }
});

/* ================= START EXAM ================= */
async function startExam() {
  showQuiz();

  const snap = await getDocs(collection(db, "questions"));
  questions = snap.docs.map(d => d.data());

  index = 0;
  answers = [];
  examSubmitted = false;



  document.getElementById("nextBtn").innerText = "Next";
document.getElementById("nextBtn").onclick = nextQuestion;



  enterFullScreen();
  startTimer();
  showQuestion();
  createSidebar();
  bindNextButton();
}

/* ================= QUESTION ================= */
function showQuestion() {
  const q = questions[index];
  if (!q) return;

  document.getElementById("question").innerText = q.question;

  const optionsBox = document.getElementById("options");

  if (q.type === "mcq") {
    optionsBox.innerHTML = q.options.map(opt => `
      <label style="display:block;margin:8px 0;">
        <input type="radio" name="mcq" value="${opt}">
        ${opt}
      </label>
    `).join("");
  } else {
    optionsBox.innerHTML = `
      <textarea id="ans" placeholder="Write your answer..."></textarea>
    `;
  }

  document.getElementById("qCounter").innerText =
    `Q ${index + 1} / ${questions.length}`;

  document.getElementById("backBtn").disabled = index === 0;

  // ALWAYS ensure next works
  const nextBtn = document.getElementById("nextBtn");
  nextBtn.innerText = (index === questions.length - 1) ? "Finish" : "Next";
  nextBtn.onclick = nextQuestion;
}

/* ================= SAVE ================= */
function saveCurrentAnswer() {
  const q = questions[index];

  if (!q) return;

  if (q.type === "mcq") {
    const selected = document.querySelector('input[name="mcq"]:checked');

    answers[index] = {
      question: q.question,
      type: "mcq",
      selected: selected ? selected.value : null,
      correct: q.answer
    };
  } else {
    const box = document.getElementById("ans");

    answers[index] = {
      question: q.question,
      type: "theory",
      answer: box ? box.value : ""
    };
  }
}

/* ================= NEXT ================= */
function nextQuestion() {
  saveCurrentAnswer();

  index++;

  if (index >= questions.length) {
    finishExam();
  } else {
    showQuestion();
  }
}

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

  await addDoc(collection(db, "results"), {
    answers,
    time: new Date().toISOString()
  });

  document.getElementById("question").innerText = "Exam Finished ✅";
  document.getElementById("options").innerHTML = "";

  const btn = document.getElementById("nextBtn");
  btn.innerText = "Download PDF";
  btn.onclick = downloadPDF;

  document.getElementById("exitBtn").disabled = false;
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

    doc.text(`Answer: ${a.selected || a.answer}`, 10, y);
    y += 10;
  });

  doc.save("exam.pdf");
};

/* ================= TIMER ================= */
function startTimer() {
  clearInterval(timer);

  timer = setInterval(() => {
    timeLeft--;

    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;

    document.getElementById("timeText").innerText =
      `Time Left: ${m}:${s < 10 ? "0" + s : s}`;

    if (timeLeft <= 0) finishExam();
  }, 1000);
}

/* ================= EXIT ================= */
window.exitExam = async function () {
  await signOut(auth);
  location.reload();
};

/* ================= FULLSCREEN ================= */
function enterFullScreen() {
  document.documentElement.requestFullscreen?.();
}
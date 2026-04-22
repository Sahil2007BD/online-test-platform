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

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyDfHxDx1hG-kSCNGl6AecgoE_KC6YY_Wmc",
  authDomain: "smart-quiz-system-12c68.firebaseapp.com",
  projectId: "smart-quiz-system-12c68",
  storageBucket: "smart-quiz-system-12c68.firebasestorage.app",
  messagingSenderId: "738008992865",
  appId: "1:738008992865:web:51e70d8ee85b4bf3326e20",
  measurementId: "G-R561C2HHLM"
};

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ================= STATE =================
let questions = [];
let index = 0;
let answers = [];
let examFinished = false;

// ================= LOGIN =================
window.login = function () {
  const email = document.getElementById("email").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!email || !pass) {
    alert("Enter email and password");
    return;
  }

  signInWithEmailAndPassword(auth, email, pass)
    .then(() => {
      showQuiz();
      loadQuestions();
    })
    .catch(err => {
      alert(err.message);
      console.error(err);
    });
};

// ================= AUTO LOGIN CHECK =================
onAuthStateChanged(auth, user => {
  if (user) {
    showQuiz();
    loadQuestions();
  } else {
    showLogin();
  }
});

// ================= UI =================
function showLogin() {
  document.getElementById("loginBox").style.display = "block";
  document.querySelector(".quiz-container").style.display = "none";
}

function showQuiz() {
  document.getElementById("loginBox").style.display = "none";
  document.querySelector(".quiz-container").style.display = "block";
}

// ================= LOAD QUESTIONS =================
async function loadQuestions() {
  const snap = await getDocs(collection(db, "questions"));

  questions = snap.docs.map(doc => doc.data());

  index = 0;
  answers = [];

  if (!questions.length) {
    document.getElementById("question").innerText = "No questions found";
    return;
  }

  showQuestion();
}

// ================= SHOW QUESTION =================
function showQuestion() {
  const q = questions[index];

  if (!q) return;

  document.getElementById("question").innerText = q.question;

  document.getElementById("options").innerHTML = `
    <textarea id="ans" placeholder="Write answer..."></textarea>
  `;
}

// ================= NEXT =================
document.getElementById("nextBtn").onclick = function () {
  const ans = document.getElementById("ans").value;

  answers[index] = {
    question: questions[index].question,
    answer: ans
  };

  index++;

  if (index < questions.length) {
    showQuestion();
  } else {
    finish();
  }
};

// ================= FINISH =================
async function finish() {
  document.getElementById("question").innerText = "Exam Finished";
  document.getElementById("options").innerHTML = "";

  await addDoc(collection(db, "results"), {
    answers,
    time: new Date().toISOString()
  });

  examFinished = true;

  document.getElementById("pdfBtn").disabled = false;
}

// ================= PDF =================
window.downloadPDF = function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  doc.text("Exam Answers", 10, y);
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

// ================= EXIT (AUTO LOGOUT) =================
window.exitExam = async function () {
  await signOut(auth);

  document.getElementById("loginBox").style.display = "block";
  document.querySelector(".quiz-container").style.display = "none";

  answers = [];
  index = 0;
  questions = [];

  document.getElementById("pdfBtn").disabled = true;
  document.getElementById("exitBtn").disabled = true;
};
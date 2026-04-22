// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

// ================= FIREBASE CONFIG =================
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
let currentQuestion = 0;
let answers = [];

// ================= STORAGE KEYS =================
const SESSION_KEY = "exam_session_start";
const ANSWERS_KEY = "exam_answers";
const INDEX_KEY = "exam_index";

// ================= LOGIN =================
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login successful ✅");

      document.getElementById("loginBox").style.display = "none";
      document.querySelector(".quiz-container").style.display = "block";

      // session start
      localStorage.setItem(SESSION_KEY, Date.now());

      // restore data
      answers = JSON.parse(localStorage.getItem(ANSWERS_KEY)) || [];
      currentQuestion = Number(localStorage.getItem(INDEX_KEY)) || 0;

      loadQuestions();
      startSessionCheck();
    })
    .catch((error) => {
      alert(error.message);
    });
};

// ================= LOGOUT =================
window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out ✅");

    document.getElementById("loginBox").style.display = "block";
    document.querySelector(".quiz-container").style.display = "none";

    clearStorage();
  });
};

// ================= LOAD QUESTIONS =================
async function loadQuestions() {
  const snap = await getDocs(collection(db, "questions"));

  questions = snap.docs.map(doc => doc.data());

  if (questions.length === 0) {
    document.getElementById("question").innerText = "No questions found ❌";
    return;
  }

  showQuestion();
}

// ================= SHOW QUESTION =================
function showQuestion() {
  const q = questions[currentQuestion];

  if (!q || !q.question) {
    document.getElementById("question").innerText = "Question missing ❌";
    return;
  }

  document.getElementById("question").innerText = q.question;

  document.getElementById("options").innerHTML = `
    <textarea id="answerBox"
      placeholder="Write your answer here..."
      rows="6"
      style="width:100%; padding:10px; border-radius:10px; font-size:16px;">
    </textarea>
  `;

  // restore previous answer if exists
  if (answers[currentQuestion]) {
    document.getElementById("answerBox").value = answers[currentQuestion].answer;
  }
}

// ================= NEXT BUTTON =================
document.getElementById("nextBtn").onclick = function () {
  const answer = document.getElementById("answerBox").value;

  answers[currentQuestion] = {
    question: questions[currentQuestion].question,
    answer: answer
  };

  // save locally (NO DATA LOSS)
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  localStorage.setItem(INDEX_KEY, currentQuestion + 1);

  currentQuestion++;

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    finishQuiz();
  }
};

// ================= FINISH QUIZ =================
async function finishQuiz() {
  document.getElementById("question").innerText = "Exam Finished ✅";
  document.getElementById("options").innerHTML = "";

  await addDoc(collection(db, "results"), {
    answers: answers,
    time: new Date().toISOString()
  });

  clearStorage();

  alert("Saved successfully ✅");
  document.getElementById("pdfBtn").disabled = false; // 🔥 ENABLE HERE

  downloadPDF();
}

// ================= PDF =================
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  doc.setFontSize(14);
  doc.text("Exam Results", 10, y);
  y += 10;

  answers.forEach((item, i) => {
    doc.setFontSize(11);

    doc.text(`Q${i + 1}: ${item.question}`, 10, y);
    y += 7;

    doc.text(`Ans: ${item.answer}`, 10, y);
    y += 10;

    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save("exam-results.pdf");
}

// ================= SESSION CHECK (1.5 HOURS) =================
function startSessionCheck() {
  setInterval(() => {
    const start = localStorage.getItem(SESSION_KEY);
    if (!start) return;

    const limit = 90 * 60 * 1000;
    const elapsed = Date.now() - Number(start);

    if (elapsed > limit) {
      alert("Session expired ⏰");
      logout();
    }
  }, 10000);
}

// ================= CLEAR STORAGE =================
function clearStorage() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ANSWERS_KEY);
  localStorage.removeItem(INDEX_KEY);
}


onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User already logged in ✅");

    document.getElementById("loginBox").style.display = "none";
    document.querySelector(".quiz-container").style.display = "block";

    loadQuestions();
    startSessionCheck(); // keep timer running
  } else {
    console.log("No user ❌");

    document.getElementById("loginBox").style.display = "block";
    document.querySelector(".quiz-container").style.display = "none";
  }
});
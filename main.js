// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

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

console.log("Firebase connected successfully ✅");

// ================= STATE =================
let questions = [];
let currentQuestion = 0;
let answers = [];

// ================= LOGIN =================
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login successful ✅");

      document.getElementById("loginBox").style.display = "none";
      document.querySelector(".quiz-container").style.display = "block";

      loadQuestions();
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
  });
};

// ================= LOAD QUESTIONS =================
async function loadQuestions() {
  try {
    const snap = await getDocs(collection(db, "questions"));

    questions = snap.docs.map(doc => doc.data());

    console.log("QUESTIONS LOADED:", questions);

    currentQuestion = 0;
    answers = [];

    if (questions.length === 0) {
      document.getElementById("question").innerText = "No questions found ❌";
      return;
    }

    showQuestion();

  } catch (error) {
    console.error("Error loading questions:", error);
  }
}

// ================= SHOW QUESTION =================
function showQuestion() {
  const q = questions[currentQuestion];

  console.log("QUESTION DATA:", q);

  if (!q || !q.question) {
    document.getElementById("question").innerText = "No question found ❌";
    return;
  }

  document.getElementById("question").innerText = q.question;
}

// ================= NEXT BUTTON =================
document.getElementById("nextBtn").onclick = function () {
  const answer = document.getElementById("answerBox").value;

  answers.push({
    question: questions[currentQuestion].question,
    answer: answer
  });

  currentQuestion++;
  showQuestion();
};

// ================= FINISH QUIZ =================
async function finishQuiz() {
  document.getElementById("question").innerText = "Quiz Finished ✅";
  document.getElementById("options").innerHTML = "";

  await addDoc(collection(db, "results"), {
    answers: answers,
    time: new Date().toISOString()
  });

  alert("Answers saved successfully ✅");
}
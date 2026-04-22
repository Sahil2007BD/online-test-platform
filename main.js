// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDfHxDx1hG-kSCNGl6AecgoE_KC6YY_Wmc",
  authDomain: "smart-quiz-system-12c68.firebaseapp.com",
  projectId: "smart-quiz-system-12c68",
  storageBucket: "smart-quiz-system-12c68.firebasestorage.app",
  messagingSenderId: "738008992865",
  appId: "1:738008992865:web:51e70d8ee85b4bf3326e20",
  measurementId: "G-R561C2HHLM"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log("Firebase connected successfully ✅");

// ---------------- LOGIN ----------------
window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Login successful ✅");
      document.getElementById("loginBox").style.display = "none";
      document.querySelector(".quiz-container").style.display = "block";
    })
    .catch((error) => {
      alert(error.message);
    });
};

// ---------------- SAVE SCORE ----------------
async function saveScore(score) {
  try {
    await addDoc(collection(db, "scores"), {
      score: score,
      date: new Date().toISOString()
    });

    console.log("Score saved ✅");
  } catch (error) {
    console.error("Error saving score:", error);
  }
}

// expose it globally if needed
window.saveScore = saveScore;
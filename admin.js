import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfHxDx1hG-kSCNGl6AecgoE_KC6YY_Wmc",
  authDomain: "smart-quiz-system-12c68.firebaseapp.com",
  projectId: "smart-quiz-system-12c68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const qRef = collection(db, "questions");

/* ================= MCQ ================= */
window.addMCQ = async function () {
  const question = document.getElementById("mcq_q").value;
  const op1 = document.getElementById("mcq_op1").value;
  const op2 = document.getElementById("mcq_op2").value;
  const op3 = document.getElementById("mcq_op3").value;
  const op4 = document.getElementById("mcq_op4").value;
  const answer = document.getElementById("mcq_correct").value;

  await addDoc(qRef, {
    type: "mcq",
    question,
    options: [op1, op2, op3, op4],
    answer
  });

  alert("MCQ Uploaded ✅");
};

/* ================= THEORY ================= */
window.addTheory = async function () {
  const question = document.getElementById("th_q").value;
  const answer = document.getElementById("th_ans").value;

  await addDoc(qRef, {
    type: "theory",
    question,
    answer
  });

  alert("Theory Uploaded ✅");
};

/* ================= LIVE LIST ================= */
const list = document.getElementById("list");

onSnapshot(qRef, (snap) => {
  list.innerHTML = "";

  snap.forEach((d) => {
    const data = d.data();

    const div = document.createElement("div");

    div.innerHTML = `
      <b>${data.type.toUpperCase()}</b><br>
      ${data.question}<br>
      <small>${data.answer}</small><br>
      <button onclick="deleteQ('${d.id}')">Delete</button>
    `;

    list.appendChild(div);
  });
});

window.deleteQ = async function (id) {
  await deleteDoc(doc(db, "questions", id));
};
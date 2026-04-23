import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDfHxDx1hG-kSCNGl6AecgoE_KC6YY_Wmc",
  authDomain: "smart-quiz-system-12c68.firebaseapp.com",
  projectId: "smart-quiz-system-12c68",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const qRef = collection(db, "questions");

/* ================= ADD QUESTION ================= */
window.addQuestion = async function () {
  const input = document.getElementById("q");
  const text = input.value.trim();

  if (!text) {
    alert("Enter a question");
    return;
  }

  try {
    await addDoc(qRef, {
      question: text,
      createdAt: Date.now()
    });

    input.value = "";
    alert("Question uploaded ✅");
  } catch (err) {
    console.error(err);
    alert("Upload failed ❌");
  }
};

/* ================= LIVE LIST ================= */
const list = document.getElementById("list");

onSnapshot(qRef, (snapshot) => {
  list.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const div = document.createElement("div");

    div.innerHTML = `
      <p>${data.question}</p>
      <button onclick="deleteQ('${docSnap.id}')">Delete</button>
    `;

    list.appendChild(div);
  });
});

/* ================= DELETE ================= */
window.deleteQ = async function (id) {
  await deleteDoc(doc(db, "questions", id));
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyDfHxDx1hG-kSCN",
  authDomain: "smart-quiz-system-12c68.firebaseapp.com",
  projectId: "smart-quiz-system-12c68"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ORDERED COLLECTION */
const qRef = query(collection(db, "questions"), orderBy("order", "asc"));

/* ================= MCQ ================= */
window.addMCQ = async function () {
  const question = document.getElementById("mcq_q").value;
  const op1 = document.getElementById("mcq_op1").value;
  const op2 = document.getElementById("mcq_op2").value;
  const op3 = document.getElementById("mcq_op3").value;
  const op4 = document.getElementById("mcq_op4").value;
  const answer = document.getElementById("mcq_correct").value;

  if (!question) return alert("Fill question");

  await addDoc(collection(db, "questions"), {
    type: "mcq",
    question,
    options: [op1, op2, op3, op4],
    answer,
    order: Date.now()
  });

  alert("MCQ Uploaded ✅");

  document.getElementById("mcq_q").value = "";
  document.getElementById("mcq_op1").value = "";
  document.getElementById("mcq_op2").value = "";
  document.getElementById("mcq_op3").value = "";
  document.getElementById("mcq_op4").value = "";
  document.getElementById("mcq_correct").value = "";
};

/* ================= THEORY ================= */
window.addTheory = async function () {
  const question = document.getElementById("th_q").value;
  const answer = document.getElementById("th_ans").value;

  if (!question) return alert("Fill question");

  await addDoc(collection(db, "questions"), {
    type: "theory",
    question,
    answer,
    order: Date.now()
  });

  alert("Theory Uploaded ✅");

  document.getElementById("th_q").value = "";
  document.getElementById("th_ans").value = "";
};

/* ================= DELETE ================= */
window.deleteQ = async function (id) {
  await deleteDoc(doc(db, "questions", id));
};

/* ================= DRAG & DROP ================= */
let dragged = null;

onSnapshot(qRef, (snap) => {
  const list = document.getElementById("list");
  list.innerHTML = "";

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  items.forEach((data, index) => {
    const div = document.createElement("div");
    div.draggable = true;
    div.dataset.id = data.id;

    div.style.cssText = `
      background: rgba(255,255,255,0.05);
      padding: 12px;
      margin: 10px 0;
      border-radius: 12px;
      border-left: 3px solid #3b82f6;
      cursor: grab;
    `;

    div.innerHTML = `
      <b>${index + 1}. ${data.type.toUpperCase()}</b><br>
      ${data.question}<br>
      <small>${data.type === "mcq" ? data.options.join(" | ") : data.answer}</small>

      <div style="margin-top:10px;">
        <button onclick="deleteQ('${data.id}')">Delete</button>
      </div>
    `;

    /* DRAG START */
    div.addEventListener("dragstart", () => {
      dragged = data;
    });

    /* DROP */
    div.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    div.addEventListener("drop", async () => {
      const allSnap = await getDocs(qRef);
      const all = allSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const from = all.find(q => q.id === dragged.id);
      const to = all.find(q => q.id === data.id);

      if (!from || !to) return;

      await updateDoc(doc(db, "questions", from.id), {
        order: to.order
      });

      await updateDoc(doc(db, "questions", to.id), {
        order: from.order
      });
    });

    list.appendChild(div);
  });
});
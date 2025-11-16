import { db } from "./firebaseConfig.js";
import {
  doc, setDoc, collection, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Create room button
const createBtn = document.getElementById("createRoomBtn");

const checkbox = document.getElementById("customCheck");
const textarea = document.getElementById("customScenariosInput");

checkbox.addEventListener("change", () => {
  textarea.classList.toggle("hidden", !checkbox.checked);
});


// CLICK HANDLER
createBtn.addEventListener("click", async () => {
  const name = document.getElementById("clasherName").value.trim();

  // Get grid size
  let selectedGrid = document.querySelector("input[name='gridSize']:checked");
  if (!selectedGrid) return alert("Select a grid size!");

  selectedGrid = selectedGrid.id; // gridDifficult, gridNormal, gridEasy

    // Always include default scenarios
    let scenarios = [
    "Professor says 'as you can see'",
    "Someone walks in late",
    "Technical issues",
    "Student asks a weird question"
    ];

    // If custom checkbox is checked, add more
    if (checkbox.checked) {
    const custom = textarea.value
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

    scenarios = scenarios.concat(custom);
    }

  // Make room code
  const roomId = Math.floor(1000 + Math.random() * 9000).toString();

  // Firestore: create room document
  await setDoc(doc(db, "rooms", roomId), {
    hostName: name,
    createdAt: serverTimestamp(),
    gridSize: selectedGrid,
    phrases: scenarios,
    isActive: true
  });

  // Redirect
  window.location.href = `game.html?room=${roomId}&host=${name}`;
});

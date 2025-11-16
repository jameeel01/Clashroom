import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// -------------------------------
// 1. Load room info from URL
// -------------------------------
async function loadRoom() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (!roomId) {
    alert("Room ID missing.");
    return;
  }

  // Get room data
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room not found!");
    return;
  }

  const data = roomSnap.data();

  // Determine grid size
  const gridSize =
    data.gridSize === "gridDifficult" ? 6 :
    data.gridSize === "gridNormal" ? 4 :
    3; // gridEasy

  generateBoard(data.phrases, gridSize);
}


// -------------------------------
// 2. Generate the bingo board
// -------------------------------
function generateBoard(phrases, gridSize) {
  const container = docum

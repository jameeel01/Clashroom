// lobby.js
import { db } from "./firebaseConfig.js";
import {
  doc,
  updateDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const roomCode = params.get("room");
const roomRef = doc(db, "rooms", roomCode);

document.getElementById("roomCode").textContent = roomCode;

// -------------------------
// REALTIME ROOM LISTENER
// -------------------------
onSnapshot(roomRef, (snap) => {
  const data = snap.data();
  const players = data.players;

  // show list of players
  document.getElementById("playerList").innerHTML = Object.values(players)
    .map((p) => `<li>${p.name}</li>`)
    .join("");

  // when host starts game → go to board
  if (data.gameState.isStarted) {
    window.location.href = `board.html?room=${roomCode}`;
  }
});

// -------------------------
// START GAME
// -------------------------
document.getElementById("startGameBtn").onclick = async () => {
  await updateDoc(roomRef, {
    "gameState.isStarted": true,
  });
};

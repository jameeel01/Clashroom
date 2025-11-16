import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let isTerminating = false;
let hasRedirected = false;

// ============================================================
// End the room (win or stop)
// ============================================================
async function terminateRoom() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");
  const playerName = params.get("player") || params.get("host") || "Unknown";

  if (!roomId) return;

  const roomRef = doc(db, "rooms", roomId);
  isTerminating = true;

  await setDoc(
    roomRef,
    { winner: playerName, status: "closed" },
    { merge: true }
  );

  // Wait 3 seconds before deleting
  setTimeout(async () => {
    try {
      await deleteDoc(roomRef);
    } catch (err) {
      console.error("Error deleting room:", err);
    }
  }, 3000);

  if (!hasRedirected) {
    hasRedirected = true;
    alert("Bingo! You have Won");
    window.location.href = "index.html";
  }
}

// ============================================================
// Watch if room is deleted OR if someone wins
// ============================================================
function watchRoomExistence(roomId) {
  const roomRef = doc(db, "rooms", roomId);

  onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      if (!isTerminating && !hasRedirected) {
        hasRedirected = true;
        alert("You lost!");
        window.location.href = "index.html";
      }
      return;
    }

    const data = snapshot.data();
    if (data?.winner && !isTerminating && !hasRedirected) {
      hasRedirected = true;
      alert(`You lost! ${data.winner} won.`);
      window.location.href = "index.html";
    }
  });
}

// ============================================================
// Load room
// ============================================================
async function loadRoom(roomId) {
  if (!roomId) {
    alert("Room ID missing.");
    return;
  }

  document.getElementById("gameIdText").innerText = roomId;

  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room not found!");
    window.location.href = "index.html";
    return;
  }

  const data = roomSnap.data();

  const gridSize =
    data.gridSize === "gridDifficult"
      ? 5
      : data.gridSize === "gridNormal"
      ? 4
      : 3;

  generateBoard(data.phrases, gridSize);
  watchPlayerCount(roomId);
  watchRoomExistence(roomId);
}

// ============================================================
// Generate Bingo Grid
// ============================================================
function generateBoard(phrases, gridSize) {
  const container = document.getElementById("boardContainer");
  container.innerHTML = "";
  container.className = "grid gap-4 mx-auto mt-10 w-max font-sans";
  container.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;

  const shuffled = [...phrases].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, gridSize * gridSize);

  selected.forEach((text) => {
    const card = document.createElement("div");
    card.className =
      "bingo-card bg-blue-100 border border-blue-300 rounded-lg p-6 w-44 h-44 flex justify-center items-center text-center cursor-pointer transition hover:bg-blue-200";
    card.innerText = text;

    card.addEventListener("click", () => {
      if (isTerminating) return;

      card.classList.toggle("selected");
      card.classList.remove("animate-pop");
      void card.offsetWidth;
      card.classList.add("animate-pop");

      checkBingo(gridSize);
    });

    container.appendChild(card);
  });
}

// ============================================================
// Bingo Checker
// ============================================================
function checkBingo(size) {
  const cards = [...document.querySelectorAll(".bingo-card")];
  const board = [];

  for (let r = 0; r < size; r++) {
    board[r] = [];
    for (let c = 0; c < size; c++) {
      board[r][c] = cards[r * size + c].classList.contains("selected");
    }
  }

  const rowWin = board.some((row) => row.every((v) => v));
  const colWin = [...Array(size)].some((c) => board.every((row) => row[c]));
  const diag1 = board.every((row, i) => row[i]);
  const diag2 = board.every((row, i) => row[size - i - 1]);

  if (rowWin || colWin || diag1 || diag2) {
    terminateRoom();
  }
}

// ============================================================
// Player Count + Player List (with “You” badge)
// ============================================================
function watchPlayerCount(roomId) {
  const playersRef = collection(db, "rooms", roomId, "players");
  const outputCount = document.getElementById("playerCount");
  const outputList = document.getElementById("playerList");

  const params = new URLSearchParams(window.location.search);
  const currentUser = params.get("player") || params.get("host") || "Unknown";

  onSnapshot(playersRef, (snapshot) => {
    outputCount.innerText = ` ${snapshot.size}`;

    let names = [];
    snapshot.forEach((docSnap) => {
      const name = docSnap.id;

      if (name === currentUser) {
        names.push(
          `• ${name} <span class="text-yellow-300 font-bold">(You)</span>`
        );
      } else {
        names.push(`• ${name}`);
      }
    });

    outputList.innerHTML =
      names.length > 0
        ? names.map((n) => `<div>${n}</div>`).join("")
        : "<div>No players</div>";
  });
}

// ============================================================
// Stop Button
// ============================================================
document.getElementById("stopBtn").addEventListener("click", async () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");
  const playerName = params.get("player") || params.get("host") || "Host";

  if (!roomId) return;

  const roomRef = doc(db, "rooms", roomId);
  isTerminating = true;

  await setDoc(
    roomRef,
    { winner: playerName, status: "closed" },
    { merge: true }
  );

  setTimeout(async () => {
    try {
      await deleteDoc(roomRef);
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, 3000);

  if (!hasRedirected) {
    hasRedirected = true;
    alert("Clash ended by host");
    window.location.href = "index.html";
  }
});

// ============================================================
// Start
// ============================================================
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
loadRoom(roomId);

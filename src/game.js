import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Flags to prevent duplicate alerts
let isTerminating = false;
let hasRedirected = false;

// Terminate the room intentionally (win or stop)
async function terminateRoom() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");
  if (!roomId) return;

  const roomRef = doc(db, "rooms", roomId);

  try {
    isTerminating = true; // mark intentional delete
    await deleteDoc(roomRef);

    if (!hasRedirected) {
      hasRedirected = true;
      alert("Bingo! You have Won");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error terminating room:", error);
    alert("Failed to terminate room.");
  }
}

// Watch the room existence constantly
function watchRoomExistence(roomId) {
  const roomRef = doc(db, "rooms", roomId);

  onSnapshot(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        if (!isTerminating && !hasRedirected) {
          hasRedirected = true;
          alert("Room no longer exists.");
          window.location.href = "index.html";
        }
      }
    },
    (error) => {
      console.error("Error watching room:", error);
      if (!hasRedirected) {
        hasRedirected = true;
        window.location.href = "index.html";
      }
    }
  );
}

// Load room
async function loadRoom(roomId) {
  if (!roomId) {
    alert("Room ID missing.");
    return;
  }

  // Show room ID in UI
  const idText = document.getElementById("gameIdText");
  if (idText) idText.innerText = roomId;

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

  // Start listeners
  watchPlayerCount(roomId);
  watchRoomExistence(roomId);
}

// Generate interactive board
function generateBoard(phrases, gridSize) {
  const container = document.getElementById("boardContainer");
  if (!container) return;

  container.innerHTML = "";
  container.className = "grid gap-4 mx-auto mt-10 w-max font-sans";
  container.style.gridTemplateColumns = `repeat(${gridSize}, minmax(0, 1fr))`;

  const shuffled = [...phrases].sort(() => Math.random() - 0.5);
  const countNeeded = gridSize * gridSize;
  const selected = shuffled.slice(0, countNeeded);

  selected.forEach((text) => {
    const card = document.createElement("div");

    card.className =
      "bingo-card bg-blue-100 border border-blue-300 rounded-lg p-6 w-44 h-44 flex justify-center items-center text-center cursor-pointer transition hover:bg-blue-200";

    card.innerText = text;

    card.addEventListener("click", () => {
      card.classList.toggle("selected");

      card.classList.remove("animate-pop");
      void card.offsetWidth;
      card.classList.add("animate-pop");

      checkBingo(gridSize);
    });

    container.appendChild(card);
  });
}

// Selected tile CSS
const styleSelected = document.createElement("style");
styleSelected.innerHTML = `
  .bingo-card.selected {
      background-color: #86efac !important; 
      text-decoration: line-through;
      box-shadow: 0 0 10px rgba(34,197,94,0.7);
      border-color: #22c55e;
  }
`;
document.head.appendChild(styleSelected);

// Card select animation
const stylePop = document.createElement("style");
stylePop.innerHTML = `
  @keyframes pop {
    0%   { transform: scale(1); }
    50%  { transform: scale(1.12); }
    100% { transform: scale(1); }
  }

  .animate-pop {
    animation: pop 0.2s ease-out;
  }
`;
document.head.appendChild(stylePop);

// Check for Bingo
function checkBingo(size) {
  const cards = [...document.querySelectorAll(".bingo-card")];

  const board = [];
  for (let r = 0; r < size; r++) {
    board[r] = [];
    for (let c = 0; c < size; c++) {
      const index = r * size + c;
      board[r][c] = cards[index].classList.contains("selected");
    }
  }

  // Rows
  for (let r = 0; r < size; r++) {
    if (board[r].every((v) => v)) {
      terminateRoom();
      return true;
    }
  }
  // Columns
  for (let c = 0; c < size; c++) {
    let col = true;
    for (let r = 0; r < size; r++) {
      if (!board[r][c]) col = false;
    }
    if (col) {
      terminateRoom();
      return true;
    }
  }
  // Diagonal TL → BR
  if (board.every((row, i) => row[i])) {
    terminateRoom();
    return true;
  }
  // Diagonal TR → BL
  if (board.every((row, i) => row[size - i - 1])) {
    terminateRoom();
    return true;
  }

  return false;
}

// Player count
function watchPlayerCount(roomId) {
  const playersRef = collection(db, "rooms", roomId, "players");
  const output = document.getElementById("playerCount");
  if (!output) return;

  onSnapshot(playersRef, (snapshot) => {
    output.innerText = ` ${snapshot.size}`;
  });
}

// Stop button
const stopBtn = document.getElementById("stopBtn");
if (stopBtn) {
  stopBtn.addEventListener("click", async () => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("room");
    if (!roomId) {
      alert("No room ID found.");
      return;
    }

    const roomRef = doc(db, "rooms", roomId);

    try {
      isTerminating = true;
      await deleteDoc(roomRef);
      if (!hasRedirected) {
        hasRedirected = true;
        alert("Bingo terminated");
        window.location.href = "index.html";
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room.");
    }
  });
}

// Entry point
const params = new URLSearchParams(window.location.search);
const roomId = params.get("room");
loadRoom(roomId);

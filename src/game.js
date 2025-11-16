import { db } from "./firebaseConfig.js";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function terminateRoom() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (!roomId) return;

  const roomRef = doc(db, "rooms", roomId);

  try {
    await deleteDoc(roomRef);
    alert("Bingo! You have Won");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error terminating room:", error);
    alert("Failed to terminate room.");
  }
}


// Load rooms
async function loadRoom() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (!roomId) {
    alert("Room ID missing.");
    return;
  }

  // Fetch room data from Firestore
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    alert("Room not found!");
    return;
  }

  const data = roomSnap.data();

  // Detect grid size from room document
  const gridSize =
    data.gridSize === "gridDifficult" ? 6 :
      data.gridSize === "gridNormal" ? 4 :
        3;

  generateBoard(data.phrases, gridSize);

  // Start listening for player count
  watchPlayerCount(roomId);
}



// Generate interactive board
function generateBoard(phrases, gridSize) {
  const container = document.getElementById("boardContainer");
  container.innerHTML = "";
  container.classList.add("font-sans");

  // Create grid columns based on size
  container.className = `grid gap-4 mx-auto mt-10 w-max grid-cols-${gridSize}`;

  // Shuffle scenarios
  const shuffled = [...phrases].sort(() => Math.random() - 0.5);
  const countNeeded = gridSize * gridSize;
  const selected = shuffled.slice(0, countNeeded);

  selected.forEach((text) => {
    const card = document.createElement("div");

    card.className =
      "bingo-card bg-blue-100 border border-blue-300 rounded-lg p-6 w-44 h-44 flex justify-center items-center text-center cursor-pointer transition hover:bg-blue-200";

    card.innerText = text;

    // Tile click handling
    card.addEventListener("click", () => {
      card.classList.toggle("selected");

      // CLICK ANIMATION
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

  // Create 2D array of selected tiles
  const board = [];
  for (let r = 0; r < size; r++) {
    board[r] = [];
    for (let c = 0; c < size; c++) {
      const index = r * size + c;
      board[r][c] = cards[index].classList.contains("selected");
    }
  }

  // Check each row
  for (let r = 0; r < size; r++) {
    if (board[r].every(v => v)) {
      terminateRoom();
    }
  }

  // Check each column
  for (let c = 0; c < size; c++) {
    let col = true;
    for (let r = 0; r < size; r++) {
      if (!board[r][c]) col = false;
    }
    if (col) {
      terminateRoom();
    }
  }

  // Check diagonal TL → BR
  if (board.every((row, i) => row[i])) {
    terminateRoom();
  }

  // Check diagonal TR → BL
  if (board.every((row, i) => row[size - i - 1])) {
    terminateRoom();
  }

  return false;
}



// Player count
function watchPlayerCount(roomId) {
  const playersRef = collection(db, "rooms", roomId, "players");
  const output = document.getElementById("playerCount");

  onSnapshot(playersRef, (snapshot) => {
    output.innerText = ` ${snapshot.size}`;
  });
}

document.getElementById("stopBtn").addEventListener("click", async () => {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get("room");

  if (!roomId) {
    alert("No room ID found.");
    return;
  }

  const roomRef = doc(db, "rooms", roomId);

  try {
    await deleteDoc(roomRef);
    alert("Bingo terminated");

    window.location.href = "index.html";
  } catch (error) {
    console.error("Error deleting room:", error);
    alert("Failed to delete room.");
  }
});



loadRoom();

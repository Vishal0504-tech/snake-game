import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

const GRID_SIZE = 20;

export default function GameBoard() {
  const socket = useSocket();
  const [gameState, setGameState] = useState({ players: {}, food: {} });
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Handle game state updates
  useEffect(() => {
    if (!socket) return;

    socket.on("gameState", (state) => setGameState(state));

    socket.on("gameOver", (score) => {
      setFinalScore(score);
      setGameOver(true);
    });

    return () => {
      socket.off("gameState");
      socket.off("gameOver");
    };
  }, [socket]);

  // Handle key presses
  useEffect(() => {
    if (!socket) return;

    const handleKeydown = (e) => {
      if (gameOver) return; // disable controls when game is over
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const dir = e.key.replace("Arrow", "").toUpperCase();
        socket.emit("keydown", dir);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [socket, gameOver]);

  const handleRestart = () => {
    setGameOver(false);
    setFinalScore(0);
    const name = prompt("Enter your name:");
    if (name) {
      socket.emit("joinGame", name);
    }
  };

  return (
    <div className="relative">
      {gameOver ? (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
          <h1 className="text-3xl font-bold mb-4">Game Over</h1>
          <p className="text-lg mb-4">Your Score: {finalScore}</p>
          <button
            onClick={handleRestart}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl shadow-lg"
          >
            Restart Game
          </button>
        </div>
      ) : (
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 20px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 20px)`,
            gap: "1px",
            background: "#222",
            padding: "5px",
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE;
            const y = Math.floor(index / GRID_SIZE);

            let cellColor = "#111";
            for (const id in gameState.players) {
              gameState.players[id].snake.forEach((segment, idx) => {
                if (segment.x === x && segment.y === y) {
                  cellColor = idx === 0 ? "white" : gameState.players[id].color;
                }
              });
            }
            if (gameState.food?.x === x && gameState.food?.y === y) {
              cellColor = "red";
            }

            return (
              <div
                key={index}
                style={{ width: 20, height: 20, backgroundColor: cellColor }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

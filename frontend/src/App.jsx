// src/App.jsx
import React, { useState } from "react";
import { SocketProvider } from "./context/SocketContext";
import JoinPage from "./components/JoinPage";
import GameBoard from "./components/GameBoard";
import Leaderboard from "./components/Leaderboard";

function AppContent() {
  const [playerName, setPlayerName] = useState(null);

  if (!playerName) {
    return <JoinPage onJoin={(name) => setPlayerName(name)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-4">🐍 Multiplayer Snake — Welcome {playerName}!</h1>
      <div className="flex gap-6">
        <GameBoard />
        <Leaderboard />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

// src/components/JoinPage.jsx
import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";

export default function JoinPage({ onJoin }) {
  const socket = useSocket();
  const [name, setName] = useState("");

  // optional: focus input automatically
  useEffect(() => {
    const el = document.getElementById("join-name");
    if (el) el.focus();
  }, []);

  const handleJoin = () => {
    const trimmed = name.trim();
    if (!trimmed || !socket) return;
    socket.emit("joinGame", trimmed);
    onJoin(trimmed);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleJoin();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4">Enter your name</h2>
        <input
          id="join-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Your name"
          className="px-3 py-2 rounded w-64 text-black"
        />
        <div className="mt-4">
          <button
            onClick={handleJoin}
            className="bg-green-600 px-4 py-2 rounded font-semibold hover:bg-green-700"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  );
}

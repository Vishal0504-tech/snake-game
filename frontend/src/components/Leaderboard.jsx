// src/components/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function Leaderboard() {
  const socket = useSocket();
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const onLb = (data) => {
      setLeaders(Array.isArray(data) ? data : []);
    };

    socket.on("leaderboard", onLb);
    return () => socket.off("leaderboard", onLb);
  }, [socket]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg w-64">
      <h3 className="text-white font-bold mb-3">🏆 Leaderboard</h3>
      {leaders.length === 0 ? (
        <p className="text-gray-400">No players yet</p>
      ) : (
        <ul className="space-y-1">
          {leaders.map((p, i) => (
            <li key={i} className="flex justify-between text-white">
              <span>{i + 1}. {p.name}</span>
              <span className="text-green-400 font-semibold">{p.score}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

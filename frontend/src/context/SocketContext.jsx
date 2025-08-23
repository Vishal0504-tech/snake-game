// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:4000", {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    s.on("connect", () => console.log("Socket connected:", s.id));
    s.on("connect_error", (err) => console.warn("Socket connect_error", err));

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

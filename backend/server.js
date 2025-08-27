const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// CORS for local development
if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "http://localhost:5173" }));
}

// ===== MongoDB (Leaderboard persistence) =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

const playerSchema = new mongoose.Schema({
  name: String,
  score: Number,
});
const Player = mongoose.model("Player", playerSchema);

// ===== Game Logic =====
const GRID_SIZE = 20;
const players = {}; // { socketId: { name, snake, dir, score, color } }
let food = randomFood();

function randomFood() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

function randomColor() {
  const colors = ["red", "blue", "green", "yellow", "purple", "orange"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ===== Game Loop =====
setInterval(async () => {
  for (const id in players) {
    let player = players[id];
    if (!player) continue;

    // Move snake head
    const head = { ...player.snake[0] };
    if (player.dir === "UP") head.y -= 1;
    if (player.dir === "DOWN") head.y += 1;
    if (player.dir === "LEFT") head.x -= 1;
    if (player.dir === "RIGHT") head.x += 1;

    // Hit wall
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      console.log(`💀 ${player.name} hit the wall!`);
      io.to(id).emit("gameOver", player.score);
      await Player.findOneAndUpdate(
        { name: player.name },
        { $max: { score: player.score } },
        { upsert: true }
      );
      delete players[id];
      continue;
    }

    // Hit self
    if (player.snake.some((s) => s.x === head.x && s.y === head.y)) {
      console.log(`💀 ${player.name} bit itself!`);
      io.to(id).emit("gameOver", player.score);
      await Player.findOneAndUpdate(
        { name: player.name },
        { $max: { score: player.score } },
        { upsert: true }
      );
      delete players[id];
      continue;
    }

    // Hit another player
    let collided = false;
    for (const otherId in players) {
      if (otherId === id) continue;
      const other = players[otherId];
      if (other.snake.some((s) => s.x === head.x && s.y === head.y)) {
        console.log(`💀 ${player.name} collided with ${other.name}!`);
        io.to(id).emit("gameOver", player.score);
        await Player.findOneAndUpdate(
          { name: player.name },
          { $max: { score: player.score } },
          { upsert: true }
        );
        delete players[id];
        collided = true;
        break;
      }
    }
    if (collided) continue;

    // Move snake
    player.snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      player.score += 10;
      food = randomFood();
    } else {
      player.snake.pop();
    }
  }

  // Broadcast game state
  io.emit("gameState", { players, food });

  // Broadcast leaderboard
  const leaderboard = Object.values(players)
    .map((p) => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score);
  io.emit("leaderboard", leaderboard);
}, 200);

// ===== Socket.IO =====
io.on("connection", (socket) => {
  console.log(`⚡ Player connected: ${socket.id}`);

  socket.on("joinGame", (name) => {
    players[socket.id] = {
      name,
      snake: [
        {
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE),
        },
      ],
      dir: "RIGHT",
      score: 0,
      color: randomColor(),
    };
    console.log(`🎮 ${name} joined the game`);
  });

  socket.on("keydown", (dir) => {
    if (players[socket.id]) players[socket.id].dir = dir;
  });

  socket.on("disconnect", async () => {
    const player = players[socket.id];
    if (player) {
      console.log(`❌ ${player.name} disconnected`);
      await Player.findOneAndUpdate(
        { name: player.name },
        { $max: { score: player.score } },
        { upsert: true }
      );
      delete players[socket.id];
    }
  });
});

// ===== Serve frontend in production =====
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// ===== API Routes =====
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Player.find().sort({ score: -1 }).limit(10);
    res.json(leaderboard);
  } catch {
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

app.get("/api/players", (req, res) => {
  const activePlayers = Object.values(players).map((p) => ({
    name: p.name,
    score: p.score,
    color: p.color,
  }));
  res.json(activePlayers);
});

// ===== Start Server =====
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

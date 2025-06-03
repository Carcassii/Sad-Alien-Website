const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static('.'));

// Game state
const players = new Map();
const balls = new Map();

// Physics constants
const GRAVITY = 0.2;
const FRICTION = 0.99;
const BALL_RADIUS = 15;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Handle socket connections
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create new player
  const player = {
    id: socket.id,
    name: `Player ${socket.id.slice(0, 4)}`,
    score: 0,
    ball: null
  };
  players.set(socket.id, player);

  // Send initial game state
  socket.emit('gameState', {
    players: Object.fromEntries(players),
    balls: Object.fromEntries(balls)
  });

  // Broadcast new player to others
  socket.broadcast.emit('playerJoined', player);

  // Handle player state updates
  socket.on('playerState', (state) => {
    const player = players.get(socket.id);
    if (player) {
      player.flippers = state.flippers;
      if (state.launchPower > 0) {
        player.launchPower = state.launchPower;
      }
    }
  });

  // Handle ball launch
  socket.on('launchBall', ({ power }) => {
    const player = players.get(socket.id);
    if (player && !player.ball) {
      const ball = {
        id: `${socket.id}-${Date.now()}`,
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 100,
        vx: 0,
        vy: -power,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      };
      balls.set(ball.id, ball);
      player.ball = ball;
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    const player = players.get(socket.id);
    if (player && player.ball) {
      balls.delete(player.ball.id);
    }
    players.delete(socket.id);
    io.emit('playerLeft', socket.id);
  });
});

// Game loop
setInterval(() => {
  // Update ball physics
  balls.forEach((ball, id) => {
    // Apply gravity
    ball.vy += GRAVITY;
    
    // Apply friction
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;
    
    // Update position
    ball.x += ball.vx;
    ball.y += ball.vy;
    
    // Handle collisions with walls
    if (ball.x < BALL_RADIUS) {
      ball.x = BALL_RADIUS;
      ball.vx *= -0.8;
    }
    if (ball.x > CANVAS_WIDTH - BALL_RADIUS) {
      ball.x = CANVAS_WIDTH - BALL_RADIUS;
      ball.vx *= -0.8;
    }
    if (ball.y < BALL_RADIUS) {
      ball.y = BALL_RADIUS;
      ball.vy *= -0.8;
    }
    if (ball.y > CANVAS_HEIGHT - BALL_RADIUS) {
      ball.y = CANVAS_HEIGHT - BALL_RADIUS;
      ball.vy *= -0.8;
    }

    // Handle ball-ball collisions
    balls.forEach((otherBall, otherId) => {
      if (id !== otherId) {
        const dx = otherBall.x - ball.x;
        const dy = otherBall.y - ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < BALL_RADIUS * 2) {
          // Collision response
          const angle = Math.atan2(dy, dx);
          const sin = Math.sin(angle);
          const cos = Math.cos(angle);
          
          // Rotate velocities
          const vx1 = ball.vx * cos + ball.vy * sin;
          const vy1 = ball.vy * cos - ball.vx * sin;
          const vx2 = otherBall.vx * cos + otherBall.vy * sin;
          const vy2 = otherBall.vy * cos - otherBall.vx * sin;
          
          // Swap velocities
          ball.vx = vx2 * cos - vy1 * sin;
          ball.vy = vy1 * cos + vx2 * sin;
          otherBall.vx = vx1 * cos - vy2 * sin;
          otherBall.vy = vy2 * cos + vx1 * sin;
          
          // Move balls apart
          const overlap = BALL_RADIUS * 2 - distance;
          ball.x -= overlap * cos / 2;
          ball.y -= overlap * sin / 2;
          otherBall.x += overlap * cos / 2;
          otherBall.y += overlap * sin / 2;
        }
      }
    });
  });

  // Broadcast game state
  io.emit('gameState', {
    players: Object.fromEntries(players),
    balls: Object.fromEntries(balls)
  });
}, 1000 / 60); // 60 FPS

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
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
const FLIPPER_LENGTH = 50;
const FLIPPER_WIDTH = 10;

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

  // Handle player name set
  socket.on('setName', (name) => {
    const player = players.get(socket.id);
    if (player && typeof name === 'string' && name.trim().length > 0) {
      player.name = name.trim().slice(0, 16);
      // Broadcast updated player info
      io.emit('playerJoined', player);
    }
  });

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

// Bumper definitions (should match client)
const BUMPERS = [
  { x: 400, y: 200, r: 30, score: 100 },
  { x: 300, y: 300, r: 25, score: 150 },
  { x: 500, y: 300, r: 25, score: 150 }
];

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

    // Flipper collision (simple)
    players.forEach((player) => {
      if (!player.flippers) return;
      // Left flipper
      const leftFlipper = {
        x: CANVAS_WIDTH * 0.3,
        y: CANVAS_HEIGHT - 50,
        angle: player.flippers.left.angle,
        pressed: player.flippers.left.pressed
      };
      // Right flipper
      const rightFlipper = {
        x: CANVAS_WIDTH * 0.7,
        y: CANVAS_HEIGHT - 50,
        angle: player.flippers.right.angle,
        pressed: player.flippers.right.pressed
      };
      [leftFlipper, rightFlipper].forEach(flipper => {
        // Flipper tip position
        const tipX = flipper.x + Math.cos(flipper.angle) * FLIPPER_LENGTH;
        const tipY = flipper.y + Math.sin(flipper.angle) * FLIPPER_LENGTH;
        // If ball is near the flipper tip and flipper is pressed, reflect ball
        const dx = ball.x - tipX;
        const dy = ball.y - tipY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BALL_RADIUS + FLIPPER_WIDTH && flipper.pressed) {
          // Reflect ball away from flipper tip
          const angle = Math.atan2(dy, dx);
          const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 8;
          ball.vx = Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;
        }
      });
    });

    // Bumper collision and scoring
    BUMPERS.forEach(bumper => {
      const dx = ball.x - bumper.x;
      const dy = ball.y - bumper.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < BALL_RADIUS + bumper.r) {
        // Simple bounce
        const angle = Math.atan2(dy, dx);
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) || 5;
        ball.vx = Math.cos(angle) * speed * 1.1;
        ball.vy = Math.sin(angle) * speed * 1.1;
        // Award points
        for (const [pid, player] of players) {
          if (player.ball && player.ball.id === ball.id) {
            player.score += bumper.score;
          }
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
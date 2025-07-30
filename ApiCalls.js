const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const teams = {}; // { teamName: { users: {}, prompt: { user1: "", user2: "" } } }

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join_team', ({ username, team }) => {
    socket.join(team);
    socket.username = username;
    socket.team = team;

    if (!teams[team]) {
      teams[team] = { users: {}, prompt: {} };
    }

    teams[team].users[username] = socket.id;
    if (!teams[team].prompt[username]) {
      teams[team].prompt[username] = '';
    }

    // Send current prompt to the new user
    io.to(socket.id).emit('update_prompt', teams[team].prompt);
  });

  socket.on('update_input', (text) => {
    const { team, username } = socket;
    if (team && teams[team]) {
      teams[team].prompt[username] = text;

      // Broadcast updated prompt to all users in the team
      io.to(team).emit('update_prompt', teams[team].prompt);
    }
  });

  socket.on('disconnect', () => {
    const { team, username } = socket;
    if (team && username && teams[team]) {
      delete teams[team].users[username];
      delete teams[team].prompt[username];
    }
    console.log('User disconnected');
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));

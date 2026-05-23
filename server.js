/**
 * Signal Lost v2 — Socket.IO Multiplayer Server
 * Phase 5 Task 1: Real-time multiplayer setup
 *
 * Handles: player join/leave, position sync (2.5s), objective state sync,
 * extraction sync, score sync, chat, spectator mode, reconnection.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  cors: { origin: '*' }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// ── Game State ──
const games = new Map(); // joinCode -> game session
const spectators = new Map(); // joinCode -> Set of socket ids

function generateCode() {
  const adj = ['AQUA','ECHO','FIELD','GOLD','IRON','JADE','LUNAR','NOVA','OMEGA','RADAR','SIGMA','TOWER','ULTR','VENUS','WAVE','YUKON','ZEBRA','ALPHA','BRAVO','DELTA'];
  const nouns = ['RADAR','SIGNAL','GHOST','PHANTOM','WATCH','BEACON','RELAY','PULSE','SENTRY','VECTOR','STORM','SHADOW','TRAIL','RIDGE','FORGE'];
  const a = adj[Math.floor(Math.random() * adj.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = String(Math.floor(Math.random() * 90) + 10);
  return `${a}-${n}-${num}`;
}

function getPlayersObject(game) {
  const obj = {};
  for (const [id, p] of game.players) {
    obj[id] = { ...p };
  }
  return obj;
}

function broadcastPlayers(game) {
  io.to(game.code).emit('players-update', getPlayersObject(game));
}

function leaveCurrentGame(socket) {
  for (const [code, game] of games) {
    if (game.players.has(socket.id)) {
      const wasHost = game.hostId === socket.id;
      const playerName = game.players.get(socket.id).name;
      game.players.delete(socket.id);
      socket.leave(code);

      // Promote new host if host leaves
      if (wasHost && game.players.size > 0) {
        const nextHost = game.players.values().next().value;
        game.hostId = nextHost.id;
        nextHost.isHost = true;
        io.to(nextHost.id).emit('chat', {
          sender: 'System',
          callsign: '',
          role: 'System',
          text: 'You are now the mission host.'
        });
      }

      if (game.players.size === 0) {
        games.delete(code);
        spectators.delete(code);
      } else {
        broadcastPlayers(game);
        io.to(code).emit('chat', {
          sender: 'System',
          callsign: '',
          role: 'System',
          text: `${playerName || 'An agent'} has left the mission.`
        });
      }
      break;
    }
  }
  // Remove from spectators
  for (const [code, specSet] of spectators) {
    if (specSet.has(socket.id)) {
      specSet.delete(socket.id);
      if (specSet.size === 0) spectators.delete(code);
      io.to(code).emit('spectator-count', specSet?.size || 0);
      break;
    }
  }
}

// ── Socket Events ──
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Host a new game
  socket.on('host-game', ({ name, callsign }) => {
    leaveCurrentGame(socket);

    let code;
    do { code = generateCode(); } while (games.has(code));

    const game = {
      code,
      hostId: socket.id,
      players: new Map(),
      settings: { duration: 60, maxPlayers: 6, country: 'norway', city: 'oslo' },
      status: 'lobby',
      objectives: new Map(),
      extraction: { state: 'idle', by: null, startedAt: null },
      scores: { North: 0, South: 0 }
    };

    game.players.set(socket.id, {
      id: socket.id,
      name: name || 'Host',
      callsign: callsign || 'HOST',
      role: null,
      team: 'North',
      lat: null,
      lng: null,
      heading: 0,
      signal: 85,
      stamina: 90,
      bot: false,
      isHost: true
    });

    games.set(code, game);
    socket.join(code);
    socket.name = name;

    socket.emit('game-created', { code, players: getPlayersObject(game), settings: game.settings });
    broadcastPlayers(game);
    console.log(`[host] ${code} by ${name}`);
  });

  // Join a game
  socket.on('join-game', ({ code, profile }) => {
    leaveCurrentGame(socket);

    const game = games.get(code?.toUpperCase?.());
    if (!game) {
      socket.emit('error-msg', 'Mission code not found.');
      return;
    }
    if (game.status !== 'lobby') {
      socket.emit('error-msg', 'Mission already in progress.');
      return;
    }
    if (game.players.size >= game.settings.maxPlayers) {
      socket.emit('error-msg', 'Mission squad is full.');
      return;
    }

    const name = profile?.name || 'Agent';
    const callsign = profile?.callsign || '';

    game.players.set(socket.id, {
      id: socket.id,
      name,
      callsign,
      role: null,
      team: 'North',
      lat: null,
      lng: null,
      heading: 0,
      signal: 78,
      stamina: 85,
      bot: false,
      isHost: false
    });

    socket.join(code);
    socket.name = name;

    socket.emit('game-joined', { code, players: getPlayersObject(game), settings: game.settings });
    broadcastPlayers(game);
    io.to(code).emit('chat', {
      sender: 'System',
      callsign: '',
      role: 'System',
      text: `${name} has linked to the mission.`
    });
    console.log(`[join] ${code} by ${name}`);
  });

  // Spectate a game
  socket.on('spectate-game', ({ code }) => {
    const game = games.get(code?.toUpperCase?.());
    if (!game) {
      socket.emit('error-msg', 'Mission code not found.');
      return;
    }

    socket.leave(code);
    socket.join(code);

    if (!spectators.has(code)) spectators.set(code, new Set());
    spectators.get(code).add(socket.id);

    socket.emit('spectate-joined', {
      code,
      players: getPlayersObject(game),
      settings: game.settings
    });
    io.to(code).emit('spectator-count', spectators.get(code).size);
    console.log(`[spectate] ${code} by ${socket.id}`);
  });

  // Request full state sync (reconnection)
  socket.on('request-state-sync', ({ code }) => {
    const game = games.get(code?.toUpperCase?.());
    if (!game) return;
    const player = game.players.get(socket.id);
    if (!player) return;

    socket.emit('game-state-sync', {
      agents: Array.from(game.players.values()).map(p => ({
        id: p.id, name: p.name, callsign: p.callsign,
        role: p.role, team: p.team,
        lat: p.lat, lng: p.lng, signal: p.signal, stamina: p.stamina
      })),
      objectives: Array.from(game.objectives.values()),
      scores: game.scores,
      remaining: game.settings.duration * 60,
      extracting: game.extraction.state === 'started',
      extractCountdown: game.extraction.state === 'started' ? 15 : 0
    });
  });

  // Select role
  socket.on('select-role', ({ role, team }) => {
    for (const [, game] of games) {
      if (game.players.has(socket.id)) {
        const p = game.players.get(socket.id);
        p.role = role;
        p.team = team;
        broadcastPlayers(game);
        break;
      }
    }
  });

  // Update position → broadcast player-moved to room (throttled naturally by client ~2.5s)
  socket.on('update-position', ({ lat, lng, heading }) => {
    for (const [, game] of games) {
      if (game.players.has(socket.id)) {
        const p = game.players.get(socket.id);
        p.lat = lat ?? p.lat;
        p.lng = lng ?? p.lng;
        p.heading = heading ?? p.heading;
        socket.to(game.code).emit('player-moved', {
          id: socket.id,
          lat: p.lat,
          lng: p.lng,
          heading: p.heading
        });
        break;
      }
    }
  });

  // Chat message
  socket.on('chat-message', ({ text, teamOnly }) => {
    for (const [, game] of games) {
      if (game.players.has(socket.id)) {
        const p = game.players.get(socket.id);
        const msg = {
          sender: p.name,
          callsign: p.callsign,
          role: p.role || 'Unknown',
          text: String(text).slice(0, 280),
          team: teamOnly ? p.team : null,
          timestamp: Date.now()
        };
        io.to(game.code).emit('chat', msg);
        console.log(`[chat] ${game.code} <${p.name}> ${msg.text}`);
        break;
      }
    }
  });

  // Launch mission (host only)
  socket.on('launch-mission', () => {
    for (const [, game] of games) {
      if (game.hostId === socket.id && game.status === 'lobby') {
        game.status = 'live';

        // Auto-assign roles and teams for players without them
        const roles = ['Drone','Mechanic','Medic','Decoder','Navigator','Courier','Mission Control'];
        const teamOrder = ['North','South'];
        let idx = 0;
        for (const p of game.players.values()) {
          if (!p.role) {
            p.role = roles[idx % roles.length];
          }
          if (!p.team) {
            p.team = teamOrder[idx % 2];
          }
          idx++;
        }

        // Add bot agents to fill roster
        const botNames = ['Ada','Mika','Rune','Liv','Echo','Kai'];
        let bi = 0;
        while (game.players.size < Math.min(4, game.settings.maxPlayers)) {
          const bid = `bot-${bi}`;
          if (!game.players.has(bid)) {
            game.players.set(bid, {
              id: bid,
              name: botNames[bi % botNames.length],
              callsign: botNames[bi % botNames.length].toUpperCase(),
              role: roles[bi % roles.length],
              team: teamOrder[bi % 2],
              bot: true,
              ready: true,
              lat: null,
              lng: null,
              signal: 65 + Math.floor(Math.random() * 25),
              stamina: 70 + Math.floor(Math.random() * 20)
            });
          }
          bi++;
        }

        io.to(game.code).emit('mission-launched', {
          players: getPlayersObject(game),
          duration: game.settings.duration
        });
        console.log(`[launch] ${game.code} — mission started`);
        break;
      }
    }
  });

  // Objective state sync
  socket.on('objective-update', ({ id, found, progress, decodedBy }) => {
    for (const [, game] of games) {
      if (game.players.has(socket.id)) {
        game.objectives.set(id, { found, progress, decodedBy, updatedAt: Date.now() });
        socket.to(game.code).emit('objective-sync', {
          id,
          found,
          progress,
          decodedBy: decodedBy || game.players.get(socket.id)?.name,
          playerId: socket.id
        });
        break;
      }
    }
  });

  // Extraction sync
  socket.on('extraction-start', () => {
    for (const [, game] of games) {
      if (game.players.has(socket.id)) {
        const p = game.players.get(socket.id);
        game.extraction = { state: 'started', by: p.name, startedAt: Date.now() };
        io.to(game.code).emit('extraction-sync', {
          state: 'started',
          by: p.name,
          playerId: socket.id
        });
        console.log(`[extraction] ${game.code} started by ${p.name}`);
        break;
      }
    }
  });

  socket.on('extraction-complete', () => {
    for (const [, game] of games) {
      if (game.players.has(socket.id)) {
        const p = game.players.get(socket.id);
        game.extraction = { state: 'completed', by: p.name, startedAt: game.extraction.startedAt };
        io.to(game.code).emit('extraction-sync', {
          state: 'completed',
          by: p.name,
          playerId: socket.id
        });
        console.log(`[extraction] ${game.code} completed by ${p.name}`);
        break;
      }
    }
  });

  // Score sync
  socket.on('score-update', ({ team, delta, total }) => {
    for (const [, game] of games) {
      if (game.players.has(socket.id)) {
        if (team && game.scores[team] !== undefined) {
          game.scores[team] = total !== undefined ? total : (game.scores[team] + (delta || 0));
        }
        io.to(game.code).emit('score-sync', {
          team,
          delta,
          total: game.scores[team]
        });
        break;
      }
    }
  });

  // Host broadcasts mission state snapshot for spectators
  socket.on('mission-state-snapshot', (snapshot) => {
    for (const [, game] of games) {
      if (game.hostId === socket.id) {
        const specSet = spectators.get(game.code);
        if (!specSet || specSet.size === 0) return;
        specSet.forEach(sid => {
          io.to(sid).emit('spectator-snapshot', snapshot);
        });
        break;
      }
    }
  });

  // Latency ping-pong
  socket.on('ping-latency', (ts) => {
    socket.emit('pong-latency', ts);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    leaveCurrentGame(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Signal Lost v2 multiplayer server running on http://0.0.0.0:${PORT}`);
});

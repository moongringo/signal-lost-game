/**
 * Signal Lost v2 — Multiplayer Server
 * Socket.IO + Express — syncs game state between players
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// ── Game State ──
const games = new Map(); // joinCode -> game session
const spectators = new Map(); // joinCode -> Set of socket ids
const lastPosUpdate = new Map(); // socketId -> timestamp (throttle position sync)

function generateCode() {
  const adj = ['AQUA','ECHO','FIELD','GOLD','IRON','JADE','LUNAR','NOVA','OMEGA','RADAR','SIGMA','TOWER','ULTR','VENUS','WAVE','YUKON','ZEBRA','ALPHA','BRAVO','DELTA'];
  const nouns = ['RADAR','SIGNAL','GHOST','PHANTOM','WATCH','BEACON','RELAY','PULSE','SENTRY','VECTOR','STORM','SHADOW','TRAIL','RIDGE','FORGE'];
  const a = adj[Math.floor(Math.random()*adj.length)];
  const n = nouns[Math.floor(Math.random()*nouns.length)];
  const num = String(Math.floor(Math.random()*90)+10);
  return `${a}-${n}-${num}`;
}

// ── Socket Events ──
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);
  let currentGame = null;
  let currentPlayer = null;

  // Host a new game
  socket.on('host-game', (profile) => {
    let code;
    do { code = generateCode(); } while (games.has(code));
    const game = {
      code,
      host: socket.id,
      state: 'lobby',
      players: {},
      settings: { duration: 60, maxPlayers: 6, country: 'norway', city: 'oslo' },
      missionState: null
    };
    games.set(code, game);
    currentGame = code;

    const player = {
      id: socket.id,
      name: profile.name || 'Host',
      callsign: profile.callsign || 'HOST',
      role: null,
      team: null,
      ready: false,
      lat: null, lng: null,
      signal: 85, stamina: 90
    };
    game.players[socket.id] = player;
    currentPlayer = player;

    socket.join(code);
    socket.emit('game-created', { code, players: game.players, settings: game.settings });
    io.to(code).emit('players-update', game.players);
    console.log(`[host] ${code} by ${player.name}`);
  });

  // Join a game
  socket.on('join-game', ({ code, profile }) => {
    const game = games.get(code?.toUpperCase());
    if (!game) return socket.emit('error-msg', 'Mission code not found.');
    if (Object.keys(game.players).length >= game.settings.maxPlayers)
      return socket.emit('error-msg', 'Mission is full.');
    if (game.state !== 'lobby') return socket.emit('error-msg', 'Mission already started.');

    const player = {
      id: socket.id,
      name: profile.name || 'Agent',
      callsign: profile.callsign || 'AGENT',
      role: null,
      team: null,
      ready: false,
      lat: null, lng: null,
      signal: 78, stamina: 92
    };
    game.players[socket.id] = player;
    currentGame = code;
    currentPlayer = player;

    socket.join(code);
    socket.emit('game-joined', { code, players: game.players, settings: game.settings });
    io.to(code).emit('players-update', game.players);
    console.log(`[join] ${code} by ${player.name}`);
  });

  // Spectate a game
  socket.on('spectate-game', ({ code }) => {
    const game = games.get(code?.toUpperCase());
    if (!game) return socket.emit('error-msg', 'Mission code not found.');
    if (game.state !== 'mission') return socket.emit('error-msg', 'Mission not live yet.');

    currentGame = code;
    if (!spectators.has(code)) spectators.set(code, new Set());
    spectators.get(code).add(socket.id);

    socket.join(code);
    socket.emit('spectate-joined', { code, players: game.players, settings: game.settings });
    // Notify players of new spectator
    io.to(code).emit('spectator-count', spectators.get(code).size);
    console.log(`[spectate] ${code} by ${socket.id}`);
  });

  // Spectator requests live state snapshot
  socket.on('request-spectator-state', () => {
    if (!currentGame) return;
    const game = games.get(currentGame);
    if (!game) return;
    socket.emit('spectator-state', {
      players: game.players,
      settings: game.settings,
      spectatorCount: spectators.get(currentGame)?.size || 0
    });
  });

  // Latency ping-pong
  socket.on('ping-latency', (clientTs) => {
    socket.emit('pong-latency', clientTs);
  });

  // Reconnection state sync request
  socket.on('request-state-sync', ({ code }) => {
    const game = games.get(code?.toUpperCase());
    if (!game) return;
    socket.emit('game-state-sync', {
      agents: Object.values(game.players),
      objectives: game.missionState?.objectives || [],
      threats: game.missionState?.threats || [],
      scores: game.missionState?.scores || { North: 0, South: 0 },
      remaining: game.missionState?.remaining || game.settings.duration * 60,
      extracting: game.missionState?.extracting || false,
      extractCountdown: game.missionState?.extractCountdown || 0,
      weather: game.missionState?.weather || { type: 'clear' },
      downedAgents: game.missionState?.downedAgents || {},
      supplyCaches: game.missionState?.supplyCaches || [],
      terrainZones: game.missionState?.terrainZones || [],
      traps: game.missionState?.traps || [],
      pings: game.missionState?.pings || [],
      waypoints: game.missionState?.waypoints || []
    });
  });

  // Player selects a role
  socket.on('select-role', ({ role, team }) => {
    if (!currentGame || !currentPlayer) return;
    const game = games.get(currentGame);
    if (!game) return;

    currentPlayer.role = role;
    currentPlayer.team = team;
    io.to(currentGame).emit('players-update', game.players);
  });

  // Update position (throttled to ~2.5s per client)
  socket.on('update-position', ({ lat, lng, heading }) => {
    if (!currentGame || !currentPlayer) return;
    const now = Date.now();
    const last = lastPosUpdate.get(socket.id) || 0;
    if (now - last < 2000) return; // throttle: min 2s between updates
    lastPosUpdate.set(socket.id, now);
    currentPlayer.lat = lat;
    currentPlayer.lng = lng;
    if (heading !== undefined) currentPlayer.heading = heading;
    socket.to(currentGame).emit('player-moved', {
      id: socket.id,
      lat, lng,
      heading: currentPlayer.heading
    });
  });

  // Send chat message
  socket.on('chat-message', (text) => {
    if (!currentGame || !currentPlayer) return;
    const msg = {
      sender: currentPlayer.name,
      callsign: currentPlayer.callsign,
      role: currentPlayer.role,
      text: String(text).slice(0, 280),
      timestamp: Date.now()
    };
    io.to(currentGame).emit('chat', msg);
    console.log(`[chat] ${currentGame} <${currentPlayer.name}> ${msg.text}`);
  });

  // Launch mission (host only)
  socket.on('launch-mission', () => {
    if (!currentGame || !currentPlayer) return;
    const game = games.get(currentGame);
    if (!game || game.host !== socket.id) return;

    game.state = 'mission';
    // Generate objectives, assign teams, etc.
    const roles = ['Drone','Mechanic','Medic','Decoder','Navigator','Courier','Mission Control'];
    const teamOrder = ['North','South'];
    let idx = 0;
    Object.values(game.players).forEach(p => {
      if (!p.role) {
        p.role = roles[idx % roles.length];
        p.team = teamOrder[idx % 2];
        idx++;
      } else if (!p.team) {
        p.team = teamOrder[idx % 2];
        idx++;
      }
    });

    // Assign bot agents to fill roster
    const botNames = ['Ada','Mika','Rune','Liv','Echo','Kai'];
    let bi = 0;
    while (Object.keys(game.players).length < Math.min(4, game.settings.maxPlayers)) {
      const bid = `bot-${bi}`;
      if (!game.players[bid]) {
        game.players[bid] = {
          id: bid, name: botNames[bi % botNames.length],
          callsign: botNames[bi % botNames.length].toUpperCase(),
          role: roles[bi % roles.length],
          team: teamOrder[bi % 2],
          bot: true, ready: true,
          lat: null, lng: null, signal: 65 + Math.floor(Math.random()*25), stamina: 70 + Math.floor(Math.random()*20)
        };
      }
      bi++;
    }

    io.to(currentGame).emit('mission-launched', {
      players: game.players,
      duration: game.settings.duration
    });
    console.log(`[launch] ${currentGame} — mission started`);
  });

  // Objective progress / completion
  socket.on('objective-update', ({ id, found, progress }) => {
    if (!currentGame) return;
    io.to(currentGame).emit('objective-sync', { id, found, progress, playerId: socket.id });
  });

  // Objective fully decoded / found
  socket.on('objective-decoded', ({ id }) => {
    if (!currentGame) return;
    const p = currentPlayer;
    io.to(currentGame).emit('objective-sync', { id, found: true, decodedBy: p?.name || 'Unknown', playerId: socket.id });
  });

  // Extraction state sync
  socket.on('extraction-start', () => {
    if (!currentGame) return;
    const p = currentPlayer;
    io.to(currentGame).emit('extraction-sync', { state: 'started', by: p?.name || 'Unknown', playerId: socket.id });
  });

  socket.on('extraction-complete', () => {
    if (!currentGame) return;
    const p = currentPlayer;
    io.to(currentGame).emit('extraction-sync', { state: 'completed', by: p?.name || 'Unknown', playerId: socket.id });
  });

  // Score sync (host or any player broadcasts local score changes)
  socket.on('score-update', ({ team, delta, total }) => {
    if (!currentGame) return;
    io.to(currentGame).emit('score-sync', { team, delta, total, playerId: socket.id });
  });

  // Host broadcasts mission state snapshot for spectators
  socket.on('mission-state-snapshot', (snapshot) => {
    if (!currentGame) return;
    const game = games.get(currentGame);
    if (!game || game.host !== socket.id) return;
    // Broadcast to spectators only
    const specSet = spectators.get(currentGame);
    if (!specSet || specSet.size === 0) return;
    specSet.forEach(sid => {
      io.to(sid).emit('spectator-snapshot', snapshot);
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    if (currentGame) {
      // Remove from spectators if applicable
      const specSet = spectators.get(currentGame);
      if (specSet && specSet.has(socket.id)) {
        specSet.delete(socket.id);
        if (specSet.size === 0) spectators.delete(currentGame);
        io.to(currentGame).emit('spectator-count', specSet?.size || 0);
      }
      const game = games.get(currentGame);
      if (game) {
        delete game.players[socket.id];
        if (Object.keys(game.players).length === 0) {
          games.delete(currentGame);
          spectators.delete(currentGame);
          console.log(`[cleanup] ${currentGame} — empty game removed`);
        } else {
          io.to(currentGame).emit('players-update', game.players);
          io.to(currentGame).emit('chat', {
            sender: 'System',
            text: `${currentPlayer?.name || 'A player'} disconnected.`
          });
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Signal Lost v2 server running on http://0.0.0.0:${PORT}`);
});

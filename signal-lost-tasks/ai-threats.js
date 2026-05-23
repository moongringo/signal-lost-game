/**
 * Signal Lost — AI Threats System
 * Patrol drones, sniper nests, environmental hazards
 */

(function() {
  'use strict';

  // ============ CONFIG ============
  const DRONE_SPEED = 0.00005; // degrees per tick (~5m/s)
  const DRONE_SPOT_RADIUS = 80; // meters
  const DRONE_ALERT_RANGE = 500; // meters broadcast to enemies
  const SNIPER_RANGE = 200; // meters
  const SNIPER_COOLDOWN = 8000; // ms between shots

  // ============ DRONE PATROL SYSTEM ============
  class PatrolDrone {
    constructor(id, waypoints, map) {
      this.id = id;
      this.waypoints = waypoints; // array of [lat, lng]
      this.currentIndex = 0;
      this.map = map;
      this.spotted = []; // players currently spotted
      this.alerted = false;
      this.direction = 1; // 1 = forward, -1 = reverse

      // Create marker
      this.marker = L.marker(this.waypoints[0], {
        icon: L.divIcon({
          className: 'patrol-drone',
          html: '🛸',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(map);

      // Create searchlight cone (circle)
      this.spotlight = L.circle(this.waypoints[0], {
        radius: DRONE_SPOT_RADIUS,
        color: '#df1f2d',
        fillColor: '#df1f2d',
        fillOpacity: 0.15,
        weight: 1,
        dashArray: '4 4'
      }).addTo(map);

      this.pathLine = L.polyline(waypoints, {
        color: '#df1f2d',
        weight: 1,
        opacity: 0.3,
        dashArray: '6 6'
      }).addTo(map);

      this.startPatrol();
    }

    startPatrol() {
      this.tick = setInterval(() => this.update(), 200);
    }

    update() {
      const target = this.waypoints[this.currentIndex + this.direction];
      if (!target) {
        this.direction *= -1;
        return;
      }

      const current = this.marker.getLatLng();
      const dx = target[1] - current.lng;
      const dy = target[0] - current.lat;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < DRONE_SPEED * 2) {
        this.currentIndex += this.direction;
        if (this.currentIndex >= this.waypoints.length - 1) this.direction = -1;
        if (this.currentIndex <= 0) this.direction = 1;
      } else {
        const newLat = current.lat + (dy / dist) * DRONE_SPEED;
        const newLng = current.lng + (dx / dist) * DRONE_SPEED;
        this.marker.setLatLng([newLat, newLng]);
        this.spotlight.setLatLng([newLat, newLng]);
      }

      this.checkSpotting();
    }

    checkSpotting() {
      // Stub: check against player positions
      // Will integrate with GPS tracking system
      const center = this.marker.getLatLng();
      // When player system is ready:
      // Object.values(playerPositions).forEach(player => {
      //   if (center.distanceTo(player.pos) < DRONE_SPOT_RADIUS) {
      //     this.triggerAlert(player);
      //   }
      // });
    }

    triggerAlert(player) {
      if (this.alerted) return;
      this.alerted = true;
      this.spotlight.setStyle({ fillColor: '#ff0000', fillOpacity: 0.4 });

      // Broadcast to enemy squad
      const event = new CustomEvent('droneAlert', {
        detail: { droneId: this.id, position: this.marker.getLatLng(), spotted: player }
      });
      document.dispatchEvent(event);

      // Visual flare
      L.circleMarker(this.marker.getLatLng(), {
        radius: 40,
        color: '#df1f2d',
        fillColor: '#df1f2d',
        fillOpacity: 0.6
      }).addTo(this.map).bindPopup('⚠️ DRONE ALERT — ENEMY SPOTTED').openPopup();

      setTimeout(() => { this.alerted = false; this.spotlight.setStyle({ fillColor: '#df1f2d', fillOpacity: 0.15 }); }, 10000);
    }

    destroy() {
      clearInterval(this.tick);
      this.map.removeLayer(this.marker);
      this.map.removeLayer(this.spotlight);
      this.map.removeLayer(this.pathLine);
    }

    hijack() {
      this.spotlight.setStyle({ color: '#00a9c7', fillColor: '#00a9c7' });
      this.marker.setIcon(L.divIcon({
        className: 'patrol-drone hijacked',
        html: '🛸✓',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      }));
      // Now spots enemies instead of players
    }
  }

  // ============ SNIPER NEST ============
  class SniperNest {
    constructor(id, position, map) {
      this.id = id;
      this.position = position;
      this.map = map;
      this.lastShot = 0;
      this.targets = [];

      this.marker = L.marker(position, {
        icon: L.divIcon({
          className: 'sniper-nest',
          html: '🔴',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      this.range = L.circle(position, {
        radius: SNIPER_RANGE,
        color: '#df1f2d',
        fillColor: '#df1f2d',
        fillOpacity: 0.05,
        weight: 1
      }).addTo(map);

      // Laser sight line
      this.laser = L.polyline([position, position], {
        color: '#ff0000',
        weight: 2,
        opacity: 0.6,
        dashArray: '10 5'
      }).addTo(map);
    }

    aimAt(targetPos) {
      this.laser.setLatLngs([this.position, targetPos]);
    }

    canFire() {
      return Date.now() - this.lastShot > SNIPER_COOLDOWN;
    }

    fire(target) {
      if (!this.canFire()) return false;
      this.lastShot = Date.now();

      // Laser flash
      this.laser.setStyle({ opacity: 1, weight: 4 });
      setTimeout(() => this.laser.setStyle({ opacity: 0.6, weight: 2 }), 300);

      // Shot tracer
      const tracer = L.polyline([this.position, target], {
        color: '#ffff00',
        weight: 3,
        opacity: 0.8
      }).addTo(this.map);
      setTimeout(() => this.map.removeLayer(tracer), 500);

      // Hit effect
      L.circleMarker(target, {
        radius: 15,
        color: '#df1f2d',
        fillColor: '#df1f2d',
        fillOpacity: 0.8
      }).addTo(this.map);

      return true;
    }

    destroy() {
      this.map.removeLayer(this.marker);
      this.map.removeLayer(this.range);
      this.map.removeLayer(this.laser);
    }
  }

  // ============ TRAP SYSTEM ============
  class TrapSystem {
    constructor(map) {
      this.map = map;
      this.traps = [];
    }

    placeMine(position, team) {
      const mine = L.marker(position, {
        icon: L.divIcon({
          className: 'mine-marker',
          html: '<div style="font-size:20px;text-shadow:0 0 6px ' + (team === 'alpha' ? '#00a9c7' : '#ff8b45') + ';">💣</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(this.map);

      const trigger = L.circle(position, {
        radius: 2,
        color: team === 'alpha' ? '#00a9c7' : '#ff8b45',
        fillColor: team === 'alpha' ? '#00a9c7' : '#ff8b45',
        fillOpacity: 0.3,
        weight: 1,
        dashArray: '3 3'
      }).addTo(this.map);

      this.traps.push({ type: 'mine', position, team, mine, trigger, armed: true });
      return mine;
    }

    placeTripwire(pos1, pos2, team) {
      const wire = L.polyline([pos1, pos2], {
        color: team === 'alpha' ? '#00a9c7' : '#ff8b45',
        weight: 2,
        opacity: 0.4,
        dashArray: '4 4'
      }).addTo(this.map);

      this.traps.push({ type: 'tripwire', pos1, pos2, team, wire, armed: true });
      return wire;
    }

    placeC4(position, team) {
      const c4 = L.marker(position, {
        icon: L.divIcon({
          className: 'c4-charge',
          html: '💣',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(this.map);

      this.traps.push({ type: 'c4', position, team, c4, armed: true, detonated: false });
      return c4;
    }

    detonateC4(trapId) {
      const trap = this.traps.find(t => t.type === 'c4' && !t.detonated);
      if (!trap) return;

      trap.detonated = true;
      const explosion = L.circleMarker(trap.position, {
        radius: 60,
        color: '#ff6600',
        fillColor: '#ff6600',
        fillOpacity: 0.6
      }).addTo(this.map);

      // Shockwave rings
      for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
          L.circle(trap.position, {
            radius: 30 * i,
            color: '#ff6600',
            weight: 2,
            opacity: 1 - i * 0.25
          }).addTo(this.map);
        }, i * 200);
      }

      setTimeout(() => this.map.removeLayer(explosion), 2000);
    }

    checkProximity(playerPos) {
      this.traps.forEach(trap => {
        if (!trap.armed) return;
        if (trap.type === 'mine') {
          const dist = this.map.distance(playerPos, trap.position);
          if (dist < 2) {
            this.triggerMine(trap);
          }
        }
      });
    }

    triggerMine(trap) {
      trap.armed = false;
      this.map.removeLayer(trap.mine);
      this.map.removeLayer(trap.trigger);

      L.circleMarker(trap.position, {
        radius: 30,
        color: '#df1f2d',
        fillColor: '#df1f2d',
        fillOpacity: 0.7
      }).addTo(this.map).bindPopup('💥 MINE DETONATED').openPopup();

      // Damage event
      const event = new CustomEvent('mineTriggered', {
        detail: { position: trap.position, team: trap.team }
      });
      document.dispatchEvent(event);
    }

    disarmMine(position, team) {
      const trap = this.traps.find(t =>
        t.type === 'mine' &&
        t.armed &&
        this.map.distance(position, t.position) < 3
      );
      if (!trap) return false;

      trap.armed = false;
      this.map.removeLayer(trap.mine);
      this.map.removeLayer(trap.trigger);

      L.marker(trap.position, {
        icon: L.divIcon({
          className: 'disarmed-mine',
          html: '✓',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(this.map).bindPopup('MINE DISARMED').openPopup();

      return true;
    }

    // Scout — find all mines within radius, return list + show scan blips
    scanMines(center, radius = 50) {
      const found = this.traps.filter(t =>
        t.type === 'mine' &&
        t.armed &&
        this.map.distance(center, t.position) <= radius
      );

      // Visual scan ring
      const scanRing = L.circle(center, {
        radius: radius,
        color: '#00a9c7',
        fillColor: '#00a9c7',
        fillOpacity: 0.05,
        weight: 2,
        dashArray: '8 8'
      }).addTo(this.map);

      // Mine blips — pulsing markers
      const blips = [];
      found.forEach((mine, i) => {
        const blip = L.circleMarker(mine.position, {
          radius: 12,
          color: '#ff8b45',
          fillColor: '#ff8b45',
          fillOpacity: 0.6,
          weight: 2
        }).addTo(this.map).bindPopup('💣 MINE DETECTED — ' + Math.round(this.map.distance(center, mine.position)) + 'm away');
        blips.push(blip);
      });

      // Fade scan after 8 seconds
      setTimeout(() => {
        this.map.removeLayer(scanRing);
        blips.forEach(b => this.map.removeLayer(b));
      }, 8000);

      return { count: found.length, mines: found.map(m => ({ position: m.position, distance: Math.round(this.map.distance(center, m.position)) })) };
    }

    // Find nearest armed mine for mechanic disarm
    findNearestMine(position, maxRange = 20) {
      let nearest = null;
      let nearestDist = Infinity;
      this.traps.forEach(t => {
        if (t.type !== 'mine' || !t.armed) return;
        const dist = this.map.distance(position, t.position);
        if (dist < nearestDist && dist <= maxRange) {
          nearestDist = dist;
          nearest = t;
        }
      });
      return nearest ? { mine: nearest, distance: Math.round(nearestDist) } : null;
    }
  }

  // ============ HAZARD SPAWNER ============
  class HazardSpawner {
    constructor(map) {
      this.map = map;
      this.hazards = [];
    }

    spawnGasZone(center, radius = 50, duration = 300000) {
      // Main toxic cloud — brighter, higher opacity, prominent border
      const gas = L.circle(center, {
        radius,
        color: '#1b5e20',
        fillColor: '#76ff03',
        fillOpacity: 0.45,
        weight: 3,
        dashArray: '8 4'
      }).addTo(this.map).bindPopup('☠️ POISON GAS — GAS MASK REQUIRED');

      // Skull icon at center — impossible to miss
      const skull = L.marker(center, {
        icon: L.divIcon({
          className: 'gas-skull-marker',
          html: '<div style="font-size:28px;text-shadow:0 0 8px #76ff03;">☠️</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(this.map);

      // Pulsing danger ring
      let pulse = 0;
      const ring = L.circle(center, {
        radius: radius + 10,
        color: '#76ff03',
        fillColor: 'transparent',
        weight: 3,
        opacity: 0.6
      }).addTo(this.map);

      const pulseInterval = setInterval(() => {
        pulse += 0.15;
        const newRadius = radius + 10 + Math.sin(pulse) * 15;
        ring.setRadius(newRadius);
        ring.setStyle({ opacity: 0.3 + Math.abs(Math.sin(pulse)) * 0.5 });
      }, 400);

      // Periodic damage tick event
      const tickInterval = setInterval(() => {
        const event = new CustomEvent('gasTick', {
          detail: { position: center, radius, damage: 5 }
        });
        document.dispatchEvent(event);
      }, 1000);

      this.hazards.push({ type: 'gas', zone: gas, ring, skull, interval: pulseInterval, tickInterval });

      setTimeout(() => {
        clearInterval(pulseInterval);
        clearInterval(tickInterval);
        this.map.removeLayer(gas);
        this.map.removeLayer(ring);
        this.map.removeLayer(skull);
      }, duration);

      return gas;
    }

    spawnEMP(center, radius = 100, duration = 60000) {
      const emp = L.circle(center, {
        radius,
        color: '#4a148c',
        fillColor: '#e040fb',
        fillOpacity: 0.35,
        weight: 3
      }).addTo(this.map).bindPopup('⚡ EMP FIELD — ELECTRONICS DISABLED');

      // Lightning icon at center
      const bolt = L.marker(center, {
        icon: L.divIcon({
          className: 'emp-bolt-marker',
          html: '<div style="font-size:28px;text-shadow:0 0 10px #e040fb;">⚡</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(this.map);

      // Static flicker ring
      let flicker = setInterval(() => {
        emp.setStyle({ fillOpacity: 0.2 + Math.random() * 0.3, weight: 2 + Math.random() * 3 });
      }, 200);

      // EMP pulse event
      const pulseInterval = setInterval(() => {
        const event = new CustomEvent('empPulse', {
          detail: { position: center, radius }
        });
        document.dispatchEvent(event);
      }, 3000);

      this.hazards.push({ type: 'emp', zone: emp, bolt, interval: flicker, pulseInterval });

      setTimeout(() => {
        clearInterval(flicker);
        clearInterval(pulseInterval);
        this.map.removeLayer(emp);
        this.map.removeLayer(bolt);
      }, duration);

      return emp;
    }

    spawnDecoyBeacon(position, team) {
      const beacon = L.marker(position, {
        icon: L.divIcon({
          className: 'decoy-beacon',
          html: '📡',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(this.map).bindPopup('📡 SIGNAL BEACON — VERIFY BEFORE APPROACHING');

      // Fake SOS ping
      const ping = L.circleMarker(position, {
        radius: 20,
        color: '#df1f2d',
        fillColor: 'transparent',
        weight: 2
      }).addTo(this.map);

      let pingRadius = 20;
      const pingAnim = setInterval(() => {
        pingRadius += 2;
        ping.setRadius(pingRadius);
        ping.setStyle({ opacity: 1 - (pingRadius / 200) });
      }, 200);

      setTimeout(() => {
        clearInterval(pingAnim);
        this.map.removeLayer(ping);
      }, 5000);

      this.hazards.push({ type: 'decoy', marker: beacon });
      return beacon;
    }
  }

  // ============ NOISE SYSTEM ============
  class NoiseSystem {
    constructor(map) {
      this.map = map;
      this.sources = [];
    }

    emitNoise(position, radius, type = 'unknown') {
      const icons = {
        walk: '👣',
        run: '👣👣',
        shot: '🔫',
        vehicle: '🚗',
        explosion: '💥'
      };

      const colors = {
        walk: '#8d6e63',
        run: '#ff9800',
        shot: '#df1f2d',
        vehicle: '#795548',
        explosion: '#ff5722'
      };

      const noise = L.circle(position, {
        radius,
        color: colors[type] || '#888',
        fillColor: colors[type] || '#888',
        fillOpacity: 0.1,
        weight: 1,
        dashArray: '4 4'
      }).addTo(this.map);

      // Fade out
      let opacity = 0.1;
      const fade = setInterval(() => {
        opacity -= 0.01;
        if (opacity <= 0) {
          clearInterval(fade);
          this.map.removeLayer(noise);
        } else {
          noise.setStyle({ fillOpacity: opacity, opacity: opacity * 2 });
        }
      }, 100);

      this.sources.push({ noise, type, position, radius });
    }

    // Direction indicator for enemies in range
    showDirectionIndicator(enemyPos, noisePos, noiseType) {
      const angle = Math.atan2(
        noisePos.lng - enemyPos.lng,
        noisePos.lat - enemyPos.lat
      ) * 180 / Math.PI;

      // Add directional arrow on enemy's HUD
      const event = new CustomEvent('noiseDetected', {
        detail: { angle, type: noiseType, distance: this.map.distance(enemyPos, noisePos) }
      });
      document.dispatchEvent(event);
    }
  }

  // ============ LOOT SYSTEM ============
  class LootSystem {
    constructor(map) {
      this.map = map;
      this.drops = [];
    }

    spawnDrop(position, items) {
      const drop = L.marker(position, {
        icon: L.divIcon({
          className: 'loot-drop',
          html: '<div style="font-size:32px;font-weight:900;color:#ffd700;text-shadow:0 0 12px #ff8c00, 0 0 4px #000;">?</div>',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        })
      }).addTo(this.map).bindPopup('🎒 LOOT: ' + items.join(', '));

      // Pulse ring — much more visible
      let pulse = 30;
      const ring = L.circle(position, {
        radius: pulse,
        color: '#ffd700',
        fillColor: 'transparent',
        weight: 3,
        opacity: 0.8
      }).addTo(this.map);

      const pulseInterval = setInterval(() => {
        pulse += 2;
        ring.setRadius(pulse);
        ring.setStyle({ opacity: Math.max(0, 1 - (pulse / 100)) });
        if (pulse > 100) {
          pulse = 30;
          ring.setStyle({ opacity: 0.8 });
        }
      }, 150);

      this.drops.push({ position, items, marker: drop, ring, interval: pulseInterval });
      return drop;
    }
  }

  // ============ MANAGER ============
  class AIThreatManager {
    constructor(map) {
      this.map = map;
      this.drones = [];
      this.snipers = [];
      this.traps = new TrapSystem(map);
      this.hazards = new HazardSpawner(map);
      this.noise = new NoiseSystem(map);
      this.loot = new LootSystem(map);
    }

    spawnDrone(waypoints) {
      const drone = new PatrolDrone(`drone-${this.drones.length}`, waypoints, this.map);
      this.drones.push(drone);
      return drone;
    }

    spawnSniper(position) {
      const sniper = new SniperNest(`sniper-${this.snipers.length}`, position, this.map);
      this.snipers.push(sniper);
      return sniper;
    }

    clearAll() {
      this.drones.forEach(d => d.destroy());
      this.snipers.forEach(s => s.destroy());
      this.drones = [];
      this.snipers = [];
      // Clear traps
      this.traps.traps.forEach(t => {
        if (t.mine) this.map.removeLayer(t.mine);
        if (t.trigger) this.map.removeLayer(t.trigger);
        if (t.wire) this.map.removeLayer(t.wire);
        if (t.c4) this.map.removeLayer(t.c4);
      });
      this.traps.traps = [];
      // Clear hazards
      this.hazards.hazards.forEach(h => {
        if (h.zone) this.map.removeLayer(h.zone);
        if (h.ring) this.map.removeLayer(h.ring);
        if (h.skull) this.map.removeLayer(h.skull);
        if (h.bolt) this.map.removeLayer(h.bolt);
        if (h.interval) clearInterval(h.interval);
        if (h.tickInterval) clearInterval(h.tickInterval);
        if (h.pulseInterval) clearInterval(h.pulseInterval);
      });
      this.hazards.hazards = [];
      // Clear loot
      this.loot.drops.forEach(d => {
        if (d.marker) this.map.removeLayer(d.marker);
        if (d.ring) this.map.removeLayer(d.ring);
        if (d.interval) clearInterval(d.interval);
      });
      this.loot.drops = [];
    }

    // Hacker — find nearest drone within range
    findNearestDrone(position, maxRange = 50) {
      let nearest = null;
      let nearestDist = Infinity;
      this.drones.forEach(d => {
        const dist = this.map.distance(position, d.marker.getLatLng());
        if (dist < nearestDist && dist <= maxRange) {
          nearestDist = dist;
          nearest = d;
        }
      });
      return nearest ? { drone: nearest, distance: Math.round(nearestDist) } : null;
    }

    // Hacker — hijack a specific drone
    hijackDrone(droneId) {
      const drone = this.drones.find(d => d.id === droneId);
      if (!drone) return false;
      drone.hijack();
      return true;
    }

    // ============ ADVANCED ABILITIES ============

    // Smoke Grenade — creates concealment cloud, hides from AI spotting
    throwSmoke(position, radius = 40, duration = 15000) {
      const smoke = L.circle(position, {
        radius,
        color: '#9e9e9e',
        fillColor: '#e0e0e0',
        fillOpacity: 0.5,
        weight: 2,
        dashArray: '6 6'
      }).addTo(this.map).bindPopup('💨 SMOKE — Concealment active');

      // Inner dense core
      const core = L.circle(position, {
        radius: radius * 0.6,
        color: '#bdbdbd',
        fillColor: '#f5f5f5',
        fillOpacity: 0.35,
        weight: 1
      }).addTo(this.map);

      // Smoke particles
      const particles = [];
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const dist = radius * 0.7;
        const pPos = [position[0] + Math.sin(angle) * dist * 0.00001, position[1] + Math.cos(angle) * dist * 0.00001];
        const p = L.circleMarker(pPos, {
          radius: 4 + Math.random() * 4,
          color: '#9e9e9e',
          fillColor: '#e0e0e0',
          fillOpacity: 0.3,
          weight: 0
        }).addTo(this.map);
        particles.push(p);
      }

      // Drift animation
      let tick = 0;
      const drift = setInterval(() => {
        tick += 0.1;
        smoke.setRadius(radius + Math.sin(tick) * 5);
        core.setRadius(radius * 0.6 + Math.cos(tick * 0.7) * 3);
        particles.forEach((p, i) => {
          const angle = (Math.PI * 2 * i) / 8 + tick * 0.05;
          const dist = radius * 0.7 + Math.sin(tick + i) * 5;
          const pPos = [position[0] + Math.sin(angle) * dist * 0.00001, position[1] + Math.cos(angle) * dist * 0.00001];
          p.setLatLng(pPos);
        });
      }, 300);

      this.hazards.hazards.push({ type: 'smoke', smoke, core, particles, interval: drift });

      setTimeout(() => {
        clearInterval(drift);
        this.map.removeLayer(smoke);
        this.map.removeLayer(core);
        particles.forEach(p => this.map.removeLayer(p));
      }, duration);

      return smoke;
    }

    // Field Surgery — full heal from critical, long channel
    fieldSurgery(player) {
      if (!player || player.status === 'dead' || player.status === 'extracted') return false;
      if (player._fieldSurgeryUsed) return false; // 1 per match
      
      player.health = 100;
      player.status = 'healthy';
      player._fieldSurgeryUsed = true;
      
      // Visual confirmation
      const pos = player.position || this.map.getCenter();
      L.circleMarker(pos, {
        radius: 30,
        color: '#00e676',
        fillColor: '#00e676',
        fillOpacity: 0.4
      }).addTo(this.map).bindPopup('🏥 FIELD SURGERY — Full restore').openPopup();
      
      return true;
    }

    // Drone Photo Intel — scan area, reveal hidden threats
    photoIntel(center, radius = 80) {
      const found = { mines: [], drones: [], snipers: [], loot: [] };
      
      // Scan mines
      this.traps.traps.forEach(t => {
        if (t.type === 'mine' && t.armed && this.map.distance(center, t.position) <= radius) {
          found.mines.push(t);
        }
      });
      
      // Scan drones
      this.drones.forEach(d => {
        const dPos = d.marker.getLatLng();
        if (this.map.distance(center, [dPos.lat, dPos.lng]) <= radius) {
          found.drones.push(d);
        }
      });
      
      // Scan snipers
      this.snipers.forEach(s => {
        if (this.map.distance(center, s.position) <= radius) {
          found.snipers.push(s);
        }
      });
      
      // Scan loot
      this.loot.drops.forEach(l => {
        if (this.map.distance(center, l.position) <= radius) {
          found.loot.push(l);
        }
      });

      // Reveal blips on map
      const revealBlips = [];
      const revealColor = '#ffeb3b';
      
      [...found.mines, ...found.drones.map(d => ({ position: [d.marker.getLatLng().lat, d.marker.getLatLng().lng] })), 
       ...found.snipers.map(s => ({ position: s.position })), 
       ...found.loot.map(l => ({ position: l.position }))].forEach(item => {
        const blip = L.circleMarker(item.position, {
          radius: 8,
          color: revealColor,
          fillColor: revealColor,
          fillOpacity: 0.6,
          weight: 2
        }).addTo(this.map);
        revealBlips.push(blip);
      });

      // Scan radius ring
      const scanRing = L.circle(center, {
        radius,
        color: '#ffeb3b',
        fillColor: 'transparent',
        weight: 2,
        dashArray: '8 8'
      }).addTo(this.map);

      setTimeout(() => {
        revealBlips.forEach(b => this.map.removeLayer(b));
        this.map.removeLayer(scanRing);
      }, 10000);

      return found;
    }

    // Radio Jam — disable all enemy drones within radius for duration
    radioJam(center, radius = 100, duration = 20000) {
      let jammedCount = 0;
      
      this.drones.forEach(d => {
        const dPos = d.marker.getLatLng();
        const dist = this.map.distance(center, [dPos.lat, dPos.lng]);
        if (dist <= radius && !d._hijacked) {
          d._jammed = true;
          d.marker.setIcon(L.divIcon({
            className: 'patrol-drone jammed',
            html: '🛸❌',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          }));
          d.spotlight.setStyle({ color: '#9e9e9e', fillColor: '#9e9e9e', fillOpacity: 0.05 });
          jammedCount++;
        }
      });

      // Jam visual
      const jamZone = L.circle(center, {
        radius,
        color: '#ffeb3b',
        fillColor: '#ffeb3b',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '10 5'
      }).addTo(this.map).bindPopup('📡 RADIO JAM — ' + jammedCount + ' drone(s) disabled');

      // Static crackle animation
      let crackle = 0;
      const crackleInterval = setInterval(() => {
        crackle += 1;
        jamZone.setStyle({ opacity: 0.3 + (crackle % 2) * 0.4 });
      }, 400);

      setTimeout(() => {
        clearInterval(crackleInterval);
        this.map.removeLayer(jamZone);
        this.drones.forEach(d => {
          if (d._jammed) {
            d._jammed = false;
            if (!d._hijacked) {
              d.marker.setIcon(L.divIcon({
                className: 'patrol-drone',
                html: '🛸',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
              }));
              d.spotlight.setStyle({ color: '#df1f2d', fillColor: '#df1f2d', fillOpacity: 0.15 });
            }
          }
        });
      }, duration);

      return { jammedCount, duration };
    }

    // Decoy Beacon — fake player marker that attracts AI
    deployDecoy(position, duration = 30000) {
      const decoy = L.marker(position, {
        icon: L.divIcon({
          className: 'decoy-player',
          html: '<div style="font-size:24px;">👤</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        })
      }).addTo(this.map);

      // Fake footstep noises
      const noise = this.noise.emitNoise(position, 30, 'run');

      // Pulse ring to attract attention
      let pulse = 20;
      const ring = L.circle(position, {
        radius: pulse,
        color: '#00a9c7',
        fillColor: 'transparent',
        weight: 2,
        opacity: 0.5
      }).addTo(this.map);

      const pulseInterval = setInterval(() => {
        pulse += 2;
        ring.setRadius(pulse);
        ring.setStyle({ opacity: Math.max(0, 0.8 - (pulse / 100)) });
        if (pulse > 100) { pulse = 20; ring.setStyle({ opacity: 0.5 }); }
      }, 200);

      // Attract nearby drones
      this.drones.forEach(d => {
        const dPos = d.marker.getLatLng();
        if (this.map.distance(position, [dPos.lat, dPos.lng]) < 200) {
          // Drone redirects toward decoy
          d._decoyTarget = position;
        }
      });

      setTimeout(() => {
        clearInterval(pulseInterval);
        this.map.removeLayer(decoy);
        this.map.removeLayer(ring);
        this.drones.forEach(d => { d._decoyTarget = null; });
      }, duration);

      return decoy;
    }

    // Trophy System — intercepts next incoming projectile
    deployTrophy(position, duration = 30000) {
      const trophy = L.marker(position, {
        icon: L.divIcon({
          className: 'trophy-system',
          html: '<div style="font-size:20px;">🛡️</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(this.map);

      const range = L.circle(position, {
        radius: 15,
        color: '#00a9c7',
        fillColor: 'transparent',
        weight: 2,
        dashArray: '4 4'
      }).addTo(this.map);

      let charges = 3;
      const trophyData = { position, charges, active: true };
      
      // Listen for incoming damage events
      const interceptHandler = (e) => {
        if (!trophyData.active || charges <= 0) return;
        const dist = this.map.distance(position, e.detail.position);
        if (dist <= 20) {
          charges--;
          // Intercept visual
          L.circleMarker(position, {
            radius: 25,
            color: '#00a9c7',
            fillColor: '#00a9c7',
            fillOpacity: 0.3
          }).addTo(this.map);
          
          if (charges <= 0) {
            trophyData.active = false;
            this.map.removeLayer(trophy);
            this.map.removeLayer(range);
            document.removeEventListener('game:incomingDamage', interceptHandler);
          }
        }
      };

      document.addEventListener('game:incomingDamage', interceptHandler);

      setTimeout(() => {
        trophyData.active = false;
        this.map.removeLayer(trophy);
        this.map.removeLayer(range);
        document.removeEventListener('game:incomingDamage', interceptHandler);
      }, duration);

      return trophyData;
    }

    // Stim Pack — instant heal + speed boost + damage resistance
    useStimPack(player) {
      if (!player || player.status === 'dead') return false;
      
      // Instant heal 25 HP
      const oldHealth = player.health;
      player.health = Math.min(100, player.health + 25);
      const healed = player.health - oldHealth;
      
      // Speed boost flag
      player._stimActive = true;
      
      // Damage resistance (50% reduction)
      player._stimResistance = true;
      
      // Visual
      const pos = player.position || this.map.getCenter();
      L.circleMarker(pos, {
        radius: 20,
        color: '#ff9800',
        fillColor: '#ff9800',
        fillOpacity: 0.3
      }).addTo(this.map).bindPopup('💉 STIM ACTIVE — Speed + Resistance').openPopup();

      setTimeout(() => {
        player._stimActive = false;
        player._stimResistance = false;
      }, 15000);

      return { healed, duration: 15000 };
    }

    // Ammo Resupply — restock squad ammo
    resupplyAmmo(player, squad) {
      if (!player || !squad) return false;
      
      // Add ammo to all living squadmates
      let totalAdded = 0;
      let playersResupplied = 0;
      squad.players.forEach(p => {
        if (p.status !== 'dead' && p.status !== 'extracted') {
          const added = Math.min(60, 120 - p.inventory.ammo); // cap at 120
          p.inventory.ammo += added;
          totalAdded += added;
          playersResupplied++;
        }
      });

      return { totalAdded, playersResupplied };
    }
  }

  // ============ EXPORTS ============
  window.AIThreats = {
    PatrolDrone,
    SniperNest,
    TrapSystem,
    HazardSpawner,
    NoiseSystem,
    LootSystem,
    AIThreatManager
  };

})();

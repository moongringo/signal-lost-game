/**
 * Signal Lost — Game Engine
 * Player state, team state, combat, scoring, match flow
 */

(function() {
  'use strict';

  // ============ CONFIG ============
  const CONFIG = {
    MAX_HEALTH: 100,
    MAX_STAMINA: 100,
    SPRINT_DRAIN: 10, // per second
    SPRINT_REGEN: 15, // per second after delay
    SPRINT_DELAY: 3000, // ms before regen starts
    BLEEDOUT_TIME: 120000, // 2 minutes
    DAMAGE: {
      GUNSHOT: 35,
      SNIPER: 85,
      MINE: 60,
      GAS_TICK: 5, // per second
      BLEED: 2, // per second when downed
      FALL: 25
    },
    SCORE: {
      BEACON: 100,
      OBJECTIVE: 200,
      DOWN_ENEMY: 50,
      KILL_ENEMY: 100,
      REVIVE: 75,
      DISARM_TRAP: 25,
      HIJACK_DRONE: 50,
      EXTRACTION: 500,
      FRIENDLY_FIRE: -50,
      FALSE_SOS: -100,
      TEAM_DEATH: -25
    },
    MATCH_DURATION: 1800000, // 30 minutes
    EXTRACTION_TIME: 30000, // 30 seconds to extract
    SQUAD_SIZE: 4
  };

  // ============ PLAYER STATE ============
  class Player {
    constructor(id, name, role, squad) {
      this.id = id;
      this.name = name;
      this.role = role;
      this.squad = squad;
      this.position = null; // [lat, lng]
      this.heading = 0;
      
      // Vitals
      this.health = CONFIG.MAX_HEALTH;
      this.stamina = CONFIG.MAX_STAMINA;
      this.status = 'healthy'; // healthy, injured, downed, dead, extracted
      
      // State flags
      this.isSprinting = false;
      this.isAiming = false;
      this.isBleeding = false;
      this.inGas = false;
      this.inEMP = false;
      this.lastSprintEnd = 0;
      this.bleedoutStart = null;
      
      // Inventory
      this.inventory = {
        medkits: 2,
        ammo: 90,
        empGrenades: 1,
        decoys: 1,
        hasGasMask: false,
        hasReconDrone: false
      };
      
      // Cooldowns (timestamps)
      this.cooldowns = {
        sos: 0,
        ability: 0,
        scan: 0
      };
      
      // Stats
      this.stats = {
        kills: 0,
        downs: 0,
        revives: 0,
        deaths: 0,
        distanceTraveled: 0,
        timePlayed: 0
      };
    }

    takeDamage(amount, source) {
      if (this.status === 'dead' || this.status === 'extracted') return false;
      
      this.health = Math.max(0, this.health - amount);
      
      if (this.health <= 0 && this.status !== 'downed') {
        this.goDown(source);
        return 'downed';
      } else if (this.health <= 0 && this.status === 'downed') {
        this.die();
        return 'killed';
      }
      
      this.isBleeding = this.health < 50;
      if (this.health < 50 && this.status === 'healthy') {
        this.status = 'injured';
      }
      return 'damaged';
    }

    heal(amount) {
      if (this.status === 'dead') return false;
      const oldHealth = this.health;
      this.health = Math.min(CONFIG.MAX_HEALTH, this.health + amount);
      if (this.health >= 50) {
        this.isBleeding = false;
        if (this.status === 'injured') this.status = 'healthy';
      }
      return this.health - oldHealth;
    }

    goDown(source) {
      this.status = 'downed';
      this.bleedoutStart = Date.now();
      this.isSprinting = false;
      
      // Emit event
      emit('playerDowned', {
        player: this,
        source: source,
        position: this.position,
        canBeRevived: true
      });
    }

    die() {
      this.status = 'dead';
      this.bleedoutStart = null;
      this.stats.deaths++;
      
      emit('playerDied', {
        player: this,
        position: this.position
      });
    }

    revive(medic) {
      if (this.status !== 'downed') return false;
      
      this.status = 'healthy';
      this.health = 25;
      this.bleedoutStart = null;
      this.isBleeding = false;
      
      if (medic) {
        medic.stats.revives++;
      }
      
      emit('playerRevived', {
        player: this,
        medic: medic
      });
      
      return true;
    }

    startSprint() {
      if (this.stamina <= 0 || this.status !== 'healthy') return false;
      this.isSprinting = true;
      return true;
    }

    stopSprint() {
      this.isSprinting = false;
      this.lastSprintEnd = Date.now();
    }

    update(deltaTime) {
      // Sprint stamina drain/regen
      if (this.isSprinting) {
        this.stamina = Math.max(0, this.stamina - (CONFIG.SPRINT_DRAIN * deltaTime));
        if (this.stamina <= 0) this.stopSprint();
      } else if (Date.now() - this.lastSprintEnd > CONFIG.SPRINT_DELAY) {
        this.stamina = Math.min(CONFIG.MAX_STAMINA, this.stamina + (CONFIG.SPRINT_REGEN * deltaTime));
      }
      
      // Bleedout timer
      if (this.status === 'downed') {
        const bleedTime = Date.now() - this.bleedoutStart;
        if (bleedTime >= CONFIG.BLEEDOUT_TIME) {
          this.die();
        } else {
          // Apply bleed damage
          this.health = Math.max(0, this.health - (CONFIG.DAMAGE.BLEED * deltaTime));
        }
      }
      
      // Gas damage
      if (this.inGas && !this.inventory.hasGasMask) {
        this.takeDamage(CONFIG.DAMAGE.GAS_TICK * deltaTime, 'gas');
      }
      
      this.stats.timePlayed += deltaTime * 1000;
    }

    canUseItem(item) {
      return this.inventory[item] > 0 && this.status === 'healthy';
    }

    useItem(item) {
      if (!this.canUseItem(item)) return false;
      
      switch(item) {
        case 'medkits':
          this.inventory.medkits--;
          this.heal(50);
          return 'healed';
        case 'empGrenades':
          this.inventory.empGrenades--;
          return 'emp_thrown';
        case 'decoys':
          this.inventory.decoys--;
          return 'decoy_placed';
        default:
          return false;
      }
    }

    updatePosition(lat, lng, heading) {
      if (this.position) {
        const dist = calculateDistance(this.position, [lat, lng]);
        this.stats.distanceTraveled += dist;
      }
      this.position = [lat, lng];
      this.heading = heading || this.heading;
    }
  }

  // ============ SQUAD STATE ============
  class Squad {
    constructor(id, name, faction) {
      this.id = id;
      this.name = name;
      this.faction = faction; // 'alpha', 'bravo'
      this.players = new Map();
      this.score = 0;
      this.objectives = [];
      this.extracted = false;
      this.extractionTime = null;
    }

    addPlayer(player) {
      this.players.set(player.id, player);
    }

    removePlayer(playerId) {
      this.players.delete(playerId);
    }

    getLivingPlayers() {
      return Array.from(this.players.values()).filter(p => p.status !== 'dead');
    }

    getDownedPlayers() {
      return Array.from(this.players.values()).filter(p => p.status === 'downed');
    }

    addScore(points, reason) {
      this.score += points;
      emit('scoreChanged', {
        squad: this,
        delta: points,
        reason: reason,
        newTotal: this.score
      });
    }

    captureObjective(objectiveId) {
      if (!this.objectives.includes(objectiveId)) {
        this.objectives.push(objectiveId);
        this.addScore(CONFIG.SCORE.OBJECTIVE, 'objective_captured');
        return true;
      }
      return false;
    }

    checkExtraction(eligible) {
      const living = this.getLivingPlayers();
      if (living.length === 0) return false;
      
      const atExtraction = living.filter(p => {
        if (!p.position || !eligible) return false;
        return calculateDistance(p.position, eligible) < 50; // 50m radius
      });
      
      return atExtraction.length === living.length;
    }

    startExtraction(position) {
      if (this.extracted) return false;
      this.extractionTime = Date.now();
      
      emit('extractionStarted', {
        squad: this,
        position: position,
        duration: CONFIG.EXTRACTION_TIME
      });
      
      return true;
    }

    completeExtraction() {
      if (!this.extractionTime) return false;
      
      this.extracted = true;
      this.players.forEach(p => {
        if (p.status !== 'dead') {
          p.status = 'extracted';
        }
      });
      
      this.addScore(CONFIG.SCORE.EXTRACTION, 'extraction_complete');
      
      emit('extractionComplete', {
        squad: this,
        survivors: this.getLivingPlayers().length
      });
      
      return true;
    }
  }

  // ============ MATCH STATE ============
  class Match {
    constructor(id) {
      this.id = id;
      this.squads = new Map();
      this.phase = 'lobby'; // lobby, warmup, active, ended
      this.startTime = null;
      this.endTime = null;
      this.winner = null;
      this.events = [];
      this.objectives = new Map();
      this.hazards = [];
      
      this.tickRate = 1000 / 20; // 20 FPS
      this.lastTick = 0;
      this.running = false;
    }

    addSquad(squad) {
      this.squads.set(squad.id, squad);
    }

    start() {
      if (this.phase !== 'lobby' && this.phase !== 'warmup') return false;
      
      this.phase = 'active';
      this.startTime = Date.now();
      this.endTime = this.startTime + CONFIG.MATCH_DURATION;
      this.running = true;
      
      emit('matchStarted', {
        matchId: this.id,
        duration: CONFIG.MATCH_DURATION
      });
      
      this.gameLoop();
      return true;
    }

    end(winnerSquadId) {
      this.phase = 'ended';
      this.winner = winnerSquadId;
      this.running = false;
      
      emit('matchEnded', {
        matchId: this.id,
        winner: this.squads.get(winnerSquadId),
        squads: Array.from(this.squads.values())
      });
    }

    gameLoop() {
      if (!this.running) return;
      
      const now = Date.now();
      const deltaTime = (now - this.lastTick) / 1000;
      this.lastTick = now;
      
      // Update all players
      this.squads.forEach(squad => {
        squad.players.forEach(player => {
          player.update(deltaTime);
        });
      });
      
      // Check win conditions
      this.checkWinConditions();
      
      // Check timer
      if (now >= this.endTime) {
        this.endByTimer();
      }
      
      setTimeout(() => this.gameLoop(), this.tickRate);
    }

    checkWinConditions() {
      // Extraction win
      for (const [id, squad] of this.squads) {
        if (squad.extracted) {
          this.end(id);
          return;
        }
      }
      
      // Last squad standing
      const livingSquads = Array.from(this.squads.values()).filter(s => {
        return s.getLivingPlayers().length > 0;
      });
      
      if (livingSquads.length === 1 && this.squads.size > 1) {
        this.end(livingSquads[0].id);
      }
    }

    endByTimer() {
      // Winner is squad with highest score
      let winner = null;
      let highestScore = -Infinity;
      
      for (const [id, squad] of this.squads) {
        if (squad.score > highestScore) {
          highestScore = squad.score;
          winner = id;
        }
      }
      
      this.end(winner);
    }

    spawnObjective(id, position, type) {
      this.objectives.set(id, {
        id,
        position,
        type,
        capturedBy: null,
        contested: false
      });
    }

    captureObjective(objectiveId, squadId) {
      const obj = this.objectives.get(objectiveId);
      if (!obj || obj.capturedBy) return false;
      
      obj.capturedBy = squadId;
      const squad = this.squads.get(squadId);
      if (squad) squad.captureObjective(objectiveId);
      
      emit('objectiveCaptured', { objective: obj, squad });
      return true;
    }

    addEvent(type, data) {
      this.events.push({
        type,
        timestamp: Date.now(),
        data
      });
    }

    getLeaderboard() {
      return Array.from(this.squads.values())
        .map(s => ({
          squad: s.name,
          score: s.score,
          objectives: s.objectives.length,
          survivors: s.getLivingPlayers().length,
          extracted: s.extracted
        }))
        .sort((a, b) => b.score - a.score);
    }

    getTimeRemaining() {
      if (!this.endTime) return null;
      return Math.max(0, this.endTime - Date.now());
    }
  }

  // ============ COMBAT SYSTEM ============
  class CombatSystem {
    constructor(match) {
      this.match = match;
      this.recentShots = []; // For noise propagation
    }

    shoot(attacker, target, weaponType = 'rifle') {
      if (attacker.status !== 'healthy') return false;
      
      const damage = weaponType === 'sniper' ? CONFIG.DAMAGE.SNIPER : CONFIG.DAMAGE.GUNSHOT;
      const result = target.takeDamage(damage, { type: 'gunshot', attacker: attacker.id });
      
      // Log shot for noise
      this.recentShots.push({
        position: attacker.position,
        time: Date.now(),
        type: weaponType
      });
      
      // Cleanup old shots
      this.recentShots = this.recentShots.filter(s => Date.now() - s.time < 5000);
      
      if (result === 'downed') {
        attacker.stats.downs++;
        const targetSquad = this.getPlayerSquad(target);
        if (targetSquad) {
          targetSquad.addScore(CONFIG.SCORE.DOWN_ENEMY, 'enemy_downed');
        }
      } else if (result === 'killed') {
        attacker.stats.kills++;
        const targetSquad = this.getPlayerSquad(target);
        if (targetSquad) {
          targetSquad.addScore(CONFIG.SCORE.KILL_ENEMY, 'enemy_killed');
        }
      }
      
      return result;
    }

    friendlyFire(attacker, target) {
      const result = target.takeDamage(CONFIG.DAMAGE.GUNSHOT / 2, { type: 'friendly', attacker: attacker.id });
      
      const attackerSquad = this.getPlayerSquad(attacker);
      if (attackerSquad) {
        attackerSquad.addScore(CONFIG.SCORE.FRIENDLY_FIRE, 'friendly_fire');
      }
      
      return result;
    }

    revive(medic, target) {
      if (medic.role !== 'medic' && medic.inventory.medkits <= 0) return false;
      
      const success = target.revive(medic);
      if (success) {
        const squad = this.getPlayerSquad(medic);
        if (squad) {
          squad.addScore(CONFIG.SCORE.REVIVE, 'teammate_revived');
        }
      }
      
      return success;
    }

    getPlayerSquad(player) {
      for (const squad of this.match.squads.values()) {
        if (squad.players.has(player.id)) return squad;
      }
      return null;
    }

    checkLineOfSight(from, to, maxRange = 200) {
      if (!from.position || !to.position) return false;
      
      const dist = calculateDistance(from.position, to.position);
      if (dist > maxRange) return false;
      
      // Simplified: check if target is prone/crouched/standing
      // In full implementation, check terrain, obstacles, etc.
      return true;
    }
  }

  // ============ UTILITY FUNCTIONS ============
  function calculateDistance(pos1, pos2) {
    // Haversine formula for lat/lng distance in meters
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1[0] * Math.PI / 180;
    const φ2 = pos2[0] * Math.PI / 180;
    const Δφ = (pos2[0] - pos1[0]) * Math.PI / 180;
    const Δλ = (pos2[1] - pos1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  function emit(eventName, data) {
    const event = new CustomEvent('game:' + eventName, { detail: data });
    document.dispatchEvent(event);
  }

  // ============ EXPORTS ============
  window.GameEngine = {
    Player,
    Squad,
    Match,
    CombatSystem,
    CONFIG,
    calculateDistance,
    emit
  };

})();

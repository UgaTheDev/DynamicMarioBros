// relationships.js - Three character relationship system
window.GameRelationships = {
  scores: {
    toad: 0,
    goomba: 0,
    koopa: 0,
  },

  init: function () {
    const saved = localStorage.getItem("fsm_relationships");
    if (saved) {
      try {
        this.scores = JSON.parse(saved);
        console.log("✅ Relationships loaded from storage:", this.scores);
      } catch (e) {
        console.error("Failed to parse saved relationships:", e);
        this.scores = { toad: 0, goomba: 0, koopa: 0 };
      }
    } else {
      console.log("✅ Relationships initialized (no saved data):", this.scores);
    }
  },

  update: function (character, delta) {
    character = character.toLowerCase();

    console.log(
      "Attempting to update:",
      character,
      "Current scores:",
      this.scores
    );

    if (!this.scores.hasOwnProperty(character)) {
      console.error(
        "❌ Unknown character:",
        character,
        "Available:",
        Object.keys(this.scores)
      );
      return;
    }

    this.scores[character] = Math.max(
      -100,
      Math.min(100, this.scores[character] + delta)
    );

    localStorage.setItem("fsm_relationships", JSON.stringify(this.scores));

    console.log(
      `📊 ${character} relationship: ${this.scores[character]} (${
        delta > 0 ? "+" : ""
      }${delta})`
    );
  },

  get: function (character) {
    character = character.toLowerCase();
    return this.scores[character] || 0;
  },

  getAll: function () {
    return { ...this.scores };
  },

  /**
   * Get the status of a specific character
   * Returns: 'allied', 'enemy', or 'neutral'
   */
  getCharacterStatus: function (character) {
    const score = this.get(character);

    if (score >= 30) {
      return "allied";
    } else if (score <= -30) {
      return "enemy";
    } else {
      return "neutral";
    }
  },

  /**
   * Get all character statuses as an object
   * Returns: { toad: 'allied', goomba: 'enemy', koopa: 'neutral' }
   */
  getAllStatuses: function () {
    const statuses = {};

    for (const character in this.scores) {
      statuses[character] = this.getCharacterStatus(character);
    }

    return statuses;
  },

  isHostile: function (character) {
    return this.get(character) < -30;
  },

  isAllied: function (character) {
    return this.get(character) > 30;
  },

  isEnemy: function (character) {
    return this.get(character) <= -30;
  },

  setStatus: function (character, status) {
    character = character.toLowerCase();

    if (!this.scores.hasOwnProperty(character)) {
      console.error("❌ Unknown character:", character);
      return;
    }

    let newScore = 0;
    if (status === "allied") {
      newScore = 50;
    } else if (status === "enemy") {
      newScore = -50;
    } else if (status === "neutral") {
      newScore = 0;
    }

    this.scores[character] = newScore;
    localStorage.setItem("fsm_relationships", JSON.stringify(this.scores));

    console.log(`✅ ${character} status set to ${status} (score: ${newScore})`);
  },

  reset: function () {
    this.scores = { toad: 0, goomba: 0, koopa: 0 };
    localStorage.removeItem("fsm_relationships");
    console.log("🔄 Relationships reset:", this.scores);
  },

  // TOAD CONSEQUENCE MODIFIERS
  getPlatformMultiplier: function () {
    const score = this.get("toad");
    if (score < -50) return 0.6;
    if (score < -30) return 0.75;
    if (score > 30) return 1.25;
    if (score > 50) return 1.4;
    return 1.0;
  },

  getItemChance: function () {
    const score = this.get("toad");
    if (score < -50) return 0.3;
    if (score < -30) return 0.5;
    if (score > 30) return 1.0;
    if (score > 50) return 1.0;
    return 0.8;
  },

  getEnemyMultiplier: function () {
    const score = this.get("toad");
    if (score < -50) return 1.5;
    if (score < -30) return 1.3;
    if (score > 30) return 0.8;
    if (score > 50) return 0.6;
    return 1.0;
  },

  getEnemySpeedMultiplier: function () {
    const score = this.get("toad");
    if (score < -50) return 1.3;
    if (score < -30) return 1.15;
    return 1.0;
  },

  shouldEnemiesBeAggressive: function () {
    return this.get("toad") < -30;
  },

  shouldUpgradeItems: function () {
    return this.get("toad") > 50;
  },

  // GOOMBA CONSEQUENCE MODIFIERS
  getGoombaSpawnMultiplier: function () {
    const score = this.get("goomba");
    if (score < -50) return 2.0; // Enemy: Double Goomba spawns
    if (score < -30) return 1.5; // Enemy: 50% more Goombas
    if (score > 30) return 0.0; // Allied: No Goombas
    if (score > 50) return 0.0; // Allied: No Goombas
    return 1.0;
  },

  shouldSuppressGoombas: function () {
    return this.get("goomba") > 30;
  },

  getGoombaPowerUpBonus: function () {
    const score = this.get("goomba");
    if (score > 50) return 3; // Extra fire flowers
    if (score > 30) return 2; // Some fire flowers
    return 0;
  },

  shouldGoombasMultiply: function () {
    return this.get("goomba") < -30;
  },

  // KOOPA CONSEQUENCE MODIFIERS
  getKoopaSpawnMultiplier: function () {
    const score = this.get("koopa");
    if (score < -50) return 1.8; // Enemy: More Koopas
    if (score < -30) return 1.4; // Enemy: Extra Koopas
    if (score > 30) return 0.7; // Allied: Fewer Koopas
    if (score > 50) return 0.5; // Allied: Much fewer Koopas
    return 1.0;
  },

  shouldRevealSecrets: function () {
    return this.get("koopa") > 30;
  },

  getKoopaSecretCount: function () {
    const score = this.get("koopa");
    if (score > 50) return 5; // Many secrets revealed
    if (score > 30) return 3; // Some secrets revealed
    return 0;
  },

  shouldHideBlocks: function () {
    return this.get("koopa") < -30;
  },

  getKoopaSpringBonus: function () {
    const score = this.get("koopa");
    if (score > 50) return 3; // Extra springs
    if (score > 30) return 2; // Some springs
    return 0;
  },

  shouldAddFalseBlocks: function () {
    return this.get("koopa") < -30;
  },

  getKoopaHighCoinBonus: function () {
    const score = this.get("koopa");
    if (score > 50) return 7; // Many high coins
    if (score > 30) return 5; // Some high coins
    return 0;
  },
};

// Auto-initialize on load
if (window.GameRelationships) {
  window.GameRelationships.init();
  console.log("✅ GameRelationships loaded and initialized");
} else {
  console.error("❌ GameRelationships failed to load!");
}

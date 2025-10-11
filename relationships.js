// relationships.js - Three character relationship system
window.GameRelationships = {
  scores: {
    toad: 0,
    luigi: 0,
    peach: 0,
  },

  init: function () {
    const saved = localStorage.getItem("fsm_relationships");
    if (saved) {
      try {
        this.scores = JSON.parse(saved);
        console.log("✅ Relationships loaded from storage:", this.scores);
      } catch (e) {
        console.error("Failed to parse saved relationships:", e);
        this.scores = { toad: 0, luigi: 0, peach: 0 };
      }
    } else {
      console.log("✅ Relationships initialized (no saved data):", this.scores);
    }
  },

  update: function (character, delta) {
    // Normalize to lowercase
    character = character.toLowerCase();

    // Debug log
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
   * Returns: { toad: 'allied', luigi: 'enemy', peach: 'neutral' }
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

  reset: function () {
    this.scores = { toad: 0, luigi: 0, peach: 0 };
    localStorage.removeItem("fsm_relationships");
    console.log("🔄 Relationships reset:", this.scores);
  },

  // CONSEQUENCE MODIFIERS
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

  get1UpBonus: function () {
    const score = this.get("luigi");
    if (score > 50) return 3;
    if (score > 30) return 1;
    if (score < -30) return -1;
    return 0;
  },

  getTimerMultiplier: function () {
    const score = this.get("luigi");
    if (score < -50) return 0.8;
    if (score < -30) return 0.9;
    if (score > 30) return 1.2;
    if (score > 50) return 1.4;
    return 1.0;
  },

  shouldPeachHelp: function () {
    return this.get("peach") > 30;
  },

  shouldPeachBeAngry: function () {
    return this.get("peach") < -30;
  },

  shouldUpgradeItems: function () {
    return this.get("toad") > 50;
  },
};

// Auto-initialize on load
if (window.GameRelationships) {
  window.GameRelationships.init();
  console.log("✅ GameRelationships loaded and initialized");
} else {
  console.error("❌ GameRelationships failed to load!");
}

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
      this.scores = JSON.parse(saved);
    }
    console.log("✅ Relationships loaded:", this.scores);
  },

  update: function (character, delta) {
    if (!this.scores[character]) {
      console.error("❌ Unknown character:", character);
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
    return this.scores[character] || 0;
  },

  getAll: function () {
    return { ...this.scores };
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
    console.log("🔄 Relationships reset");
  },

  // Consequence modifiers
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
    return 0.8;
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
};

// Auto-initialize
GameRelationships.init();
console.log("✅ GameRelationships loaded");

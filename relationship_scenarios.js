console.log("🎭 relationship_scenarios.js loading...");

const RelationshipScenarios = {
  apiKey: "AIzaSyC8R4GV-YXfB8XBnyOI9VveVTHwSanFP8o",

  conversationHistory: {
    toad: [],
    goomba: [],
    koopa: [],
  },

  // Random NPC selection
  getRandomNPC() {
    const npcs = ["toad", "goomba", "koopa"];
    const randomNPC = npcs[Math.floor(Math.random() * npcs.length)];
    console.log(`🎲 Random NPC selected: ${randomNPC}`);
    return randomNPC;
  },

  async generateScenario(character) {
    const relationshipScore = GameRelationships.get(character);
    const currentRelationship = GameRelationships.getCharacterStatus(character);
    const history = this.conversationHistory[character];

    const prompt = this.buildPrompt(
      character,
      currentRelationship,
      relationshipScore,
      history
    );

    try {
      console.log(`🤖 Calling Gemini API for ${character}...`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 500,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const data = await response.json();
      console.log("📡 API Response received");

      if (!data.candidates || !data.candidates[0]) {
        console.error("❌ API Error - No candidates");
        return this.getFallbackScenario(character);
      }

      const responseText = data.candidates[0].content.parts[0].text;
      let scenario = JSON.parse(responseText);

      if (Array.isArray(scenario)) {
        scenario = scenario[0];
      }

      console.log("✅ Parsed scenario:", scenario);

      // Store in history
      this.conversationHistory[character].push({
        relationshipScore,
        scenario: scenario.situation,
      });

      return scenario;
    } catch (error) {
      console.error("❌ AI generation failed:", error);
      return this.getFallbackScenario(character);
    }
  },

  buildPrompt(character, relationship, score, history) {
    const historyContext =
      history.length > 0
        ? `Previous interactions:\n${history
            .map(
              (h, i) =>
                `${i + 1}. (Score: ${h.relationshipScore}) ${h.scenario}`
            )
            .join("\n")}`
        : "This is your first interaction.";

    return `You are creating a scenario for a Super Mario game where the player encounters ${character.toUpperCase()} at the end of a level.

Current relationship: ${relationship} (score: ${score}/100)
${historyContext}

Create a SHORT scenario (2-3 sentences max) where ${character} presents a situation or needs help. The scenario should:
1. Build naturally from previous interactions if any exist
2. Reflect the current relationship (${relationship})
3. Be appropriate for a Mario game setting
4. Present THREE clear choices: positive (help), neutral (ignore), negative (harm)

Return ONLY valid JSON in this EXACT format:
{
  "situation": "The scenario description here",
  "positiveChoice": "Help them (describe the helpful action)",
  "neutralChoice": "Walk away (describe the neutral action)", 
  "negativeChoice": "Harm/sabotage them (describe the harmful action)",
  "positiveOutcome": "What happens if they help",
  "neutralOutcome": "What happens if they're neutral",
  "negativeOutcome": "What happens if they harm"
}`;
  },

  getFallbackScenario(character) {
    const fallbacks = {
      toad: {
        situation: "Toad is trapped under a fallen block and calling for help!",
        positiveChoice: "Lift the block and free Toad",
        neutralChoice: "Walk past without getting involved",
        negativeChoice: "Push the block harder on Toad",
        positiveOutcome: "Toad is grateful and offers you a power-up!",
        neutralOutcome:
          "Toad manages to escape on his own, looking disappointed...",
        negativeOutcome: "Toad cries out in pain as you make things worse!",
      },
      goomba: {
        situation: "A Goomba is being cornered by larger enemies.",
        positiveChoice: "Defend the Goomba from the bullies",
        neutralChoice: "Keep walking, it's not your problem",
        negativeChoice: "Join in attacking the Goomba",
        positiveOutcome: "The Goomba becomes your ally!",
        neutralOutcome: "The Goomba fights them off alone...",
        negativeOutcome: "The Goomba runs away in terror!",
      },
      koopa: {
        situation: "Koopa's shell has cracked and they can't move properly.",
        positiveChoice: "Help repair Koopa's shell",
        neutralChoice: "Ignore Koopa and continue on",
        negativeChoice: "Kick the shell away cruelly",
        positiveOutcome: "Koopa thanks you and reveals a secret!",
        neutralOutcome: "Koopa slowly repairs the shell alone...",
        negativeOutcome: "Koopa retreats into the broken shell, hurt!",
      },
    };
    return fallbacks[character] || fallbacks.toad;
  },

  async showScenarioDialog(character) {
    console.log(`🎭 Showing scenario for ${character}...`);
    const scenario = await this.generateScenario(character);

    const dialog = document.createElement("div");
    dialog.id = "scenario-dialog";
    dialog.innerHTML = `
      <div class="scenario-overlay">
        <div class="scenario-box">
          <div class="scenario-character">${this.getCharacterEmoji(
            character
          )} ${character.toUpperCase()}</div>
          <div class="scenario-situation">${scenario.situation}</div>
          <div class="scenario-choices">
            <button class="choice-positive">✅ ${
              scenario.positiveChoice
            }</button>
            <button class="choice-neutral">⚪ ${scenario.neutralChoice}</button>
            <button class="choice-negative">❌ ${
              scenario.negativeChoice
            }</button>
          </div>
          <div class="scenario-outcome" style="display:none;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    this.addScenarioStyles();

    // Handle choices with correct score changes
    dialog.querySelector(".choice-positive").onclick = () => {
      this.handleChoice(character, 15, scenario.positiveOutcome, dialog);
    };
    dialog.querySelector(".choice-neutral").onclick = () => {
      this.handleChoice(character, 0, scenario.neutralOutcome, dialog);
    };
    dialog.querySelector(".choice-negative").onclick = () => {
      this.handleChoice(character, -15, scenario.negativeOutcome, dialog);
    };

    if (window.pause) window.pause();
  },

  getCharacterEmoji(character) {
    const emojis = {
      toad: "🍄",
      goomba: "👾",
      koopa: "🐢",
    };
    return emojis[character] || "❓";
  },

  handleChoice(character, scoreChange, outcome, dialog) {
    GameRelationships.update(character, scoreChange);
    const newScore = GameRelationships.get(character);

    console.log(
      `📊 ${character} relationship: ${newScore}/100 (${
        scoreChange > 0 ? "+" : ""
      }${scoreChange})`
    );

    const outcomeDiv = dialog.querySelector(".scenario-outcome");
    outcomeDiv.innerHTML = `
      <p>${outcome}</p>
      <p class="score-change ${
        scoreChange > 0 ? "positive" : scoreChange < 0 ? "negative" : "neutral"
      }">
        ${scoreChange > 0 ? "+" : ""}${scoreChange} relationship
      </p>
      <button class="continue-btn">Continue</button>
    `;
    outcomeDiv.style.display = "block";
    dialog.querySelector(".scenario-choices").style.display = "none";

    outcomeDiv.querySelector(".continue-btn").onclick = () => {
      dialog.remove();

      // Resume game
      if (window.unpause) window.unpause();

      // Reset trigger
      if (window.FlagpoleDialogueTrigger) {
        FlagpoleDialogueTrigger.hasTriggered = false;
      }

      console.log("✅ Dialogue complete - game resumed");
    };
  },

  addScenarioStyles() {
    if (document.getElementById("scenario-styles")) return;

    const style = document.createElement("style");
    style.id = "scenario-styles";
    style.textContent = `
      .scenario-overlay { 
        position: fixed !important; 
        top: 0 !important; 
        left: 0 !important; 
        right: 0 !important; 
        bottom: 0 !important; 
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.9) !important; 
        display: flex !important; 
        align-items: center !important; 
        justify-content: center !important; 
        z-index: 10000 !important; 
        font-family: 'Press Start 2P', monospace; 
      }
      .scenario-box { 
        background: #2a2a2a; 
        border: 4px solid #fff; 
        border-radius: 8px; 
        padding: 20px; 
        max-width: 600px; 
        width: 90%;
        box-shadow: 0 0 20px rgba(0,0,0,0.5); 
      }
      .scenario-character { 
        color: #ffd700; 
        font-size: 20px; 
        text-align: center; 
        margin-bottom: 15px; 
        text-shadow: 2px 2px #000; 
      }
      .scenario-situation { 
        color: #fff; 
        font-size: 12px; 
        line-height: 1.6; 
        margin-bottom: 20px; 
        padding: 15px; 
        background: rgba(0,0,0,0.3); 
        border-radius: 4px; 
      }
      .scenario-choices { 
        display: flex; 
        flex-direction: column; 
        gap: 10px; 
      }
      .choice-positive, .choice-neutral, .choice-negative, .continue-btn { 
        padding: 15px; 
        font-size: 11px; 
        border: 3px solid; 
        border-radius: 4px; 
        cursor: pointer; 
        transition: all 0.2s; 
        font-family: 'Press Start 2P', monospace; 
        text-align: left; 
      }
      .choice-positive { 
        background: #2ecc71; 
        color: #fff; 
        border-color: #27ae60; 
      }
      .choice-positive:hover { 
        background: #27ae60; 
        transform: scale(1.02); 
      }
      .choice-neutral { 
        background: #95a5a6; 
        color: #fff; 
        border-color: #7f8c8d; 
      }
      .choice-neutral:hover { 
        background: #7f8c8d; 
        transform: scale(1.02); 
      }
      .choice-negative { 
        background: #e74c3c; 
        color: #fff; 
        border-color: #c0392b; 
      }
      .choice-negative:hover { 
        background: #c0392b; 
        transform: scale(1.02); 
      }
      .scenario-outcome { 
        color: #fff; 
        font-size: 11px; 
        line-height: 1.6; 
        padding: 15px; 
        background: rgba(0,0,0,0.3); 
        border-radius: 4px; 
      }
      .score-change { 
        font-size: 14px; 
        font-weight: bold; 
        margin: 10px 0; 
        text-align: center; 
      }
      .score-change.positive { color: #2ecc71; }
      .score-change.neutral { color: #95a5a6; }
      .score-change.negative { color: #e74c3c; }
      .continue-btn { 
        background: #3498db; 
        color: #fff; 
        border-color: #2980b9; 
        width: 100%; 
        text-align: center; 
        margin-top: 10px; 
      }
      .continue-btn:hover { 
        background: #2980b9; 
      }
    `;
    document.head.appendChild(style);
  },
};

// Flagpole trigger system for NON X-4 levels
const FlagpoleDialogueTrigger = {
  active: false,
  hasTriggered: false,
  delaySeconds: 3,

  init() {
    console.log("🚩 Flagpole Dialogue Trigger initialized");
    this.hookFlagpoleCollision();
  },

  hookFlagpoleCollision() {
    // Hook into the FlagCollision function
    if (window.FlagCollision && !window.FlagCollisionOriginal) {
      window.FlagCollisionOriginal = window.FlagCollision;

      window.FlagCollision = function (player, flag) {
        console.log("🚩 Flagpole touched!");

        // Call original flagpole logic
        const result = window.FlagCollisionOriginal.call(this, player, flag);

        // Check if this is a non X-4 level
        const currentWorld = window.currentmap
          ? `${currentmap[0]}-${currentmap[1]}`
          : "unknown";
        console.log(`🗺️ Current level: ${currentWorld}`);

        // Trigger dialogue ONLY on non X-4 levels (X-1, X-2, X-3)
        const levelNumber = currentmap ? currentmap[1] : 0;
        if (levelNumber !== 4 && !FlagpoleDialogueTrigger.hasTriggered) {
          console.log(
            `✅ Non X-4 level detected (${currentWorld}) - triggering dialogue`
          );
          FlagpoleDialogueTrigger.triggerDialogue();
        } else if (levelNumber === 4) {
          console.log(`⏩ X-4 level (${currentWorld}) - skipping dialogue`);
        } else {
          console.log(`⏩ Already triggered this level - skipping`);
        }

        return result;
      };

      console.log("✅ FlagCollision hooked successfully");
    }
  },

  triggerDialogue() {
    if (this.hasTriggered) {
      console.log("⏩ Already triggered dialogue this level");
      return;
    }

    this.hasTriggered = true;
    console.log(`🎭 Dialogue will trigger in ${this.delaySeconds} seconds...`);

    setTimeout(() => {
      // Pause game
      if (window.pause) window.pause();

      // Stop player movement
      if (window.player) {
        if (window.player.keys) {
          window.player.keys.run = 0;
          window.player.keys.left = 0;
          window.player.keys.right = 0;
        }
        window.player.xvel = 0;
        window.player.yvel = 0;
      }

      // Select random NPC
      const randomNPC = RelationshipScenarios.getRandomNPC();
      console.log(`🎲 Selected NPC: ${randomNPC}`);

      // Show dialogue
      if (window.RelationshipScenarios) {
        RelationshipScenarios.showScenarioDialog(randomNPC);
      } else {
        console.error("❌ RelationshipScenarios not found!");
      }
    }, this.delaySeconds * 1000);
  },

  reset() {
    this.hasTriggered = false;
    console.log("🔄 Flagpole trigger reset for new level");
  },
};

// Initialize when map changes
if (window.setMap && !window.setMapOriginalForDialogue) {
  window.setMapOriginalForDialogue = window.setMap;

  window.setMap = function () {
    // Reset trigger for new level
    if (window.FlagpoleDialogueTrigger) {
      FlagpoleDialogueTrigger.reset();
    }

    // Call original setMap
    return window.setMapOriginalForDialogue.apply(this, arguments);
  };

  console.log("✅ setMap hooked for trigger reset");
}

// Export to window
window.RelationshipScenarios = RelationshipScenarios;
window.FlagpoleDialogueTrigger = FlagpoleDialogueTrigger;

// Test function
window.testScenario = (char) => {
  const character = char || RelationshipScenarios.getRandomNPC();
  RelationshipScenarios.showScenarioDialog(character);
};

// Auto-initialize
setTimeout(() => {
  if (window.FlagpoleDialogueTrigger) {
    FlagpoleDialogueTrigger.init();
  }
}, 1000);

console.log("✅ relationship_scenarios.js loaded!");
console.log("🎮 Test with: testScenario() or testScenario('toad')");

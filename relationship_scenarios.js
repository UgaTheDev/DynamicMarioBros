const RelationshipScenarios = {
  apiKey: "AIzaSyC8R4GV-YXfB8XBnyOI9VveVTHwSanFP8o",

  conversationHistory: {
    toad: [],
    goomba: [],
    koopa: [],
  },

  checkLevelEnd() {
    const currentWorld = window.map?.area || "";
    console.log("🎮 Current world:", currentWorld);

    if (currentWorld.endsWith("-4")) {
      const character = this.getCharacterForWorld(currentWorld);
      console.log("🎭 Triggering scenario for:", character);
      this.showScenarioDialog(character);
    }
  },

  getCharacterForWorld(world) {
    if (world.startsWith("1-")) return "toad";
    if (world.startsWith("2-")) return "goomba";
    if (world.startsWith("3-")) return "koopa";
    return "toad";
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
      console.log("🤖 Calling Gemini API for", character);
      console.log("📝 Prompt:", prompt.substring(0, 200) + "...");

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
      console.log("📡 Full API Response:", JSON.stringify(data, null, 2));

      if (!data.candidates || !data.candidates[0]) {
        console.error("❌ API Error - No candidates:", data);
        console.log("🔄 Using fallback scenario");
        return this.getFallbackScenario(character);
      }

      const responseText = data.candidates[0].content.parts[0].text;
      console.log("📄 Raw response text:", responseText);

      let scenario = JSON.parse(responseText);

      if (Array.isArray(scenario)) {
        scenario = scenario[0];
      }

      console.log("✅ Parsed scenario:", scenario);

      this.conversationHistory[character].push({
        relationshipScore,
        scenario: scenario.situation,
      });

      return scenario;
    } catch (error) {
      console.error("❌ AI generation failed:", error);
      console.error("Error details:", error.message, error.stack);
      console.log("🔄 Using fallback scenario");
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

    return `You are creating a scenario for a Super Mario game where the player encounters ${character.toUpperCase()} at the end of World X-4.

Current relationship: ${relationship} (score: ${score}/100)
${historyContext}

Create a SHORT scenario (2-3 sentences max) where ${character} needs help or presents a dilemma. The scenario should:
1. Build naturally from previous interactions
2. Reflect the current relationship (${relationship})
3. Be appropriate for a Mario game setting
4. Present a clear choice between helping (+25) or ignoring/harming (-25)

Return ONLY valid JSON in this exact format:
{
  "situation": "The scenario description here",
  "positiveChoice": "Help them (describe how)",
  "negativeChoice": "Ignore/harm them (describe how)",
  "positiveOutcome": "What happens if they help",
  "negativeOutcome": "What happens if they ignore"
}`;
  },

  getFallbackScenario(character) {
    const fallbacks = {
      toad: {
        situation: "Toad is trapped under a fallen block and needs your help!",
        positiveChoice: "Lift the block and free Toad",
        negativeChoice: "Walk past without helping",
        positiveOutcome: "Toad is grateful and offers you a power-up!",
        negativeOutcome: "Toad struggles alone as you leave...",
      },
      goomba: {
        situation: "A Goomba is being bullied by larger enemies.",
        positiveChoice: "Defend the Goomba",
        negativeChoice: "Join in the bullying",
        positiveOutcome: "The Goomba becomes your ally!",
        negativeOutcome: "The Goomba runs away in fear...",
      },
      koopa: {
        situation: "Koopa's shell has cracked and they can't move.",
        positiveChoice: "Help repair the shell",
        negativeChoice: "Kick the shell away",
        positiveOutcome: "Koopa thanks you and reveals a secret!",
        negativeOutcome: "Koopa retreats into the broken shell...",
      },
    };
    return fallbacks[character] || fallbacks.toad;
  },

  async showScenarioDialog(character) {
    console.log(`🎭 Generating scenario for ${character}...`);
    const scenario = await this.generateScenario(character);

    const dialog = document.createElement("div");
    dialog.id = "scenario-dialog";
    dialog.innerHTML = `
      <div class="scenario-overlay">
        <div class="scenario-box">
          <div class="scenario-character">${character.toUpperCase()}</div>
          <div class="scenario-situation">${scenario.situation}</div>
          <div class="scenario-choices">
            <button class="choice-positive">✅ ${
              scenario.positiveChoice
            }</button>
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

    dialog.querySelector(".choice-positive").onclick = () => {
      this.handleChoice(character, 25, scenario.positiveOutcome, dialog);
    };
    dialog.querySelector(".choice-negative").onclick = () => {
      this.handleChoice(character, -25, scenario.negativeOutcome, dialog);
    };

    if (window.gameState) window.gameState.paused = true;
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
      <p class="score-change ${scoreChange > 0 ? "positive" : "negative"}">
        ${scoreChange > 0 ? "+" : ""}${scoreChange} relationship
      </p>
      <button class="continue-btn">Continue</button>
    `;
    outcomeDiv.style.display = "block";
    dialog.querySelector(".scenario-choices").style.display = "none";

    outcomeDiv.querySelector(".continue-btn").onclick = () => {
      dialog.remove();
      if (window.gameState) window.gameState.paused = false;
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
      max-width: 500px; 
      width: 90%;
      box-shadow: 0 0 20px rgba(0,0,0,0.5); 
      position: relative;
    }
      .scenario-character { color: #ffd700; font-size: 20px; text-align: center; margin-bottom: 15px; text-shadow: 2px 2px #000; }
      .scenario-situation { color: #fff; font-size: 12px; line-height: 1.6; margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 4px; }
      .scenario-choices { display: flex; flex-direction: column; gap: 10px; }
      .choice-positive, .choice-negative, .continue-btn { padding: 15px; font-size: 11px; border: 3px solid; border-radius: 4px; cursor: pointer; transition: all 0.2s; font-family: 'Press Start 2P', monospace; text-align: left; }
      .choice-positive { background: #2ecc71; color: #fff; border-color: #27ae60; }
      .choice-positive:hover { background: #27ae60; transform: scale(1.02); }
      .choice-negative { background: #e74c3c; color: #fff; border-color: #c0392b; }
      .choice-negative:hover { background: #c0392b; transform: scale(1.02); }
      .scenario-outcome { color: #fff; font-size: 11px; line-height: 1.6; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 4px; }
      .score-change { font-size: 14px; font-weight: bold; margin: 10px 0; text-align: center; }
      .score-change.positive { color: #2ecc71; }
      .score-change.negative { color: #e74c3c; }
      .continue-btn { background: #3498db; color: #fff; border-color: #2980b9; width: 100%; text-align: center; margin-top: 10px; }
      .continue-btn:hover { background: #2980b9; }
    `;
    document.head.appendChild(style);
  },
}; // <-- CLOSE RelationshipScenarios HERE

window.RelationshipScenarios = window.RelationshipScenarios || {
  apiKey: "AIzaSyC8R4GV-YXfB8XBnyOI9VveVTHwSanFP8o",

  conversationHistory: {
    toad: [],
    goomba: [],
    koopa: [],
  },

  checkLevelEnd() {
    const currentWorld = window.map?.area || "";
    console.log("🎮 Current world:", currentWorld);

    if (currentWorld.endsWith("-4")) {
      const character = this.getCharacterForWorld(currentWorld);
      console.log("🎭 Triggering scenario for:", character);
      this.showScenarioDialog(character);
    }
  },

  getCharacterForWorld(world) {
    if (world.startsWith("1-")) return "toad";
    if (world.startsWith("2-")) return "goomba";
    if (world.startsWith("3-")) return "koopa";
    return "toad";
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
      console.log("🤖 Calling Gemini API...");
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
      console.log("📡 API Response:", data);

      if (!data.candidates) {
        console.error("API Error:", data);
        return this.getFallbackScenario(character);
      }

      let scenario = JSON.parse(data.candidates[0].content.parts[0].text);

      if (Array.isArray(scenario)) {
        scenario = scenario[0];
      }

      console.log("✅ Generated scenario:", scenario);

      this.conversationHistory[character].push({
        relationshipScore,
        scenario: scenario.situation,
      });

      return scenario;
    } catch (error) {
      console.error("AI generation failed:", error);
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

    return `You are creating a scenario for a Super Mario game where the player encounters ${character.toUpperCase()} at the end of World X-4.

Current relationship: ${relationship} (score: ${score}/100)
${historyContext}

Create a SHORT scenario (2-3 sentences max) where ${character} needs help or presents a dilemma. The scenario should:
1. Build naturally from previous interactions
2. Reflect the current relationship (${relationship})
3. Be appropriate for a Mario game setting
4. Present a clear choice between helping (+25) or ignoring/harming (-25)

Return ONLY valid JSON in this exact format:
{
  "situation": "The scenario description here",
  "positiveChoice": "Help them (describe how)",
  "negativeChoice": "Ignore/harm them (describe how)",
  "positiveOutcome": "What happens if they help",
  "negativeOutcome": "What happens if they ignore"
}`;
  },

  getFallbackScenario(character) {
    const fallbacks = {
      toad: {
        situation: "Toad is trapped under a fallen block and needs your help!",
        positiveChoice: "Lift the block and free Toad",
        negativeChoice: "Walk past without helping",
        positiveOutcome: "Toad is grateful and offers you a power-up!",
        negativeOutcome: "Toad struggles alone as you leave...",
      },
      goomba: {
        situation: "A Goomba is being bullied by larger enemies.",
        positiveChoice: "Defend the Goomba",
        negativeChoice: "Join in the bullying",
        positiveOutcome: "The Goomba becomes your ally!",
        negativeOutcome: "The Goomba runs away in fear...",
      },
      koopa: {
        situation: "Koopa's shell has cracked and they can't move.",
        positiveChoice: "Help repair the shell",
        negativeChoice: "Kick the shell away",
        positiveOutcome: "Koopa thanks you and reveals a secret!",
        negativeOutcome: "Koopa retreats into the broken shell...",
      },
    };
    return fallbacks[character] || fallbacks.toad;
  },

  async showScenarioDialog(character) {
    console.log(`🎭 Generating scenario for ${character}...`);
    const scenario = await this.generateScenario(character);

    const dialog = document.createElement("div");
    dialog.id = "scenario-dialog";
    dialog.innerHTML = `
      <div class="scenario-overlay">
        <div class="scenario-box">
          <div class="scenario-character">${character.toUpperCase()}</div>
          <div class="scenario-situation">${scenario.situation}</div>
          <div class="scenario-choices">
            <button class="choice-positive">✅ ${
              scenario.positiveChoice
            }</button>
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

    dialog.querySelector(".choice-positive").onclick = () => {
      this.handleChoice(character, 25, scenario.positiveOutcome, dialog);
    };
    dialog.querySelector(".choice-negative").onclick = () => {
      this.handleChoice(character, -25, scenario.negativeOutcome, dialog);
    };

    if (window.gameState) window.gameState.paused = true;
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
      <p class="score-change ${scoreChange > 0 ? "positive" : "negative"}">
        ${scoreChange > 0 ? "+" : ""}${scoreChange} relationship
      </p>
      <button class="continue-btn">Continue</button>
    `;
    outcomeDiv.style.display = "block";
    dialog.querySelector(".scenario-choices").style.display = "none";

    outcomeDiv.querySelector(".continue-btn").onclick = () => {
      dialog.remove();
      if (window.gameState) window.gameState.paused = false;
    };
  },

  addScenarioStyles() {
    if (document.getElementById("scenario-styles")) return;
    const style = document.createElement("style");
    style.id = "scenario-styles";
    style.textContent = `
      .scenario-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; z-index: 10000; font-family: 'Press Start 2P', monospace; }
      .scenario-box { background: #2a2a2a; border: 4px solid #fff; border-radius: 8px; padding: 20px; max-width: 500px; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
      .scenario-character { color: #ffd700; font-size: 20px; text-align: center; margin-bottom: 15px; text-shadow: 2px 2px #000; }
      .scenario-situation { color: #fff; font-size: 12px; line-height: 1.6; margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 4px; }
      .scenario-choices { display: flex; flex-direction: column; gap: 10px; }
      .choice-positive, .choice-negative, .continue-btn { padding: 15px; font-size: 11px; border: 3px solid; border-radius: 4px; cursor: pointer; transition: all 0.2s; font-family: 'Press Start 2P', monospace; text-align: left; }
      .choice-positive { background: #2ecc71; color: #fff; border-color: #27ae60; }
      .choice-positive:hover { background: #27ae60; transform: scale(1.02); }
      .choice-negative { background: #e74c3c; color: #fff; border-color: #c0392b; }
      .choice-negative:hover { background: #c0392b; transform: scale(1.02); }
      .scenario-outcome { color: #fff; font-size: 11px; line-height: 1.6; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 4px; }
      .score-change { font-size: 14px; font-weight: bold; margin: 10px 0; text-align: center; }
      .score-change.positive { color: #2ecc71; }
      .score-change.negative { color: #e74c3c; }
      .continue-btn { background: #3498db; color: #fff; border-color: #2980b9; width: 100%; text-align: center; margin-top: 10px; }
      .continue-btn:hover { background: #2980b9; }
    `;
    document.head.appendChild(style);
  },
}; // <-- CLOSE RelationshipScenarios HERE
const ToadDialogueTrigger = {
  active: false,
  hasTriggered: false,

  start() {
    this.active = true;
    this.hasTriggered = false;
    console.log("🍄 Toad dialogue trigger activated for this level");
    console.log(
      "🍄 Active status:",
      this.active,
      "HasTriggered:",
      this.hasTriggered
    );
  },

  stop() {
    this.active = false;
    this.hasTriggered = false;
    console.log("🔄 Toad dialogue trigger deactivated");
  },

  check() {
    // Debug: Show we're in the check function
    if (this.active && !this.hasTriggered && window.player) {
      console.log(
        `🔍 Mario at x=${Math.floor(player.left)}, active=${
          this.active
        }, triggered=${this.hasTriggered}`
      );
    }

    if (!this.active || this.hasTriggered) {
      console.log(
        "⚠️ Check returning early - active:",
        this.active,
        "hasTriggered:",
        this.hasTriggered
      );
      return;
    }

    if (!window.player) {
      console.log("⚠️ No player found");
      return;
    }

    console.log(
      `✅ Checking position: ${Math.floor(player.left)} vs 1090-1110`
    );

    if (player.left >= 1090 && player.left <= 1110) {
      this.hasTriggered = true;
      console.log("🍄 Approached Toad - triggering dialogue!");

      player.keys.run = 0;
      player.xvel = 0;

      if (window.RelationshipScenarios) {
        setTimeout(() => {
          RelationshipScenarios.showScenarioDialog("toad");
        }, 300);
      }
    }
  },
};

// Global check loop
let checkLoopInterval = null;

function startCheckLoop() {
  if (checkLoopInterval) {
    clearInterval(checkLoopInterval);
  }

  console.log("⏰ Starting ToadDialogueTrigger check loop");
  checkLoopInterval = setInterval(() => {
    console.log(
      "⏱️ Interval tick - active:",
      ToadDialogueTrigger.active,
      "hasTriggered:",
      ToadDialogueTrigger.hasTriggered
    );
    if (ToadDialogueTrigger.active) {
      ToadDialogueTrigger.check();
    }
  }, 100);
}

// Start the loop immediately
startCheckLoop();

window.ToadDialogueTrigger = ToadDialogueTrigger;
window.startCheckLoop = startCheckLoop;
window.testScenario = (char) =>
  RelationshipScenarios.showScenarioDialog(char || "toad");

console.log(
  "🎭 Relationship Scenarios loaded! Test with: testScenario('toad')"
);
console.log("🔄 Check loop started!");

const MapModifier = {
  originalMapStates: {},
  activeModifications: {},
  clearCurrentModifications() {
    console.log("🧹 Clearing modifications for level transition");
    this.disableDoubleCoinChance();
  },
  init() {
    console.log("🗺️ Map Modifier initialized");
    this.loadModificationState();
    this.hookIntoSpawnMap();
    this.hookIntoSetMap();
  },
  hookIntoSetMap() {
    if (!window.setMapOriginal && window.setMap) {
      window.setMapOriginal = window.setMap;
      window.setMap = function () {
        console.log("🗺️ setMap called - new level loading");
        MapModifier.clearCurrentModifications();
        const result = setMapOriginal.apply(this, arguments);
        return result;
      };
      console.log("✅ Hooked into setMap - modifiers reset on level change");
    }
  },
  _showRelationshipMessage(msg) {
    let box = document.getElementById("relationship-message");
    if (box) {
      box.textContent = msg;
      box.style.display = "block";
      setTimeout(() => {
        box.style.display = "none";
      }, 2500);
    } else {
      alert(msg);
    }
  },
  showToadHelpMessage() {
    this._showRelationshipMessage(
      "🍄 Toad: You are now allied! Mushrooms incoming! You now have a chance for coins to double drop!"
    );
  },
  showLuigiHelpMessage() {
    this._showRelationshipMessage(
      "👨 Luigi: You are now allied! Platforms and springs appear!"
    );
  },
  showPeachHelpMessage() {
    this._showRelationshipMessage(
      "👑 Peach: You are now allied! Hidden secrets revealed!"
    );
  },
  hookIntoSpawnMap() {
    if (!window.spawnMapOriginal && window.spawnMap) {
      window.spawnMapOriginal = window.spawnMap;
      window.spawnMap = () => {
        spawnMapOriginal();
        setTimeout(() => {
          if (window.player && player.alive) {
            console.log("🎮 Level loaded - injecting modifications");
            MapModifier.injectModifications();
          }
        }, 150);
      };
      console.log("✅ Hooked into spawnMap");
    }
    this.hookIntoMaintainSolids();
  },
  hookIntoMaintainSolids() {
    if (!window.maintainSolidsOriginal && window.maintainSolids) {
      window.maintainSolidsOriginal = window.maintainSolids;
      window.maintainSolids = function (update) {
        for (var i = 0, solid; i < solids.length; ++i) {
          solid = solids[i];
          const isProtected =
            solid &&
            solid.relationshipTag &&
            (solid.relationshipTag.includes("helpful") ||
              solid.relationshipTag.includes("relationship"));
          if (solid.alive) {
            if (solid.movement) solid.movement(solid);
          }
          if (isProtected) {
            continue;
          }
          if (!solid.alive || solid.right < QuadsKeeper.getDelX()) {
            deleteThing(solid, solids, i);
          }
        }
      };
      console.log("✅ Hooked into maintainSolids - platforms protected");
    }
  },
  injectModifications() {
    if (!window.map || !window.GameRelationships) return;
    const relationships = GameRelationships.getAllStatuses();
    const levelKey = "current";
    Object.entries(relationships).forEach(([character, status]) => {
      if (status !== "neutral") {
        this.applyCharacterModifications(levelKey, character, status);
      }
    });
  },
  applyModifications(levelKey) {
    if (!levelKey) {
      console.warn("No level key provided");
      return;
    }
    console.log(`🗺️ Applying modifications to level: ${levelKey}`);
    if (!this.originalMapStates[levelKey]) {
      this.saveOriginalState(levelKey);
    }
    const relationships = GameRelationships.getAllStatuses();
    setTimeout(() => {
      Object.entries(relationships).forEach(([character, status]) => {
        this.applyCharacterModifications(levelKey, character, status);
      });
      this.saveModificationState();
    }, 100);
  },
  saveOriginalState(levelKey) {
    this.originalMapStates[levelKey] = {
      platforms: [],
      enemies: [],
      powerups: [],
      coins: [],
      blocks: [],
    };
    console.log(`💾 Saved original state for ${levelKey}`);
  },
  applyCharacterModifications(levelKey, character, status) {
    const modKey = `${levelKey}_${character}_${status}`;
    console.log(
      `🔧 Applying ${character} modifications (${status}) to ${levelKey}`
    );
    switch (character) {
      case "toad":
        this.applyToadModifications(levelKey, status);
        break;
      case "luigi":
        this.applyLuigiModifications(levelKey, status);
        break;
      case "peach":
        this.applyPeachModifications(levelKey, status);
        break;
    }
    this.activeModifications[modKey] = true;
  },
  applyToadModifications(levelKey, status) {
    if (status === "allied") {
      console.log("🍄 Toad is allied - mushroom bonuses activated!");
      this.showToadHelpMessage();
      setTimeout(() => {
        this.addPowerUps(levelKey, "mushroom", 3);
      }, 2000);
      this.doubleQuestionBlocks(levelKey);
      this.enableDoubleCoinChance();
    } else if (status === "enemy") {
      console.log("🍄 Toad is enemy - making level harder");
      this.addEnemies(levelKey, "goomba", 3);
      this.disableDoubleCoinChance();
    }
  },
  applyLuigiModifications(levelKey, status) {
    if (status === "allied") {
      console.log("👻 Luigi is allied - adding high platforms");
      this.showLuigiHelpMessage();
      this.addHighPlatforms(levelKey, "luigi");
      this.addSprings(levelKey, 2);
      this.addHighCoins(levelKey, 5);
    } else if (status === "enemy") {
      console.log("👻 Luigi is enemy - making jumps harder");
      this.spreadPlatforms(levelKey);
      this.addEnemies(levelKey, "koopa", 2);
      this.removeSprings(levelKey);
    }
  },
  applyPeachModifications(levelKey, status) {
    if (status === "allied") {
      console.log("👑 Peach is allied - revealing secrets");
      this.showPeachHelpMessage();
      this.revealHiddenBlocks(levelKey, 3);
      this.addBonusCoins(levelKey, 10);
      this.addPowerUps(levelKey, "star", 1);
    } else if (status === "enemy") {
      console.log("👑 Peach is enemy - hiding rewards");
      this.hideBlocks(levelKey, 2);
      this.removeCoins(levelKey, 5);
      this.addFalseBlocks(levelKey, 2);
    }
  },
  doubleQuestionBlocks(levelKey) {
    console.log(`❓ Doubling the number of ? blocks`);
    const existingBlocks = solids.filter(
      (s) => s.name === "Block" && !s.used && s.left > 100 && s.left < 2000
    );
    console.log(`Found ${existingBlocks.length} existing ? blocks`);
    const bricksToConvert = solids.filter(
      (s) =>
        s.name === "Brick" &&
        !s.used &&
        !s.relationshipModified &&
        s.left > 100 &&
        s.left < 2000
    );
    const convertCount = Math.min(
      existingBlocks.length,
      bricksToConvert.length
    );
    console.log(`Converting ${convertCount} bricks to ? blocks`);
    for (let i = 0; i < convertCount; i++) {
      const brick = bricksToConvert[i];
      brick.relationshipModified = true;
      brick.name = "Block";
      removeClass(brick, "brick");
      removeClass(brick, "unused");
      addClass(brick, "Block");
      addClass(brick, "unused");
      if (Math.random() < 0.3) {
        brick.contents = [Mushroom, false, false];
      } else {
        brick.contents = [Coin, false, false];
      }
      TimeHandler.addSpriteCycleSynched(brick, [
        "one",
        "two",
        "three",
        "two",
        "one",
      ]);
      console.log(`✅ Converted brick at x=${brick.left} to ? block`);
    }
  },
  enableDoubleCoinChance() {
    console.log(`🪙 Enabling 40% double coin chance`);
    if (!window.gainCoinOriginal) {
      window.gainCoinOriginal = window.gainCoin;
      window.gainCoin = function () {
        gainCoinOriginal();
        if (GameRelationships && GameRelationships.isAllied("toad")) {
          if (Math.random() < 0.4) {
            gainCoinOriginal();
            AudioPlayer.play("Coin");
            console.log("🍄 Toad bonus: Double coin!");
          }
        }
      };
      console.log("✅ Double coin chance hooked");
    }
  },
  disableDoubleCoinChance() {
    if (window.gainCoinOriginal) {
      window.gainCoin = window.gainCoinOriginal;
      delete window.gainCoinOriginal;
      console.log("❌ Double coin chance disabled");
    }
  },
  addHighPlatforms(levelKey, character) {
    const positions = this.getHighPlatformPositions(levelKey);
    positions.forEach((pos) => {
      this.createPlatform(pos.x, pos.y, pos.width, `${character}_high`);
    });
  },
  spreadPlatforms(levelKey) {
    console.log("⚠️ Spreading platforms - jumps will be harder");
  },
  createGaps(levelKey, count) {
    console.log(`⚠️ Creating ${count} challenging gaps`);
  },
  addEnemies(levelKey, enemyType, count) {
    console.log(`👾 Adding ${count} ${enemyType}s`);
    const positions = this.getEnemySpawnPositions(levelKey, count);
    positions.forEach((pos) => {
      this.spawnEnemy(enemyType, pos.x, pos.y, `relationship_spawn`);
    });
  },
  weakenEnemies(levelKey, multiplier) {
    console.log(`💪 Weakening enemies (${multiplier}x health)`);
  },
  addPowerUps(levelKey, type, count) {
    console.log(`⭐ Adding ${count} ${type} power-ups`);
    const positions = this.getPowerUpPositions(levelKey, count);
    positions.forEach((pos) => {
      this.spawnPowerUp(type, pos.x, pos.y, `relationship_powerup`);
    });
    if (type === "mushroom") {
      this.showToadHelpMessage();
    }
  },
  addSprings(levelKey, count) {
    console.log(`🦘 Adding ${count} springs`);
    const positions = this.getSpringPositions(levelKey, count);
    positions.forEach((pos) => {
      this.createSpring(pos.x, pos.y, `relationship_spring`);
    });
  },
  removeSprings(levelKey) {
    console.log("🦘 Removing springs");
    const springs = this.findObjectsByTag("relationship_spring");
    springs.forEach((spring) => this.removeObject(spring));
  },
  addBonusCoins(levelKey, count) {
    console.log(`🪙 Adding ${count} bonus coins`);
    const positions = this.getCoinPositions(levelKey, count);
    positions.forEach((pos) => {
      this.createCoin(pos.x, pos.y, `relationship_coin`);
    });
  },
  addHighCoins(levelKey, count) {
    console.log(`🪙 Adding ${count} high coins`);
    const positions = this.getHighCoinPositions(levelKey, count);
    positions.forEach((pos) => {
      this.createCoin(pos.x, pos.y, `relationship_high_coin`);
    });
  },
  removeCoins(levelKey, count) {
    console.log(`🪙 Removing ${count} coins`);
    const coins = this.findObjectsByTag("relationship_coin").slice(0, count);
    coins.forEach((coin) => this.removeObject(coin));
  },
  revealHiddenBlocks(levelKey, count) {
    console.log(`📦 Revealing ${count} hidden blocks`);
    const blocks = this.findHiddenBlocks(levelKey).slice(0, count);
    blocks.forEach((block) => this.makeBlockVisible(block));
  },
  hideBlocks(levelKey, count) {
    console.log(`📦 Hiding ${count} blocks`);
    const blocks = this.findVisibleBlocks(levelKey).slice(0, count);
    blocks.forEach((block) => this.makeBlockHidden(block));
  },
  addFalseBlocks(levelKey, count) {
    console.log(`❌ Adding ${count} false blocks`);
    const positions = this.getBlockPositions(levelKey, count);
    positions.forEach((pos) => {
      this.createFalseBlock(pos.x, pos.y, `relationship_false`);
    });
  },
  getHelpfulPlatformPositions(levelKey) {
    return [
      { x: 200, y: 64, width: 64 },
      { x: 350, y: 64, width: 64 },
      { x: 500, y: 56, width: 64 },
    ];
  },
  getHighPlatformPositions(levelKey) {
    return [
      { x: 250, y: 40, width: 64 },
      { x: 450, y: 32, width: 64 },
    ];
  },
  getEnemySpawnPositions(levelKey, count) {
    const floorY = 88;
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        x: 220 + i * 180,
        y: floorY,
      }));
  },
  getPowerUpPositions(levelKey, count) {
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        x: 240 + i * 140,
        y: 72,
      }));
  },
  getSpringPositions(levelKey, count) {
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        x: 450 + i * 200,
        y: 450,
      }));
  },
  getCoinPositions(levelKey, count) {
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        x: 300 + i * 50,
        y: 380,
      }));
  },
  getHighCoinPositions(levelKey, count) {
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        x: 400 + i * 60,
        y: 200,
      }));
  },
  getBlockPositions(levelKey, count) {
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        x: 400 + i * 100,
        y: 300,
      }));
  },
  findHiddenBlocks(levelKey) {
    console.log("🔍 Finding hidden blocks...");
    const hiddenBlocks = [];
    if (window.solids) {
      for (let i = 0; i < solids.length; i++) {
        const solid = solids[i];
        if (solid.hidden && solid.name === "Block") {
          hiddenBlocks.push(solid);
        }
      }
    }
    return hiddenBlocks;
  },
  findVisibleBlocks(levelKey) {
    console.log("🔍 Finding visible blocks...");
    const visibleBlocks = [];
    if (window.solids) {
      for (let i = 0; i < solids.length; i++) {
        const solid = solids[i];
        if (!solid.hidden && solid.name === "Block" && !solid.used) {
          visibleBlocks.push(solid);
        }
      }
    }
    return visibleBlocks;
  },
  findPlatformsByTag(tag) {
    console.log(`🔍 Finding platforms with tag: ${tag}`);
    const platforms = [];
    if (window.solids) {
      for (let i = 0; i < solids.length; i++) {
        const solid = solids[i];
        if (solid.relationshipTag === tag) {
          platforms.push(solid);
        }
      }
    }
    return platforms;
  },
  findObjectsByTag(tag) {
    console.log(`🔍 Finding objects with tag: ${tag}`);
    const objects = [];
    const arrays = [window.solids, window.characters, window.scenery];
    for (const arr of arrays) {
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const obj = arr[i];
        if (obj.relationshipTag === tag) {
          objects.push(obj);
        }
      }
    }
    return objects;
  },
  createPlatform(x, y, width, tag) {
    console.log(`🏗️ Creating platform at (${x}, ${y}) width:${width} [${tag}]`);
    try {
      const platform = new Thing(Stone, width / 8, 1);
      addThing(platform, x, y);
      platform.relationshipTag = tag;
      platform.outerok = Infinity;
      platform.nokillend = true;
      console.log(`✅ Platform created at index ${solids.indexOf(platform)}`);
      return platform;
    } catch (e) {
      console.error("Failed to create platform:", e);
      return null;
    }
  },
  removePlatform(platform) {
    console.log(`🗑️ Removing platform`);
    if (platform && platform.alive) {
      killNormal(platform);
    }
  },
  spawnEnemy(type, x, y, tag) {
    console.log(`👾 Spawning ${type} at (${x}, ${y}) [${tag}]`);
    let enemy;
    switch (type.toLowerCase()) {
      case "goomba":
        enemy = new Thing(Goomba);
        break;
      case "koopa":
        enemy = new Thing(Koopa, false);
        break;
      default:
        console.warn(`Unknown enemy type: ${type}`);
        return;
    }
    addThing(enemy, x, y);
    enemy.relationshipTag = tag;
    enemy.outerok = 8;
    enemy.nokillend = true;
    enemy.noscroll = true;
    if (window.map && window.map.spawned) {
      map.spawned.push(enemy);
    }
    return enemy;
  },
  spawnPowerUp(type, x, y, tag) {
    console.log(`⭐ Spawning ${type} power-up at (${x}, ${y}) [${tag}]`);
    let powerup;
    switch (type.toLowerCase()) {
      case "mushroom":
        powerup = new Thing(Mushroom);
        break;
      case "fireflower":
        powerup = new Thing(FireFlower);
        break;
      case "star":
        powerup = new Thing(Star);
        break;
      default:
        console.warn(`Unknown powerup type: ${type}`);
        return;
    }
    addThing(powerup, x, y);
    powerup.relationshipTag = tag;
    return powerup;
  },
  createSpring(x, y, tag) {
    console.log(`🦘 Creating spring at (${x}, ${y}) [${tag}]`);
    const spring = new Thing(Springboard);
    addThing(spring, x, y);
    spring.relationshipTag = tag;
    return spring;
  },
  createCoin(x, y, tag) {
    console.log(`🪙 Creating coin at (${x}, ${y}) [${tag}]`);
    const coin = new Thing(Coin);
    addThing(coin, x, y);
    coin.relationshipTag = tag;
    return coin;
  },
  createFalseBlock(x, y, tag) {
    console.log(`❌ Creating false block at (${x}, ${y}) [${tag}]`);
    const block = new Thing(Block, false);
    addThing(block, x, y);
    block.relationshipTag = tag;
    removeClass(block, "used");
    addClass(block, "unused");
    return block;
  },
  removeObject(obj) {
    console.log(`🗑️ Removing object`);
    if (obj && obj.alive) {
      killNormal(obj);
    }
  },
  makeBlockVisible(block) {
    console.log(`👁️ Making block visible`);
    if (block) {
      block.hidden = false;
      removeClass(block, "hidden");
      setThingSprite(block);
    }
  },
  makeBlockHidden(block) {
    console.log(`🫥 Making block hidden`);
    if (block) {
      block.hidden = true;
      addClass(block, "hidden");
      setThingSprite(block);
    }
  },
  saveModificationState() {
    const state = {
      active: this.activeModifications,
      timestamp: Date.now(),
    };
    localStorage.setItem("mapModifications", JSON.stringify(state));
  },
  loadModificationState() {
    const saved = localStorage.getItem("mapModifications");
    if (saved) {
      const state = JSON.parse(saved);
      this.activeModifications = state.active || {};
      console.log("📂 Loaded modification state");
    }
  },
  resetLevel(levelKey) {
    console.log(`🔄 Resetting all modifications for ${levelKey}`);
    this.allowDeletion = true;
    [
      "relationship_spawn",
      "relationship_powerup",
      "relationship_spring",
      "relationship_coin",
      "relationship_high_coin",
      "relationship_false",
      "toad_helpful",
      "luigi_high",
    ].forEach((tag) => {
      const objects = this.findObjectsByTag(tag);
      objects.forEach((obj) => this.removeObject(obj));
    });
    this.allowDeletion = false;
    Object.keys(this.activeModifications).forEach((key) => {
      if (key.startsWith(levelKey)) {
        delete this.activeModifications[key];
      }
    });
    this.saveModificationState();
  },
  getModificationSummary(levelKey) {
    const active = Object.keys(this.activeModifications).filter((key) =>
      key.startsWith(levelKey)
    );
    return {
      count: active.length,
      modifications: active,
    };
  },
};
if (typeof window !== "undefined") {
  window.MapModifier = MapModifier;
  console.log("✅ MapModifier available globally");
}

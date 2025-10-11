// map_modifier.js - Modifies game maps based on relationship status

const MapModifier = {
  // Store original map state for restoration
  originalMapStates: {},

  // Track active modifications
  activeModifications: {},

  /**
   * Initialize the map modifier system
   */
  init() {
    console.log("🗺️ Map Modifier initialized");
    this.loadModificationState();

    // Hook into FSM's spawnMap function to add our objects
    this.hookIntoSpawnMap();
  },

  /**
   * Hook into FSM's spawnMap to inject our modifications
   */
  hookIntoSpawnMap() {
    // Save original spawnMap function
    if (!window.spawnMapOriginal && window.spawnMap) {
      window.spawnMapOriginal = window.spawnMap;

      // Replace with our version
      window.spawnMap = () => {
        // Call original
        spawnMapOriginal();

        // Add our modifications after a delay (when level is loaded)
        setTimeout(() => {
          // Only inject if we're actually in a level (not title screen)
          if (window.player && player.alive) {
            console.log("🎮 Level loaded - injecting modifications");
            MapModifier.injectModifications();
          }
        }, 150);
      };

      console.log("✅ Hooked into spawnMap");
    }

    // CRITICAL: Hook into maintainSolids to prevent deletion
    this.hookIntoMaintainSolids();
  },

  /**
   * Hook into maintainSolids to protect our objects
   */
  hookIntoMaintainSolids() {
    if (!window.maintainSolidsOriginal && window.maintainSolids) {
      window.maintainSolidsOriginal = window.maintainSolids;

      window.maintainSolids = function (update) {
        // Iterate through solids array
        for (var i = 0, solid; i < solids.length; ++i) {
          solid = solids[i];

          // Check if this is one of our relationship objects
          const isProtected =
            solid &&
            solid.relationshipTag &&
            (solid.relationshipTag.includes("helpful") ||
              solid.relationshipTag.includes("relationship"));

          // Execute movement if alive
          if (solid.alive) {
            if (solid.movement) solid.movement(solid);
          }

          // CRITICAL: Skip deletion check for protected objects
          if (isProtected) {
            continue; // Don't delete our platforms!
          }

          // Normal FSM deletion logic for non-protected objects
          if (!solid.alive || solid.right < QuadsKeeper.getDelX()) {
            deleteThing(solid, solids, i);
          }
        }
      };

      console.log("✅ Hooked into maintainSolids - platforms protected");
    }
  },

  /**
   * Inject modifications into the current map
   */
  injectModifications() {
    // Only inject if we have a valid map and relationships
    if (!window.map || !window.GameRelationships) return;

    const relationships = GameRelationships.getAllStatuses();
    const levelKey = "current"; // We'll use a generic key

    // Apply modifications for each character
    Object.entries(relationships).forEach(([character, status]) => {
      if (status !== "neutral") {
        this.applyCharacterModifications(levelKey, character, status);
      }
    });
  },

  /**
   * Apply all relationship-based modifications to current level
   * Call this when loading a level or when relationships change
   */
  applyModifications(levelKey) {
    if (!levelKey) {
      console.warn("No level key provided");
      return;
    }

    console.log(`🗺️ Applying modifications to level: ${levelKey}`);

    // Store original state if not already stored
    if (!this.originalMapStates[levelKey]) {
      this.saveOriginalState(levelKey);
    }

    // Get current relationship statuses
    const relationships = GameRelationships.getAllStatuses();

    // CRITICAL: Wait for next game tick to ensure FSM is ready
    setTimeout(() => {
      // Apply modifications for each character
      Object.entries(relationships).forEach(([character, status]) => {
        this.applyCharacterModifications(levelKey, character, status);
      });

      // Save modification state
      this.saveModificationState();
    }, 100); // Small delay to let FSM settle
  },

  /**
   * Save original map state before modifications
   */
  saveOriginalState(levelKey) {
    // This will store the original positions/states of map elements
    // You'll need to adapt this to your game's structure
    this.originalMapStates[levelKey] = {
      platforms: [],
      enemies: [],
      powerups: [],
      coins: [],
      blocks: [],
    };

    console.log(`💾 Saved original state for ${levelKey}`);
  },

  /**
   * Apply modifications based on a character's relationship status
   */
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

    // Track that this modification is active
    this.activeModifications[modKey] = true;
  },

  /**
   * TOAD MODIFICATIONS
   * Toad = mushroom expert, affects platforms and power-ups
   */
  applyToadModifications(levelKey, status) {
    if (status === "allied") {
      console.log("🍄 Toad is allied - mushroom bonuses activated!");

      // 1. Mushrooms drop from sky
      this.addPowerUps(levelKey, "mushroom", 3);

      // 2. Double the number of ? blocks (convert bricks to ? blocks)
      this.doubleQuestionBlocks(levelKey);

      // 3. Hook coin collection for 40% double coin chance
      this.enableDoubleCoinChance();
    } else if (status === "enemy") {
      console.log("🍄 Toad is enemy - making level harder");
      // Add more goombas
      this.addEnemies(levelKey, "goomba", 3);
      // Remove the double coin hook
      this.disableDoubleCoinChance();
    }
    // Neutral = no modifications
  },

  /**
   * LUIGI MODIFICATIONS
   * Luigi = jumper, affects vertical elements
   */
  applyLuigiModifications(levelKey, status) {
    if (status === "allied") {
      console.log("👻 Luigi is allied - adding high platforms");
      // Add high platforms for exploration
      this.addHighPlatforms(levelKey, "luigi");
      // Add springs/trampolines
      this.addSprings(levelKey, 2);
      // Add coins at high positions
      this.addHighCoins(levelKey, 5);
    } else if (status === "enemy") {
      console.log("👻 Luigi is enemy - making jumps harder");
      // Make platforms more spread out
      this.spreadPlatforms(levelKey);
      // Add flying enemies (koopas)
      this.addEnemies(levelKey, "koopa", 2);
      // Remove some springs
      this.removeSprings(levelKey);
    }
  },

  /**
   * PEACH MODIFICATIONS
   * Peach = royalty, affects coins and secrets
   */
  applyPeachModifications(levelKey, status) {
    if (status === "allied") {
      console.log("👑 Peach is allied - revealing secrets");
      // Reveal hidden blocks
      this.revealHiddenBlocks(levelKey, 3);
      // Add bonus coins
      this.addBonusCoins(levelKey, 10);
      // Add star power-up
      this.addPowerUps(levelKey, "star", 1);
    } else if (status === "enemy") {
      console.log("👑 Peach is enemy - hiding rewards");
      // Hide more blocks
      this.hideBlocks(levelKey, 2);
      // Remove some coins
      this.removeCoins(levelKey, 5);
      // Add false blocks (look like ? but are empty)
      this.addFalseBlocks(levelKey, 2);
    }
  },

  // ==================== BLOCK CONVERSION FUNCTIONS ====================

  doubleQuestionBlocks(levelKey) {
    console.log(`❓ Doubling the number of ? blocks`);

    // Find all existing ? blocks (unused blocks)
    const existingBlocks = solids.filter(
      (s) => s.name === "Block" && !s.used && s.left > 100 && s.left < 2000
    );

    console.log(`Found ${existingBlocks.length} existing ? blocks`);

    // Find bricks to convert
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

    // Convert bricks to ? blocks
    for (let i = 0; i < convertCount; i++) {
      const brick = bricksToConvert[i];
      brick.relationshipModified = true;

      // Transform brick into ? block
      brick.name = "Block";
      removeClass(brick, "brick");
      removeClass(brick, "unused");
      addClass(brick, "Block");
      addClass(brick, "unused");

      // Give it coin contents (or random powerup)
      if (Math.random() < 0.3) {
        brick.contents = [Mushroom, false, false];
      } else {
        brick.contents = [Coin, false, false];
      }

      // Add the animated sprite cycle for ? blocks
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

    // Hook into the gainCoin function
    if (!window.gainCoinOriginal) {
      window.gainCoinOriginal = window.gainCoin;

      window.gainCoin = function () {
        // Call original
        gainCoinOriginal();

        // 40% chance to get a bonus coin if Toad is allied
        if (GameRelationships && GameRelationships.isAllied("toad")) {
          if (Math.random() < 0.4) {
            gainCoinOriginal();
            // Visual feedback
            AudioPlayer.play("Coin");
            console.log("🍄 Toad bonus: Double coin!");
          }
        }
      };

      console.log("✅ Double coin chance hooked");
    }
  },

  disableDoubleCoinChance() {
    // Restore original gainCoin function
    if (window.gainCoinOriginal) {
      window.gainCoin = window.gainCoinOriginal;
      window.gainCoinOriginal = null;
      console.log("❌ Double coin chance disabled");
    }
  },

  addHighPlatforms(levelKey, character) {
    // Add platforms for vertical exploration
    const positions = this.getHighPlatformPositions(levelKey);
    positions.forEach((pos) => {
      this.createPlatform(pos.x, pos.y, pos.width, `${character}_high`);
    });
  },

  spreadPlatforms(levelKey) {
    // Make existing platforms more spread out (harder jumps)
    console.log("⚠️ Spreading platforms - jumps will be harder");
    // Implementation depends on your platform system
  },

  createGaps(levelKey, count) {
    // Remove platforms to create challenging gaps
    console.log(`⚠️ Creating ${count} challenging gaps`);
    // Implementation depends on your platform system
  },

  // ==================== ENEMY MODIFICATIONS ====================

  addEnemies(levelKey, enemyType, count) {
    console.log(`👾 Adding ${count} ${enemyType}s`);
    const positions = this.getEnemySpawnPositions(levelKey, count);
    positions.forEach((pos) => {
      this.spawnEnemy(enemyType, pos.x, pos.y, `relationship_spawn`);
    });
  },

  weakenEnemies(levelKey, multiplier) {
    console.log(`💪 Weakening enemies (${multiplier}x health)`);
    // Reduce enemy health/speed
    // Implementation depends on your enemy system
  },

  // ==================== POWER-UP MODIFICATIONS ====================

  addPowerUps(levelKey, type, count) {
    console.log(`⭐ Adding ${count} ${type} power-ups`);
    const positions = this.getPowerUpPositions(levelKey, count);
    positions.forEach((pos) => {
      this.spawnPowerUp(type, pos.x, pos.y, `relationship_powerup`);
    });
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

  // ==================== COIN MODIFICATIONS ====================

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

  // ==================== BLOCK MODIFICATIONS ====================

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

  // ==================== HELPER FUNCTIONS ====================
  // These need to be adapted to your game engine

  getHelpfulPlatformPositions(levelKey) {
    // Place platforms at known good positions in World 1-1
    // These are absolute positions that work well
    return [
      { x: 200, y: 64, width: 64 }, // First platform - mid air
      { x: 350, y: 64, width: 64 }, // Second platform
      { x: 500, y: 56, width: 64 }, // Third platform - higher
    ];
  },

  getHighPlatformPositions(levelKey) {
    return [
      { x: 250, y: 40, width: 64 }, // Very high
      { x: 450, y: 32, width: 64 }, // Even higher
    ];
  },

  getEnemySpawnPositions(levelKey, count) {
    const floorY = 88; // Floor level

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

    // Search through solids array for hidden blocks
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

    // Search through solids array for visible blocks
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

    // Search through solids array
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

    // Search through all game object arrays
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

  // ==================== CREATION FUNCTIONS ====================
  // These interface with Full Screen Mario's addThing() system

  createPlatform(x, y, width, tag) {
    console.log(`🏗️ Creating platform at (${x}, ${y}) width:${width} [${tag}]`);

    try {
      // Create Stone platform
      const platform = new Thing(Stone, width / 8, 1);
      addThing(platform, x, y);

      // Mark for protection in maintainSolids
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

    // Create a block with no contents
    const block = new Thing(Block, false); // false = no contents
    addThing(block, x, y);
    block.relationshipTag = tag;
    // Make it look like it has something
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

  // ==================== STATE MANAGEMENT ====================

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

  /**
   * Reset all modifications for a level
   */
  resetLevel(levelKey) {
    console.log(`🔄 Resetting all modifications for ${levelKey}`);

    // Allow deletion temporarily
    this.allowDeletion = true;

    // Remove all relationship-spawned objects
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

    // Reset deletion flag
    this.allowDeletion = false;

    // Clear active modifications for this level
    Object.keys(this.activeModifications).forEach((key) => {
      if (key.startsWith(levelKey)) {
        delete this.activeModifications[key];
      }
    });

    this.saveModificationState();
  },

  /**
   * Get summary of active modifications
   */
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

// Initialize when file loads
if (typeof window !== "undefined") {
  window.MapModifier = MapModifier;
  console.log("✅ MapModifier available globally");
}

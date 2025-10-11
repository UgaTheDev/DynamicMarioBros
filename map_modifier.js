const MapModifier = {
  originalMapStates: {},
  activeModifications: {},
  // Tracks if the global Block prototype has been modified
  isBlockHitOverridden: false,
  // Tracks if the global addThing function has been modified
  isAddThingOverridden: false,

  clearCurrentModifications() {
    console.log("🧹 Clearing modifications for level transition");
    // --- CRITICAL RESTORATION LOGIC ---
    this.disableDoubleCoinChance();
    this.restoreBlockHitBehavior();
    this.restoreGoombaSuppression(); // <-- Ensures Goombas can spawn again in the next level
    // -----------------------------------

    // --- LOGIC: Ensure relationship status does not carry over to the next level ---
    if (window.GameRelationships && GameRelationships.setStatus) {
      // Forcefully reset character statuses to 'neutral' for the next level.
      GameRelationships.setStatus("toad", "neutral");
      GameRelationships.setStatus("goomba", "neutral");
      GameRelationships.setStatus("koopa", "neutral");
      console.log("🔄 Relationship statuses reset to neutral for next level.");
    } else {
      console.warn(
        "⚠️ Cannot reset GameRelationships status externally. Next level might inherit previous modifications."
      );
    }

    // Clear internal modification state to prevent accidental persistence of flags
    this.activeModifications = {};
    // ------------------------------------------------------------------------------------
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
        // This runs the cleanup before the new level finishes loading
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
      console.log(msg);
    }
  },
  // --- CONSOLIDATED DIALOGUES ---
  showToadHelpMessage() {
    this._showRelationshipMessage(
      "🍄 Allied Toad: Mushrooms incoming! You now have a chance for coins to double drop!"
    );
  },
  showToadEnemyMessage() {
    this._showRelationshipMessage(
      "😈 Enemy Toad: Treasures are mine! Expect traps and suppressed rewards!"
    );
  },
  // NEW GOOMBA DIALOGUES
  showGoombaHelpMessage() {
    this._showRelationshipMessage(
      "🟢 Allied Goomba: Your enemy is my enemy! Goombas cleared!"
    );
  },
  showGoombaEnemyMessage() {
    this._showRelationshipMessage(
      "🔴 Enemy Goomba: We're multiplying! Face our sheer numbers!"
    );
  },
  // NEW KOOPA DIALOGUES
  showKoopaHelpMessage() {
    this._showRelationshipMessage(
      "🐢 Allied Koopa: Secrets revealed and extra boost power!"
    );
  },
  showKoopaEnemyMessage() {
    this._showRelationshipMessage(
      "⚫ Enemy Koopa: Reinforcements and hidden obstacles deployed!"
    );
  },
  // --- END DIALOGUES ---

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
      case "goomba":
        this.applyGoombaModifications(levelKey, status);
        break;
      case "koopa":
        this.applyKoopaModifications(levelKey, status);
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
      this.convertBricksToQuestionBlocks(levelKey, 5);
      this.enableDoubleCoinChance();
    } else if (status === "enemy") {
      console.log("😈 Enemy Toad activated: Applying traps and removals.");
      this.showToadEnemyMessage();

      this.setupDeadlyBlockSuppression();

      // Difficulty increases
      this.addEnemies(levelKey, "goomba", 8);
      this.spawnFastEnemies(levelKey, "koopa", 2);

      // Reward removals (Power-up suppression)
      this.removeExistingPowerUps(levelKey, Infinity);
      this.disableDoubleCoinChance();
    }
  },

  // GOOMBA MODIFICATIONS
  applyGoombaModifications(levelKey, status) {
    if (status === "allied") {
      console.log(
        "🟢 Allied Goomba: Removing local threats and adding rewards."
      );
      this.showGoombaHelpMessage();
      this.removeEnemies(levelKey, "goomba", Infinity); // Remove all existing goombas
      this.setupGoombaSuppression(); // <-- Block future goombas from spawning in THIS level
      this.addPowerUps(levelKey, "fireflower", 2);
    } else if (status === "enemy") {
      console.log("🔴 Enemy Goomba: Massing forces!");
      this.showGoombaEnemyMessage();
      this.addEnemies(levelKey, "goomba", 10);
      this.spreadPlatforms(levelKey); // Make jumps harder
    }
  },

  // KOOPA MODIFICATIONS
  applyKoopaModifications(levelKey, status) {
    if (status === "allied") {
      console.log("🐢 Allied Koopa: Revealing secrets and providing bounce!");
      this.showKoopaHelpMessage();
      this.revealHiddenBlocks(levelKey, 3);
      this.addSprings(levelKey, 2);
      this.addHighCoins(levelKey, 5);
    } else if (status === "enemy") {
      console.log("⚫ Enemy Koopa: Traps and reinforcements active.");
      this.showKoopaEnemyMessage();
      this.addEnemies(levelKey, "koopa", 5);
      this.hideBlocks(levelKey, 3);
      this.addFalseBlocks(levelKey, 2);
    }
  },

  // *** Global AddThing Behavior Override for Goomba Suppression ***
  setupGoombaSuppression() {
    if (typeof window.addThing !== "function" || this.isAddThingOverridden) {
      return;
    }

    window.addThingOriginal = window.addThing;

    window.addThing = function (thing, x, y) {
      // Check if Goomba is allied and the thing being added is a Goomba
      if (
        window.GameRelationships &&
        window.GameRelationships.isAllied &&
        window.GameRelationships.isAllied("goomba") &&
        window.Goomba &&
        thing instanceof window.Goomba
      ) {
        console.log(
          "🟢 Allied Goomba: Suppression engaged. Blocking Goomba spawn."
        );
        // Do NOT call addThingOriginal, effectively preventing the object from being added to the game arrays.
        return;
      }

      // Otherwise, run the original function
      window.addThingOriginal.call(this, thing, x, y);
    };

    this.isAddThingOverridden = true;
    console.log("✅ Global addThing behavior overridden for Allied Goomba.");
  },

  // *** Restore AddThing Behavior ***
  restoreGoombaSuppression() {
    if (window.addThingOriginal && this.isAddThingOverridden) {
      window.addThing = window.addThingOriginal;
      delete window.addThingOriginal;
      this.isAddThingOverridden = false;
      console.log(
        "✅ addThing behavior restored. Goombas can spawn in the next level."
      );
    }
  },

  // *** Global Block Hit Behavior Override for Mushroom Suppression ***
  setupDeadlyBlockSuppression() {
    if (!window.Block || this.isBlockHitOverridden) {
      return;
    }

    // Backup the original hit function
    window.Block.prototype.hitOriginal = window.Block.prototype.hit;

    // Define the new overridden hit function
    window.Block.prototype.hit = function (thing) {
      // Check if Toad is currently an enemy AND the block has contents (i.e., a ? block)
      if (
        window.GameRelationships &&
        window.GameRelationships.isEnemy &&
        window.GameRelationships.isEnemy("toad") &&
        this.contents &&
        this.contents.length > 0
      ) {
        // Check if the contents includes a non-coin power-up (Mushroom, FireFlower, or Star)
        const isPowerUpBlock = this.contents.some((content) => {
          return (
            content === window.Mushroom ||
            content === window.FireFlower ||
            content === window.Star
          );
        });

        if (isPowerUpBlock && typeof window.Coin !== "undefined") {
          console.log(
            "😈 Enemy Toad: Power-up suppression engaged. Dropping only a coin."
          );
          // Temporarily force contents to be Coin before calling the original hit logic
          const originalContents = this.contents;
          this.contents = [window.Coin, false, false];

          // Call the original hit logic
          window.Block.prototype.hitOriginal.call(this, thing);

          // Restore original contents after hit is complete
          this.contents = originalContents;
          return;
        }
      }

      // If not an enemy or not a power-up block, call the original hit logic
      window.Block.prototype.hitOriginal.call(this, thing);
    };

    this.isBlockHitOverridden = true;
    console.log("✅ Global Block.hit behavior overridden for Enemy Toad.");
  },

  // *** Restore Block Hit Behavior ***
  restoreBlockHitBehavior() {
    if (
      window.Block &&
      window.Block.prototype.hitOriginal &&
      this.isBlockHitOverridden
    ) {
      window.Block.prototype.hit = window.Block.prototype.hitOriginal;
      delete window.Block.prototype.hitOriginal;
      this.isBlockHitOverridden = false;
      console.log("✅ Block.hit behavior restored.");
    }
  },

  removeExistingPowerUps(levelKey, count) {
    // Note: count is now Infinity when Toad is an enemy
    console.log(
      `🍄 Removing up to ${count} existing power-ups from the level.`
    );
    const powerUps = characters.filter(
      (c) =>
        c.alive &&
        !c.relationshipTag &&
        (c.name === "Mushroom" || c.name === "FireFlower" || c.name === "Star")
    );

    const removeCount = Math.min(count, powerUps.length);
    if (removeCount > 0) {
      console.log(
        `Found ${powerUps.length} power-ups. Removing ${removeCount}.`
      );
      for (let i = 0; i < removeCount; i++) {
        this.removeObject(powerUps[i]);
      }
    } else {
      console.log("No visible power-ups found to remove.");
    }
  },

  // HELPER: Remove enemies from the current map
  removeEnemies(levelKey, enemyType, count) {
    console.log(`🗑️ Removing up to ${count} ${enemyType} enemies.`);
    const enemiesToRemove = window.characters
      .filter(
        (c) =>
          c.alive &&
          !c.relationshipTag &&
          c.name && // <-- Safely check for name property
          c.name.toLowerCase() === enemyType.toLowerCase()
      )
      .slice(0, count);

    if (enemiesToRemove.length > 0) {
      console.log(`Found ${enemiesToRemove.length} ${enemyType}s to remove.`);
      enemiesToRemove.forEach((enemy) => this.removeObject(enemy));
    } else {
      console.log(`No existing ${enemyType}s found to remove.`);
    }
  },

  // Spawning faster enemies
  spawnFastEnemies(levelKey, enemyType, count) {
    console.log(`🚀 Enemy Toad: Spawning ${count} fast ${enemyType}s!`);
    const positions = this.getEnemySpawnPositions(levelKey, count);
    positions.forEach((pos) => {
      const enemy = this.spawnEnemy(enemyType, pos.x, pos.y, `toad_fast_enemy`);
      if (enemy) {
        if (enemy.walking && enemy.walking.speed) {
          enemy.walking.speed *= 1.5; // Make them 50% faster
          console.log(`⚡ ${enemyType} at x=${enemy.left} now faster!`);
        }
      }
    });
  },
  // Renamed function to clarify it modifies existing Bricks
  convertBricksToQuestionBlocks(levelKey, count) {
    console.log(`❓ Converting existing bricks to ? blocks for bonus rewards.`);

    // Find all eligible Brick solids to modify
    const bricksToConvert = solids.filter(
      (s) =>
        s.name === "Brick" &&
        !s.used &&
        !s.relationshipModified &&
        s.left > 100 &&
        s.left < 2000
    );

    // Convert all eligible bricks (removing the confusing Math.min logic)
    const convertCount = bricksToConvert.length;
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
    console.log(`🫥 Hiding ${count} blocks`);
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
      case "pidget":
        enemy = new Thing(Pidget);
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
      "toad_fast_enemy",
    ].forEach((tag) => {
      const objects = this.findObjectsByTag(tag);
      objects.forEach((obj) => this.removeObject(obj));
    });
    // Reset any blocks that were modified by Goomba/Koopa relationship logic
    // We don't track modified blocks specifically, so general tag removal is key.

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
  // --- Position Helpers (Kept generic, no changes needed) ---
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
  // --- End Position Helpers ---

  // --- Utility for testing/debugging (Bypassing direct GameRelationships calls) ---
  testSetStatus(character, status) {
    if (window.GameRelationships && GameRelationships.setStatus) {
      GameRelationships.setStatus(character, status);
      console.log(
        `🕹️ TEST: Set ${character} status to ${status}. Modifications will now apply.`
      );
    } else {
      console.error(
        "GameRelationships object not available for testing status."
      );
    }
  },

  // ALLY COMMANDS
  allyGoomba() {
    this.testSetStatus("goomba", "allied");
    this.applyModifications("current");
  },

  allyKoopa() {
    this.testSetStatus("koopa", "allied");
    this.applyModifications("current");
  },

  allyToad() {
    this.testSetStatus("toad", "allied");
    this.applyModifications("current");
  },

  // ENEMY COMMANDS
  enemyToad() {
    this.testSetStatus("toad", "enemy");
    this.applyModifications("current");
  },

  enemyGoomba() {
    this.testSetStatus("goomba", "enemy");
    this.applyModifications("current");
  },

  enemyKoopa() {
    this.testSetStatus("koopa", "enemy");
    this.applyModifications("current");
  },

  resetAllTestStatuses() {
    this.testSetStatus("goomba", "neutral");
    this.testSetStatus("koopa", "neutral");
    this.testSetStatus("toad", "neutral");
    this.clearCurrentModifications();
  },
  // --- End Utility ---
};
if (typeof window !== "undefined") {
  window.MapModifier = MapModifier;
  console.log("✅ MapModifier available globally");
}

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
      "⚫ Enemy Koopa: Homing shells deployed! Dodge or perish!"
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

      // Remove existing goombas - run multiple times to catch all of them
      this.removeEnemies(levelKey, "goomba", Infinity);

      // Run removal again after a short delay to catch any that were just spawning
      setTimeout(() => {
        this.removeEnemies(levelKey, "goomba", Infinity);
      }, 100);

      // And one more time for good measure
      setTimeout(() => {
        this.removeEnemies(levelKey, "goomba", Infinity);
      }, 300);

      this.setupGoombaSuppression(); // <-- Block future goombas from spawning in THIS level
      this.addPowerUps(levelKey, "fireflower", 2);
    } else if (status === "enemy") {
      console.log("🔴 Enemy Goomba: Massing forces!");
      this.showGoombaEnemyMessage();
      this.addEnemies(levelKey, "goomba", 10); // Back to normal size
    }
  },

  // KOOPA MODIFICATIONS  // KOOPA MODIFICATIONS
  applyKoopaModifications(levelKey, status) {
    if (status === "allied") {
      console.log(
        "🐢 Allied Koopa: Revealing secrets and providing boost rings!"
      );
      this.showKoopaHelpMessage();
      this.revealHiddenBlocks(levelKey, 3);
      this.addBoostRings(levelKey, 8);
      this.addHighCoins(levelKey, 15);
    } else if (status === "enemy") {
      console.log("⚫ Enemy Koopa: Homing shells incoming in 3 seconds!");
      this.showKoopaEnemyMessage();
      this.addEnemies(levelKey, "koopa", 3);

      // Spawn homing shells after 3-second delay
      setTimeout(() => {
        console.log("⚫ Enemy Koopa: Deploying homing shells now!");
        this.spawnHomingShells(levelKey, 8);
      }, 3000); // 3-second delay
    }
  },
  // SPAWN HOMING SHELLS METHODS
  spawnHomingShells(levelKey, count) {
    console.log(`🎯 Spawning ${count} homing shells`);

    const positions = this.getHomingShellPositions(levelKey, count);

    positions.forEach((pos, index) => {
      // Stagger the spawns with additional delay between each shell
      setTimeout(() => {
        this.createHomingShell(pos.x, pos.y, `koopa_homing_shell`);
      }, index * 500); // 500ms between each shell spawn
    });
  },

  createHomingShell(x, y, tag) {
    console.log(`🎯 Creating homing shell at (${x}, ${y})`);

    try {
      // Create a shell based on Koopa shell
      const shell = new Thing(Koopa, true); // true for shell mode
      addThing(shell, x, y);
      shell.relationshipTag = tag;
      shell.nokillend = true;
      shell.outerok = Infinity;

      // Make it spin and home in on player
      shell.movement = this.createHomingMovement();

      // Visual customization - alternating green/red
      const isGreen = Math.random() > 0.5;
      shell.shellColor = isGreen ? "green" : "red";

      if (isGreen) {
        removeClass(shell, "koopa");
        addClass(shell, "green-shell");
      } else {
        removeClass(shell, "koopa");
        addClass(shell, "red-shell");
      }

      // Reduced speed boost - only 1.25x instead of 2.5x
      if (shell.walking) {
        shell.walking.speed *= 1.25; // Was 2.5x, now 1.25x
      }

      shell.homingActive = true;
      shell.lastDirectionChange = 0;

      console.log(
        `🎯 ${shell.shellColor} homing shell deployed at (${x}, ${y}) - HALF SPEED`
      );
      return shell;
    } catch (e) {
      console.error("Failed to create homing shell:", e);
      return null;
    }
  },
  createHomingMovement() {
    return function (shell) {
      if (!shell.alive || !shell.homingActive) return;

      const now = Date.now();

      // Only adjust direction every 500ms to prevent jittery movement
      if (now - shell.lastDirectionChange > 500) {
        if (window.player && player.alive) {
          // Calculate direction to player
          const dx = player.left - shell.left;
          const dy = player.top - shell.top;

          // Prioritize horizontal movement, with slight vertical adjustment
          if (Math.abs(dx) > 20) {
            if (dx > 0) {
              shell.direction = 1; // Move right
            } else {
              shell.direction = -1; // Move left
            }
          }

          // Occasionally jump toward player if they're above
          if (dy < -30 && Math.random() < 0.3) {
            shell.yvel = -unitsize * 1; // Reduced jump power
          }

          shell.lastDirectionChange = now;
        }
      }

      // Apply movement based on direction - HALF SPEED
      if (shell.direction > 0) {
        shell.xvel = unitsize * 0.9; // Was 1.8, now 0.9 (half speed)
      } else if (shell.direction < 0) {
        shell.xvel = -unitsize * 0.9; // Was -1.8, now -0.9 (half speed)
      }

      // Visual spinning effect
      if (now % 200 < 100) {
        addClass(shell, "spinning");
      } else {
        removeClass(shell, "spinning");
      }
    };
  },

  getHomingShellPositions(levelKey, count) {
    const positions = [];
    const startX = 400;
    const endX = 2200;

    for (let i = 0; i < count; i++) {
      // Distribute shells throughout the level
      const x = startX + (endX - startX) * (i / count);

      // Vary heights - some on ground, some on platforms
      const heights = [88, 72, 64, 56];
      const y = heights[Math.floor(Math.random() * heights.length)];

      positions.push({
        x: x,
        y: y,
      });
    }

    console.log(`📍 Homing shell positions: ${positions.length} shells`);
    return positions;
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

    if (!window.characters || window.characters.length === 0) {
      console.log(
        "No characters array or empty - enemies may not be spawned yet."
      );
      return;
    }

    const enemyTypeLower = enemyType.toLowerCase();

    // Filter enemies - check type, name, constructor.name, and title
    const enemiesToRemove = window.characters
      .filter((c) => {
        if (!c) return false;

        // Don't skip things that might not be fully "alive" yet
        // Only skip if explicitly dead
        if (c.dead) return false;

        // Skip things we've already tagged
        if (c.relationshipTag) return false;

        // Check by type property (PRIMARY - used by Goomba, Koopa, etc.)
        if (c.type && c.type.toLowerCase() === enemyTypeLower) {
          return true;
        }

        // Check by name property
        if (c.name && c.name.toLowerCase() === enemyTypeLower) {
          return true;
        }

        // Check by constructor name
        if (
          c.constructor &&
          c.constructor.name &&
          c.constructor.name.toLowerCase() === enemyTypeLower
        ) {
          return true;
        }

        // Check by title property
        if (
          c.title &&
          typeof c.title === "string" &&
          c.title.toLowerCase().includes(enemyTypeLower)
        ) {
          return true;
        }

        return false;
      })
      .slice(0, count === Infinity ? undefined : count);

    if (enemiesToRemove.length > 0) {
      console.log(`Found ${enemiesToRemove.length} ${enemyType}(s) to remove.`);
      enemiesToRemove.forEach((enemy) => {
        console.log(
          `  Removing ${
            enemy.type || enemy.name || enemy.constructor.name
          } at x=${enemy.left || "unknown"}`
        );
        this.removeObject(enemy);
      });
    } else {
      console.log(`No ${enemyType}s found to remove in this pass.`);
    }

    return enemiesToRemove.length;
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

  addEnemies(levelKey, enemyType, count) {
    console.log(`👾 Adding ${count} ${enemyType}s`);
    const positions = this.getEnemySpawnPositions(levelKey, count);
    positions.forEach((pos) => {
      this.spawnEnemy(enemyType, pos.x, pos.y, `relationship_spawn`);
    });
  },

  addPowerUps(levelKey, type, count) {
    console.log(`⭐ Adding ${count} ${type} power-ups`);
    const positions = this.getPowerUpPositions(levelKey, count);
    positions.forEach((pos) => {
      this.spawnPowerUp(type, pos.x, pos.y, `relationship_powerup`);
    });
  },

  addBoostRings(levelKey, count) {
    console.log(`💨 Adding ${count} horizontal boost rings`);
    const positions = this.getBoostRingPositions(levelKey, count);
    positions.forEach((pos) => {
      this.createBoostRing(pos.x, pos.y, `relationship_boost_ring`);
    });
  },

  removeBoostRings(levelKey) {
    console.log("💨 Removing boost rings");
    const rings = this.findObjectsByTag("relationship_boost_ring");
    rings.forEach((ring) => this.removeObject(ring));
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

  revealHiddenBlocks(levelKey, count) {
    console.log(`📦 Revealing ${count} hidden blocks`);
    const blocks = this.findHiddenBlocks(levelKey).slice(0, count);
    blocks.forEach((block) => this.makeBlockVisible(block));
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

  createBoostRing(x, y, tag) {
    console.log(`💨 Creating boost ring at (${x}, ${y}) [${tag}]`);

    // Use a Star item as the visual base, but we'll modify it
    const ring = new Thing(Star);
    addThing(ring, x, y);
    ring.relationshipTag = tag;
    ring.nokillend = true;
    ring.outerok = Infinity;
    ring.nofall = true; // Keep it floating in place
    ring.nocollidesolid = true;
    ring.movement = false; // Don't let it move

    // Try to change the visual to look like a green arrow
    // Remove star classes and add custom styling
    if (typeof removeClass === "function") {
      removeClass(ring, "star");
      removeClass(ring, "item");
    }
    if (typeof addClass === "function") {
      addClass(ring, "boost-arrow");
    }

    // Try to set a green color filter if possible
    if (ring.canvas && ring.context) {
      ring.context.fillStyle = "#00FF00"; // Green
    }

    // Override the collision to give horizontal boost instead of star power
    ring.collide = function (player, ring) {
      if (!player.player || !ring.alive) return;

      // Give horizontal speed boost (back to 3.5x)
      player.xvel = unitsize * 3.5; // Fast horizontal movement
      player.yvel = Math.min(player.yvel, unitsize * -0.5); // Slight upward boost too

      // Visual/audio feedback
      if (typeof AudioPlayer !== "undefined" && AudioPlayer.play) {
        AudioPlayer.play("Powerup");
      }

      // Make the ring flash and respawn quickly
      ring.hidden = true;
      setTimeout(() => {
        if (ring.alive) {
          ring.hidden = false;
          if (typeof setThingSprite === "function") {
            setThingSprite(ring);
          }
        }
      }, 150);

      console.log("💨 Boost activated! Speed: " + player.xvel);
    };

    return ring;
  },

  createCoin(x, y, tag) {
    console.log(`🪙 Creating coin at (${x}, ${y}) [${tag}]`);
    const coin = new Thing(Coin);
    addThing(coin, x, y);
    coin.relationshipTag = tag;
    return coin;
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
      "relationship_coin",
      "relationship_high_coin",
      "toad_fast_enemy",
      "koopa_homing_shell", // For our new shells
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

  getBoostRingPositions(levelKey, count) {
    // Spread boost rings throughout the stage at random heights
    const positions = [];
    const startX = 300;
    const spacing = 225; // Every 450 units horizontally

    for (let i = 0; i < count; i++) {
      // Random height between ground (88) and sky (24)
      // Ground level is around 88, sky is around 24
      const minY = 24; // Highest point (sky)
      const maxY = 80; // Just above ground level
      const randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

      positions.push({
        x: startX + i * spacing,
        y: randomY,
      });
    }

    return positions;
  },

  getCoinPositions(levelKey, count) {
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        x: 300 + i * 50,
        y: 60, // Medium height
      }));
  },

  getHighCoinPositions(levelKey, count) {
    // Spread coins throughout the stage at varying positions
    const positions = [];
    const startX = 400; // Start after first ring
    const spacing = 150; // Space out coins evenly

    for (let i = 0; i < count; i++) {
      // Random height for each coin between sky and above ground
      const minY = 24;
      const maxY = 80;
      const randomY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;

      positions.push({
        x: startX + i * spacing,
        y: randomY,
      });
    }

    return positions;
  },

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

const MapModifier = {
  originalMapStates: {},
  activeModifications: {},
  isBlockHitOverridden: false,
  isAddThingOverridden: false,
  isLevelActive: false,
  persistentRelationships: {},
  isDeathHooked: false,

  // INITIALIZATION METHODS
  init() {
    console.log("🗺️ Map Modifier initialized");
    this.loadModificationState();
    this.hookIntoSpawnMap();
    this.hookIntoSetMap();
    this.hookIntoPlayerDeath();
    this.hookIntoPlayerRespawn();
    this.startPlayerStateMonitor();
    this.addGlobalDeathListener();
    this.setupDeathDetection();
    console.log("🗺️ All hooks installed");
  },

  manualInit() {
    console.log("🛠️ MANUAL INITIALIZATION CALLED");
    if (typeof window !== "undefined") {
      window.MapModifier = this;
      console.log("✅ MapModifier manually assigned to window");

      // Call the regular init
      this.init();

      // Add test commands
      window.allyToad = () => this.allyToad();
      window.enemyToad = () => this.enemyToad();
      window.allyGoomba = () => this.allyGoomba();
      window.enemyGoomba = () => this.enemyGoomba();
      window.allyKoopa = () => this.allyKoopa();
      window.enemyKoopa = () => this.enemyKoopa();
      window.resetAll = () => this.resetAllTestStatuses();
      window.testDeath = () => this.testDeathAndRespawn();
      window.forceReapply = () => this.reapplyPersistentModifications();
      window.testDeathAndRespawn = () => this.testDeathAndRespawn();

      console.log("✅ Manual initialization complete");
      console.log(
        "🎮 Test commands available: allyToad(), enemyToad(), allyGoomba(), enemyGoomba(), allyKoopa(), enemyKoopa(), resetAll(), testDeath(), forceReapply(), testDeathAndRespawn()"
      );
    }
  },

  // DEATH DETECTION METHODS
  setupDeathDetection() {
    console.log("🔍 Setting up enhanced death detection");

    // Method 1: Override the player's kill method
    if (window.player && window.player.kill && !this.originalPlayerKill) {
      this.originalPlayerKill = window.player.kill;
      window.player.kill = function () {
        console.log("💀 PLAYER KILL METHOD CALLED - DEATH DETECTED!");
        MapModifier.isLevelActive = true;
        console.log("💀 isLevelActive set to:", MapModifier.isLevelActive);
        return MapModifier.originalPlayerKill.call(this);
      };
      console.log("✅ Hooked player.kill method");
    }

    // Method 2: Monitor player health/lives
    this.startDeathMonitoring();
  },

  startDeathMonitoring() {
    console.log("🔍 Starting death monitoring");
    let lastLives = window.player?.lives;
    let lastHealth = window.player?.health;

    const monitorDeath = () => {
      if (window.player) {
        const currentLives = window.player.lives;
        const currentHealth = window.player.health;

        // Check for life loss
        if (lastLives !== undefined && currentLives < lastLives) {
          console.log(
            "💀 LIFE LOST DETECTED! Lives:",
            lastLives,
            "->",
            currentLives
          );
          this.isLevelActive = true;
          console.log("💀 isLevelActive set to:", this.isLevelActive);

          // Schedule reapplication after respawn
          setTimeout(() => {
            console.log("💀 Scheduling reapplication after life loss");
            this.reapplyPersistentModifications();
          }, 1000);
        }

        // Check for health reaching 0
        if (lastHealth !== undefined && currentHealth <= 0 && lastHealth > 0) {
          console.log("💀 HEALTH ZERO DETECTED! Player died");
          this.isLevelActive = true;
          console.log("💀 isLevelActive set to:", this.isLevelActive);
        }

        lastLives = currentLives;
        lastHealth = currentHealth;
      }

      setTimeout(monitorDeath, 100);
    };

    setTimeout(monitorDeath, 1000);
  },

  // TEST METHODS
  testDeathAndRespawn() {
    console.log("🧪 TEST: Simulating death and respawn cycle");

    // Simulate death
    this.isLevelActive = true;
    console.log("💀 Simulated death - isLevelActive:", this.isLevelActive);

    // Clear modifications (like death would)
    this.resetLevel("current");
    console.log("💀 Cleared level objects");

    // Wait a bit then reapply (like respawn would)
    setTimeout(() => {
      console.log("🔁 Simulating respawn - reapplying modifications");
      this.reapplyPersistentModifications();
    }, 1000);
  },

  clearCurrentModifications() {
    console.log("🧹 clearCurrentModifications called");
    console.log("🧹 isLevelActive:", this.isLevelActive);

    // Only clear if we're actually completing the level (not dying)
    if (!this.isLevelActive) {
      console.log("🧹 Clearing modifications for level completion");

      // Clear persistent state
      this.persistentRelationships = {};
      console.log("🧹 Cleared persistentRelationships");

      // Restore original behaviors
      this.disableDoubleCoinChance();
      this.restoreBlockHitBehavior();
      this.restoreGoombaSuppression();

      // Clear active modifications
      this.activeModifications = {};
      console.log("🧹 Cleared activeModifications");
    } else {
      console.log("💀 Player died - modifications will persist and reapply");
      console.log(
        "💀 persistentRelationships preserved:",
        this.persistentRelationships
      );
      // Don't clear persistentRelationships on death!
    }
  },

  // More reliable death detection
  hookIntoPlayerRespawn() {
    console.log("🔍 DEBUG: Attempting to hook into player respawn...");

    const waitForRespawnSystem = setInterval(() => {
      if (window.player && window.respawnPlayer) {
        clearInterval(waitForRespawnSystem);
        console.log("✅ Found respawnPlayer function");

        // Hook into the respawn system
        window.respawnPlayerOriginal = window.respawnPlayer;
        window.respawnPlayer = function () {
          console.log("🔁 DEBUG: respawnPlayer called - player is respawning");
          MapModifier.isLevelActive = true; // Keep modifications
          console.log(
            "🔁 DEBUG: isLevelActive set to:",
            MapModifier.isLevelActive
          );

          const result = window.respawnPlayerOriginal.apply(this, arguments);
          console.log("🔁 DEBUG: Original respawnPlayer completed");

          // Schedule reapplication after respawn completes
          setTimeout(() => {
            console.log(
              "🔁 DEBUG: Timeout callback - calling reapplyPersistentModifications"
            );
            MapModifier.reapplyPersistentModifications();
          }, 500);

          return result;
        };
        console.log("✅ Hooked into respawnPlayer");
      } else {
        console.log(
          "❌ respawnPlayer not found yet, player exists:",
          !!window.player
        );
      }
    }, 100);

    // Safety timeout
    setTimeout(() => {
      clearInterval(waitForRespawnSystem);
      console.log("⏰ Respawn hook timeout - respawnPlayer might not exist");
    }, 5000);
  },

  // DEBUG: Add a global listener to catch ANY death-related calls
  addGlobalDeathListener() {
    console.log("🔍 DEBUG: Adding global death listener");

    // Override killNormal to catch when player dies
    if (window.killNormal && !window.killNormalOriginal) {
      window.killNormalOriginal = window.killNormal;
      window.killNormal = function (obj) {
        console.log("💀 killNormal called with:", obj);
        if (obj && obj.player) {
          console.log("💀 DEBUG: killNormal called on player!");
          MapModifier.isLevelActive = true;
          console.log(
            "💀 DEBUG: isLevelActive set to:",
            MapModifier.isLevelActive
          );
        }
        return window.killNormalOriginal.call(this, obj);
      };
      console.log("✅ Hooked killNormal");
    } else {
      console.log("❌ killNormal not available or already hooked");
    }

    // Also hook into any function that might kill the player
    if (window.killPlayer && !window.killPlayerOriginal) {
      window.killPlayerOriginal = window.killPlayer;
      window.killPlayer = function (playerObj) {
        console.log("💀 DEBUG: killPlayer called!");
        MapModifier.isLevelActive = true;
        console.log(
          "💀 DEBUG: isLevelActive set to:",
          MapModifier.isLevelActive
        );
        return window.killPlayerOriginal.call(this, playerObj);
      };
      console.log("✅ Hooked killPlayer");
    } else {
      console.log("❌ killPlayer not available or already hooked");
    }
  },

  // Enhanced death hook with more debugging
  hookIntoPlayerDeath() {
    console.log("🔍 DEBUG: Attempting to hook into player death...");

    // Wait for player to be available
    const waitForPlayer = setInterval(() => {
      if (window.player) {
        clearInterval(waitForPlayer);
        console.log("🔍 DEBUG: Player found, checking death method...");
        console.log("🔍 DEBUG: player.death type:", typeof player.death);
        console.log("🔍 DEBUG: player object:", player);

        if (window.player.death && !this.isDeathHooked) {
          this.originalPlayerDeath = window.player.death;
          console.log(
            "✅ Found player.death method:",
            this.originalPlayerDeath
          );

          window.player.death = function (playerObj) {
            console.log("💀 DEBUG: player.death() called directly!");
            console.log("💀 DEBUG: playerObj:", playerObj);
            MapModifier.isLevelActive = true;
            console.log(
              "💀 DEBUG: isLevelActive set to:",
              MapModifier.isLevelActive
            );

            // Call the original death function
            const result = MapModifier.originalPlayerDeath.call(
              this,
              playerObj
            );
            console.log("💀 DEBUG: Original death function completed");
            return result;
          };

          this.isDeathHooked = true;
          console.log(
            "✅ Hooked into player.death - modifications persist on death"
          );
        } else {
          console.log(
            "❌ Could not hook into player.death - function not found or already hooked"
          );
          console.log("❌ player.death exists:", !!window.player.death);
          console.log("❌ isDeathHooked:", this.isDeathHooked);
        }
      } else {
        console.log("⏳ Waiting for player object...");
      }
    }, 100);

    // Safety timeout
    setTimeout(() => {
      clearInterval(waitForPlayer);
      console.log("⏰ Player death hook timeout");
    }, 5000);
  },

  // Enhanced state monitor with more logging
  startPlayerStateMonitor() {
    console.log("🔍 DEBUG: Starting enhanced player state monitor");
    let lastAliveState = true;
    let lastDeadState = false;
    let lastDyingState = false;
    let monitorIteration = 0;

    const checkPlayerState = () => {
      monitorIteration++;
      if (window.player) {
        const currentAlive = player.alive;
        const currentDead = player.dead;
        const currentDying = player.dying;

        // Log state every 10 iterations for visibility
        if (monitorIteration % 10 === 0) {
          console.log(
            `🔍 Player State [${monitorIteration}]: alive=${currentAlive}, dead=${currentDead}, dying=${currentDying}, isLevelActive=${this.isLevelActive}`
          );
        }

        // Log all state changes for debugging
        if (lastAliveState !== currentAlive) {
          console.log(
            `🔍 DEBUG: player.alive changed from ${lastAliveState} to ${currentAlive}`
          );
          lastAliveState = currentAlive;

          if (!currentAlive) {
            console.log(
              "💀 Player state monitor: alive -> dead - modifications persist"
            );
            MapModifier.isLevelActive = true;
            console.log(
              "💀 DEBUG: isLevelActive set to:",
              MapModifier.isLevelActive
            );
          }
        }

        if (lastDeadState !== currentDead) {
          console.log(
            `🔍 DEBUG: player.dead changed from ${lastDeadState} to ${currentDead}`
          );
          lastDeadState = currentDead;

          if (currentDead) {
            console.log(
              "💀 Player state monitor: dead set to true - modifications persist"
            );
            MapModifier.isLevelActive = true;
            console.log(
              "💀 DEBUG: isLevelActive set to:",
              MapModifier.isLevelActive
            );
          }
        }

        if (lastDyingState !== currentDying) {
          console.log(
            `🔍 DEBUG: player.dying changed from ${lastDyingState} to ${currentDying}`
          );
          lastDyingState = currentDying;

          if (currentDying) {
            console.log(
              "💀 Player state monitor: dying set to true - modifications persist"
            );
            MapModifier.isLevelActive = true;
            console.log(
              "💀 DEBUG: isLevelActive set to:",
              MapModifier.isLevelActive
            );
          }
        }

        // Detect when player respawns (dead to alive)
        if (!lastAliveState && currentAlive) {
          console.log(
            "🔁 Player state monitor: dead -> alive - reapplying modifications"
          );
          console.log(
            "🔁 DEBUG: Current isLevelActive:",
            MapModifier.isLevelActive
          );
          console.log(
            "🔁 DEBUG: Player state - alive:",
            player.alive,
            "dead:",
            player.dead,
            "dying:",
            player.dying
          );

          setTimeout(() => {
            console.log(
              "🔁 State monitor: Calling reapplyPersistentModifications"
            );
            MapModifier.reapplyPersistentModifications();
          }, 500);
        }
      } else {
        console.log(`🔍 [${monitorIteration}] Player object not found`);
      }

      setTimeout(checkPlayerState, 100);
    };

    setTimeout(checkPlayerState, 1000);
    console.log("✅ Started enhanced player state monitor");
  },

  hookIntoSetMap() {
    if (!window.setMapOriginal && window.setMap) {
      window.setMapOriginal = window.setMap;
      window.setMap = function () {
        console.log("🗺️ setMap called - new level loading");
        console.log(
          "🗺️ Current isLevelActive before reset:",
          MapModifier.isLevelActive
        );
        // This runs when a new level starts (level completion)
        MapModifier.isLevelActive = false; // Level completed, ready for new one
        console.log("🗺️ isLevelActive after reset:", MapModifier.isLevelActive);
        MapModifier.clearCurrentModifications();
        const result = setMapOriginal.apply(this, arguments);
        console.log("🗺️ setMap completed");
        return result;
      };
      console.log("✅ Hooked into setMap - modifiers reset on level change");
    } else {
      console.log("❌ setMap not available or already hooked");
    }
  },

  applyModifications(levelKey) {
    console.log(`🗺️ applyModifications called for level: ${levelKey}`);
    if (!levelKey) {
      console.warn("No level key provided");
      return;
    }

    console.log(`🗺️ Applying modifications to level: ${levelKey}`);
    if (!this.originalMapStates[levelKey]) {
      this.saveOriginalState(levelKey);
    }

    const relationships = GameRelationships.getAllStatuses();
    console.log(`🗺️ Relationships to apply:`, relationships);

    setTimeout(() => {
      Object.entries(relationships).forEach(([character, status]) => {
        this.applyCharacterModifications(levelKey, character, status);
      });
      this.saveModificationState();
    }, 100);
  },

  injectModifications() {
    console.log("🗺️ injectModifications called");
    if (!window.map || !window.GameRelationships) {
      console.log(
        "❌ injectModifications: map or GameRelationships not available"
      );
      return;
    }

    const relationships = GameRelationships.getAllStatuses();
    const levelKey = "current";
    console.log(`🗺️ Injecting modifications for relationships:`, relationships);

    Object.entries(relationships).forEach(([character, status]) => {
      if (status !== "neutral") {
        this.applyCharacterModifications(levelKey, character, status);
      }
    });
  },

  saveOriginalState(levelKey) {
    console.log(`💾 saveOriginalState called for: ${levelKey}`);
    this.originalMapStates[levelKey] = {
      platforms: [],
      enemies: [],
      powerups: [],
      coins: [],
      blocks: [],
    };
    console.log(`💾 Saved original state for ${levelKey}`);
  },

  _showRelationshipMessage(msg) {
    console.log(`💬 Relationship message: ${msg}`);
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

  hookIntoMaintainSolids() {
    console.log("🔧 hookIntoMaintainSolids called");
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
    } else {
      console.log("❌ maintainSolids not available or already hooked");
    }
  },
  hookIntoSpawnMap() {
    if (!window.spawnMapOriginal && window.spawnMap) {
      window.spawnMapOriginal = window.spawnMap;
      window.spawnMap = () => {
        console.log("🎮 spawnMap called - LEVEL STARTING");
        spawnMapOriginal();

        // More aggressive modification injection
        const injectWithRetry = (attempt = 0) => {
          if (window.player && window.player.alive) {
            console.log("🎮 Player alive - marking level as active");
            MapModifier.isLevelActive = true;
            console.log("🎮 isLevelActive set to:", MapModifier.isLevelActive);
            MapModifier.injectModifications();
          } else if (attempt < 10) {
            console.log(`🎮 Player not ready yet, retry ${attempt + 1}/10`);
            setTimeout(() => injectWithRetry(attempt + 1), 200);
          } else {
            console.log("❌ Player never became ready for modifications");
          }
        };

        setTimeout(() => injectWithRetry(), 300);
      };
      console.log("✅ Hooked into spawnMap");
    } else {
      console.log("❌ spawnMap not available or already hooked");
    }
    this.hookIntoMaintainSolids();
  },

  reapplyPersistentModifications() {
    console.log("🔄 ===== REAPPLY PERSISTENT MODIFICATIONS =====");
    console.log("🔄 isLevelActive:", this.isLevelActive);
    console.log("🔄 persistentRelationships:", this.persistentRelationships);

    if (!this.isLevelActive) {
      console.log("❌ Cannot reapply - level not active");
      return;
    }

    // Clear existing modification objects first
    this.resetLevel("current");

    // Wait a bit for level to reset, then reapply
    setTimeout(() => {
      console.log("🔄 Reapplying modifications after respawn");

      // Reapply all persistent relationships
      Object.entries(this.persistentRelationships).forEach(
        ([character, status]) => {
          if (status !== "neutral") {
            console.log(`🔄 Reapplying ${character} as ${status}`);
            this.applyCharacterModifications("current", character, status);
          }
        }
      );

      console.log("✅ Modifications reapplied after death");
    }, 800);
  },

  // Emergency fallback method
  forceReapplyModifications() {
    console.log("🚨 FORCE REAPPLYING MODIFICATIONS");

    this.resetLevel("current");

    setTimeout(() => {
      console.log("🚨 Applying modifications forcefully");
      Object.entries(this.persistentRelationships).forEach(
        ([character, status]) => {
          if (status !== "neutral") {
            console.log(`🚨 Force applying ${character} as ${status}`);
            this.applyCharacterModifications("current", character, status);
          }
        }
      );
    }, 500);
  },

  // Enhanced applyCharacterModifications with logging
  applyCharacterModifications(levelKey, character, status) {
    const modKey = `${levelKey}_${character}_${status}`;
    console.log(
      `🔧 ===== APPLYING ${character} MODIFICATIONS (${status}) =====`
    );
    console.log(
      `🔧 LevelKey: ${levelKey}, Character: ${character}, Status: ${status}`
    );

    // Store for persistence - ALWAYS store even if we think it might be redundant
    this.persistentRelationships[character] = status;
    console.log(
      `🔧 Stored in persistentRelationships:`,
      this.persistentRelationships
    );

    // Ensure level is marked as active for persistence
    this.isLevelActive = true;
    console.log(`🔧 isLevelActive set to:`, this.isLevelActive);

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
    console.log(`🔧 Added to activeModifications: ${modKey}`);
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

  // KOOPA MODIFICATIONS
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
      // CRITICAL: Ensure level is marked as active for persistence
      this.isLevelActive = true;
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
    // Force clear since this is a manual reset
    this.isLevelActive = false;
    this.clearCurrentModifications();
  },
};

if (typeof window !== "undefined") {
  console.log("🌐 Window detected - setting up MapModifier");
  window.MapModifier = MapModifier;

  // Try to auto-initialize after a short delay
  setTimeout(() => {
    if (window.MapModifier && typeof window.MapModifier.init === "function") {
      console.log("🔄 Auto-initializing MapModifier");
      window.MapModifier.init();

      // Add test commands for auto-init
      window.allyToad = () => MapModifier.allyToad();
      window.enemyToad = () => MapModifier.enemyToad();
      window.allyGoomba = () => MapModifier.allyGoomba();
      window.enemyGoomba = () => MapModifier.enemyGoomba();
      window.allyKoopa = () => MapModifier.allyKoopa();
      window.enemyKoopa = () => MapModifier.enemyKoopa();
      window.resetAll = () => MapModifier.resetAllTestStatuses();
      window.testDeath = () => MapModifier.testDeathAndRespawn();
      window.forceReapply = () => MapModifier.reapplyPersistentModifications();
      window.testDeathAndRespawn = () => MapModifier.testDeathAndRespawn();

      console.log(
        "🎮 Test commands available: allyToad(), enemyToad(), allyGoomba(), enemyGoomba(), allyKoopa(), enemyKoopa(), resetAll(), testDeath(), forceReapply(), testDeathAndRespawn()"
      );
    } else {
      console.log(
        "❌ MapModifier not ready for auto-init, use MapModifier.manualInit()"
      );
    }
  }, 2000);

  console.log("✅ MapModifier loaded - use MapModifier.manualInit() if needed");
}
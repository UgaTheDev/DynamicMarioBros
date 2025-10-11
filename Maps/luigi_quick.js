// luigi_quick.js - Relationship: Luigi Allied (+30 or more)
// Concept: Overworld, many Springboards and 1-Ups (bonus lives).

var map = new Map();
map.time = 350; // Generous time limit
map.locs = [
  new Location(0, true),
  new Location(0, exitPipeVert),
  new Location(1, false, 800), // Finish
];
map.areas = [
  new Area("Overworld Alt", function () {
    setLocationGeneration(0);

    pushPreCastle(0, 0, true);
    pushPrePattern("backfence", 0, 0, 5);
    pushPreFloor(0, 0, 70);

    // --- SECTION 1: Speedy Start ---
    pushPreThing(Springboard, 128, 14.5); // Springboard for quick movement
    pushPreThing(Block, 160, jumplev1, [Mushroom, 1]); // 1-Up Mushroom
    pushPreThing(Block, 168, jumplev1);
    pushPreThing(Koopa, 200, 12, false, true);

    // --- SECTION 2: High Road ---
    // A series of short platforms, encouraging Mario to jump quickly and stay airborne.
    pushPreThing(Stone, 256, 16, 1, 2);
    pushPreThing(Stone, 280, 32, 1, 4);
    pushPreThing(Stone, 304, 48, 1, 6);
    pushPreThing(Stone, 328, 64, 1, 8);
    pushPreThing(Block, 336, 64, [Mushroom, 1]); // Another 1-Up at the peak!

    // --- SECTION 3: Springboard Chain ---
    pushPreFloor(350, 0, 30);
    pushPreThing(Springboard, 400, 14.5);
    pushPreThing(Springboard, 450, 14.5);
    pushPreThing(Springboard, 500, 14.5);

    // Flagpole exit
    endCastleOutside(650);
  }),
];

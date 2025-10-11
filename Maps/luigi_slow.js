// luigi_slow.js - Relationship: Luigi Hostile (-30 or less)
// Concept: Many vertical pipes, long travel between them, and lots of forced slow movement.

var map = new Map();
map.time = 150; // Very short time limit due to the nature of the level
map.locs = [
  new Location(0, true),
  new Location(0, exitPipeVert), // Exit pipe
  new Location(1, false, 1200), // Finish
];
map.areas = [
  new Area("Overworld", function () {
    setLocationGeneration(0);

    pushPreCastle(0, 0, true);
    pushPrePattern("backreg", 0, 0, 4);
    pushPreFloor(0, 0, 100);

    // --- SECTION 1: Tall Pipe Start ---
    pushPrePipe(128, 0, 32, true);
    pushPreThing(Goomba, 136, 8);
    pushPreThing(Block, 176, jumplev1);

    // --- SECTION 2: The Pipe Gauntlet ---
    // A series of tall pipes requiring precise, slow movement.
    pushPrePipe(256, 0, 16, true);
    pushPrePipe(288, 0, 40, true);
    pushPrePipe(320, 0, 24, true);
    fillPreThing(Koopa, 330, 8, 3, 1, 16); // Koopas patrolling the short path
    pushPrePipe(384, 0, 32, true);

    // --- SECTION 3: Wasting Time ---
    // Forced to jump over a pipe repeatedly to clear enemies.
    pushPrePipe(500, 0, 24, true);
    fillPreThing(Goomba, 508, 36, 3, 1, 12); // Enemies on top of the pipe

    // --- SECTION 4: The Long Walk ---
    // A long, empty floor section to eat up the clock.
    pushPreFloor(550, 0, 40);
    fillPreThing(Goomba, 600, 8, 5, 1, 12);

    // Flagpole exit
    endCastleOutside(750);
  }),
];

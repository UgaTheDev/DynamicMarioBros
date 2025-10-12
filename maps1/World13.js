map.time = 400;
map.locs = [
  new Location(0, walkToPipe),
  new Location(1),
  new Location(2, exitPipeVert)
];
map.areas = [
  new Area("Overworld", function() {
    setLocationGeneration(0);

    pushPreCastle();
    pushPrePattern("backcloud", 0, 4, 2);
    pushPreFloor(0, 0, 200);
    pushPreThing(PipeSide, 80, 16, 1);
    pushPrePipe(96, 0, 32);
    pushPreTree(120, 0);
    pushPreThing(Goomba, 152, 16);
    pushPreThing(Koopa, 184, 16);
  }),
  new Area("Underwater", function() {
    setLocationGeneration(1);
    goUnderWater();
    
    pushPreFloor(139, 0, 67);
    pushPreThing(Coral, 235, 24, 3);
    fillPreThing(Coin, 259, 7, 2, 1, 8);
    pushPreThing(Stone, 291, jumplev1 + 8, 3, 1);
    pushPreThing(Blooper, 323, 16);
    fillPreThing(Coin, 363, jumplev2 - 8, 3, 1, 8);
    pushPreThing(Coral, 411, 40, 5);
    fillPreThing(Coin, 435, 15, 3, 1, 8);
    pushPreThing(Stone, 483, jumplev1 + 16, 2, 1);
    pushPreThing(Coral, 483, jumplev1 + 32, 2);
    pushPreThing(Blooper, 515, jumplev1 + 8);
    pushPreThing(Coral, 547, 32, 4);
    pushPreThing(CheepCheep, 587, 24, false, false);
    pushPreThing(Stone, 659, 32, 1, 3);
    pushPreThing(Stone, 667, 48, 1, 5);
    fillPreThing(Coin, 685, 31, 3, 1, 8);
	pushPreThing(CheepCheep, 587, 16, false, false);
    pushPreThing(CheepCheep, 621, 24, false, false);
    
    pushPreFloor(715, 0, 60);
    pushPreThing(Stone, 715, 40, 1, 5);
    pushPreThing(Stone, 723, 24, 1, 3);
    pushPreThing(CheepCheep, 755, 24, false, false);
    pushPreThing(Stone, 771, 24, 2, 3);
    pushPreThing(Stone, 771, 88, 2, 3);
    pushPreThing(CheepCheep, 779, 48, false, false);
    pushPreThing(CheepCheep, 795, 16, false, false);
    pushPreThing(Stone, 803, 64, 3, 1);
    pushPreThing(Blooper, 811, 40, false, false);
    pushPreThing(Coral, 811, 80, 2);
    pushPreThing(Coral, 859, 24, 3);
    pushPreThing(Blooper, 899, 80);
    pushPreThing(CheepCheep, 899, 56, false, false);
    pushPreThing(CheepCheep, 923, 80, true, false);
    fillPreThing(Coin, 955, 23, 3, 1, 8);
    pushPreThing(CheepCheep, 955, 24, false, false);
    pushPreThing(Stone, 963, 32, 2, 1);
    pushPreThing(Coral, 963, 64, 4);
    pushPreThing(Blooper, 987, 16);
	fillPreThing(Coin, 987, 31, 3, 1, 8);
    fillPreThing(Coin, 1051, 63, 3, 1, 8, 8);
    pushPreThing(Stone, 1067, 40, 2, 1);
    pushPreThing(CheepCheep, 1083, 72, false, false);
    pushPreThing(Coral, 1107, 32, 4);
    pushPreThing(CheepCheep, 1171, 24, true, false);
    pushPreThing(Stone, 1179, 32, 1, 4);
    pushPreThing(Stone, 1187, 16, 1, 2);
    pushPreThing(CheepCheep, 1195, 16, false, false);
    pushPreThing(Stone, 1195, 88, 1, 3);
    pushPreThing(Stone, 1203, 72, 8, 1);
    pushPreThing(Coin, 1211, 23);
    fillPreThing(Coin, 1219, 15, 3, 1, 8);
    pushPreThing(Coin, 1243, 23);
    pushPreThing(CheepCheep, 1239, 40, false, false);
    pushPreFloor(1267, 0, 17);
    pushPreThing(Stone, 1267, 16, 1, 2);
    pushPreThing(Stone, 1275, 32, 1, 4);
    pushPreThing(CheepCheep, 1299, 32, false, false);
    pushPreThing(Coral, 1323, 16, 2);
    pushPreThing(Coral, 1339, 24, 3);
    pushPreThing(CheepCheep, 1345, 56, true, false);
    pushPreThing(Stone, 1395, 64, 1, 8);
    pushPreThing(Stone, 1403, 64, 2, 1);
    fillPreThing(Coin, 1420, 40, 3, 2, 8, -24);
    pushPreThing(Stone, 1443, 64, 2, 1);
    pushPreFloor(1459, 0, 82);
    pushPreThing(Stone, 1459, 64, 1, 8);
    pushPreThing(CheepCheep, 1459, 80, false, false);
    pushPreThing(CheepCheep, 1483, 16, true, false);
    fillPreThing(Stone, 1523, 32, 1, 2, 0, 32, 5, 1);
    pushPreThing(Coral, 1531, 80, 2);
    pushPreThing(Blooper, 200, 48);
	pushPreThing(Blooper, 400, 24);
	pushPreThing(Blooper, 800, 72);
    fillPreThing(Coin, 300, 15, 3, 1, 8);
	fillPreThing(Coin, 500, 23, 3, 1, 8);
    fillPreThing(Coin, 700, 31, 3, 1, 8);
	fillPreThing(Coin, 900, 39, 3, 1, 8);
	fillPreThing(Coin, 1100, 47, 3, 1, 8);
    pushPreThing(CheepCheep, 1540, 40, false, false);
    fillPreThing(Stone, 1567, 32, 1, 2, 0, 32, 4, 1);
    pushPreThing(CheepCheep, 1591, 72, true, false);
    pushPreThing(CheepCheep, 1615, 48, true, false);
    pushPreThing(Stone, 1627, 8, 5, 1);
    pushPreThing(Stone, 1635, 16, 4, 1);
    pushPreThing(Stone, 1643, 24, 3, 1);
    pushPreThing(Stone, 1651, 32, 2, 1);
    pushPreThing(Stone, 1651, 88, 2, 4);
    pushPreThing(PipeSide, 1659, 48, 2, true);
    pushPreThing(Stone, 1667, 88, 14, 11);
  }),
  new Area("Overworld", function() {
    setLocationGeneration(2);
  
    pushPrePattern("backreg", 104, 0, 1);
    pushPreFloor(0, 0, 42);
    pushPrePipe(0, 0, 16, true, false, 2);
    pushPreThing(Stone, 16, 8, 1, 1);
    pushPreThing(Stone, 24, 16, 1, 2);
    pushPreThing(Stone, 32, 24, 1, 3);
    pushPreThing(Stone, 40, 32, 1, 4);
    pushPreThing(Stone, 48, 40, 1, 5);
    pushPreThing(Stone, 56, 48, 1, 6);
    pushPreThing(Stone, 64, 56, 1, 7);
    pushPreThing(Stone, 72, 64, 2, 8);
    endCastleOutside(148);
  })
];
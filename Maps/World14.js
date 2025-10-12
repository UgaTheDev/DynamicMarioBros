map.time = 300;
map.locs = [
  new Location(0, startCastle)
];
map.areas = [
  new Area("Castle", function() {
    setLocationGeneration(0);
    
    startCastleInside();
    
    makeCeilingCastle(176, 11, 3);
    pushPreFloor(0, 0, 200);
    
    fillPreWater(2, 0, 32);
    pushPreThing(Podoboo, 0, -32);
    pushPreThing(Stone, 16, 32, 2, 1);
    pushPreThing(Stone, 48, 48, 3, 1);
    pushPreThing(CastleBlock, 56, 48);
    pushPreThing(Block, 56, 80, Mushroom);
    pushPreThing(Stone, 88, 32, 2, 1);
    pushPreThing(Podoboo, 112, -32);
	pushPreThing(Beetle, 112, 40);
    
    pushPreFloor(120, 0, 52);
    pushPreThing(Stone, 120, 24, 2, 3);
    makeCeilingCastle(136, 49, 4);
    pushPreThing(Stone, 160, jumplev1, 36, 1);
    pushPreThing(CastleBlock, 208, 0);
    pushPreThing(CastleBlock, 256, jumplev1, 6);
    pushPreThing(CastleBlock, 304, 0);
    pushPreThing(CastleBlock, 304, jumplev2, 6);
    pushPreThing(CastleBlock, 352, jumplev1, 6);
    pushPreThing(CastleBlock, 400, 0);
    pushPreThing(CastleBlock, 448, jumplev1, 6);
    pushPreThing(Stone, 504, 24, 4, 3)
    pushPreThing(CastleBlock, 520, 56, 6);
	pushPreThing(Beetle, 520, 40);
    
    pushPrePlatformGenerator(550, 3, -1);
    pushPrePlatformGenerator(574, 3, 1);
    
    pushPreFloor(600, 16);
    pushPreThing(CastleBlock, 600, 24, 6, true);
    pushPreFloor(608, 24, 6);
    makeCeilingCastle(608, 6, 3);
    pushPreFloor(656, 0, 10);
    fillPreThing(Coin, 681, 7, 3, 2, 8, 32);
    pushPreThing(CastleBlock, 688, 16);
    fillPreWater(736, 0, 4);
    pushPreThing(Stone, 728, 24, 1, 3);
    pushPreFloor(752, 24, 2);
    fillPreWater(768, 0, 4);
    
    pushPreFloor(784, 0, 13);
    pushPreThing(Stone, 784, 24, 5, 3);
    makeCeilingCastle(784, 13, 3);
    fillPreThing(Stone, 840, 24, 2, 1, 32, 0, 2, 3);
	pushPreThing(Beetle, 840, 40);
	fillPreThing(Coin, 840, 7, 3, 2, 8, 32);
    
    fillPreThing(Brick, 888, 64, 6, 1, 8);
    endCastleInside(888, "Beetle");
  }),
  new Area("Overworld", function() {
        setLocationGeneration(1);
        pushPreFloor(888, 0, 100);
        pushPreThing(Goomba, 920, 0);
        pushPreThing(Koopa, 960, 0);
		pushPreThing(Goomba, 1000, 0);
        pushPrePipe(1040, 0, 3);
        pushPreTree(1080, 0);
		fillPreThing(Coin, 1100, 7, 3, 2, 8, 32);
    }),
	new Area("Underwater", function() {
        setLocationGeneration(1);
        goUnderWater(1188);
        pushPreFloor(1188, 0, 50);
        pushPreThing(Blooper, 1220, -50);
        pushPreThing(CheepCheep, 1260, -20);
        pushPreThing(Coral, 1300, 0, 2, 2);
		pushPreThing(CheepCheep, 1340, -20);
		fillPreThing(Coin, 1300, 7, 3, 2, 8, 32);

    }),
    new Area("Sky", function() {
        setLocationGeneration(1);
		fillPreThing(Coin, 1380, 7, 3, 2, 8, 32);
        pushPrePlatformGenerator(1380, 3, 1);
        pushPreThing(Koopa, 1420, 0, true);
		fillPreThing(Coin, 1420, 7, 3, 2, 8, 32);
    })
];
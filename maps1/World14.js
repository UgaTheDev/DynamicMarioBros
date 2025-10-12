map.time = 300;
map.locs = [
  new Location(0, startCastle)
];
map.areas = [
  new Area("Castle", function() {
    setLocationGeneration(0);
    
    startCastleInside();
    
    makeCeilingCastle(152, 11, 3);
    pushPreFloor(0, 0, 200);
    
    fillPreWater(16, 0, 32);
    pushPreThing(Podoboo, 16, -32);
    pushPreThing(Stone, 32, 32, 2, 1);
    pushPreThing(Stone, 64, 48, 3, 1);
    pushPreThing(CastleBlock, 72, 48);
    pushPreThing(Block, 72, 80, Mushroom);
    pushPreThing(Stone, 104, 32, 2, 1);
    pushPreThing(Beetle, 128, 32);
    pushPreThing(Podoboo, 128, -32);
    
    pushPreFloor(144, 0, 52);
    pushPreThing(Stone, 144, 24, 2, 3);
    makeCeilingCastle(160, 49, 4);
    pushPreThing(Stone, 184, jumplev1, 36, 1);
    pushPreThing(CastleBlock, 232, 0);
    pushPreThing(CastleBlock, 280, jumplev1, 6);
    pushPreThing(CastleBlock, 328, 0);
    pushPreThing(CastleBlock, 328, jumplev2, 6);
    pushPreThing(CastleBlock, 376, jumplev1, 6);
    pushPreThing(CastleBlock, 424, 0);
    pushPreThing(CastleBlock, 472, jumplev1, 6);
    pushPreThing(Stone, 528, 24, 4, 3)
    pushPreThing(CastleBlock, 544, 56, 6);
    
    pushPrePlatformGenerator(574, 3, -1);
    pushPrePlatformGenerator(598, 3, 1);
    pushPreThing(Beetle, 620, 16);
    pushPreThing(Beetle, 620, 48);
    
    pushPreFloor(624, 16);
    pushPreThing(CastleBlock, 624, 24, 6, true);
    pushPreFloor(632, 24, 6);
    makeCeilingCastle(632, 6, 3);
    pushPreFloor(680, 0, 10);
    fillPreThing(Coin, 705, 7, 3, 2, 8, 32);
    pushPreThing(CastleBlock, 712, 16);
    fillPreWater(760, 0, 4);
    pushPreThing(Stone, 752, 24, 1, 3);
    pushPreFloor(776, 24, 2);
    fillPreWater(792, 0, 4);
    
    pushPreFloor(808, 0, 13);
    pushPreThing(Stone, 808, 24, 5, 3);
    makeCeilingCastle(808, 13, 3);
    fillPreThing(Stone, 864, 24, 2, 1, 32, 0, 2, 3);

    fillPreThing(Brick, 912, 64, 6, 1, 8);
    pushPreThing(Beetle, 928, 48);
    pushPreThing(Beetle, 944, 48);
    fillPreThing(Coin, 917, 75, 2, 2, 16, 16);
    fillPreThing(Coin, 950, 75, 2, 2, 16, 16);

    pushPreFloor(960, 0, 60);
    pushPreThing(Stone, 976, 24, 4, 3)
    pushPreThing(CastleBlock, 992, 56, 6);
    fillPreThing(Coin, 997, 7, 3, 2, 8, 32);
    fillPreThing(Coin, 1045, 7, 3, 2, 8, 32);

    pushPrePlatformGenerator(1084, 3, -1);
    pushPrePlatformGenerator(1108, 3, 1);
    pushPreThing(Beetle, 1120, 16);
    pushPreThing(Beetle, 1120, 48);
    pushPreFloor(1156, 0, 60);
    fillPreThing(Coin, 1177, 75, 2, 2, 16, 16);
    pushPreThing(Podoboo, 1190, -32);
    fillPreThing(Coin, 1200, 75, 2, 2, 16, 16);
    makeCeilingCastle(1156, 13, 3);

    pushPreFloor(1268, 0, 30);
    fillPreThing(Coin, 1289, 7, 3, 2, 8, 32);
    pushPreThing(Podoboo, 1296, -32);
    fillPreThing(Coin, 1337, 7, 3, 2, 8, 32);
    makeCeilingCastle(1268, 13, 3);

    pushPreThing(CastleBlock, 1364, 0);
    pushPreThing(CastleBlock, 1364, jumplev2, 6);
    pushPreThing(CastleBlock, 1412, jumplev1, 6);
    pushPreThing(CastleBlock, 1460, 0);
    pushPreThing(CastleBlock, 1508, jumplev1, 6);
    pushPreFloor(1556, 0, 10);
    fillPreThing(Coin, 1577, 75, 2, 2, 16, 16);
    fillPreThing(Coin, 1600, 75, 2, 2, 16, 16);

    pushPreThing(CastleBlock, 1636, 16);
    endCastleInside(1636, "Beetle");
  })
];
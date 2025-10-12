map.time = "night";
map.locs = [
  new Location(0, true)
];
map.areas = [
  new Area("Overworld Night", function() {
    setLocationGeneration(0);

    pushPreCastle(200, 0, true);
    pushPrePattern("backreg", 200, 0, 4);
    pushPreFloor(0, 0, 200);
	pushPreThing(Goomba, 300, 16);
    pushPreThing(Lakitu, 384, 84);
    fillPreThing(Block, 328, jumplev1, 2, 1, 8);
    
    pushPreFloor(376, 0, 9);
    pushPreThing(Stone, 408, 8, 6);
    pushPreThing(Stone, 432, 16, 5);
    pushPreThing(Stone, 456, 24, 4);
    pushPreThing(Stone, 480, 32, 3);
	pushPreThing(Koopa, 456, 0);
    pushPreThing(Brick, 488, jumplev2, Mushroom);
    pushPreFloor(496, 0, 2);
    pushPreThing(Brick, 496, jumplev2);
    
    pushPreFloor(528, 0, 16);
    fillPreThing(Brick, 528, jumplev1, 2, 1, 8);
    pushPreThing(Brick, 544, jumplev1, Coin);
	fillPreThing(Coin, 530, jumplev1-1, 3, 1, 8);
    
    pushPreFloor(672, 0, 15);
    fillPreThing(Coin, 697, jumplev1-1, 3, 1, 8);
    pushPreThing(Stone, 752, 8);
    pushPreThing(Stone, 760, 16, 1, 2);
    pushPreThing(Stone, 768, 24, 1, 3);
    pushPreThing(Stone, 776, 32, 2, 4);
	pushPreThing(Koopa, 760, 0);
    
    fillPreThing(Coin, 809, 47, 2, 1, 8);
    pushPreFloor(816, 0, 16);
    pushPreThing(Stone, 872, 16);
    pushPreThing(Stone, 880, 24, 1, 2);
    pushPreThing(Stone, 896, 40, 1, 5);
    pushPreThing(Stone, 904, 48, 1, 6);
    pushPreThing(Stone, 912, 56, 1, 7);
	fillPreThing(Coin, 875, jumplev1-1, 3, 1, 8);
    pushPreThing(Block, 920, 40, [Mushroom, 1], true);
    fillPreThing(Brick, 920, 56, 3, 1, 8);
    fillPreThing(Brick, 936, 24, 3, 1, 8);
    
    pushPreFloor(968, 0, 31);
    pushPrePipe(1016, 0, 24, true);
	pushPreThing(Goomba, 1000, 16);
    fillPreThing(Coin, 1041, 39, 3, 1, 8);
    fillPreThing(Block, 1104, jumplev1, 1, 2, 0, 32, Coin, true);
    pushPreThing(Stone, 1176, 8);
    pushPreThing(Stone, 1184, 16, 1, 2);
    pushPreThing(Stone, 1192, 24, 1, 3);
	fillPreThing(Coin, 1180, jumplev1-1, 3, 1, 8);
    pushPreThing(Stone, 1200, 32, 1, 4);
    pushPreThing(Stone, 1208, 40, 1, 5);
    fillPreThing(Brick, 1216, 40, 2, 1, 8);
    fillPreThing(Brick, 1240, 8, 5, 1, 8);
    pushPreThing(Block, 1240, 40, Mushroom);
    pushPreThing(Block, 1248, 40);
    pushPreFloor(1272, 0, 2);
    
    pushPreFloor(1296, 0, 12);
    pushPreThing(Stone, 1344, 8);
    pushPreThing(Stone, 1352, 16, 1, 2);
    pushPreThing(Stone, 1360, 24, 1, 3);
    pushPreThing(Stone, 1368, 32, 1, 4);
    pushPreThing(Stone, 1376, 40, 1, 5);
	pushPreThing(Koopa, 1350, 0);
    pushPreThing(Stone, 1384, 48, 1, 6);
    fillPreThing(Brick, 1392, 48, 2, 1, 8);
    pushPreThing(Brick, 1408, 32);
    fillPreThing(Brick, 1416, 16, 3, 1, 8);
    pushPreThing(Brick, 1416, 32, Coin);
    pushPreFloor(1440, 0, 9);
	fillPreThing(Coin, 1420, jumplev1-1, 3, 1, 8);
    
    pushPreFloor(1536, 0, 7);
    pushPreThing(Stone, 1552, 8);
    pushPreThing(Stone, 1560, 16, 1, 2);
	pushPreThing(Goomba, 1560, 16);
    pushPreThing(Stone, 1568, 24, 1, 3);
    pushPreThing(Stone, 1576, 32, 1, 4);
    pushPreThing(Stone, 1584, 40, 1, 5);
	fillPreThing(Coin, 1565, jumplev1-1, 3, 1, 8);
    
    pushPreFloor(1608, 0, 30);
    pushPreFuncCollider(1608, zoneDisableLakitu);
    pushPreThing(Stone, 1608, 64, 2, 8);
    endCastleOutside(1684);
  })
];
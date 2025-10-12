map.time = "night";
map.locs = [
  new Location(0, true)
];
map.areas = [
  new Area("Overworld Night", function() {
    setLocationGeneration(0);

    pushPreCastle(75, 0, true);
    pushPrePattern("backreg", 75, 0, 4);
    pushPreFloor(0, 0, 200);
    pushPreThing(Lakitu, 109, 84);
    fillPreThing(Block, 53, jumplev1, 2, 1, 8);
    
    pushPreFloor(251, 0, 9);
    pushPreThing(Stone, 133, 8, 6);
    pushPreThing(Stone, 157, 16, 5);
    pushPreThing(Stone, 181, 24, 4);
    pushPreThing(Stone, 205, 32, 3);
    pushPreThing(Brick, 213, jumplev2, Mushroom);
    pushPreFloor(221, 0, 2);
    pushPreThing(Brick, 221, jumplev2);
    pushPreThing(Goomba, 237, 10);
    
    pushPreFloor(303, 0, 16);
    fillPreThing(Brick, 303, jumplev1, 2, 1, 8);
    pushPreThing(Brick, 319, jumplev1, Coin);
    pushPreThing(Koopa, 335, 10);
    
    pushPreFloor(397, 0, 15);
    fillPreThing(Coin, 422, jumplev1-1, 3, 1, 8);
    pushPreThing(Stone, 477, 8);
    pushPreThing(Stone, 485, 16, 1, 2);
    pushPreThing(Stone, 493, 24, 1, 3);
    pushPreThing(Stone, 501, 32, 2, 4);
    pushPreThing(Goomba, 520, 10);
    
    fillPreThing(Coin, 534, 47, 2, 1, 8);
    pushPreFloor(541, 0, 16);
    pushPreThing(Stone, 597, 16);
    pushPreThing(Stone, 605, 24, 1, 2);
    pushPreThing(Stone, 621, 40, 1, 5);
    pushPreThing(Stone, 629, 48, 1, 6);
    pushPreThing(Stone, 637, 56, 1, 7);
    pushPreThing(Block, 645, 40, [Mushroom, 1], true);
    fillPreThing(Brick, 645, 56, 3, 1, 8);
    fillPreThing(Brick, 661, 24, 3, 1, 8);
    pushPreThing(Koopa, 677, 10);
    
    pushPreFloor(693, 0, 31);
    pushPrePipe(741, 0, 24, true);
    fillPreThing(Coin, 766, 39, 3, 1, 8);
    fillPreThing(Block, 829, jumplev1, 1, 2, 0, 32, Coin, true);
    pushPreThing(Stone, 901, 8);
    pushPreThing(Stone, 909, 16, 1, 2);
    pushPreThing(Stone, 917, 24, 1, 3);
    pushPreThing(Stone, 925, 32, 1, 4);
    pushPreThing(Stone, 933, 40, 1, 5);
    fillPreThing(Brick, 941, 40, 2, 1, 8);
    fillPreThing(Brick, 965, 8, 5, 1, 8);
    pushPreThing(Block, 965, 40, Mushroom);
    pushPreThing(Block, 973, 40);
    pushPreFloor(997, 0, 2);
    pushPreThing(Goomba, 1005, 10);
    
    pushPreFloor(1021, 0, 12);
    pushPreThing(Stone, 1069, 8);
    pushPreThing(Stone, 1077, 16, 1, 2);
    pushPreThing(Stone, 1085, 24, 1, 3);
    pushPreThing(Stone, 1093, 32, 1, 4);
    pushPreThing(Stone, 1101, 40, 1, 5);
    pushPreThing(Stone, 1109, 48, 1, 6);
    fillPreThing(Brick, 1117, 48, 2, 1, 8);
    pushPreThing(Brick, 1133, 32);
    fillPreThing(Brick, 1141, 16, 3, 1, 8);
    pushPreThing(Brick, 1141, 32, Coin);
    pushPreFloor(1165, 0, 9);
    pushPreThing(Koopa, 1181, 10);
    fillPreThing(Coin, 1173, jumplev1-1, 3, 1, 8);
    
    pushPreFloor(1261, 0, 7);
    pushPreThing(Stone, 1277, 8);
    pushPreThing(Stone, 1285, 16, 1, 2);
    pushPreThing(Stone, 1293, 24, 1, 3);
    pushPreThing(Stone, 1301, 32, 1, 4);
    pushPreThing(Stone, 1309, 40, 1, 5);
    pushPreThing(Goomba, 1325, 10);
    
    pushPreFloor(1333, 0, 30);
    pushPreFuncCollider(1333, zoneDisableLakitu);
    pushPreThing(Stone, 1333, 64, 2, 8);
    fillPreThing(Coin, 1375, 47, 2, 1, 8);
    pushPreTree(1390, 0);
    pushPreTree(1405, 0);
    pushPreTree(1420, 0);
    endCastleOutside(1409+75+207);
  })
];
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
	pushPreTree(0, 48, 3);
	pushPreTree(32, 48, 3);
	pushPreTree(64, 48, 3);
    pushPreThing(PipeSide, 80, 16, 1);
	pushPreThing(Goomba, 112, 16);
	pushPreThing(Koopa, 144, 16);
    pushPrePipe(96, 0, 32);
  }),
  new Area("Underwater", function() {
    setLocationGeneration(1);
    goUnderWater();
    
    pushPreFloor(0, 0, 67);
    pushPreThing(Coral, 234, 24, 3);
    fillPreThing(Coin, 258, 7, 2, 1, 8);
    pushPreThing(Stone, 290, jumplev1 + 8, 3, 1);
    pushPreThing(Blooper, 322, 16);
	pushPreThing(CheepCheep, 330, 32, false, false);
    fillPreThing(Coin, 362, jumplev2, 3, 1, 8);
    pushPreThing(Coral, 410, 40, 5);
    fillPreThing(Coin, 434, 7, 3, 1, 8);
    pushPreThing(Stone, 482, jumplev1 + 16, 2, 1);
    pushPreThing(Coral, 482, jumplev1 + 32, 2);
    pushPreThing(Blooper, 514, jumplev1 + 16);
	pushPreThing(CheepCheep, 522, 64, false, false);
    pushPreThing(Coral, 546, 32, 4);
    pushPreThing(Blooper, 586, 24);
	pushPreThing(CheepCheep, 594, 16, false, false);
    pushPreThing(Stone, 658, 24, 1, 3);
    pushPreThing(Stone, 666, 40, 1, 5);
    fillPreThing(Coin, 684, 23, 3, 1, 8);
	pushPreThing(CheepCheep, 702, 80, false, false);
    
    pushPreFloor(714, 0, 60);
    pushPreThing(Stone, 714, 40, 1, 5);
    pushPreThing(Stone, 722, 24, 1, 3);
    pushPreThing(CheepCheep, 754, 24, false, false);
    pushPreThing(Stone, 770, 24, 2, 3);
    pushPreThing(Stone, 770, 88, 2, 3);
    pushPreThing(CheepCheep, 778, 48, false, false);
    pushPreThing(CheepCheep, 794, 16, false, false);
    pushPreThing(Stone, 802, 64, 3, 1);
    pushPreThing(Blooper, 810, 40, false, false);
    pushPreThing(Coral, 810, 80, 2);
    pushPreThing(Coral, 858, 24, 3);
    pushPreThing(Blooper, 898, 80);
    pushPreThing(CheepCheep, 898, 56, false, false);
    pushPreThing(CheepCheep, 922, 80, true, false);
    fillPreThing(Coin, 954, 15, 3, 1, 8);
    pushPreThing(CheepCheep, 954, 24, false, false);
    pushPreThing(Stone, 962, 32, 2, 1);
    pushPreThing(Coral, 962, 64, 4);
    pushPreThing(Blooper, 986, 16);
    fillPreThing(Coin, 1050, 55, 3, 1, 8, 8);
    pushPreThing(Stone, 1066, 40, 2, 1);
    pushPreThing(CheepCheep, 1082, 72, false, false);
    pushPreThing(Coral, 1106, 32, 4);
    pushPreThing(CheepCheep, 1170, 24, true, false);
    pushPreThing(Stone, 1178, 32, 1, 4);
    pushPreThing(Stone, 1186, 16, 1, 2);
    pushPreThing(CheepCheep, 1194, 16, false, false);
    pushPreThing(Stone, 1194, 88, 1, 3);
    pushPreThing(Stone, 1202, 72, 8, 1);
    pushPreThing(Coin, 1210, 15);
    fillPreThing(Coin, 1218, 7, 3, 1, 8);
    pushPreThing(Coin, 1242, 15);
    pushPreThing(CheepCheep, 1238, 40, false, false);
    pushPreFloor(1266, 0, 17);
    pushPreThing(Stone, 1266, 16, 1, 2);
    pushPreThing(Stone, 1274, 32, 1, 4);
    pushPreThing(CheepCheep, 1298, 32, false, false);
    pushPreThing(Coral, 1322, 16, 2);
    pushPreThing(Coral, 1338, 24, 3);
    pushPreThing(CheepCheep, 1344, 56, true, false);
    pushPreThing(Stone, 1394, 64, 1, 8);
    pushPreThing(Stone, 1402, 64, 2, 1);
    fillPreThing(Coin, 1419, 32, 3, 2, 8, -24);
    pushPreThing(Stone, 1442, 64, 2, 1);
    pushPreFloor(1458, 0, 47);
    pushPreThing(Stone, 1458, 64, 1, 8);
    pushPreThing(CheepCheep, 1458, 80, false, false);
    pushPreThing(CheepCheep, 1482, 16, true, false);
    fillPreThing(Stone, 1522, 32, 1, 2, 0, 32, 5, 1);
    pushPreThing(Coral, 1530, 80, 2);
    pushPreThing(CheepCheep, 1546, 40, false, false);
	pushPreThing(Blooper, 1554, 72, false, false);
	pushPreThing(CheepCheep, 20, 40, false, false);
	pushPreThing(CheepCheep, 400, 16, false, false);
	pushPreThing(Blooper, 500, 24, false, false);
	pushPreThing(CheepCheep, 900, 48, false, false);
	pushPreThing(CheepCheep, 978, 56, false, false);
	pushPreThing(CheepCheep, 1120, 72, false, false);
	pushPreThing(Blooper, 1300, 40, false, false);
	pushPreThing(CheepCheep, 1450, 24, false, false);
    fillPreThing(Stone, 1566, 32, 1, 2, 0, 32, 4, 1);
    pushPreThing(CheepCheep, 1590, 72, true, false);
    pushPreThing(CheepCheep, 1614, 48, true, false);
    
    pushPreThing(Stone, 1626, 8, 5, 1);
    pushPreThing(Stone, 1634, 16, 4, 1);
    pushPreThing(Stone, 1642, 24, 3, 1);
    pushPreThing(Stone, 1650, 32, 2, 1);
    pushPreThing(Stone, 1650, 88, 2, 4);
    pushPreThing(PipeSide, 1658, 48, 2, true);
    pushPreThing(Stone, 1666, 88, 14, 11);
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
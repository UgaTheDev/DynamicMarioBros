map.time = 300;
map.locs = [new Location(0, startCastle)];
map.areas = [
  new Area("Castle", function () {
    setLocationGeneration(0);

    endCastleInside(1, "Toad");
    pushPreThing(Platform, 1108, 56, 4, [
      moveSliding,
      1080,
      1112,
    ]).object.nocollidechar = true;
  }),
];

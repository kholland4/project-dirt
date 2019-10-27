//---L1 Machines---

defineMachine(new MachineType(
  "mach:L1_miner", "L1 Miner",
  {mech_energy: -2, stone: 0.5}, {stone: 10},
  new Texture("tiles/default_mach_L1_miner.png"),
  {build_cost: {wood: -6, stone: -3}, build_speed: 0.075}
));

defineMachine(new MachineType(
  "mach:L1_water_mill", "Water Mill",
  {mech_energy: 1.5}, {},
  new Texture("tiles/default_mach_L1_water_mill.png"),
  {build_cost: {wood: -6, stone: -1}, build_speed: 0.1},
  function(tile) {
    var tiles = [main.map.tileAt(tile.x - 1, tile.y), main.map.tileAt(tile.x + 1, tile.y), main.map.tileAt(tile.x, tile.y - 1), main.map.tileAt(tile.x, tile.y + 1)];
    for(var i = 0; i < tiles.length; i++) {
      if(tiles[i].type.name == "default:water") {
        return true;
      }
    }
    return false;
  }
));

defineMachine(new MachineType(
  "mach:L1_water_pump", "Water Pump",
  {water: 0.5}, {},
  new Texture("tiles/default_mach_L1_water_pump.png"),
  {build_cost: {wood: -4, stone: -1}, build_speed: 0.1},
  function(tile) {
    var tiles = [main.map.tileAt(tile.x - 1, tile.y), main.map.tileAt(tile.x + 1, tile.y), main.map.tileAt(tile.x, tile.y - 1), main.map.tileAt(tile.x, tile.y + 1)];
    for(var i = 0; i < tiles.length; i++) {
      if(tiles[i].type.name == "default:water") {
        return true;
      }
    }
    return false;
  }
));

defineMachine(new MachineType(
  "mach:L1_stone_crusher", "Stone Crusher",
  {mech_energy: -1, stone: -0.5, stone_dust: 1}, {stone: 10, stone_dust: 20},
  new Texture("tiles/default_mach_L1_stone_crusher.png"),
  {build_cost: {wood: -7, stone: -3}, build_speed: 0.075}
));

defineMachine(new MachineType(
  "mach:L1_stone_slurry", "Stone Slurrier",
  {mech_energy: -0.5, stone_dust: -1, water: -0.2, stone_slurry: 1}, {stone_dust: 15, water: 4, stone_slurry: 20},
  new Texture("tiles/default_mach_L1_stone_slurry.png"),
  {build_cost: {wood: -6, stone: -2}, build_speed: 0.075}
));

defineMachine(new MachineType(
  "mach:L1_stone_brick", "Stone Bricker",
  {stone_slurry: -0.5, stone_brick: 0.2}, {stone_slurry: 20, stone_brick: 15},
  new Texture("tiles/default_mach_L1_stone_brick.png"),
  {build_cost: {wood: -8, stone: -1}, build_speed: 0.075}
));

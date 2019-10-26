//Groups: floor, dirt

defineTile(new TileType("default:grass", "Grass", ["floor", "dirt"], new Texture("tiles/default_grass.png"), {},
  [
    new TileAction("Clear grass", {}, 1.0, function(tile) { tile.setType("default:dirt"); })
  ]));
defineTile(new TileType("default:dirt", "Dirt", ["floor", "dirt"], new Texture("tiles/default_dirt.png"), {},
  [
    new TileAction("Till", {}, 0.3, function(tile) { tile.setType("default:farmland"); }),
    new TileAction("Dig", {dirt: 1}, 0.2, function(tile) { tile.setType("default:stone"); })
  ]));
defineTile(new TileType("default:farmland", "Farmland", ["dirt"], new Texture("tiles/default_farmland.png"), {},
  [
    new TileAction("Clear", {}, 0.3, function(tile) { tile.setType("default:dirt"); })
  ]));
defineTile(new TileType("default:stone", "Stone", ["floor"], new Texture("tiles/default_stone.png"), {},
  [
    new TileAction("Fill", {dirt: -1}, 0.4, function(tile) { tile.setType("default:dirt"); }),
//    new TileAction("Fill", {water_bucket: -1, bucket: 1}, 0.4, function(tile) { tile.setType("default:water"); }),
    new TileAction("Mine", {stone: 1}, 0.1, function(tile) { tile.setType("default:hole"); })
  ]));
defineTile(new TileType("default:hole", "Hole", [], new Texture("tiles/default_hole.png"), {walkable: false},
  [
    new TileAction("Fill", {stone: -1}, 0.4, function(tile) { tile.setType("default:stone"); })
  ]));
defineTile(new TileType("default:water", "Water", [], new Texture("tiles/default_water.png"), {walkSpeed: 0.5},
  [
    new TileAction("Fill", {dirt: -1}, 0.2, function(tile) { tile.setType("default:dirt"); })
//    new TileAction("Collect", {bucket: -1, water_bucket: 1}, 0.2, function(tile) { tile.setType("default:stone"); })
  ]));

defineTile(new TileType("default:tree", "Tree", [], new Texture("tiles/default_tree.png"), {walkable: false},
  [
    new TileAction("Clear", {wood: 1}, 0.2, function(tile) { tile.clear(); })
  ]));



defineTile(new TileType("default:wood_hut", "Wooden Hut", [],
  function(tile) {
    return this.props.data.tex["q" + tile.sect.x.toString() + "_" + tile.sect.y.toString()].image;
  }, {data: {
    tex: {
      q0_0: new Texture("tiles/default_wood_hut_00.png"),
      q1_0: new Texture("tiles/default_wood_hut_10.png"),
      q0_1: new Texture("tiles/default_wood_hut_01.png"),
      q1_1: new Texture("tiles/default_wood_hut_11.png")
    }
  }, walkable: false, buildable: true, build_cost: {wood: -5}, build_speed: 0.05, multi_tile: true, multi_tile_w: 2, multi_tile_h: 2},
  [
    new TileAction("Clear", {wood: 4}, 0.08, function(tile) { tile.operateAll(function(tile) { tile.clear(); }); })
  ]));

defineTile(new TileType("default:wood_fence", "Wood Fence", [],
  function(tile) {
    var top = main.map.tileAt(tile.x, tile.y - 1).type.name == this.name ? 1 : 0;
    var right = main.map.tileAt(tile.x + 1, tile.y).type.name == this.name ? 1 : 0;
    var bottom = main.map.tileAt(tile.x, tile.y + 1).type.name == this.name ? 1 : 0;
    var left = main.map.tileAt(tile.x - 1, tile.y).type.name == this.name ? 1 : 0;
    
    return this.props.data.tex["p" + top.toString() + right.toString() + bottom.toString() + left.toString()].image;
  }, {data: {
    tex: {
      p0000: new Texture("tiles/default_wood_fence_0000.png"),
      p0001: new Texture("tiles/default_wood_fence_0001.png"),
      p0010: new Texture("tiles/default_wood_fence_0010.png"),
      p0011: new Texture("tiles/default_wood_fence_0011.png"),
      p0100: new Texture("tiles/default_wood_fence_0100.png"),
      p0101: new Texture("tiles/default_wood_fence_0101.png"),
      p0110: new Texture("tiles/default_wood_fence_0110.png"),
      p0111: new Texture("tiles/default_wood_fence_0111.png"),
      
      p1000: new Texture("tiles/default_wood_fence_1000.png"),
      p1001: new Texture("tiles/default_wood_fence_1001.png"),
      p1010: new Texture("tiles/default_wood_fence_1010.png"),
      p1011: new Texture("tiles/default_wood_fence_1011.png"),
      p1100: new Texture("tiles/default_wood_fence_1100.png"),
      p1101: new Texture("tiles/default_wood_fence_1101.png"),
      p1110: new Texture("tiles/default_wood_fence_1110.png"),
      p1111: new Texture("tiles/default_wood_fence_1111.png")
    }
  }, walkable: false, buildable: true, buildable_tile: true, build_cost: {wood: -0.5}, build_speed: 0.5},
  [
    new TileAction("Clear", {wood: 0.5}, 0.5, function(tile) { tile.clear(); })
  ]));

defineTile(new TileType("default:wood_planks", "Wood Flooring", ["floor"], new Texture("tiles/default_wood_planks.png"), {buildable: true, buildable_tile: true, build_cost: {wood: -0.25}, build_speed: 2},
  [
    new TileAction("Clear", {wood: 0.25}, 2, function(tile) { tile.clear(); })
  ]));

defineTile(new TileType("default:egg", "Egg", [], new Texture("tiles/default_egg.png"), {},
  [
    new TileAction("Hatch", {}, 0.4, function(tile) { tile.clear(); var w = createWorker("Worker " + (workers.length + 1)); w.x = tile.x + 0.5; w.y = tile.y + 0.5; })
  ]));

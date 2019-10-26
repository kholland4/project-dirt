class TileAction {
  constructor(name, costs, speed, func) {
    this.name = name;
    this.costs = costs;
    this.speed = speed; //speed in tiles/sec
    this.func = func;
  }
  
  run(tile) {
    var ok = true;
    for(var key in this.costs) {
      if(!canUseMaterial(key, this.costs[key])) {
        ok = false;
      }
    }
    if(!ok) { return false; }
    
    this.func(tile);
    main.map.setTile(tile.x, tile.y, tile);
    
    for(var key in this.costs) {
      useMaterial(key, this.costs[key]);
    }
    
    return true;
  }
}

class TileBuildAction {
  constructor(target, costs, speed) {
    if(typeof(target) == "string") {
      this.target = tiles[target];
    } else {
      this.target = target;
    }
    this.name = "Build " + this.target.printName;
    this.costs = costs;
    this.speed = speed; //speed in tiles/sec
  }
  
  ok(tile) {
    return tile.type.groups.includes("floor");
  }
  
  run(tile) {
    if(!tile.type.groups.includes("floor")) { return false; }
    
    var ok = true;
    for(var key in this.costs) {
      if(!canUseMaterial(key, this.costs[key])) {
        ok = false;
      }
    }
    if(!ok) { return false; }
    
    if(this.target.props.multi_tile) {
      for(var x = 0; x < this.target.props.multi_tile_w; x++) {
        for(var y = 0; y < this.target.props.multi_tile_h; y++) {
          var tile2 = main.map.tileAt(tile.x + x, tile.y + y);
          if(!tile2.type.groups.includes("floor")) { return false; }
        }
      }
      
      for(var x = 0; x < this.target.props.multi_tile_w; x++) {
        for(var y = 0; y < this.target.props.multi_tile_h; y++) {
          var tile2 = main.map.tileAt(tile.x + x, tile.y + y);
          tile2.build(this.target, new Rect(x, y, this.target.props.multi_tile_w, this.target.props.multi_tile_h));
          tile2.changed = true;
          main.map.setTile(tile.x + x, tile.y + y, tile2);
        }
      }
    } else {
      tile.build(this.target);
      tile.changed = true;
      main.map.setTile(tile.x, tile.y, tile);
    }
    
    for(var key in this.costs) {
      useMaterial(key, this.costs[key]);
    }
    
    return true;
  }
}

var tileDefaultProps = {
  walkable: true, walkSpeed: 1, buildable: false, buildable_tile: false, build_cost: {}, build_speed: 0, data: {}, multi_tile: false, multi_tile_w: 1, multi_tile_h: 1,
  on_build: null, on_clear: null,
  is_machine: false, machine_type: null,
  is_pipe: false
};
function overlayProps(props) {
  var obj = Object.assign({}, tileDefaultProps);
  
  for(var prop in props) {
    obj[prop] = props[prop];
  }
  
  return obj;
}

class TileType {
  constructor(name, printName, groups, tex, props, actions) {
    this.name = name;
    this.printName = printName;
    this.groups = groups;
    this.tex = tex;
    this.props = overlayProps(props);
    this.actions = actions;
  }
  
  render(tile) {
    if(this.tex instanceof Texture) {
      return this.tex.image;
    } else {
      return this.tex(tile);
    }
  }
  
  onBuild(tile) {
    if(this.props.on_build != null) {
      this.props.on_build(tile);
    }
  }
  
  onClear(tile) {
    if(this.props.on_clear != null) {
      this.props.on_clear(tile);
    }
  }
}

var tiles = {};
function defineTile(type) {
  tiles[type.name] = type;
}

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

var tileDefaultData = {
  machine_config_local: null, machine_config_global: null, machine_state: null, //NOTE: machine_config_global and machine_state are REFS to the same objects for all of a multi-tile machine
  pipe_config: null, pipe_state: null
}

class Tile {
  constructor(type, underneath=null) {
    if(typeof(type) == "string") {
      this.type = tiles[type];
    } else {
      this.type = type;
    }
    
    this.x = null;
    this.y = null;
    
    if(typeof(underneath) == "string") {
      this.underneath = [tiles[underneath]];
    } else if(this.underneath == null) {
      this.underneath = [];
    } else {
      this.underneath = [underneath];
    }
    
    this.changed = false;
    
    this.sect = new Rect(0, 0, this.type.props.multi_tile_w, this.type.props.multi_tile_h);
    
    this.data = Object.assign({}, tileDefaultData);
  }
  
  clear() {
    this.type.onClear(this);
    if(this.underneath.length > 0) {
      this.setType(this.underneath.pop());
    }
    this.data = {};
  }
  
  build(target, sect=null) {
    this.underneath.push(this.type);
    this.setType(target);
    if(sect != null) {
      this.sect = sect;
    }
    this.type.onBuild(this);
  }
  
  setType(str) {
    //FIXME - if str is null
    if(typeof(str) == "string") {
      this.type = tiles[str];
    } else {
      this.type = str;
    }
    
    this.sect = new Rect(0, 0, this.type.props.multi_tile_w, this.type.props.multi_tile_h);
    
    this.changed = true;
  }
  
  operateAll(func) {
    var xoff = this.x - this.sect.x;
    var yoff = this.y - this.sect.y;
    var w = this.sect.w;
    var h = this.sect.h;
    for(var x = 0; x < w; x++) {
      for(var y = 0; y < h; y++) {
        func(main.map.tileAt(xoff + x, yoff + y));
      }
    }
  }
  
  render() {
    if(this.underneath.length == 0) {
      return this.type.render(this);
    } else {
      var top = this.type.render(this);
      var bottom = this.underneath[this.underneath.length - 1].render(this);
      
      var canvas = document.createElement("canvas");
      canvas.width = bottom.width;
      canvas.height = bottom.height;
      var ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      ctx.webkitImageSmoothingEnabled = false;
      ctx.mozImageSmoothingEnabled = false;
      ctx.drawImage(bottom, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(top, 0, 0, canvas.width, canvas.height);
      return canvas;
    }
  }
  
  clone() {
    var tile = new Tile(this.type);
    tile.x = this.x;
    tile.y = this.y;
    tile.underneath = this.underneath;
    tile.sect = this.sect.clone();
    tile.changed = this.changed;
    //TODO: this.data
    return tile;
  }
}

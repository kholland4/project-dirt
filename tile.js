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

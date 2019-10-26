//TODO: flow visualization - store each consumeOutput request and visualize properties, falloff, etc

var activePipes = [];

function registerPipeInstance(tile) {
  activePipes.push(tile);
}
function destroyPipeInstance(tile) {
  for(var i = 0; i < activePipes.length; i++) {
    if(activePipes[i] == tile) {
      activePipes.splice(i, 1);
      return true;
    }
  }
  return false;
}

class PipeType {
  constructor(name, printName, tex, tile_props, props) {
    this.name = name;
    this.printName = printName;
    
    if(typeof(tex) == "string") {
      this.tex = function(tile) {
        var sides = {top: 0, bottom: 0, left: 0, right: 0};
        for(var side in sides) {
          if(!tile.data.pipe_config.connections[side]) { continue; }
          
          var adj = neighborAt(tile, side);
          //TODO: check for material type
          if(adj.type.props.is_pipe) {
            if(adj.data.pipe_config.connections[oppositeDir(side)]) { sides[side] = 1; continue; }
          } else if(adj.type.props.is_machine) {
            if(adj.data.machine_config_local.adjTransfer[oppositeDir(side)].dir != null) { sides[side] = 1; continue; }
          }
        }
        
        return this.props.data.tex["p" + sides.top.toString() + sides.right.toString() + sides.bottom.toString() + sides.left.toString()].image;
      };
    } else {
      this.tex = tex;
    }
    
    this.tileProps = Object.assign({data: {}, walkable: false, buildable: true, buildable_tile: true, build_cost: {}, build_speed: 1}, tile_props); //, multi_tile: true, multi_tile_w: 2, multi_tile_h: 2};
    this.tileProps.is_pipe = true;
    this.tileProps.machine_type = this;
    this.tileProps.on_build = function(tile) {
      //initialize tile data
      tile.data.pipe_config = new PipeConfig();
      tile.data.pipe_state = new PipeConfig(tile.type.props.machine_type);
      
      registerPipeInstance(tile);
    };
    this.tileProps.on_clear = function(tile) {
      destroyPipeInstance(tile);
      //TODO
    };
    
    if(typeof(tex) == "string") {
      this.tileProps.data.tex = {};
      for(var i = 0; i < 16; i++) {
        var n = i.toString(2).padStart(4, '0');
        this.tileProps.data.tex["p" + n] = new Texture(tex + n + ".png");
      }
    }
    
    
    this.removeCost = {};
    for(var key in this.tileProps.build_cost) { this.removeCost[key] = -this.tileProps.build_cost[key] * 0.8; }
    this.removeSpeed = this.tileProps.build_speed;
    
    this.props = Object.assign({}, props);
  }
  
  consumeOutput(tile, tileTo, material, amount) {
    if(!tile.type.props.is_pipe) { return 0; }
    
    var m = this.crawlNetwork(tile, material);
    
    for(var i = 0; i < m.length; i++) {
      var or = m[i].tile.data.machine_state.outputRate[material];
      var falloff = this.calcFalloff(tile.type.props.machine_type, material, m[i].distance);
      //TODO: fail if falloff == 0
      var newOR = falloff * or;
      
      if(amount >= newOR) {
        m[i].tile.type.props.machine_type.consumeOutput(m[i].tile, neighborAt(m[i].tile, m[i].side), material, or);
        amount -= newOR;
      } else {
        var toConsume = amount * (1 / falloff);
        m[i].tile.type.props.machine_type.consumeOutput(m[i].tile, neighborAt(m[i].tile, m[i].side), material, toConsume);
        amount = 0;
      }
      
      if(amount <= 0) { break; }
    }
    
    return amount <= 0;
  }
  
  availableOutput(tile, tileTo, material, amount) {
    if(!tile.type.props.is_pipe) { return 0; }
    
    var m = this.crawlNetwork(tile, material);
    
    var avail = 0;
    for(var i = 0; i < m.length; i++) {
      var or = m[i].tile.data.machine_state.outputRate[material];
      var falloff = this.calcFalloff(tile.type.props.machine_type, material, m[i].distance);
      //TODO: fail if falloff == 0
      var newOR = falloff * or;
      avail += newOR;
    }
    
    return avail;
  }
  
  crawlNetwork(startTile, material=null) {
    var toVisit = [{tile: startTile, visited: false, distance: 0}];
    var i = 0;
    while(i < toVisit.length) {
      var tile = toVisit[i].tile;
      var dirs = ["top", "bottom", "left", "right"];
      for(var n = 0; n < dirs.length; n++) {
        if(!tile.data.pipe_config.connections[dirs[n]]) { continue; }
        var adj = neighborAt(tile, dirs[n]);
        if(adj == null) { continue; }
        if(!adj.type.props.is_pipe) { continue; }
        
        if(!adj.data.pipe_config.connections[oppositeDir(dirs[n])]) { continue; }
        
        var found = false;
        for(var x = 0; x < toVisit.length; x++) {
          if(toVisit[x].tile == adj) {
            toVisit[x].distance = Math.min(toVisit[x].distance, toVisit[i].distance + 1);
            found = true;
            break;
          }
        }
        
        if(found) { continue; }
        
        toVisit.push({tile: adj, visited: false, distance: toVisit[i].distance + 1});
      }
      toVisit[i].visited = true;
      i++;
    }
    
    var out = [];
    for(var i = 0; i < toVisit.length; i++) {
      var tile = toVisit[i].tile;
      var dirs = ["top", "bottom", "left", "right"];
      for(var n = 0; n < dirs.length; n++) {
        if(!tile.data.pipe_config.connections[dirs[n]]) { continue; }
        var adj = neighborAt(tile, dirs[n]);
        if(adj == null) { continue; }
        if(!adj.type.props.is_machine) { continue; }
        
        var side = oppositeDir(dirs[n]);
        var trans = adj.data.machine_config_local.adjTransfer[side];
        if(trans.dir != 1 || (material != null && trans.type != material)) { continue; }
        
        out.push({tile: adj, distance: toVisit[i].distance + 1, side: side});
      }
    }
    
    return out;
  }
  
  calcFalloff(type, material, distance) {
    var falloffLow = 1;
    var falloffHigh = 0.5;
    
    var propFalloff = {density: null, corrosion: null};
    for(var key in propFalloff) {
      if(!(key in type.props) || !(key in materials[material].props)) { continue; }
      var maxAmt = type.props[key].max;
      var gain = type.props[key].gain;
      var startAmt = materials[material].props[key];
      
      var endAmt = startAmt * (1 + gain * distance);
      if(endAmt > maxAmt) { return 0; }
      
      propFalloff[key] = falloffLow - ((endAmt / maxAmt) * (falloffLow - falloffHigh));
    }
    
    //return average falloff
    var total = 0;
    var count = 0;
    for(var key in propFalloff) {
      if(propFalloff[key] != null) {
        total += propFalloff[key];
        count++;
      }
    }
    if(count == 0) { return 1; }
    return total / count;
  }
}

var pipes = {};

function definePipe(type) {
  pipes[type.name] = type;
  
  defineTile(new TileType("default:" + type.name, type.printName, ["pipe"], type.tex, type.tileProps,
    [
      new TileAction("Remove", type.removeCost, type.removeSpeed, function(tile) { tile.operateAll(function(tile) { tile.clear(); }); })
    ]));
}

class PipeConfig {
  constructor() {
    this.connections = {
      top: true,
      bottom: true,
      left: true,
      right: true
    };
  }
  
  clone() {
    return this;
  }
}

class PipeState {
  constructor(type) {
    
  }
  
  clone() {
    return this;
  }
}

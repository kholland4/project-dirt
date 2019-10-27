var activeMachines = [];

function registerMachineInstance(tile) {
  activeMachines.push(tile);
}
function destroyMachineInstance(tile) {
  for(var i = 0; i < activeMachines.length; i++) {
    if(activeMachines[i] == tile) {
      activeMachines.splice(i, 1);
      return true;
    }
  }
  return false;
}

function side(tile, tileTo) {
  if(tile.x == tileTo.x && tile.y - 1 == tileTo.y) {
    return "top";
  } else if(tile.x == tileTo.x && tile.y + 1 == tileTo.y) {
    return "bottom";
  } else if(tile.x - 1 == tileTo.x && tile.y == tileTo.y) {
    return "left"
  } else if(tile.x + 1 == tileTo.x && tile.y == tileTo.y) {
    return "right";
  } else {
    return null;
  }
}

function neighborAt(tile, dir) {
  if(dir == "top") {
    return main.map.tileAt(tile.x, tile.y - 1);
  } else if(dir == "bottom") {
    return main.map.tileAt(tile.x, tile.y + 1);
  } else if(dir == "left") {
    return main.map.tileAt(tile.x - 1, tile.y);
  } else if(dir == "right") {
    return main.map.tileAt(tile.x + 1, tile.y);
  }
  return null;
}

function oppositeDir(dir) {
  if(dir == "top") { return "bottom"; } else
  if(dir == "bottom") { return "top"; } else
  if(dir == "left") { return "right"; } else
  if(dir == "right") { return "left"; }
  return null;
}

class MachineType {
  constructor(name, printName, production, invCapacity, tex, tile_props, operateCondition=null) {
    this.name = name;
    this.printName = printName;
    this._production = production;
    
    this.tex = tex;
    
    this.tileProps = Object.assign({data: {}, walkable: false, buildable: true, build_cost: {}, build_speed: 1}, tile_props); //, multi_tile: true, multi_tile_w: 2, multi_tile_h: 2};
    this.tileProps.is_machine = true;
    this.tileProps.machine_type = this;
    this.tileProps.on_build = function(tile) {
      //initialize tile data
      if(tile.sect.x == 0 && tile.sect.y == 0) {
        tile.data.machine_config_local = new MachineConfigLocal();
        tile.data.machine_config_global = new MachineConfigGlobal();
        tile.data.machine_state = new MachineState(tile.type.props.machine_type);
    
        tile.data.machine_state.outputRate = {};
        tile.data.machine_state.inputRate = {};
        var prod = tile.type.props.machine_type.production(tile);
        for(var key in prod) {
          if(prod[key] >= 0) {
            tile.data.machine_state.outputRate[key] = 0;
          } else {
            tile.data.machine_state.inputRate[key] = 0;
          }
        }
        
        tile.data.machine_state.og_outputRate = Object.assign({}, tile.data.machine_state.outputRate);
        
        registerMachineInstance(tile);
      } else {
        tile.data.machine_config_local = new MachineConfigLocal();
        var oTile = main.map.tileAt(tile.x - tile.sect.x, tile.y - tile.sect.y);
        tile.data.machine_config_global = oTile.data.machine_config_global;
        tile.data.machine_state = oTile.data.machine_state;
      }
    };
    this.tileProps.on_clear = function(tile) {
      destroyMachineInstance(tile);
      //TODO
    };
    this.removeCost = {};
    for(var key in this.tileProps.build_cost) { this.removeCost[key] = -this.tileProps.build_cost[key] * 0.8; }
    this.removeSpeed = this.tileProps.build_speed;
    
    this.invCapacity = invCapacity;
    
    this._operateCondition = operateCondition;
  }
  
  production(tile) {
    if(this._production instanceof Function) {
      return this._production(tile);
    } else {
      return this._production;
    }
  }
  
  handleInput(tile, tscale) {
    var globalConfig = tile.data.machine_config_global;
    var localConfig = tile.data.machine_config_local;
    var state = tile.data.machine_state;
    
    var prod = this.production(tile);
    var reqs = {};
    for(var key in prod) { if(prod[key] < 0) { reqs[key] = prod[key]; } }
    
    var reqs_original = Object.assign({}, reqs);
    
    //clear input rates
    tile.data.machine_state.inputRate = {};
    var prod = this.production(tile);
    for(var key in prod) {
      if(prod[key] < 0) {
        tile.data.machine_state.inputRate[key] = 0;
      }
    }
    
    //clear per-side input rates
    for(var key in tile.data.machine_config_local.adjTransfer) {
      if(tile.data.machine_config_local.adjTransfer[key].dir == -1) {
        tile.data.machine_state.adjRates[key] = 0;
      }
    }
    
    //QUIT if inventory full
    if(this.outputInvFull(tile)) { return false; }
    
    //QUIT if not allowed by tile, i. e. water mill not by water
    if(this._operateCondition instanceof Function) {
      if(!this._operateCondition(tile)) {
        return false;
      }
    }
    
    //TODO: partial input rates, constrained by input with lowest %
    
    //TODO: check that there's enough input from neighboring machines, pipes, etc.
    //      based on configured inputs
    //      deduct from reqs accordingly
    
    var sources = [];
    
    for(var key in localConfig.adjTransfer) {
      var data = localConfig.adjTransfer[key];
      if(data.dir == -1 && (data.type in reqs)) {
        if(reqs[data.type] < 0) {
          var target = null;
          if(key == "top") { target = main.map.tileAt(tile.x, tile.y - 1); } else
          if(key == "bottom") { target = main.map.tileAt(tile.x, tile.y + 1); } else
          if(key == "left") { target = main.map.tileAt(tile.x - 1, tile.y); } else
          if(key == "right") { target = main.map.tileAt(tile.x + 1, tile.y); } else
          { continue; }
          
          if(target.type.props.is_machine || target.type.props.is_pipe) {
            var avail = target.type.props.machine_type.availableOutput(target, tile, data.type, -reqs[data.type]);
            if(avail > 0) {
              reqs[data.type] += avail;
              sources.push({target: target, type: data.type, amount: -avail});
            }
          }
        }
      }
    }
    
    var storage_used = {};
    
    //check if enough resources are in storage
    for(var key in reqs) {
      if(reqs[key] < 0) {
        if(key in this.invCapacity) {
          storage_used[key] = -Math.min(tile.data.machine_state.inv[key], -reqs[key] * tscale);
          reqs[key] -= storage_used[key] / tscale;
        }
      }
    }
    
    //---
    
    //find constraining input rate
    var min_key = null;
    var min_amount = 1;
    for(var key in reqs) {
      var amt = (reqs_original[key] - reqs[key]) / reqs_original[key];
      if(amt < min_amount) {
        min_amount = amt;
        min_key = key;
      }
    }
    
    if(min_key != null && min_amount < 0.999) { //FIXME needed?
      //constrain all other inputs to min_amount
      
      for(var i = 0; i < sources.length; i++) {
        var key = sources[i].type;
        if(key in storage_used) {
          var amt = sources[i].amount + storage_used[key] / tscale;
          if(amt / reqs_original[key] > min_amount) {
            if(sources[i].amount / reqs_original[key] <= min_amount) {
              var target_rate = min_amount * reqs_original[key] - sources[i].amount;
              storage_used[key] = target_rate * tscale;
              
              reqs[key] = reqs_original[key] - (sources[i].amount + target_rate);
            } else {
              storage_used[key] = 0;
              sources[i].amount = min_amount * reqs_original[key];
              reqs[key] = reqs_original[key] - (min_amount * reqs_original[key]);
            }
          }
        } else {
          var amt = sources[i].amount;
          if(amt / reqs_original[key] > min_amount) {
            sources[i].amount = min_amount * reqs_original[key];
            reqs[key] = reqs_original[key] - (min_amount * reqs_original[key]);
          }
        }
      }
      
      for(var key in storage_used) {
        var inSources = false;
        for(var i = 0; i < sources.length; i++) { if(sources[i].type == key) { inSources = true; } }
        if(inSources) { continue; }
        
        var amt = storage_used[key] / tscale;
        if(amt / reqs_original[key] > min_amount) {
          var target_rate = min_amount * reqs_original[key];
          storage_used[key] = target_rate * tscale;
          
          reqs[key] = reqs_original[key] - target_rate;
        }
      }
    }
    
    //---
    
    //update inputRate
    //FIXME - partial rates
    tile.data.machine_state.inputRate = {};
    //var prod = this.production(tile);
    for(var key in prod) {
      if(prod[key] < 0) {
        tile.data.machine_state.inputRate[key] = reqs_original[key] - reqs[key];
      }
    }
    
    //---
    
    //consume storage resources
    for(var key in storage_used) {
      if(key in this.invCapacity) {
        tile.data.machine_state.inv[key] += storage_used[key];
      }
    }
    
    //consume input from neighboring machines, pipes, etc.
    for(var i = 0; i < sources.length; i++) {
      if(sources[i].amount != 0) {
        sources[i].target.type.props.machine_type.consumeOutput(sources[i].target, tile, sources[i].type, -sources[i].amount);
        
        //FIXME - testing, etc.
        tile.data.machine_state.adjRates[side(tile, sources[i].target)] += sources[i].amount;
      }
    }
    
    return min_amount;
  }
  
  tick1(tile, tscale) {
    //FIXME
    //clear per-side output rates
    for(var key in tile.data.machine_config_local.adjTransfer) {
      if(tile.data.machine_config_local.adjTransfer[key].dir == 1) {
        tile.data.machine_state.adjRates[key] = 0;
      }
    }
  }
  
  tick2(tile, tscale) {
    //compute this first in case of self-referential loops
    var inputOK = this.handleInput(tile, tscale);
    
    //store excess output
    for(var key in tile.data.machine_state.outputRate) {
      if(key in tile.data.machine_state.inv) {
        tile.data.machine_state.inv[key] = Math.min(tile.data.machine_state.inv[key] + tile.data.machine_state.outputRate[key] * tscale, tile.type.props.machine_type.invCapacity[key]);
        //TODO: what about overflows?
      }
    }
    
    if(inputOK !== false) {
      tile.data.machine_state.outputRate = {};
      var prod = this.production(tile);
      for(var key in prod) {
        if(prod[key] >= 0) {
          tile.data.machine_state.outputRate[key] = prod[key] * inputOK;
        }
      }
    } else {
      tile.data.machine_state.outputRate = {};
      var prod = this.production(tile);
      for(var key in prod) {
        if(prod[key] >= 0) {
          tile.data.machine_state.outputRate[key] = 0;
        }
      }
    }
    
    tile.data.machine_state.og_outputRate = Object.assign({}, tile.data.machine_state.outputRate);
  }
  
  consumeOutput(tile, tileTo, material, amount) {
    //verify availableOutput?
    
    if(tile.data.machine_state.outputRate[material] - amount < 0) {
      return false;
    }
    tile.data.machine_state.outputRate[material] -= amount;
    
    tile.data.machine_state.adjRates[side(tile, tileTo)] += amount;
    
    return true;
  }
  
  availableOutput(tile, tileTo, material, amount) {
    var data = tile.data.machine_config_local.adjTransfer[side(tile, tileTo)];
    
    if(data.dir == 1 && data.type == material) {
      return Math.min(amount, tile.data.machine_state.outputRate[material], data.rateLimit);
    } else {
      return 0;
    }
  }
  
  anyInvFull(tile) {
    for(var key in tile.type.props.machine_type.invCapacity) {
      if(tile.data.machine_state.inv[key] >= tile.type.props.machine_type.invCapacity[key]) {
        return true;
      }
    }
    return false;
  }
  
  outputInvFull(tile) {
    var prod = tile.type.props.machine_type.production(tile);
    for(var key in prod) {
      if(prod[key] >= 0) {
        if(key in tile.type.props.machine_type.invCapacity) {
          if(tile.data.machine_state.inv[key] >= tile.type.props.machine_type.invCapacity[key]) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

var machines = {};

function defineMachine(type) {
  machines[type.name] = type;
  
  defineTile(new TileType("default:" + type.name, type.printName, ["mach"], type.tex, type.tileProps,
    [
      new TileAction("Remove", type.removeCost, type.removeSpeed, function(tile) { tile.operateAll(function(tile) { tile.clear(); }); })
    ]));
}

//LOCAL (per-tile) config for things like i/o assignments (NOTE: upon tile creation, restrict to only valid I/O - i. e. only bottom/right, etc.?)
class MachineConfigLocal {
  constructor() {
    this.adjTransfer = {
      top: {dir: null, type: null, rateLimit: Infinity},
      bottom: {dir: null, type: null, rateLimit: Infinity},
      left: {dir: null, type: null, rateLimit: Infinity},
      right: {dir: null, type: null, rateLimit: Infinity}
    };
  }
  
  clone() {
    return this;
  }
}

//GLOBAL machine config, shared by all tiles in a multi-tile machine
class MachineConfigGlobal {
  constructor() {
    
  }
  
  clone() {
    return this;
  }
}

//Machine state, shared by all tiles in a multi-tile machine
class MachineState {
  constructor(type) {
    this.inv = {};
    for(var key in type.invCapacity) {
      this.inv[key] = 0;
    }
    
    this.outputRate = {};
    this.og_outputRate = {};
    
    this.inputRate = {};
    
    this.adjRates = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
  }
  
  clone() {
    return this;
  }
}

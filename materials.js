class MaterialType {
  constructor(name, props) {
    this.name = name;
    this.props = Object.assign({can_have: true}, props);
    this.visible = true;
  }
}

var materials = {};

var playerInv = {};

function registerMaterial(name, props={}) {
  materials[name] = new MaterialType(name, props);
  playerInv[name] = 0;
}

//L1 basic materials
registerMaterial("dirt", {density: 1.5, speed: 0.6, corrosion: 0.1});
registerMaterial("wood", {density: 1, speed: 1, corrosion: 0.1});
registerMaterial("stone", {density: 4, speed: 1, corrosion: 0.2});
//L1 extras
registerMaterial("mech_energy", {can_have: false});
registerMaterial("water", {density: 2, speed: 1, corrosion: 0});

//L2 materials
registerMaterial("stone_dust", {density: 2.5, speed: 0.5, corrosion: 0.15});
registerMaterial("stone_slurry", {density: 2.5, speed: 0.7, corrosion: 0.3});
registerMaterial("stone_brick", {density: 3, speed: 1, corrosion: 0.05});
registerMaterial("iron_ore", {density: 4.5, speed: 1, corrosion: 0.25});
registerMaterial("coal", {density: 2, speed: 1, corrosion: 0.1});

//L3 materials
registerMaterial("iron", {density: 7, speed: 1, corrosion: 0.05});

function useMaterial(name, delta) {
  if(!(name in playerInv)) { playerInv[name] = 0; }
  
  playerInv[name] += delta;
}

function canUseMaterial(name, delta) {
  if(!(name in playerInv)) { playerInv[name] = 0; }
  
  if(playerInv[name] + delta < 0) {
    return false;
  }
  return true;
}

function getMaterialQty(name) {
  if(!(name in playerInv)) { playerInv[name] = 0; }
  
  return playerInv[name];
}

class MaterialType {
  constructor(name, props, materialCategory=null) {
    this.name = name;
    this.props = Object.assign({can_have: true}, props);
    this.visible = true;
    this.materialCategory = materialCategory;
    if(this.materialCategory == null) { this.materialCategory = []; }
  }
}

var materials = {};

var playerInv = {};

function registerMaterial(name, props={}, materialCategory=null) {
  materials[name] = new MaterialType(name, props, materialCategory);
  playerInv[name] = 0;
}

//L1 basic materials
registerMaterial("dirt", {density: 1.5, speed: 0.6, corrosion: 0.1}, ["dust"]);
registerMaterial("wood", {density: 1, speed: 1, corrosion: 0.1}, ["solid"]);
registerMaterial("stone", {density: 4, speed: 1, corrosion: 0.2}, ["solid"]);
//L1 extras
registerMaterial("mech_energy", {can_have: false, energy: 1}, ["mech_energy"]);
registerMaterial("water", {density: 2, speed: 1, corrosion: 0}, ["fluid"]);

//L2 materials
registerMaterial("stone_dust", {density: 2.5, speed: 0.5, corrosion: 0.15}, ["dust"]);
registerMaterial("stone_slurry", {density: 2.5, speed: 0.7, corrosion: 0.3}, ["fluid"]);
registerMaterial("stone_brick", {density: 3, speed: 1, corrosion: 0.05}, ["solid"]);
registerMaterial("iron_ore", {density: 4.5, speed: 1, corrosion: 0.25}, ["solid"]);
registerMaterial("coal", {density: 2, speed: 1, corrosion: 0.1}, ["solid"]);

//L3 materials
registerMaterial("iron", {density: 7, speed: 1, corrosion: 0.05}, ["solid"]);

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

var main = {};

var workers = [];
var laborGroups = [];

var uiActivePlace = null;
var uiActivePlace_pos = null;
var uiPlaceCallback;

var loaded = false;

function init() {
  noise.seed(Math.random());
  
  main.canvas = document.getElementById("main");
  main.canvas.width = window.innerWidth;
  main.canvas.height = window.innerHeight;
  main.ctx = main.canvas.getContext("2d");
  main.ctx.imageSmoothingEnabled = false;
  main.ctx.webkitImageSmoothingEnabled = false;
  main.ctx.mozImageSmoothingEnabled = false;
  main.size = {
    w: main.canvas.width,
    h: main.canvas.height
  };
  
  main.hudRect = new Rect(0, main.size.h - 300, main.size.w, 300);
  
  main.viewport = new Rect(0, 0, main.size.w, main.size.h - main.hudRect.h);
  main.scale = 1;
  
  main.map = new Map();
  
  main.cursor = {x: null, y: null};
  main.activeTile = {x: null, y: null};
  main.activeRegion = null;
  main.activeRegionType = null;
  main.canvas.addEventListener("click", function(e) {
    main.activeTile.x = main.cursor.x;
    main.activeTile.y = main.cursor.y;
    if(main.activeRegion != null) {
      if(main.activeTile.x < main.activeRegion.x || main.activeTile.x >= main.activeRegion.x + main.activeRegion.w ||
         main.activeTile.y < main.activeRegion.y || main.activeTile.y >= main.activeRegion.y + main.activeRegion.h) {
        main.activeRegion = null;
      }
    }
    updateHUD();
    
    if(uiActivePlace != null) {
      uiPlaceCallback(main.cursor.x, main.cursor.y);
    } else {
      updateBuildHUD(); //just to ensure it's updated in case list of tiles changes
    }
  });
  
  main.activeRegionPreview = null;
  var dragState = false;
  var didDrag = false;
  var dragStart = {x: null, y: null};
  main.canvas.addEventListener("mousedown", function(e) {
    dragState = true;
    didDrag = false;
    dragStart = mouseToWorld(e.clientX, e.clientY);
  });
  main.canvas.addEventListener("mousemove", function(e) {
    if(dragState) {
      didDrag = true;
      var currPos = mouseToWorld(e.clientX, e.clientY);
      main.activeRegionPreview = new Rect(Math.min(dragStart.x, currPos.x), Math.min(dragStart.y, currPos.y), Math.abs(currPos.x - dragStart.x) + 1, Math.abs(currPos.y - dragStart.y) + 1);
    }
  });
  main.canvas.addEventListener("mouseup", function(e) {
    if(dragState && didDrag) {
      endPos = mouseToWorld(e.clientX, e.clientY);
      if(endPos.x != dragStart.x || endPos.y != dragStart.y) {
        main.activeRegion = new Rect(Math.min(dragStart.x, endPos.x), Math.min(dragStart.y, endPos.y), Math.abs(endPos.x - dragStart.x) + 1, Math.abs(endPos.y - dragStart.y) + 1);
      } else {
        main.activeRegion = null;
      }
    }
    dragState = false;
    didDrag = false;
    main.activeRegionPreview = null;
  });
  
  main.player = new Entity(0.5, 0.5);
  main.player.tex = new Texture("player.png");
  main.player.name = "Self";
  
  /*for(var i = 1; i <= 10; i++) {
    createWorker("Worker " + i);
  }*/
  createLaborGroup("Group 1");
  createLaborGroup("Group 2");
  createLaborGroup("Group 3");
  createLaborGroup("Group 4");
  
  updateHUD();
  updateBuildHUD();
  updateTaskHUD();
  
  animate();
}

document.addEventListener("DOMContentLoaded", init);

window.addEventListener("resize", function() {
  main.canvas.width = window.innerWidth;
  main.canvas.height = window.innerHeight;
  
  main.ctx = main.canvas.getContext("2d");
  main.ctx.imageSmoothingEnabled = false;
  main.ctx.webkitImageSmoothingEnabled = false;
  main.ctx.mozImageSmoothingEnabled = false;
  
  main.size.w = main.canvas.width;
  main.size.h = main.canvas.height;
  
  main.viewport.w = main.size.w;
  main.viewport.h = main.size.h - main.hudRect.h;
});

var keyState = {
  up: false,
  down: false,
  left: false,
  right: false
};

document.addEventListener("keydown", function(e) {
  if(e.key == "w") { keyState.up = true; }
  if(e.key == "s") { keyState.down = true; }
  if(e.key == "a") { keyState.left = true; }
  if(e.key == "d") { keyState.right = true; }
  
  if(e.key == "-") { main.scale -= 0.5; }
  if(e.key == "=") { main.scale += 0.5; }
  main.scale = Math.max(Math.min(main.scale, 6), 0.5);
});
document.addEventListener("keyup", function(e) {
  if(e.key == "w") { keyState.up = false; }
  if(e.key == "s") { keyState.down = false; }
  if(e.key == "a") { keyState.left = false; }
  if(e.key == "d") { keyState.right = false; }
});

var prevTime = performance.now();
var tickTime = 0;
var tickFrames = 0;

function animate() {
  var loadFile;
  if(!loaded) {
    var ok = true;
    for(var i = 0; i < allTextures.length; i++) {
      if(!allTextures[i].ready()) {
        loadFile = allTextures[i];
        ok = false;
        break;
      }
    }
    if(ok) { loaded = true; }
  }
  
  if(!loaded) {
    main.ctx.fillStyle = "#333";
    main.ctx.fillRect(0, 0, main.size.w, main.size.h);
    
    main.ctx.fillStyle = "#fff";
    main.ctx.font = "16px sans-serif";
    main.ctx.fillText("loading...", 30, 30);
    
    main.ctx.fillText("project-dirt/" + loadFile.url, 30, 50);
    if(loadFile.error) {
      main.ctx.fillStyle = "#c00";
      main.ctx.fillText(" [error]", 30 + main.ctx.measureText("project-dirt/" + loadFile.url).width, 50);
    }
    
    requestAnimationFrame(animate);
    return;
  }
  
  var time = performance.now();
  var timeDelta = time - prevTime;
  prevTime = time;
  var tscale = timeDelta / 1000;
  
  var oldPos = {x: main.player.x, y: main.player.y};
  
  var playerTile = main.map.tileAt(Math.floor(main.player.x), Math.floor(main.player.y));
  var speedFac = playerTile.type.props.walkSpeed;
  
  if(keyState.left) {
    main.player.x -= main.player.walkSpeed.x * tscale * speedFac;
  }
  if(keyState.right) {
    main.player.x += main.player.walkSpeed.x * tscale * speedFac;
  }
  
  var playerTile2 = main.map.tileAt(Math.floor(main.player.x), Math.floor(main.player.y));
  if(!playerTile2.type.props.walkable && playerTile.type.props.walkable) {
    main.player.x = oldPos.x;
    //main.player.y = oldPos.y;
  }
  
  if(keyState.up) {
    main.player.y -= main.player.walkSpeed.y * tscale * speedFac;
  }
  if(keyState.down) {
    main.player.y += main.player.walkSpeed.y * tscale * speedFac;
  }
  
  var playerTile2 = main.map.tileAt(Math.floor(main.player.x), Math.floor(main.player.y));
  if(!playerTile2.type.props.walkable && playerTile.type.props.walkable) {
    //main.player.x = oldPos.x;
    main.player.y = oldPos.y;
  }
  
  var tileSize = new Rect(0, 0, defaultTileSize * main.scale, defaultTileSize * main.scale);
  main.viewport.x = main.player.x * tileSize.w - Math.round(main.viewport.w / 2);
  main.viewport.y = main.player.y * tileSize.h - Math.round(main.viewport.h / 2);
  
  //labor groups
  for(var i = 0; i < laborGroups.length; i++) {
    laborGroups[i].autoAssign();
  }
  
  main.player.tick(tscale);
  for(var i = 0; i < workers.length; i++) {
    workers[i].tick(tscale);
  }
  
  updateCursor();
  render();
  
  if(taskHUDChanged()) {
    updateTaskHUD();
  }
  
  var activeTile = getActiveTile();
  if(activeTile != null) {
    if(activeTile.changed) {
      updateHUD();
      activeTile.changed = false;
    }
  }
  
  tickTime += tscale;
  tickFrames++;
  if(tickFrames >= 10) {
    updateMaterialsHUD();
    
    for(var i = 0; i < activeMachines.length; i++) {
      activeMachines[i].type.props.machine_type.tick1(activeMachines[i], tickTime);
    }
    for(var i = 0; i < activeMachines.length; i++) {
      activeMachines[i].type.props.machine_type.tick2(activeMachines[i], tickTime);
    }
    
    updateMachineInv();
    
    tickFrames = 0;
    tickTime = 0;
  }
  
  requestAnimationFrame(animate);
}

var mouse = {x: 0, y: 0};
document.addEventListener("mousemove", function(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function mouseToWorld(x, y) {
  var bounds = new Rect(main.viewport.x, main.viewport.y, main.viewport.w, main.viewport.h);
  var tileSize = new Rect(0, 0, defaultTileSize * main.scale, defaultTileSize * main.scale);
  
  var startX = -bounds.x;
  var startY = -bounds.y;
  
  var out = {x: 0, y: 0};
  out.x = Math.floor((x - startX) / tileSize.w);
  out.y = Math.floor((y - startY) / tileSize.h);
  return out;
}

function updateCursor() {
  var bounds = new Rect(main.viewport.x, main.viewport.y, main.viewport.w, main.viewport.h);
  var tileSize = new Rect(0, 0, defaultTileSize * main.scale, defaultTileSize * main.scale);
  
  var startX = -bounds.x;
  var startY = -bounds.y;
  
  main.cursor.x = Math.floor((mouse.x - startX) / tileSize.w);
  main.cursor.y = Math.floor((mouse.y - startY) / tileSize.h);
  
  /*var playerReach = 10;
  
  if(main.cursor.x < Math.floor(main.player.x) - playerReach || main.cursor.x > Math.floor(main.player.x) + playerReach || main.cursor.y < Math.floor(main.player.y) - playerReach || main.cursor.y > Math.floor(main.player.y) + playerReach) {
    main.cursor.x = null;
    main.cursor.y = null;
  }*/
}

function createWorker(name) {
  var x = 0.5 + workers.length;
  var y = 0.5;
  if(main.cursor.x != null && main.cursor.y != null) {
    x = main.cursor.x + 0.5;
    y = main.cursor.y + 0.5;
  }
  var w = new Entity(x, y);
  w.tex = new Texture("worker.png");
  w.name = name;
  w.type = "worker";
  w.globalIndex = workers.length;
  workers.push(w);
  
  updateTaskHUD();
  
  return w;
}

function createLaborGroup(name, members=[]) {
  var g = new LaborGroup();
  g.name = name;
  for(var i = 0; i < members.length; i++) {
    g.addMember(members[i]);
  }
  g.globalIndex = laborGroups.length;
  laborGroups.push(g);
  
  updateTaskHUD();
  
  return g;
}

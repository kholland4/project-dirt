var defaultTileSize = 64;
var defaultEntitySize = 32;

function render() {
  //Render map
  var bounds = new Rect(main.viewport.x, main.viewport.y, main.viewport.w, main.viewport.h);
  var tileSize = new Rect(0, 0, defaultTileSize * main.scale, defaultTileSize * main.scale);
  
  var startX = -bounds.x;
  var startY = -bounds.y;
  
  for(var x = Math.floor(bounds.x / tileSize.w); x < Math.ceil((bounds.x + bounds.w) / tileSize.w); x++) {
    for(var y = Math.floor(bounds.y / tileSize.h); y < Math.ceil((bounds.y + bounds.h) / tileSize.h); y++) {
      var tile = main.map.tileAt(x, y);
      main.ctx.drawImage(tile.render(), startX + x * tileSize.w, startY + y * tileSize.h, tileSize.w, tileSize.h);
      
      if(main.cursor.x == x && main.cursor.y == y) {
        main.ctx.beginPath();
        main.ctx.rect(startX + x * tileSize.w + 1, startY + y * tileSize.h + 1, tileSize.w - 4, tileSize.h - 4);
        main.ctx.lineWidth = 4;
        main.ctx.strokeStyle = "#999";
        main.ctx.stroke();
      }
      if(main.activeTile.x == x && main.activeTile.y == y) {
        main.ctx.beginPath();
        main.ctx.rect(startX + x * tileSize.w + 2, startY + y * tileSize.h + 2, tileSize.w - 4, tileSize.h - 4);
        main.ctx.lineWidth = 4;
        main.ctx.strokeStyle = "white";
        main.ctx.stroke();
      }
    }
  }
  
  //Player
  var x = main.player.x * tileSize.w - bounds.x;
  var y = main.player.y * tileSize.h - bounds.y;
  
  var img = main.player.render();
  if(img != undefined) {
    main.ctx.drawImage(img, x - ((defaultEntitySize * main.scale) / 2), y - ((defaultEntitySize * main.scale) / 2), defaultEntitySize * main.scale, defaultEntitySize * main.scale);
  }
  
  //Workers
  for(var i = 0; i < workers.length; i++) {
    var w = workers[i];
    var x = w.x * tileSize.w - bounds.x;
    var y = w.y * tileSize.h - bounds.y;
    
    var img = w.render();
    if(img != undefined) {
      main.ctx.drawImage(img, x - ((defaultEntitySize * main.scale) / 2), y - ((defaultEntitySize * main.scale) / 2), defaultEntitySize * main.scale, defaultEntitySize * main.scale);
    }
    
    if(main.cursor.x == Math.floor(w.x) && main.cursor.y == Math.floor(w.y)) {
      //display tooltip with name
      main.ctx.font = "18px sans-serif";
      var size = main.ctx.measureText(w.name);
      main.ctx.strokeStyle = "black";
      main.ctx.strokeWidth = 4;
      main.ctx.strokeText(w.name, x - (size.width / 2), y + defaultEntitySize);
      main.ctx.fillStyle = "white";
      main.ctx.fillText(w.name, x - (size.width / 2), y + defaultEntitySize);
    } 
  }
  
  //Build selector
  if(uiActivePlace != null && ((main.cursor.x != null && main.cursor.y != null) || uiActivePlace_pos != null)) {
    var type = uiActivePlace.target;
    var tile;
    if(uiActivePlace_pos == null) {
      tile = main.map.tileAt(main.cursor.x, main.cursor.y);
    } else {
      tile = main.map.tileAt(uiActivePlace_pos.x, uiActivePlace_pos.y);
    }
    
    if(type.props.multi_tile) {
      for(var x = tile.x; x < tile.x + type.props.multi_tile_w; x++) {
        for(var y = tile.y; y < tile.y + type.props.multi_tile_h; y++) {
          var tile2 = main.map.tileAt(x, y).clone();
          tile2.sect = new Rect(x - tile.x, y - tile.y, type.props.multi_tile_w, type.props.multi_tile_h);
          var img = type.render(tile2);
          main.ctx.globalAlpha = 0.5;
          main.ctx.drawImage(img, startX + x * tileSize.w, startY + y * tileSize.h, tileSize.w, tileSize.h);
          main.ctx.globalAlpha = 1;
        }
      }
    } else {
      var x = tile.x;
      var y = tile.y;
      
      var img = type.render(tile);
      main.ctx.globalAlpha = 0.5;
      main.ctx.drawImage(img, startX + x * tileSize.w, startY + y * tileSize.h, tileSize.w, tileSize.h);
      main.ctx.globalAlpha = 1;
    }
  }
  
  //Active region
  if(main.activeRegion != null) {
    main.ctx.beginPath();
    main.ctx.rect(startX + main.activeRegion.x * tileSize.w - 2, startY + main.activeRegion.y * tileSize.h - 2, main.activeRegion.w * tileSize.w + 4, main.activeRegion.h * tileSize.h + 4);
    main.ctx.lineWidth = 4;
    main.ctx.strokeStyle = "#333";
    main.ctx.stroke();
  }
  
  if(main.activeRegionPreview != null) {
    main.ctx.beginPath();
    main.ctx.rect(startX + main.activeRegionPreview.x * tileSize.w - 2, startY + main.activeRegionPreview.y * tileSize.h - 2, main.activeRegionPreview.w * tileSize.w + 4, main.activeRegionPreview.h * tileSize.h + 4);
    main.ctx.lineWidth = 4;
    main.ctx.strokeStyle = "#444";
    main.ctx.stroke();
  }
}

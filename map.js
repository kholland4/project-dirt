class Mapgen {
  constructor() {
    
  }
  
  tileAt(x, y) {
    var scale = 5;
    var val = noise.perlin2(x / scale, y / scale);
    
    var tile;
    if(val < -0.2) {
      var tile = new Tile("default:water");
    } else if(val > 0.35) {
      var tile = new Tile("default:tree", "default:grass");
    } else {
      var tile = new Tile("default:grass");
      if(noise.perlin2(x / scale * 3, y / scale * 3) < -0.7) {
        tile.build(tiles["default:egg"]);
      }
    }
    tile.x = x;
    tile.y = y;
    tile.changed = false;
    return tile;
  }
}

class Map {
  constructor() {
    this.mapgen = new Mapgen();
    
    this.data = {};
  }
  
  tileAt(x, y) {
    if((x + "," + y) in this.data) {
      return this.data[x + "," + y];
    } else {
      return this.mapgen.tileAt(x, y);
    }
  }
  
  setTile(x, y, tile) {
    this.data[x + "," + y] = tile;
  }
}

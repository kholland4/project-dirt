class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  clone() {
    return new Rect(this.x, this.y, this.w, this.h);
  }
}

var allTextures = [];

class Texture {
  constructor(url) {
    this.url = url;
    this.image = document.createElement("img");
    this.image.src = this.url;
    this.image.dataset.index = allTextures.length;
    this.image.onerror = function() {
      allTextures[parseInt(this.dataset.index)].error = true;
    };
    
    this.error = false;
    
    allTextures.push(this);
  }
  
  ready() {
    if(!this.image.complete) {
      return false;
    }
    if(typeof this.image.naturalWidth != "undefined" && this.image.naturalWidth == 0) {
      return false;
    }
    return true;
  }
}

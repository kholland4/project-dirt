class Entity {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.tex = null;
    
    this.walkSpeed = {x: 4, y: 4}; //tiles per second
    
    this.workQueue = [];
    this.autoWork = true;
    
    this.currentAction = null;
    this.actionTimer = 0;
    this.actionTimerStart = 0;
    
    this.changed = false;
    
    this.name = "(unnamed)";
    this.type = "default";
    
    this.globalIndex = -1;
  }
  
  tick(timeDelta) {
    if(this.currentAction != null) {
      this.actionTimer -= timeDelta;
      if(this.actionTimer <= 0) {
        var res = this.currentAction.action.run(this.currentAction.tile);
        if(res) {
          for(var i = 0; i < this.workQueue.length; i++) {
            if(this.workQueue[i] == this.currentAction) {
              this.workQueue.splice(i, 1);
              break;
            }
          }
        } else {
          this.currentAction.tried_and_failed = true;
        }
        this.currentAction = null;
        this.changed = true;
      }
    }
    
    if(this.currentAction == null && this.autoWork) {
      if(this.workQueue.length > 0) {
        var index;
        var maxPriority = 0;
        for(var i = 0; i < this.workQueue.length; i++) {
          if(this.workQueue[i].priority > maxPriority && !this.workQueue[i].tried_and_failed) {
            maxPriority = this.workQueue[i].priority;
            index = i;
          }
        }
        
        if(index != undefined) {
          this.runTask(index);
        }
      }
    }
  }
  
  queueTask(tile, action, settings) {
    this.workQueue.push({
      tile: tile,
      action: action,
      priority: settings.priority,
      settings: settings,
      tried_and_failed: false
    });
    this.changed = true;
  }
  takeTask(entry) {
    this.workQueue.push(entry);
    this.changed = true;
  }
  
  runTask(index) {
    var data = this.workQueue[index];
    
    this.currentAction = data;
    this.actionTimer = 1 / data.action.speed;
    this.actionTimerStart = this.actionTimer;
    
    if(this.type == "worker") {
      this.x = data.tile.x + 0.5;
      this.y = data.tile.y + 0.5;
    }
    
    this.changed = true;
  }
  
  render() {
    if(this.tex != null) {
      return this.tex.image;
    } else {
      return null;
    }
  }
}

class LaborGroup {
  constructor() {
    this.workQueue = [];
    
    this.members = [];
    
    this.changed = false;
    
    this.name = "(unnamed)";
    
    this.globalIndex = -1;
  }
  
  addMember(ent) {
    this.members.push(ent);
    this.changed = true;
  }
  removeMember(ent) {
    for(var i = 0; i < this.members.length; i++) {
      if(this.members[i] == ent) {
        this.members.splice(i, 1);
        this.changed = true;
        return true;
      }
    }
    return false;
  }
  
  autoAssign() {
    for(var i = 0; i < this.members.length && this.workQueue.length > 0; i++) {
      var w = this.members[i];
      if(w.workQueue.length == 0) {
        w.takeTask(this.workQueue[0]);
        this.workQueue.splice(0, 1);
        this.changed = true;
      }
    }
  }
  
  tick(timeDelta) {
    
  }
  
  queueTask(tile, action, settings) {
    this.workQueue.push({
      tile: tile,
      action: action,
      priority: settings.priority,
      settings: settings,
      tried_and_failed: false
    });
    this.changed = true;
  }
  takeTask(entry) {
    this.workQueue.push(entry);
    this.changed = true;
  }
  
  runTask(index) {
    
  }
}

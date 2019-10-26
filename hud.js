function getActiveTile() {
  if(main.activeTile.x == null || main.activeTile.y == null) {
    return null;
  }
  return main.map.tileAt(main.activeTile.x, main.activeTile.y);
}

function updateHUD() {
  var tile = getActiveTile();
  if(tile == null) {
    document.getElementById("hudInner").style.display = "none";
  } else {
    if(main.activeRegion == null) {
      document.getElementById("hudTileName").innerText = tile.type.printName;
      document.getElementById("hudTilePos").innerText = "(" + main.activeTile.x + ", " + main.activeTile.y + ")";
    } else {
      //FIXME?
      main.activeRegionType = tile.type.name;
      
      //FIXME!
      if(tile.type.props.multi_tile) {
        main.activeRegionType = null;
      }
      
      document.getElementById("hudTileName").innerText = tile.type.printName;
      var x2 = main.activeRegion.x + main.activeRegion.w - 1;
      var y2 = main.activeRegion.y + main.activeRegion.h - 1;
      document.getElementById("hudTilePos").innerText = "(" + main.activeRegion.x + ", " + main.activeRegion.y + ") - (" + x2 + ", " + y2 + ")";
    }
    
    var qty = 1;
    if(main.activeRegion != null) {
      qty = 0;
      for(var x = main.activeRegion.x; x < main.activeRegion.x + main.activeRegion.w; x++) {
        for(var y = main.activeRegion.y; y < main.activeRegion.y + main.activeRegion.h; y++) {
          tile2 = main.map.tileAt(x, y);
          if(tile2.type.name == main.activeRegionType) {
            qty++;
          }
        }
      }
    }
    
    var actionList = document.getElementById("hudTileActions_items");
    while(actionList.firstChild) { actionList.removeChild(actionList.firstChild); }
    
    for(var i = 0; i < tile.type.actions.length + 1; i++) {
      var action;
      if(i >= tile.type.actions.length) {
        if(!tile.type.groups.includes("floor")) { continue; }
        
        action = {
          name: "Build...",
          costs: {}
        };
      } else {
        action = tile.type.actions[i];
      }
      
      var item = document.createElement("div");
      item.className = "hudTileActions_item";
      item.dataset.index = i;
      item.onclick = function() {
        hudSelectAction(this.dataset.index);
      };
      
      var title = document.createElement("div");
      title.className = "hudTileActions_item_title";
      title.innerText = action.name;
      item.appendChild(title);
      
      var cost = document.createElement("div");
      cost.className = "hudTileActions_item_cost";
      for(var key in action.costs) {
        var span = document.createElement("span");
        if(action.costs[key] < 0) { span.className = "hudTileActions_item_costNegative"; } else
        if(action.costs[key] == 0) { span.className = "hudTileActions_item_costNeutral"; } else
        if(action.costs[key] > 0) { span.className = "hudTileActions_item_costPositive"; }
        span.innerText = key + ": " + (action.costs[key] * qty).toFixed(1);
        cost.appendChild(span);
      }
      item.appendChild(cost);
      
      actionList.appendChild(item);
    }
    
    var settingsBox = document.getElementById("hudTileAC");
    while(settingsBox.firstChild) { settingsBox.removeChild(settingsBox.firstChild); }
    
    var extraBox = document.getElementById("hudExtra");
    while(extraBox.firstChild) { extraBox.removeChild(extraBox.firstChild); }
    
    //---MACHINES---
    var container = document.getElementById("hudMachineProduction");
    while(container.firstChild) { container.removeChild(container.firstChild); }
    
    if(tile.type.props.is_machine) {
      var prod = {};
      var inputRate = tile.data.machine_state.inputRate;
      for(var key in inputRate) { prod[key] = inputRate[key]; }
      var outputRate = tile.data.machine_state.og_outputRate;
      for(var key in outputRate) { prod[key] = outputRate[key]; }
      
      for(var key in prod) {
        var span = document.createElement("span");
        if(prod[key] < 0) { span.className = "hudTileActions_item_costNegative"; } else
        if(prod[key] == 0) { span.className = "hudTileActions_item_costNeutral"; } else
        if(prod[key] > 0) { span.className = "hudTileActions_item_costPositive"; }
        span.innerText = key + ": " + prod[key].toFixed(1) + " /s";
        container.appendChild(span);
      }
    }
    
    //--
    
    var container = document.getElementById("hudMachineInv");
    while(container.firstChild) { container.removeChild(container.firstChild); }
    
    if(tile.type.props.is_machine) {
      for(var key in tile.type.props.machine_type.invCapacity) {
        var entry = document.createElement("div");
        entry.className = "hudMachineInv_entry";
        entry.dataset.material = key;
        
        var text = document.createElement("div");
        text.className = "hudMachineInv_entry_text";
        text.id = "hudMachineInv_entry_text_" + key; //FIXME - security
        text.innerText = key + ": " + tile.data.machine_state.inv[key].toFixed(1) + "/" + tile.type.props.machine_type.invCapacity[key];
        entry.appendChild(text);
        
        if(materials[key].props.can_have) {
          var button = document.createElement("button");
          button.className = "hudMachineInv_entry_button";
          button.innerText = "Take All";
          button.onclick = function() {
            var material = this.parentElement.dataset.material;
            var tile = getActiveTile();
            if(tile == null) { return; }
            
            useMaterial(material, tile.data.machine_state.inv[material]);
            tile.data.machine_state.inv[material] = 0;
            updateHUD();
          };
          entry.appendChild(button);
          
          for(var i = 1; i <= 100; i *= 10) {
            var button = document.createElement("button");
            button.className = "hudMachineInv_entry_button";
            button.innerText = "+" + i;
            button.dataset.amt = i;
            button.onclick = function() {
              var material = this.parentElement.dataset.material;
              var amt = parseInt(this.dataset.amt);
              var tile = getActiveTile();
              if(tile == null) { return; }
              
              useMaterial(material, -amt);
              tile.data.machine_state.inv[material] += amt;
              updateHUD();
            };
            if(!canUseMaterial(key, -i) || tile.data.machine_state.inv[key] + i > tile.type.props.machine_type.invCapacity[key]) {
              button.disabled = true;
            }
            entry.appendChild(button);
          }
        }
        
        container.appendChild(entry);
      }
    }
    
    //--
    
    if(tile.type.props.is_machine) {
      var items = ["top", "bottom", "left", "right"];
      for(var i = 0; i < items.length; i++) {
        var item = items[i];
        var data = tile.data.machine_config_local.adjTransfer[item];
        
        var container = document.getElementById("hudMachineIO_" + item);
        while(container.firstChild) { container.removeChild(container.firstChild); }
        container.dataset.dir = item;
        
        var select = document.createElement("select");
        var opt = document.createElement("option"); opt.value = "0"; opt.innerText = "--"; if(data.dir == null) { opt.selected = true; } select.appendChild(opt);
        var opt = document.createElement("option"); opt.value = "-1"; opt.innerText = "in"; if(data.dir == -1) { opt.selected = true; } select.appendChild(opt);
        var opt = document.createElement("option"); opt.value = "1"; opt.innerText = "out"; if(data.dir == 1) { opt.selected = true; } select.appendChild(opt);
        select.onchange = function() {
          var tile = getActiveTile();
          var dir = this.parentElement.dataset.dir;
          if(this.value == "0") {
            tile.data.machine_config_local.adjTransfer[dir].dir = null;
          } else if(this.value == "-1" || this.value == "1") {
            tile.data.machine_config_local.adjTransfer[dir].dir = parseInt(this.value);
          }
          tile.data.machine_config_local.adjTransfer[dir].type = null;
          updateHUD(); //FIXME
        };
        container.appendChild(select);
        
        if(data.dir == null) { data.type = null; }
        
        var select = document.createElement("select");
        var prod = tile.type.props.machine_type.production(tile);
        //var opt = document.createElement("option"); opt.value = ""; opt.innerText = "--"; select.appendChild(opt);
        for(var key in prod) {
          if(data.dir != null) {
            if(prod[key] * data.dir > 0 || (prod[key] == 0 && data.dir == 1)) {
              if(data.type == null) { data.type = key; }
              var opt = document.createElement("option"); opt.value = key; opt.innerText = key; if(data.type == key) { opt.selected = true; } select.appendChild(opt);
            }
          }
        }
        select.onchange = function() {
          var tile = getActiveTile();
          var dir = this.parentElement.dataset.dir;
          if(this.value != "") {
            tile.data.machine_config_local.adjTransfer[dir].type = this.value;
          }
          updateHUD(); //FIXME
        };
        container.appendChild(select);
        
        var rate = document.createElement("div");
        var rateVal = tile.data.machine_state.adjRates[item];
        //if(tile.data.machine_config_local.adjTransfer[item].dir == 1) { rateVal = -rateVal; }
        if(rateVal != 0) {
          rate.innerText = tile.data.machine_config_local.adjTransfer[item].type + ": " + rateVal.toFixed(1) + " /s";
        }
        
        if(rateVal > 0) {
          rate.className = "hudTileActions_item_costPositive";
        } else if(rateVal < 0) {
          rate.className = "hudTileActions_item_costNegative";
        } else {
          rate.className = "hudTileActions_item_costNeutral";
        }
        container.appendChild(rate);
        
        //container.appendChild(select);
      }
      
      document.getElementById("hudMachineIO").style.display = "block";
    } else {
      document.getElementById("hudMachineIO").style.display = "none";
    }
    
    //--
    
    document.getElementById("hudInner").style.display = "block";
  }
  
  updateMaterialsHUD(true);
}

function updateMaterialsHUD(setColor=false) {
  var invList = document.getElementById("hudMaterials_items");
  if(invList.children.length == Object.keys(playerInv).length) {
    for(var key in playerInv) {
      var entry = document.getElementById("hudMaterials_" + key);
      if(setColor) {
        entry.className = "hudMaterials_entry";
      }
      entry.innerText = key + ": " + playerInv[key].toFixed(1);
    }
  } else {
    while(invList.firstChild) { invList.removeChild(invList.firstChild); }
    
    for(var key in playerInv) {
      var entry = document.createElement("div");
      entry.className = "hudMaterials_entry";
      entry.innerText = key + ": " + playerInv[key].toFixed(1);
      entry.id = "hudMaterials_" + key; //FIXME - security
      invList.appendChild(entry);
    }
  }
}

function updateMachineInv() {
  var tile = getActiveTile();
  if(tile == null) { return; }
  
  var container = document.getElementById("hudMachineProduction");
  while(container.firstChild) { container.removeChild(container.firstChild); }
  
  if(tile.type.props.is_machine) {
    var prod = {};
    var inputRate = tile.data.machine_state.inputRate;
    for(var key in inputRate) { prod[key] = inputRate[key]; }
    var outputRate = tile.data.machine_state.og_outputRate;
    for(var key in outputRate) { prod[key] = outputRate[key]; }
    
    for(var key in prod) {
      var span = document.createElement("span");
      if(prod[key] < 0) { span.className = "hudTileActions_item_costNegative"; } else
      if(prod[key] == 0) { span.className = "hudTileActions_item_costNeutral"; } else
      if(prod[key] > 0) { span.className = "hudTileActions_item_costPositive"; }
      span.innerText = key + ": " + prod[key].toFixed(1) + " /s";
      container.appendChild(span);
    }
  }
  
  //---
  
  if(tile.type.props.is_machine) {
    for(var key in tile.type.props.machine_type.invCapacity) {
      //FIXME: if ids not present?
      var text = document.getElementById("hudMachineInv_entry_text_" + key); //FIXME - security
      text.innerText = key + ": " + tile.data.machine_state.inv[key].toFixed(1) + "/" + tile.type.props.machine_type.invCapacity[key];
    }
  }
  
  //---
  
  if(tile.type.props.is_machine) {
    var items = ["top", "bottom", "left", "right"];
    for(var i = 0; i < items.length; i++) {
      var item = items[i];
      
      var container = document.getElementById("hudMachineIO_" + item);
      
      var rate = container.children[2];
      var rateVal = tile.data.machine_state.adjRates[item];
      //if(tile.data.machine_config_local.adjTransfer[item].dir == 1) { rateVal = -rateVal; }
      if(rateVal != 0) {
        rate.innerText = tile.data.machine_config_local.adjTransfer[item].type + ": " + rateVal.toFixed(1) + " /s";
      } else { rate.innerText = ""; }
      
      if(rateVal > 0) {
        rate.className = "hudTileActions_item_costPositive";
      } else if(rateVal < 0) {
        rate.className = "hudTileActions_item_costNegative";
      } else {
        rate.className = "hudTileActions_item_costNeutral";
      }
      container.appendChild(rate);
    }
  }
}

function hudSelectAction(index) {
  var tile = getActiveTile();
  if(tile == null) { return; }
  
  var qty = 1;
  if(main.activeRegion != null) {
    qty = 0;
    for(var x = main.activeRegion.x; x < main.activeRegion.x + main.activeRegion.w; x++) {
      for(var y = main.activeRegion.y; y < main.activeRegion.y + main.activeRegion.h; y++) {
        tile2 = main.map.tileAt(x, y);
        if(tile2.type.name == main.activeRegionType) {
          qty++;
        }
      }
    }
  }
      
  var settingsBox = document.getElementById("hudTileAC");
  while(settingsBox.firstChild) { settingsBox.removeChild(settingsBox.firstChild); }
  
  var extraBox = document.getElementById("hudExtra");
  while(extraBox.firstChild) { extraBox.removeChild(extraBox.firstChild); }
  
  var actionList = document.getElementById("hudTileActions_items");
  for(var i = 0; i < actionList.children.length; i++) {
    if(i >= tile.type.actions.length) {
      if(i == index) {
        actionList.children[i].className = "hudTileActions_item selected";
        
        var list = document.getElementById("hudTileAC");
        while(list.firstChild) { list.removeChild(list.firstChild); }
        
        var buildables = [];
        for(var key in tiles) {
          if(tiles[key].props.buildable_tile) {
            buildables.push(key);
          }
        }
        
        for(var n = 0; n < buildables.length; n++) {
          var action = new TileBuildAction(tiles[buildables[n]], tiles[buildables[n]].props.build_cost, tiles[buildables[n]].props.build_speed);
          
          var item = document.createElement("div");
          item.className = "hudTileActions_item";
          item.dataset.index = buildables[n];
          item.onclick = function() {
            hudSelectBuild(this.dataset.index);
          };
          
          var title = document.createElement("div");
          title.className = "hudTileActions_item_title";
          title.innerText = action.target.printName;
          item.appendChild(title);
          
          var cost = document.createElement("div");
          cost.className = "hudTileActions_item_cost";
          for(var key in action.costs) {
            var span = document.createElement("span");
            if(action.costs[key] < 0) { span.className = "hudTileActions_item_costNegative"; } else
            if(action.costs[key] == 0) { span.className = "hudTileActions_item_costNeutral"; } else
            if(action.costs[key] > 0) { span.className = "hudTileActions_item_costPositive"; }
            span.innerText = key + ": " + (action.costs[key] * qty).toFixed(1);
            cost.appendChild(span);
          }
          item.appendChild(cost);
          
          list.appendChild(item);
        }
      } else {
        actionList.children[i].className = "hudTileActions_item";
      }
    } else if(i == index) {
      var action = tile.type.actions[i];
      
      actionList.children[i].className = "hudTileActions_item selected";
      
      var settingsBox = document.getElementById("hudTileAC");
      while(settingsBox.firstChild) { settingsBox.removeChild(settingsBox.firstChild); }
      
      var extraBox = document.getElementById("hudExtra");
      while(extraBox.firstChild) { extraBox.removeChild(extraBox.firstChild); }
      
      var table = document.createElement("table");
      table.className = "hudTileAC_table";
      
      var items = [
        {label: "Worker", id: "hudTileAC_workerSelect", type: "dropdown", options: hudGetWorkers(action)},
        {label: "Tool", id: "hudTileAC_toolSelect", type: "dropdown", options: hudGetTools(action)},
        {label: "Priority", id: "hudTileAC_prioritySelect", type: "number", minVal: 1, maxVal: 10, defaultVal: 5}
      ]
      
      for(var x = 0; x < items.length; x++) {
        item = items[x];
        
        var tr = document.createElement("tr");
        tr.className = "hudTileAC_tr";
        var tdLabel = document.createElement("td");
        tdLabel.className = "hudTileAC_tdLeft";
        tdLabel.innerText = item.label;
        tr.appendChild(tdLabel);
        var tdDropdown = document.createElement("td");
        tdDropdown.className = "hudTileAC_tdRight";
        
        if(item.type == "dropdown") {
          var dropdown = document.createElement("select");
          dropdown.className = "hudTileAC_dropdown";
          dropdown.id = item.id;
          for(var n = 0; n < item.options.length; n++) {
            var opt = document.createElement("option");
            opt.innerText = item.options[n][0];
            opt.value = item.options[n][1];
            dropdown.appendChild(opt);
          }
          tdDropdown.appendChild(dropdown);
        } else if(item.type == "number") {
          var input = document.createElement("input");
          input.type = "number";
          input.className = "hudTileAC_number";
          input.id = item.id;
          input.min = item.minVal;
          input.max = item.maxVal;
          input.value = item.defaultVal;
          tdDropdown.appendChild(input);
        }
        
        tr.appendChild(tdDropdown);
        table.appendChild(tr);
      }
      
      settingsBox.appendChild(table);
      
      var button = document.createElement("button");
      button.className = "hudTileAC_button";
      if(main.activeRegion == null) {
        button.innerText = "Assign";
      } else {
        button.innerText = "Assign (" + qty + " tiles)";
      }
      button.dataset.index = index;
      button.onclick = function() {
        if(main.activeTile.x == null || main.activeTile.y == null) {
          return;
        }
        var tile = main.map.tileAt(main.activeTile.x, main.activeTile.y);
        var action = tile.type.actions[this.dataset.index];
        
        var workerName = document.getElementById("hudTileAC_workerSelect").value;
        var tool = document.getElementById("hudTileAC_toolSelect").value;
        var priority = parseInt(document.getElementById("hudTileAC_prioritySelect").value);
        
        if(main.activeRegion == null) {
          hudQueueTask(tile, action, workerName, tool, priority);
        } else {
          for(var x = main.activeRegion.x; x < main.activeRegion.x + main.activeRegion.w; x++) {
            for(var y = main.activeRegion.y; y < main.activeRegion.y + main.activeRegion.h; y++) {
              tile = main.map.tileAt(x, y);
              if(tile.type.name == main.activeRegionType) {
                hudQueueTask(tile, action, workerName, tool, priority);
              }
            }
          }
        }
        
        hudSelectAction(-1);
        
        //FIXME - general, robust HUD updates
        //updateHUD();
      };
      settingsBox.appendChild(button);
      
      var timeCost = document.createElement("span");
      timeCost.className = "hudTileAC_timeCost";
      if(main.activeRegion == null) {
        timeCost.innerText = (1 / action.speed).toFixed(1) + " sec";
      } else {
        var timeEach = (1 / action.speed);
        
        timeCost.innerText = (timeEach * qty).toFixed(1) + " sec (" + timeEach.toFixed(1) + " sec each)";
      }
      settingsBox.appendChild(timeCost);
      
      for(var key in playerInv) {
        var entry = document.getElementById("hudMaterials_" + key);
        entry.innerText = key + ": " + playerInv[key].toFixed(1);
        
        if(key in action.costs) {
          if(canUseMaterial(key, action.costs[key] * qty)) {
            //if(action.costs[key] > 0) {
            //  entry.className = "hudMaterials_entry positive";
            //} else {
              entry.className = "hudMaterials_entry good";
            //}
          } else {
            entry.className = "hudMaterials_entry bad";
          }
        } else {
          entry.className = "hudMaterials_entry";
        }
      }
    } else {
      actionList.children[i].className = "hudTileActions_item";
    }
  }
}

function hudSelectBuild(index) {
  var tile = getActiveTile();
  if(tile == null) { return; }
  
  var qty = 1;
  if(main.activeRegion != null) {
    qty = 0;
    for(var x = main.activeRegion.x; x < main.activeRegion.x + main.activeRegion.w; x++) {
      for(var y = main.activeRegion.y; y < main.activeRegion.y + main.activeRegion.h; y++) {
        tile2 = main.map.tileAt(x, y);
        if(tile2.type.name == main.activeRegionType) {
          qty++;
        }
      }
    }
  }
  
  var actionList = document.getElementById("hudTileAC");
  for(var i = 0; i < actionList.children.length; i++) {
    if(actionList.children[i].dataset.index == index) {
      var action = new TileBuildAction(tiles[index], tiles[index].props.build_cost, tiles[index].props.build_speed);
      
      actionList.children[i].className = "hudTileActions_item selected";
      
      var settingsBox = document.getElementById("hudExtra");
      while(settingsBox.firstChild) { settingsBox.removeChild(settingsBox.firstChild); }
      
      var table = document.createElement("table");
      table.className = "hudTileAC_table";
      
      var items = [
        {label: "Worker", id: "hudTileAC_workerSelect", type: "dropdown", options: hudGetWorkers(action)},
        {label: "Tool", id: "hudTileAC_toolSelect", type: "dropdown", options: hudGetTools(action)},
        {label: "Priority", id: "hudTileAC_prioritySelect", type: "number", minVal: 1, maxVal: 10, defaultVal: 5}
      ];
      
      for(var x = 0; x < items.length; x++) {
        item = items[x];
        
        var tr = document.createElement("tr");
        tr.className = "hudTileAC_tr";
        var tdLabel = document.createElement("td");
        tdLabel.className = "hudTileAC_tdLeft";
        tdLabel.innerText = item.label;
        tr.appendChild(tdLabel);
        var tdDropdown = document.createElement("td");
        tdDropdown.className = "hudTileAC_tdRight";
        
        if(item.type == "dropdown") {
          var dropdown = document.createElement("select");
          dropdown.className = "hudTileAC_dropdown";
          dropdown.id = item.id;
          for(var n = 0; n < item.options.length; n++) {
            var opt = document.createElement("option");
            opt.innerText = item.options[n][0];
            opt.value = item.options[n][1];
            dropdown.appendChild(opt);
          }
          tdDropdown.appendChild(dropdown);
        } else if(item.type == "number") {
          var input = document.createElement("input");
          input.type = "number";
          input.className = "hudTileAC_number";
          input.id = item.id;
          input.min = item.minVal;
          input.max = item.maxVal;
          input.value = item.defaultVal;
          tdDropdown.appendChild(input);
        }
        
        tr.appendChild(tdDropdown);
        table.appendChild(tr);
      }
      
      settingsBox.appendChild(table);
      
      var button = document.createElement("button");
      button.className = "hudTileAC_button";
      if(main.activeRegion == null) {
        button.innerText = "Assign";
      } else {
        button.innerText = "Assign (" + qty + " tiles)";
      }
      button.dataset.index = index;
      button.onclick = function() {
        if(main.activeTile.x == null || main.activeTile.y == null) {
          return;
        }
        var tile = main.map.tileAt(main.activeTile.x, main.activeTile.y);
        var action = new TileBuildAction(tiles[index], tiles[index].props.build_cost, tiles[index].props.build_speed);
        
        var workerName = document.getElementById("hudTileAC_workerSelect").value;
        var tool = document.getElementById("hudTileAC_toolSelect").value;
        var priority = parseInt(document.getElementById("hudTileAC_prioritySelect").value);
        
        if(main.activeRegion == null) {
          hudQueueTask(tile, action, workerName, tool, priority);
        } else {
          for(var x = main.activeRegion.x; x < main.activeRegion.x + main.activeRegion.w; x++) {
            for(var y = main.activeRegion.y; y < main.activeRegion.y + main.activeRegion.h; y++) {
              tile = main.map.tileAt(x, y);
              if(tile.type.name == main.activeRegionType) {
                hudQueueTask(tile, action, workerName, tool, priority);
              }
            }
          }
        }
        
        hudSelectAction(-1);
        
        //FIXME - general, robust HUD updates
        //updateHUD();
      };
      settingsBox.appendChild(button);
      
      var timeCost = document.createElement("span");
      timeCost.className = "hudTileAC_timeCost";
      if(main.activeRegion == null) {
        timeCost.innerText = (1 / action.speed).toFixed(1) + " sec";
      } else {
        var timeEach = (1 / action.speed);
        
        timeCost.innerText = (timeEach * qty).toFixed(1) + " sec (" + timeEach.toFixed(1) + " sec each)";
      }
      settingsBox.appendChild(timeCost);
      
      for(var key in playerInv) {
        var entry = document.getElementById("hudMaterials_" + key);
        entry.innerText = key + ": " + playerInv[key].toFixed(1);
        
        if(key in action.costs) {
          if(canUseMaterial(key, action.costs[key] * qty)) {
            //if(action.costs[key] > 0) {
            //  entry.className = "hudMaterials_entry positive";
            //} else {
              entry.className = "hudMaterials_entry good";
            //}
          } else {
            entry.className = "hudMaterials_entry bad";
          }
        } else {
          entry.className = "hudMaterials_entry";
        }
      }
    } else {
      actionList.children[i].className = "hudTileActions_item";
    }
  }
}

//------------------------

function updateBuildHUD() {
  var list = document.getElementById("hudBuildSel_items");
  while(list.firstChild) { list.removeChild(list.firstChild); }
  
  var buildables = [];
  for(var key in tiles) {
    if(tiles[key].props.buildable && !tiles[key].props.buildable_tile) {
      buildables.push(key);
    }
  }
  
  for(var i = 0; i < buildables.length; i++) {
    var action = new TileBuildAction(tiles[buildables[i]], tiles[buildables[i]].props.build_cost, tiles[buildables[i]].props.build_speed);
    
    var item = document.createElement("div");
    item.className = "hudTileActions_item";
    item.dataset.index = buildables[i];
    item.onclick = function() {
      buildHUDSelect(this.dataset.index);
    };
    
    var title = document.createElement("div");
    title.className = "hudTileActions_item_title";
    title.innerText = action.target.printName;
    item.appendChild(title);
    
    var cost = document.createElement("div");
    cost.className = "hudTileActions_item_cost";
    for(var key in action.costs) {
      var span = document.createElement("span");
      if(action.costs[key] < 0) { span.className = "hudTileActions_item_costNegative"; } else
      if(action.costs[key] == 0) { span.className = "hudTileActions_item_costNeutral"; } else
      if(action.costs[key] > 0) { span.className = "hudTileActions_item_costPositive"; }
      span.innerText = key + ": " + action.costs[key].toFixed(1);
      cost.appendChild(span);
    }
    item.appendChild(cost);
    
    list.appendChild(item);
  }
  
  var settingsBox = document.getElementById("hudBuildSettings");
  while(settingsBox.firstChild) { settingsBox.removeChild(settingsBox.firstChild); }
}

function buildHUDSelect(index) {
  var settingsBox = document.getElementById("hudBuildSettings");
  while(settingsBox.firstChild) { settingsBox.removeChild(settingsBox.firstChild); }
  
  var actionList = document.getElementById("hudBuildSel_items");
  for(var i = 0; i < actionList.children.length; i++) {
    if(actionList.children[i].dataset.index == index) {
      var action = new TileBuildAction(tiles[index], tiles[index].props.build_cost, tiles[index].props.build_speed);
      
      actionList.children[i].className = "hudTileActions_item selected";
      
      var settingsBox = document.getElementById("hudBuildSettings");
      while(settingsBox.firstChild) { settingsBox.removeChild(settingsBox.firstChild); }
      
      var table = document.createElement("table");
      table.className = "hudTileAC_table";
      
      var items = [
        {label: "Worker", id: "hudBuild_workerSelect", type: "dropdown", options: hudGetWorkers(action)},
        {label: "Tool", id: "hudBuild_toolSelect", type: "dropdown", options: hudGetTools(action)},
        {label: "Priority", id: "hudBuild_prioritySelect", type: "number", minVal: 1, maxVal: 10, defaultVal: 5}
      ];
      
      for(var x = 0; x < items.length; x++) {
        item = items[x];
        
        var tr = document.createElement("tr");
        tr.className = "hudTileAC_tr";
        var tdLabel = document.createElement("td");
        tdLabel.className = "hudTileAC_tdLeft";
        tdLabel.innerText = item.label;
        tr.appendChild(tdLabel);
        var tdDropdown = document.createElement("td");
        tdDropdown.className = "hudTileAC_tdRight";
        
        if(item.type == "dropdown") {
          var dropdown = document.createElement("select");
          dropdown.className = "hudTileAC_dropdown";
          dropdown.id = item.id;
          for(var n = 0; n < item.options.length; n++) {
            var opt = document.createElement("option");
            opt.innerText = item.options[n][0];
            opt.value = item.options[n][1];
            dropdown.appendChild(opt);
          }
          tdDropdown.appendChild(dropdown);
        } else if(item.type == "number") {
          var input = document.createElement("input");
          input.type = "number";
          input.className = "hudTileAC_number";
          input.id = item.id;
          input.min = item.minVal;
          input.max = item.maxVal;
          input.value = item.defaultVal;
          tdDropdown.appendChild(input);
        }
        
        tr.appendChild(tdDropdown);
        table.appendChild(tr);
      }
      
      settingsBox.appendChild(table);
      
      var button = document.createElement("button");
      button.className = "hudTileAC_button";
      button.innerText = "Assign";
      button.dataset.index = index;
      button.disabled = true;
      settingsBox.appendChild(button);
      
      var timeCost = document.createElement("span");
      timeCost.className = "hudTileAC_timeCost";
      timeCost.innerText = (1 / action.speed).toFixed(1) + " sec";
      settingsBox.appendChild(timeCost);
      
      for(var key in playerInv) {
        var entry = document.getElementById("hudMaterials_" + key);
        entry.innerText = key + ": " + playerInv[key].toFixed(1);
        
        if(key in action.costs) {
          if(canUseMaterial(key, action.costs[key])) {
            //if(action.costs[key] > 0) {
            //  entry.className = "hudMaterials_entry positive";
            //} else {
              entry.className = "hudMaterials_entry good";
            //}
          } else {
            entry.className = "hudMaterials_entry bad";
          }
        } else {
          entry.className = "hudMaterials_entry";
        }
      }
      
      //---
      
      uiActivePlace = action;
      uiActivePlace_pos = null;
      uiPlaceCallback = function(x, y) {
        button.disabled = false;
        button.dataset.x = x;
        button.dataset.y = y;
        uiActivePlace_pos = {x: x, y: y};
        
        button.onclick = function() {
          var x = parseInt(this.dataset.x);
          var y = parseInt(this.dataset.y);
          
          var tile = main.map.tileAt(x, y);
          var action = uiActivePlace;
          
          var workerName = document.getElementById("hudBuild_workerSelect").value;
          var tool = document.getElementById("hudBuild_toolSelect").value;
          var priority = parseInt(document.getElementById("hudBuild_prioritySelect").value);
          
          hudQueueTask(tile, action, workerName, tool, priority);
          
          uiActivePlace = null;
          buildHUDSelect("");
        };
      };
    } else {
      actionList.children[i].className = "hudTileActions_item";
    }
  }
}

//----

function hudSetTab(parent, id) {
  var tabList = document.getElementById("hudTabSel");
  for(var i = 0; i < tabList.children.length; i++) {
    if(tabList.children[i] == parent) {
      tabList.children[i].className = "hudTabSel_tab selected";
    } else {
      tabList.children[i].className = "hudTabSel_tab";
    }
  }
  
  uiActivePlace = null;
  if(id == "hudTabTile") { updateHUD(); }
  if(id == "hudTabBuild") { updateBuildHUD(); }
  if(id == "hudTabLabor") { updateLaborHUD(); }
  if(id == "hudTabTile" || id == "hudTabBuild") {
    document.getElementById("hudMaterials").style.display = "inline-block";
  } else {
    document.getElementById("hudMaterials").style.display = "none";
  }
  
  var target = document.getElementById(id);
  
  var tabs = document.getElementsByClassName("hudTab");
  for(var i = 0; i < tabs.length; i++) {
    if(tabs[i] != target) {
      tabs[i].style.display = "none";
    }
  }
  target.style.display = "inline-block";
}

//----

function hudGetWorkers(action) {
  var arr = [];
  
  var target = getTaskHUDTarget();
  if(target instanceof LaborGroup) {
    arr.push(["[ (" + target.name + ") ]", taskWorkerSel]);
  } else {
    arr.push(["[ " + target.name + " ]", taskWorkerSel]);
  }
  
  arr.push(["Self", "self"]);
  for(var i = 0; i < laborGroups.length; i++) {
    arr.push(["(" + laborGroups[i].name + ")", "g" + i.toString()]);
  }
  for(var i = 0; i < workers.length; i++) {
    arr.push([workers[i].name, i.toString()]);
  }
  return arr;
}

function hudGetTools(action) {
  return [["None", "none"]];
}

function hudQueueTask(tile, action, workerName, tool, priority) {
  var w = workerByName(workerName);
  
  w.queueTask(tile, action, {priority: priority});
}

//---------------

function workerByName(n) {
  if(n == "self") {
    return main.player;
  } else if(n.startsWith("g")) {
    return laborGroups[parseInt(n.substring(1))];
  } else {
    return workers[parseInt(n)];
  }
}

function getTaskHUDTarget() {
  return workerByName(taskWorkerSel);
}

function taskHUDChanged() {
  var target = getTaskHUDTarget();
  
  return target.changed;
}

var taskWorkerSel = "self";
function updateTaskHUD() {
  var target = getTaskHUDTarget();
  
  var container = document.getElementById("taskHUDList");
  while(container.firstChild) { container.removeChild(container.firstChild); }
  
  var sel = document.getElementById("taskHUDTitle");
  while(sel.firstChild) { sel.removeChild(sel.firstChild); }
  
  var opt = document.createElement("option");
  opt.innerText = "Self";
  if(main.player.workQueue.length > 0) {
    opt.innerText += " (" + main.player.workQueue.length + ")";
  }
  opt.value = "self";
  if(taskWorkerSel == "self") { opt.selected = true; }
  sel.appendChild(opt);
  
  for(var i = 0; i < laborGroups.length; i++) {
    var opt = document.createElement("option");
    opt.innerText = "(" + laborGroups[i].name + ")";
    if(laborGroups[i].workQueue.length > 0) {
      opt.innerText += " (" + laborGroups[i].workQueue.length + ")";
    }
    opt.value = "g" + i.toString();
    if(taskWorkerSel == opt.value) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  }
  
  for(var i = 0; i < workers.length; i++) {
    var opt = document.createElement("option");
    opt.innerText = workers[i].name;
    if(workers[i].workQueue.length > 0) {
      opt.innerText += " (" + workers[i].workQueue.length + ")";
    }
    opt.value = i.toString();
    if(taskWorkerSel == opt.value) {
      opt.selected = true;
    }
    sel.appendChild(opt);
  }
  sel.onchange = function() { taskWorkerSel = this.value; updateTaskHUD(); }
  
  //FIXME
  var newList = [];
  for(var i = 10; i >= 1; i--) {
    for(var n = 0; n < target.workQueue.length; n++) {
      if(target.workQueue[n].priority == i) {
        newList.push([n, target.workQueue[n]]);
      }
    }
  }
  
  if(newList.length == 0) {
    var el = document.createElement("div");
    el.className = "taskHUDNone";
    el.innerText = "(no tasks)";
    container.appendChild(el);
  }
  
  for(var i = 0; i < newList.length; i++) {
    var item = newList[i][1];
    
    var el = document.createElement("div");
    el.className = "taskHUDItem";
    var tile = item.tile;
    el.innerText = tile.type.printName + " (" + tile.x + ", " + tile.y + ") - " + item.action.name + " (" + (1 / item.action.speed).toFixed(1) + " sec)";
    
    if(target.currentAction == item) {
      el.className += " active";
    } else if(item.tried_and_failed) {
      el.className += " failed";
    }
    
    el.dataset.index = newList[i][0];
    el.onclick = function() {
      target.runTask(this.dataset.index);
    };
    
    container.appendChild(el);
  }
  
  target.changed = false;
}

function taskHUDClear() {
  var target = getTaskHUDTarget();
  
  target.workQueue.splice(0, target.workQueue.length);
  target.changed = true;
  if(taskWorkerSel == "auto") { sharedWorkQueue_changed = true; }
}

function taskHUDRetryAll() {
  for(var i = 0; i < workers.length; i++) {
    var found = false;
    for(var n = 0; n < workers[i].workQueue.length; n++) {
      if(workers[i].workQueue[n].tried_and_failed) {
        workers[i].workQueue[n].tried_and_failed = false;
        found = true;
      }
    }
    if(found) {
      workers[i].changed = true;
    }
  }
}

//------------

function hudLaborCol(group) {
  var col = document.createElement("div");
  col.className = "hudCol hudLaborCol";
  
  col.dataset.index = group.globalIndex;
  col.ondragover = function(event) {
    event.preventDefault();
  };
  col.ondrop = function(event) {
    event.preventDefault();
    var index = parseInt(event.dataTransfer.getData("text"));
    
    for(var i = 0; i < laborGroups.length; i++) {
      var g = laborGroups[i];
      for(var n = 0; n < g.members.length; n++) {
        var m = g.members[n];
        if(m.globalIndex == index) {
          g.removeMember(m);
          
          var targetIndex = parseInt(this.dataset.index);
          if(targetIndex >= 0) {
            laborGroups[targetIndex].addMember(m);
          }
          updateLaborHUD();
          return;
        }
      }
    }
    
    //no group found
    var m = workers[index];
    
    var targetIndex = parseInt(this.dataset.index);
    if(targetIndex >= 0) {
      laborGroups[targetIndex].addMember(m);
    }
    updateLaborHUD();
  };
  
  var title = document.createElement("div");
  title.className = "hudCol_title";
  title.innerText = group.name;
  if(group.workQueue.length > 0) {
    title.innerText += " (" + group.workQueue.length + ")";
  }
  col.appendChild(title);
  
  var items = document.createElement("div");
  items.className = "hudCol_items";
  
  for(var i = 0; i < group.members.length; i++) {
    var item = document.createElement("div");
    item.className = "hudLaborItem";
    item.dataset.index = group.members[i].globalIndex;
    
    var name = document.createElement("div");
    name.className = "hudLaborItem_name";
    name.innerText = group.members[i].name;
    if(group.members[i].workQueue.length > 0) {
      name.innerText += " (" + group.members[i].workQueue.length + ")";
    }
    item.appendChild(name);
    
    var settings = document.createElement("div");
    settings.className = "hudLaborItem_settings";
    settings.innerText = "edit";
    settings.onclick = function() {
      var w = workers[this.parentElement.dataset.index];
      //FIXME
      var res = window.prompt("Rename worker", w.name);
      if(res != null) {
        w.name = res;
        updateLaborHUD();
      }
    };
    item.appendChild(settings);
    
    item.draggable = true;
    item.ondragstart = function(event) {
      event.dataTransfer.setData("text", this.dataset.index);
    };
    
    items.appendChild(item);
  }
  
  col.appendChild(items);
  
  return col;
}

function updateLaborHUD() {
  var container = document.getElementById("hudTabLabor");
  while(container.firstChild) { container.removeChild(container.firstChild); }
  
  var allGroup = new LaborGroup();
  allGroup.name = "Unassigned";
  var allAssigned = [];
  for(var i = 0; i < laborGroups.length; i++) {
    allAssigned = allAssigned.concat(laborGroups[i].members);
  }
  for(var i = 0; i < workers.length; i++) {
    var found = false;
    for(var n = 0; n < allAssigned.length; n++) {
      if(allAssigned[n] == workers[i]) {
        found = true;
        break;
      }
    }
    if(!found) {
      allGroup.addMember(workers[i]);
    }
  }
  
  container.appendChild(hudLaborCol(allGroup));
  for(var i = 0; i < laborGroups.length; i++) {
    container.appendChild(hudLaborCol(laborGroups[i]));
  }
}

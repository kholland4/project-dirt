definePipe(new PipeType(
  "pipe:wood", "Wood Pipe",
  "tiles/default_wood_fence_", {build_cost: {wood: -1}, build_speed: 3},
  {density: {max: 3.5, gain: 0.06}, corrosion: {max: 0.5, gain: 0.1}},
  ["fluid"]
));

definePipe(new PipeType(
  "pipe:conveyor", "Conveyor",
  "tiles/default_wood_fence_", {build_cost: {wood: -0.5, stone: -0.5}, build_speed: 3},
  {density: {max: 9, gain: 0.06}, corrosion: {max: 0.5, gain: 0.1}},
  ["solid", "dust"]
));

definePipe(new PipeType(
  "pipe:axle", "Axle",
  "tiles/default_wood_fence_", {build_cost: {wood: -0.75}, build_speed: 3},
  {energy: {max: 3, gain: 0.1}},
  ["mech_energy"]
));

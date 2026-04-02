const registry = {};

export function registerAll(moduleExports) {
  for (const [key, value] of Object.entries(moduleExports)) {
    if (typeof value === "function") {
      registry[key] = value;
    }
  }
}


export function register(name, cls) {
  registry[name] = cls;
  console.log(registry[name]);
}

export function get(name) {
  return registry[name];
}
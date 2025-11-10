let activeComputeFunc = null;
let allFuncs = {};
// Set is used to remove duplicate effects when we add them
let runnableEffects = new Set();
let queue = false;
function computed(cb) {
  activeComputeFunc = cb;
  cb();
  activeComputeFunc = null;
}

const proxiedObject = new Proxy(
  {},
  {
    get(target, prop) {
      if (activeComputeFunc) {
        if (allFuncs[prop]) {
          allFuncs[prop].push(activeComputeFunc);
        } else {
          allFuncs[prop] = [activeComputeFunc];
        }
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      let propFuncs = allFuncs[prop];
      if (propFuncs) {
        propFuncs.forEach((func) => runnableEffects.add(func));
        // queue is used to prevent multiple flush calls
        // because queueMicrotask is async and it will be called after the current call stack is finished
        // so if we have all the effects in the set, we can call flush only once after all synchronous code is finished.
        if (!queue) {
          queue = true;
          queueMicrotask(() => {
            queue = false;
            flush();
          });
        }
      }
      return true;
    },
  }
);
function flush() {
  console.log("flush", runnableEffects);
  const effects = Array.from(runnableEffects);
  while (effects.length) {
    // get the first value and delete it
    const func = effects.shift();
    func();
  }
}

computed(() => {
  console.log("effect one in progress");
  proxiedObject.fullName =
    (proxiedObject.fname ?? "---") + " " + (proxiedObject.lname ?? "---");
});
computed(() => {
  console.log("effect two in progress");
  proxiedObject.test = proxiedObject.fname;
});
console.log("fname changed");
proxiedObject.fname = "ARman";
console.log("lname changed");
proxiedObject.lname = "Amraei";
console.log("fname changed");
proxiedObject.fname = "peji";

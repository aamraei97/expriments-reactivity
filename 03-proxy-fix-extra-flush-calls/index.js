let activeComputeFunc = null;
let allFuncs = {};
let runnableEffects = [];
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
        propFuncs.forEach((func) => runnableEffects.push(func));
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
  while (runnableEffects.length) {
    // get the first value and delete it
    const func = runnableEffects.shift();
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

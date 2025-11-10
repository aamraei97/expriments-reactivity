let activeComputeFunc = null;
let allFuncs = {};
let runnableEffects = [];
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
        runnableEffects = [...runnableEffects, ...propFuncs];
        queueMicrotask(() => {
          flush();
        });
      }
      return true;
    },
  }
);
function flush() {
  while (runnableEffects.length) {
    runnableEffects.shift()();
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

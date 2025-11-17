const output = document.querySelector(".output");
const values = document.querySelector("#values");
const ageToggleBtn = document.querySelector("#age-toggle-btn");
const effectsLinkage = new Map();
values.addEventListener("submit", handleValuesChange);
ageToggleBtn.addEventListener("click", handleAgeToggle);
function handleAgeToggle() {
  addToOutput("age toggle button clicked");
  proxiedFlag.value = !proxiedFlag.value;
  ageToggleBtn.textContent = `consider Age: ${proxiedFlag.value}`;
}
function addToOutput(text) {
  output.innerHTML += `<p>${text}</p>`;
}

function handleValuesChange(e) {
  e.preventDefault(); // prevent page reload

  const formData = new FormData(e.target); // or form
  const data = Object.fromEntries(formData.entries());

  // Todo in 06
  // we need to use a diffing algorithm to compare the old and new values and only call the computed functions if the values have changed
  if (proxiedObject.fname !== data.fname) {
    addToOutput("fname changed");
    proxiedObject.fname = data.fname;
  }
  if (proxiedObject.lname !== data.lname) {
    addToOutput("lname changed");
    proxiedObject.lname = data.lname;
  }
  if (proxiedObject.age !== +data.age) {
    addToOutput("age changed");
    proxiedObject.age = +data.age;
  }
}

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
function onSet({ prop }) {
  let propFuncs = allFuncs[prop];
  console.log(`propFuncs length: ${propFuncs?.size} for prop: ${prop}`);
  if (propFuncs) {
    Array.from(propFuncs).forEach((func) => runnableEffects.add(func));
    // queue is used to prevent multiple flush calls
    // because queueMicrotask is async and it will be called after the current call stack is finished
    // so if we have all the effects in the set, we can call flush only once after all synchronous code is finished.
    console.log("444444", { queue });
    if (!queue) {
      queue = true;
      queueMicrotask(() => {
        queue = false;

        flush();
      });
    }
  }
}
function onGet({ prop }) {
  if (activeComputeFunc) {
    // build up the linkage of the effects -> dependencies
    if (effectsLinkage.has(activeComputeFunc)) {
      let dependencies = effectsLinkage.get(activeComputeFunc);
      dependencies.push(prop);
      effectsLinkage.set(activeComputeFunc, dependencies);
    } else {
      effectsLinkage.set(activeComputeFunc, [prop]);
    }
    console.log(
      `onGet (${prop}): relations of effects -> prop`,
      effectsLinkage.get(activeComputeFunc)
    );

    if (allFuncs[prop]) {
      allFuncs[prop].add(activeComputeFunc);
    } else {
      allFuncs[prop] = new Set([activeComputeFunc]);
    }
    // build up the linkage of the dependencies -> effects
    console.log(
      `onGet (${prop}): relations of props -> effects`,
      allFuncs[prop]
    );
  }
}
const proxiedObject = new Proxy(
  { fname: "Arman", lname: "Amraei", age: 29 },
  {
    get(target, prop) {
      onGet({ prop });
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      onSet({ prop });
      return true;
    },
  }
);
const proxiedFlag = new Proxy(
  { value: true },
  {
    get(target, prop) {
      onGet({ prop });
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      onSet({ prop });
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

    let dependencies = effectsLinkage.get(func);
    console.log("dependencies before cleanup", dependencies);
    if (dependencies?.length) {
      dependencies.forEach((dependency) => {
        if (allFuncs[dependency]?.has(func)) {
          allFuncs[dependency].delete(func);
        }
      });
      effectsLinkage.set(func, []);
    }
    console.log("dependencies after cleanup", effectsLinkage.get(func));
    activeComputeFunc = func;
    func();
    activeComputeFunc = null;
    console.log("dependencies after func call", effectsLinkage.get(func));
  }
  runnableEffects.clear();
}

computed(() => {
  if (proxiedFlag.value) {
    let text =
      (proxiedObject.fname ?? "---") +
      " " +
      (proxiedObject.lname ?? "---") +
      " " +
      proxiedObject.age;
    addToOutput(`effect one in progress: ${text}`);
    proxiedObject.user = text;
  } else {
    let text =
      (proxiedObject.fname ?? "---") +
      " " +
      (proxiedObject.lname ?? "---") +
      " " +
      "age should not be considered";
    addToOutput(`effect one in progress: ${text}`);
    proxiedObject.user = text;
  }
});
// computed(() => {
//   addToOutput("effect two in progress");
//   proxiedObject.test = proxiedObject.fname;
// });

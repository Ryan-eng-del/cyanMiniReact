const taskQueue = [];
const timerQueue = [];
let deadline = 0;
const threshold = 5;

export function scheduleCallback(callback) {
  const newTask = { callback };
  taskQueue.push(newTask); // [workLoop]
  schedule(flushWork);
}
export function schedule(callback) {
  timerQueue.push(callback);
  postMessage();
}

const postMessage = () => {
  const { port1, port2 } = new MessageChannel();
  port1.onmessage = () => {
    let tem = timerQueue.splice(0, timerQueue.length);
    tem.forEach((c) => c());
  };
  port2.postMessage(null);
};

function flushWork() {
  deadline = getCurrentTime() + threshold;
  let currentTask = taskQueue[0]; // {workLoop}
  while (currentTask && !shouldYield()) {
    const { callback } = currentTask;
    callback(); //workLoop
    taskQueue.shift(); // taskQueue = []
    currentTask = taskQueue[0]; // currentTask = undefind
  }
}
export function shouldYield() {
  return getCurrentTime() >= deadline;
}
export function getCurrentTime() {
  return performance.now();
}

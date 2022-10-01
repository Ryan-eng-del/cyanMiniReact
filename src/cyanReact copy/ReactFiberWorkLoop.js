import {
  updateClassComponent,
  updateFunctionComponent,
  updateHostComponent,
} from "./ReactFiberConceil";
import { scheduleCallback, shouldYield } from "./scheduler";
import { isFn, isString, Palcement, Update, updateNodeChildren } from "./util";

// 根节点: div#app
let wipRoot = null;

// 当前正在被conceil和peform的节点
let nextUnitWork = null;

export function scheduleUpdateOnFiber(fiber) {
  fiber.alternate = { ...fiber };
  wipRoot = fiber;
  wipRoot.sibling = null;
  nextUnitWork = wipRoot;
  scheduleCallback(workLoop);
}

// 形成fiber结构的时候是按照 self -> child -> sibling的结构去深度优先遍历的
export function performUnitOfWork(wip) {
  const { type } = wip;
  // console.log(wip, "wip");
  // self
  // 更新自己 -> 协调子节点
  if (isString(type)) {
    updateHostComponent(wip);
  } else if (isFn(type)) {
    if (wip.flag) {
      updateClassComponent(wip);
    } else {
      updateFunctionComponent(wip);
    }
  }
  // 返回下一个更新的fiber
  // child
  if (wip.child) {
    return wip.child;
  }

  // sibling 如果当前wip没有sibling了，去父亲Fiber 也就是returnFiber上去找sibling
  let next = wip;
  while (next) {
    if (next.sibling) return next.sibling;
    next = next.return;
  }
  return null;
}

export function workLoop() {
  while (nextUnitWork && !shouldYield()) {
    nextUnitWork = performUnitOfWork(nextUnitWork);
  }
  if (!nextUnitWork && wipRoot) {
    // 提交
    commitRoot();
  }
}

// 寻找父节点
function getParentNode(fiber) {
  let next = fiber.return;
  // 这里就是在判断函数式组件的时候，函数式组件的子节点应该挂载到函数式组件的父节点上(return)
  if (!next.stateNode) {
    next = next.return;
  }
  return next.stateNode;
}

function commitWorker(fiber) {
  if (!fiber) return;
  const { stateNode, flags } = fiber;
  let parent = getParentNode(fiber);
  //? 这里如果不区分更新和插入，只有插入，那就会在创建一次组件来append

  // updateFunctionComponent 没有挂载stateNode属性， updateHostComponet 会挂载stateNode属性
  // Placement
  if (flags & Palcement && stateNode) parent.appendChild(stateNode);
  // Update
  if (flags & Update && stateNode) {
    updateNodeChildren(stateNode, fiber.alternate.props, fiber.props);
  }

  // commit child
  commitWorker(fiber.child);
  // commit sibling
  commitWorker(fiber.sibling);
}

// 提交
function commitRoot() {
  commitWorker(wipRoot.child);
}

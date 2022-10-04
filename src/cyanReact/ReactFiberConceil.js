import { createFiber } from "./fiber";
import { renderHooks } from "./hooks";
import { isStringOrNumber, sameNode, Update, updateNodeChildren } from "./util";

// 更新原生标签
export function updateHostComponent(wip) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    // update attributes
    updateNodeChildren(wip.stateNode, {}, wip.props);
  }
  // 构建fiber
  reconceilChildren(wip, wip.props.children);
  // console.log(wip, "构建fiber");
}

// 更新函数标签
export function updateFunctionComponent(wip) {
  renderHooks(wip);
  const { type, props } = wip;
  const child = type(props);
  reconceilChildren(wip, child);
}

// 更新类标签
export function updateClassComponent(wip) {
  const { type, props } = wip;
  const child = new type(props);
  reconceilChildren(wip, child.render());
}

// 调和 conceil children 将vnode多叉树结构形成fiber数据结构，fiber数据结构就是在多叉树的基础上，层序采用链表结构来增强关联方便diff，child, sibling, return
// diff v1.0
// 1 2 3 4
// 2 3 4
export function reconceilChildren(returnFiber, children) {
  if (isStringOrNumber(children)) return;
  let previousNewFiber = null;
  children = Array.isArray(children) ? children : [children];
  // 老节点的头节点
  let oldFiber = returnFiber.alternate && returnFiber.alternate.child;
  for (let i = 0; i < children.length; i++) {
    const newChildren = children[i];
    let flag = newChildren?.type?.prototype?.isReactComponent ? true : false;
    const newFiber = createFiber(newChildren, returnFiber, flag);
    const same = sameNode(newChildren, oldFiber);
    if (same) {
      Object.assign(newFiber, {
        alternate: oldFiber,
        stateNode: oldFiber.stateNode,
        flags: Update,
      });
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (!previousNewFiber) {
      returnFiber.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }
}

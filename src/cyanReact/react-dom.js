// import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
// fiber 版本
// function render(vnode, container) {
//   console.log(vnode, "vnode");
//   const fiberRoot = {
//     type: container.nodeName.toLocaleLowerCase(),
//     stateNode: container,
//     props: { children: vnode },
//   };
//   scheduleUpdateOnFiber(fiberRoot);
// }

import {
  MOVE,
  PLACEMENT,
  REACT_CONTEXT,
  REACT_FORWARD_REF,
  REACT_FRAGMENT,
  REACT_MEMO,
  REACT_PROVIDER,
  REACT_TEXT,
} from "./constants";
import { addEvent } from "./event";
import { shallowEqual } from "./util";
function mount(vdom, container) {
  let newDom = createDom(vdom);
  if (!newDom) return;
  container.appendChild(newDom);
  if (newDom.componentDidMount) newDom.componentDidMount();
}

/* Hooks */
// vdom -> dom
let hookState = [];
let hookIndex = 0;
let scheduleUpdate = null;
function render(vdom, container) {
  mount(vdom, container);

  scheduleUpdate = () => {
    hookIndex = 0;
    compareTwoDom(container, vdom, vdom);
  };
}

/* useState是useReducer的语法糖 ->  React源码实现 useState = () => useReducer(null, initialState) */
export function useState(initialState) {
  const hookValue = hookState[hookIndex];
  hookState[hookIndex] = hookValue === undefined ? initialState : hookValue;
  const curIndex = hookIndex;
  function setState(newState) {
    newState =
      typeof newState === "function" ? newState(hookState[curIndex]) : newState;
    hookState[curIndex] = newState;
    // debugger;
    scheduleUpdate();
  }
  return [hookState[hookIndex++], setState];
}

export function useEffect(callback, deps = []) {
  let curIndex = hookIndex;
  // debugger;
  if (hookState[hookIndex]) {
    let [destory, oldDeps] = hookState[hookIndex];
    let isSame = deps && deps.every((item, index) => item === oldDeps[index]);
    if (isSame) {
      hookIndex++;
    } else {
      destory && destory();
      setTimeout(() => {
        const destory = callback();
        hookState[curIndex] = [destory, deps];
      });
      hookIndex++;
    }
  } else {
    setTimeout(() => {
      const destory = callback();
      hookState[curIndex] = [destory, deps];
    });
    hookIndex++;
  }
}

export function useLayoutEffect(callback, deps = []) {
  let curIndex = hookIndex;
  // debugger;
  if (hookState[hookIndex]) {
    let [destory, oldDeps] = hookState[hookIndex];
    let isSame = deps && deps.every((item, index) => item === oldDeps[index]);
    if (isSame) {
      hookIndex++;
    } else {
      destory && destory();
      queueMicrotask(() => {
        const destory = callback();
        hookState[curIndex] = [destory, deps];
      });
      hookIndex++;
    }
  } else {
    queueMicrotask(() => {
      const destory = callback();
      hookState[curIndex] = [destory, deps];
    });
    hookIndex++;
  }
}

export function useRef() {
  hookState[hookIndex] = hookState[hookIndex] || { current: null };
  return hookState[hookIndex++];
}

export function useMemo(factory, deps) {
  if (hookState[hookIndex]) {
    let [memoObj, oldDeps] = hookState[hookIndex];
    let isSame = deps.every((item, index) => item === oldDeps[index]);
    if (isSame) {
      hookIndex++;
      return memoObj;
    } else {
      const memoObj = factory();
      hookState[hookIndex++] = [memoObj, deps];
      return memoObj;
    }
  } else {
    const memoObj = factory();
    hookState[hookIndex++] = [memoObj, deps];
    return memoObj;
  }
}

export function useContext(context) {
  return context._currentValue;
}

export function useImperativeHandle(ref, factory) {
  ref.current = factory();
}
export function useCallback(callback, deps = []) {
  // debugger;
  if (hookState[hookIndex]) {
    let [lastCallback, oldDeps] = hookState[hookIndex];
    let isSame = deps.every((item, index) => item === oldDeps[index]);
    // debugger;
    if (isSame) {
      hookIndex++;
      return lastCallback;
    } else {
      hookState[hookIndex++] = [callback, deps];
      return callback;
    }
  } else {
    hookState[hookIndex++] = [callback, deps];
    return callback;
  }
}

/* useState React源码实现 useState = () => useReducer(null, initialState) */
export function useReducer(reducer, initialState) {
  const hookValue = hookState[hookIndex];
  hookState[hookIndex] = hookValue === undefined ? initialState : hookValue;
  const currentIndex = hookIndex;
  function dispatch(action) {
    let oldState = hookState[currentIndex];
    hookState[currentIndex] = reducer(oldState, action);
    scheduleUpdate();
  }
  return [hookState[hookIndex++], dispatch];
}

function reconceilChildren(vdom, parent) {
  for (let i = 0; i < vdom.length; i++) {
    if (!vdom[i]) return;
    vdom[i].mountIndex = i;
    mount(vdom[i], parent);
  }
}

/* vdom -> dom */
function createDom(vdom) {
  if (!vdom) return;
  const { type, props, ref } = vdom;
  let dom = null;
  if (type && type.$$typeof === REACT_FORWARD_REF) {
    return mountForwardComponent(vdom);
  } else if (type && type.$$typeof === REACT_PROVIDER) {
    return mountProviderComponent(vdom);
  } else if (type && type.$$typeof === REACT_CONTEXT) {
  } else if (type && type.$$typeof === REACT_MEMO) {
    return mountMemoComponent(vdom);
  } else if (type && type.$$typeof === REACT_CONTEXT) {
    return mountContextComponent(vdom);
  } else if (type === REACT_FRAGMENT) {
    dom = document.createDocumentFragment();
  } else if (type === REACT_TEXT) {
    dom = document.createTextNode(props);
  } else if (typeof type == "function") {
    if (type.isReactComponent) return mountClassComponent(vdom);
    else return mountFunctionComponent(vdom);
  } else {
    dom = document.createElement(type);
  }

  // update attributes
  updateProps(dom, {}, props);
  if (props?.children) {
    // debugger;
    if (Array.isArray(props.children)) {
      reconceilChildren(props.children, dom);
    } else if (typeof props.children === "object") {
      props.children.mountIndex = 0;
      mount(props.children, dom);
    }
  }
  /* 将dom挂载到vdom */
  vdom.dom = dom;
  /* 挂载ref */
  if (ref) ref.current = dom;
  return dom;
}

/* Memo组件 */
function mountMemoComponent(vdom) {
  const {
    type: { type: MemoCpn },
    props,
  } = vdom;
  vdom.prevProps = props;
  const renderVdom = MemoCpn(props);
  vdom.oldRenderVdom = renderVdom;
  return createDom(renderVdom);
}

/* Forward组件 */
function mountForwardComponent(vdom) {
  const { type, props, ref } = vdom;
  let renderVdom = type.render(props, ref);
  vdom.oldRenderVdom = renderVdom;
  return createDom(renderVdom);
}

/* class 组件 */
function mountClassComponent(vdom) {
  const { type: ClassComponent, props, ref } = vdom;
  const renderInstance = new ClassComponent(props);
  if (ClassComponent.contextType) {
    renderInstance.context = ClassComponent.contextType._currentValue;
  }
  if (renderInstance.componentWillMount) renderInstance.componentWillMount();
  vdom.classInstance = renderInstance;
  if (ref) ref.current = renderInstance;
  const renderVdom = renderInstance.render();
  renderInstance.oldRenderVdom = vdom.oldRenderVdom = renderVdom;
  let dom = createDom(renderVdom);
  if (renderInstance.componentDidMount) {
    dom.componentDidMount =
      renderInstance.componentDidMount.bind(renderInstance);
  }
  return dom;
}

/* function 组件 */
function mountFunctionComponent(vdom) {
  let { type: FunctionComponent, props } = vdom;
  let renderVdom = FunctionComponent(props);
  vdom.oldRenderVdom = renderVdom;
  return createDom(renderVdom);
}

/* Context Provider */
function mountProviderComponent(vdom) {
  let { type, props } = vdom;
  let context = type._context;
  context._currentValue = props.value;
  let renderVdom = props.children;
  vdom.oldRenderVdom = renderVdom;
  return createDom(renderVdom);
}

/* Context Consumber */
function mountContextComponent(vdom) {
  let { type, props } = vdom;
  let context = type._context;
  let renderVdom = props.children(context._currentValue);
  vdom.oldRenderVdom = renderVdom;
  return createDom(renderVdom);
}
/* 更新dom节点属性 */
function updateProps(dom, oldProps = {}, newProps) {
  /* handle add and update attributes */
  for (const key in newProps) {
    if (key === "children") continue;
    else if (key === "style") {
      let styObj = newProps[key];
      for (const attr in styObj) {
        dom.style[attr] = styObj[attr];
      }
    } else if (/^on[A-Z].*/.test(key)) {
      addEvent(dom, key.toLowerCase(), newProps[key]);
    } else {
      dom[key] = newProps[key];
    }
  }
  // handle delete attrubutes
  for (const key in oldProps) {
    if (!newProps.hasOwnProperty(key)) {
      delete dom[key];
    }
  }
}

/* vdom get dom */
export function findDom(vdom) {
  if (!vdom) return null;
  if (vdom.dom) return vdom.dom;
  else {
    let renderDom = vdom.oldRenderVdom;
    return findDom(renderDom);
  }
}

/* Diff */
export function compareTwoDom(parentDom, oldVdom, newVdom, nextDom) {
  // debugger;

  if (!oldVdom && !newVdom) return;
  else if (oldVdom && !newVdom) {
    unMountVdom(oldVdom);
  } else if (!oldVdom && newVdom) {
    let newDom = createDom(newVdom);
    if (nextDom) parentDom.insertBefore(newDom, nextDom);
    else parentDom.appendChild(newDom);
  } else if (oldVdom && newVdom && oldVdom.type !== newVdom.type) {
    unMountVdom(oldVdom);
    let newDom = createDom(newVdom);
    if (nextDom) parentDom.insertBefore(newDom, nextDom);
    else parentDom.appendChild(newDom);
  } else {
    /* 新老节点都有值，并且类型相同 */
    updateElement(oldVdom, newVdom);
  }
}

/* 可以复用，更新元素节点 */
function updateElement(oldVdom, newVdom) {
  if (oldVdom.type === REACT_TEXT) {
    let currentDom = (newVdom.dom = findDom(oldVdom));
    if (oldVdom.props !== newVdom.props) {
      /* 文本节点做过特殊处理，文字在文本vdom的props属性上 */
      currentDom.textContent = newVdom.props;
    }
  } else if (oldVdom.type.$$typeof === REACT_PROVIDER) {
    updateProviderComponent(oldVdom, newVdom);
  } else if (oldVdom.type.$$typeof === REACT_CONTEXT) {
  } else if (oldVdom.type.$$typeof === REACT_MEMO) {
    updateMemoComponent(oldVdom, newVdom);
  } else if (oldVdom.type.$$typeof === REACT_CONTEXT) {
    updateContextConponent(oldVdom, newVdom);
  } else if (typeof oldVdom.type === "string") {
    let currentDom = (newVdom.dom = findDom(oldVdom));
    updateProps(currentDom, oldVdom.props, newVdom.props);

    updateChildren(currentDom, oldVdom.props.children, newVdom.props.children);
  } else if (typeof oldVdom.type === "function") {
    if (oldVdom.type.isReactComponent) {
      updateClassCpn(oldVdom, newVdom);
    } else {
      updateFunctionCpn(oldVdom, newVdom);
    }
  }
}
/* 更新Memo组件 */
function updateMemoComponent(oldVdom, newVdom) {
  let {
    type: { compare },
    prevProps,
  } = oldVdom;
  compare = compare || shallowEqual;
  /* 不需要更新 */
  // debugger;

  // debugger;
  if (compare(prevProps, newVdom.props)) {
    newVdom.prevProps = prevProps;
    newVdom.oldRenderVdom = oldVdom.oldRenderVdom;
  } else {
    let oldDom = findDom(oldVdom);
    let parentDom = oldDom.parentNode;
    let {
      type: { type: MemoCpn },
      props,
    } = newVdom;
    let renderDom = MemoCpn(props);
    compareTwoDom(parentDom, oldVdom, renderDom);
    newVdom.prevProps = props;
    newVdom.oldRenderVdom = renderDom;
  }
}

/* 更新Provider组件 */
function updateProviderComponent(oldVdom, newVdom) {
  let currentDom = findDom(oldVdom);
  let parentDom = currentDom.parentNode;
  let { type, props } = newVdom;
  let context = type._context;
  context._currentValue = props.value;
  let renderVdom = props.children;
  compareTwoDom(parentDom, oldVdom.oldRenderVdom, renderVdom);
  newVdom.oldRenderVdom = renderVdom;
}

/* 更新Context组件 */
function updateContextConponent(oldVdom, newVdom) {
  let currentDom = findDom(oldVdom);
  let parentDom = currentDom.parentNode;
  let { type, props } = newVdom;
  let context = type._context;
  let renderVdom = props.children(context._currentValue);
  compareTwoDom(parentDom, oldVdom.oldRenderVdom, renderVdom);
  newVdom.oldRenderVdom = renderVdom;
}

/* 更新类组件 */
function updateClassCpn(oldVdom, newVdom) {
  const classInstance = (newVdom.classInstance = oldVdom.classInstance);
  newVdom.oldRednerVdom = oldVdom.oldRenderVdom;
  if (classInstance.componentWillReceiveProps) {
    classInstance.componentWillReceiveProps();
  }
  classInstance.updater.emitUpdate(newVdom.props);
}

/* 更新函数式组件 */
function updateFunctionCpn(oldVdom, newVdom) {
  let currentDom = findDom(oldVdom);
  if (!currentDom) return;
  let { type, props } = newVdom;
  let newRenderVdom = type(props);
  compareTwoDom(currentDom.parentNode, oldVdom.oldRenderVdom, newRenderVdom);
  newVdom.oldRenderVdom = newRenderVdom;
}

/* 更新子节点 */
function updateChildren(parentDom, oldChildren, newChildren) {
  oldChildren = Array.isArray(oldChildren) ? oldChildren : [oldChildren];
  newChildren = Array.isArray(newChildren) ? newChildren : [newChildren];
  /* 增强版DOM diff 可以移动 */
  const keyOldMap = {};
  let lastPlaceIndex = 0;
  const patch = [];
  oldChildren.forEach((item, index) => {
    if (!item) return;
    let oldKey = item.key ? item.key : index;
    keyOldMap[oldKey] = item;
  });

  newChildren.forEach((newChild, index) => {
    if (!newChild) return;
    newChild.mountIndex = index;
    const newKey = newChild.key ? newChild.key : index;
    let oldchild = keyOldMap[newKey];
    if (oldchild) {
      updateElement(oldchild, newChild);
      if (oldchild.mountIndex < lastPlaceIndex) {
        patch.push({
          type: MOVE,
          oldchild,
          newChild,
          mountIndex: index,
        });
      }
      delete keyOldMap[newKey];
      lastPlaceIndex = Math.max(lastPlaceIndex, oldchild.mountIndex);
    } else {
      patch.push({
        type: PLACEMENT,
        newChild,
        mountIndex: index,
      });
    }
  });

  /* 过滤出来patch补丁包当中需要移动的老节点 */
  let moveChildren = patch
    .filter((action) => action.type === MOVE)
    .map((action) => action.oldchild);

  /* 先将需要移动和删除的节点删除 */
  Object.values(keyOldMap)
    .concat(moveChildren)
    .forEach((oldChild) => {
      let currentDom = findDom(oldChild);
      currentDom.remove();
    });

  /* 处理新增和移动 */
  patch.forEach((action) => {
    let { type, oldchild, newChild, mountIndex } = action;
    let childNodes = parentDom.childNodes;
    if (type === PLACEMENT) {
      let newDom = createDom(newChild);
      let childNode = childNodes[mountIndex];
      if (childNode) {
        parentDom.insertBefore(newDom, childNode);
      } else {
        parentDom.appendChild(newDom);
      }
    } else if (type === MOVE) {
      const oldDom = findDom(oldchild);
      let childNode = childNodes[mountIndex];
      if (childNode) {
        parentDom.insertBefore(oldDom, childNode);
      } else {
        parentDom.appendChild(oldDom);
      }
    }
  });

  /* 简易版DOM diff 一一对比*/
  // const maxLength = Math.max(oldChildren.length, newChildren.length);
  // for (let index = 0; index < maxLength; index++) {
  //   let nextVdom = oldChildren.find((item, i) => i > index && item);
  //   compareTwoDom(
  //     parentDom,
  //     oldChildren[index],
  //     newChildren[index],
  //     findDom(nextVdom)
  //   );
  // }
}

/* 删除老节点 */
function unMountVdom(vdom) {
  let { props, ref, classInstance } = vdom;
  let currentDom = findDom(vdom);
  if (classInstance && classInstance.componentWillMount) {
    classInstance.componentWillMount();
  }
  if (ref) ref.current = null;

  if (props?.children) {
    let children = Array.isArray(props.children)
      ? props.children
      : [props.children];
    children.forEach(unMountVdom);
  }

  /* 将该元素所在的Dom结构中删除 */
  if (currentDom) currentDom.remove();
}

function createPortal(vdom, container) {
  if (!container) container = document.createElement("div");
  document.body.appendChild(container);
  container.setAttribute("id", "dialog");
  return mount(vdom, container);
}
//eslint-disable-next-line
export default { render, createPortal };

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

import { REACT_FORWARD_REF, REACT_TEXT } from "./constants";
import { addEvent } from "./event";

// vdom -> dom
function render(vdom, container) {
  let newDom = createDom(vdom);
  container.appendChild(newDom);
  if (newDom.componentDidMount) newDom.componentDidMount();
}

function reconceilChildren(vdom, parent) {
  for (let i = 0; i < vdom.length; i++) {
    render(vdom[i], parent);
  }
}

/* vdom -> dom */
function createDom(vdom) {
  const { type, props, ref } = vdom;
  let dom = null;
  if (type && type.$$typeof === REACT_FORWARD_REF) {
    return mountForwardComponent(vdom);
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
  if (props.children) {
    if (Array.isArray(props.children)) {
      reconceilChildren(props.children, dom);
    } else if (typeof props.children === "object") {
      render(props.children, dom);
    }
  }
  /* 将dom挂载到vdom */
  vdom.dom = dom;
  /* 挂载ref */
  if (ref) ref.current = dom;
  return dom;
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

/* 更新dom节点属性 */
function updateProps(dom, oldProps = {}, newProps) {
  /* handle add and update attributes */
  for (const key in newProps) {
    if (key === "children") continue;
    else if (key === "style") {
      let styObj = newProps[key];
      for (const attr of styObj) {
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
export function compareTwoDom(parentDom, oldVdom, newVdom) {
  // debugger;
  if (!oldVdom && !newVdom) return;
  else if (oldVdom && !newVdom) {
    unMountVdom(oldVdom);
  } else if (!oldVdom && newVdom) {
    let newDom = createDom(newVdom);
    parentDom.appendChild(newDom); //Bug
  } else if (oldVdom && newVdom && oldVdom.type !== newVdom.type) {
    unMountVdom(oldVdom);
    let newDom = createDom(newVdom);
    parentDom.appendChild(newDom); //Bug
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
/* 更新类组件 */
function updateClassCpn(oldVdom, newVdom) {
  console.log(oldVdom, newVdom);
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
  const maxLength = Math.max(oldChildren.length, newChildren.length);
  for (let index = 0; index < maxLength; index++) {
    compareTwoDom(parentDom, oldChildren[index], newChildren[index]);
  }
}

/* 删除老节点 */
function unMountVdom(vdom) {
  console.log("卸载");
  let { props, ref, classInstance } = vdom;
  console.log(vdom);
  let currentDom = findDom(vdom);
  if (classInstance && classInstance.componentWillMount) {
    classInstance.componentWillMount();
  }
  if (ref) ref.current = null;
  if (props.children) {
    let children = Array.isArray(props.children)
      ? props.children
      : [props.children];
    children.forEach(unMountVdom);
  }

  /* 将该元素所在的Dom结构中删除 */
  if (currentDom) currentDom.remove();
}
//eslint-disable-next-line
export default { render };

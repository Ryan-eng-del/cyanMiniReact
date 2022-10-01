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
}

function reconceilChildren(vdom, parent) {
  for (let i = 0; i < vdom.length; i++) {
    render(vdom[i], parent);
  }
}

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
  if (ref) ref.current = renderInstance;
  const renderVdom = renderInstance.render();
  renderInstance.oldRenderVdom = vdom.oldRenderVdom = renderVdom;
  return createDom(renderVdom);
}

/* function 组件 */
function mountFunctionComponent(vdom) {
  let { type: FunctionComponent, props } = vdom;
  let renderVdom = FunctionComponent(props);
  vdom.oldRenderVdom = renderVdom;
  return createDom(renderVdom);
}

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

export function compareTwoDom(parentDom, oldVdom, newVdom) {
  let oldDom = findDom(oldVdom);
  let newDom = createDom(newVdom);
  parentDom.replaceChild(newDom, oldDom);
}
//eslint-disable-next-line
export default { render };

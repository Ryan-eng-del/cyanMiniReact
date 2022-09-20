import { isString } from "./util";

function render(vnode, container) {
  console.log(vnode, "vnode");
  // vnode -> node
  const node = createNode(vnode);
  // node 放入 container
  container.appendChild(node);
}

// vnode -> node
function createNode(vnode) {
  const { type, props } = vnode;
  let node = null;
  if (isString(type)) {
    node = document.createElement(type);
    // recursion
    reconcilChilren(props.children, node);
    // update attrubutes
    updateAttributes(node, props);
  } else if (typeof type === "function") {
    node = type.prototype.isReactComponent
      ? updateClassComponent(vnode)
      : updateFunctionComponent(vnode);
  } else {
    // 文本节点
    node = document.createTextNode(vnode);
  }
  return node;
}

// 渲染函数组件
function updateFunctionComponent(vnode) {
  const { type, props } = vnode;
  const child = type(props);
  const node = createNode(child);
  return node;
}

// 渲染类组件
function updateClassComponent(vnode) {
  const { type, props } = vnode;
  const child = new type(props).render();
  const node = createNode(child);
  return node;
}
//渲染节点属性
function updateAttributes(node, props) {
  Object.keys(props)
    .filter((i) => i != "children")
    .forEach((i) => {
      node[i] = props[i];
    });
}

// recursion
function reconcilChilren(children, parent) {
  children = Array.isArray(children) ? children : [children];
  for (let index = 0; index < children.length; index++) {
    render(children[index], parent);
  }
}
//eslint-disable-next-line
export default { render };

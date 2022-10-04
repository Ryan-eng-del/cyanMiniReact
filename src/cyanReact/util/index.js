import { REACT_ELEMENT, REACT_TEXT } from "../constants";

export const isString = (type) => {
  return typeof type === "string";
};
// 标记该节点的diff后的action是 替换，更新还是删除，使用二进制的时候，切换状态会更快，更加方便。
export const NoFlags = 0b0;
export const Palcement = 0b00010;
export const Update = 0b00100;
export const Delete = 0b01000;

//更新DOM的属性
export function updateNodeChildren(node, prevVal, nextVal) {
  Object.keys(prevVal)
    // .filter(k => k !== "children")
    .forEach((k) => {
      if (k === "children") {
        // 有可能是文本
        if (isStringOrNumber(prevVal[k])) {
          node.textContent = "";
        }
      } else if (k.slice(0, 2) === "on") {
        const eventName = k.slice(2).toLocaleLowerCase();
        node.removeEventListener(eventName, prevVal[k]);
      } else {
        if (!(k in nextVal)) {
          node[k] = "";
        }
      }
    });
  Object.keys(nextVal)
    // .filter(k => k !== "children")
    .forEach((k) => {
      if (k === "children") {
        // 有可能是文本
        if (isStringOrNumber(nextVal[k])) {
          node.textContent = nextVal[k] + "";
        }
      } else if (k.slice(0, 2) === "on") {
        const eventName = k.slice(2).toLocaleLowerCase();
        node.addEventListener(eventName, nextVal[k]);
      } else {
        node[k] = nextVal[k];
      }
    });
}

export const isStringOrNumber = (val) => {
  return typeof val === "number" || typeof val === "string";
};

export const isFn = (type) => {
  return typeof type === "function";
};

export const sameNode = (a, b) => {
  console.log(a, b, "diff");
  return !!(a && b && a.key === b.key && a.type === b.type);
};

export function toVom(element) {
  return typeof element == "string" || typeof element == "number"
    ? { $$typeof: REACT_ELEMENT, type: REACT_TEXT, props: element }
    : element;
}

export function shallowEqual(oldData, newData) {
  if (oldData === newData) return true;
  let keys1 = Object.keys(oldData);
  let keys2 = Object.keys(newData);
  if (keys1.length !== keys2.length) return false;
  for (const k of keys1) {
    if (!newData.hasOwnProperty(k) || newData[k] !== oldData[k]) return false;
  }
  return true;
}

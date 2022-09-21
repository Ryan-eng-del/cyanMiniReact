export const isString = (type) => {
  return typeof type === "string";
};

const isArrayString = (arr) => {
  return arr.every((i) => isString(i));
};
//更新DOM的属性
export function updateNodeChildren(stateNode, props) {
  console.log(stateNode, props, "stateNode, props");
  Object.keys(props).forEach((attr) => {
    let val = props[attr];
    if (attr === "children") {
      if (isString(val)) {
        stateNode.textContent = val;
      }
      if (Array.isArray(val) && isArrayString(val)) {
        stateNode.textContent = val.join("");
      }
    } else {
      stateNode[attr] = val;
    }
  });
}

export const isFn = (type) => {
  return typeof type === "function";
};

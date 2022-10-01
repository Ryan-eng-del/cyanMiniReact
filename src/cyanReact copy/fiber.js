import { Palcement } from "./util";

export function createFiber(vnode, returnFiber, flag) {
  const fiber = {
    type: vnode.type,
    key: vnode.key,
    props: vnode.props,
    stateNode: null, // 原生标签时候指dom节点，类组件时候指的是实例
    child: null, // 第一个子fiber
    sibling: null, // 下一个兄弟fiber
    return: returnFiber, // 父fiber
    // flags
    flag,
    flags: Palcement,
    // 老节点 复用的时候，新节点去找老节点去diff或者说是更新
    alternate: null,
  };
  return fiber;
}

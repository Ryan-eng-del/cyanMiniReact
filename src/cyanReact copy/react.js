import { REACT_ELEMENT } from "./constants";
import { compareTwoDom, findDom } from "./react-dom";
import { toVom } from "./util";
/* createElement */
function createElement(type, config, children) {
  let props = { ...config };
  delete props?.__self;
  delete props?.__source;
  if (arguments.length > 3) {
    props.children = Array.prototype.slice.call(arguments, 2).map(toVom);
  } else if (arguments.length === 3) {
    props.children = toVom(children);
  }
  return {
    $$typeof: REACT_ELEMENT,
    type,
    props,
  };
}
/* 合成事件作为代理去实现批量更新，只执行一次,更新一次forceUpdate */
export const updateQueue = {
  /* 是否处于批量更新模式 */
  isBatchingUpdate: false,
  /* 当前等待更新的队列 */
  updaters: new Set(),
  batchUpdate() {
    this.isBatchingUpdate = false;
    for (const updater of this.updaters) {
      updater.updateComponent();
    }
    this.updaters.clear();
  },
};

/* Updater */
class Updater {
  constructor(classInstance) {
    this.classInstance = classInstance;
    this.pendingState = [];
  }
  addState(partialState) {
    this.pendingState.push(partialState);
    this.emitUpdate();
  }
  emitUpdate() {
    /* 批量更新添加到队列，不更新 */
    if (updateQueue.isBatchingUpdate) {
      updateQueue.updaters.add(this);
    } else {
      this.updateComponent();
    }
  }
  updateComponent() {
    const { classInstance, pendingState } = this;
    if (pendingState.length > 0) {
      let newState = this.getState();
      shouldUpdate(classInstance, newState);
    }
  }
  getState() {
    const { classInstance, pendingState } = this;
    let { state } = classInstance;
    pendingState.forEach((nState) => {
      state = { ...state, ...nState };
    });
    pendingState.length = 0;
    return state;
  }
}

function shouldUpdate(classInstance, newState) {
  classInstance.state = newState;
  classInstance.forceUpdate();
}

class Component {
  static isReactComponent = true;

  constructor(props) {
    this.props = props;
    this.updater = new Updater(this);
  }
  setState(partialState) {
    this.updater.addState(partialState);
  }
  forceUpdate() {
    let oldRenderVdom = this.oldRenderVdom;
    let oldDom = findDom(oldRenderVdom);
    let newRendeVdom = this.render();
    compareTwoDom(oldDom.parentNode, oldRenderVdom, newRendeVdom);
    this.oldRenderVdom = newRendeVdom;
  }
}
const React = { createElement, Component };
export default React;

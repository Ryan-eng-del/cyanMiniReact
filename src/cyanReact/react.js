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
    this.updateComponent();
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

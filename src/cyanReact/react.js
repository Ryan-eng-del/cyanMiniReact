import {
  REACT_CONTEXT,
  REACT_ELEMENT,
  REACT_FORWARD_REF,
  REACT_FRAGMENT,
  REACT_MEMO,
  REACT_PROVIDER,
} from "./constants";
import { compareTwoDom, findDom, useState } from "./react-dom";
import { shallowEqual, toVom } from "./util";

/* createElement jsx -> vdom*/
function createElement(type, config, children) {
  let ref;
  let key;
  let props = { ...config };
  ref = config.ref;
  key = config.key;
  delete props?.__self;
  delete props?.__source;
  delete config.key;
  delete config.ref;
  delete config.__source;
  delete config.__self;

  if (arguments.length > 3) {
    props.children = Array.prototype.slice.call(arguments, 2).map(toVom);
  } else if (arguments.length === 3) {
    props.children = toVom(children);
  }
  return {
    $$typeof: REACT_ELEMENT,
    type,
    props,
    ref,
    key,
  };
}

/* React 18已经抛弃了updateQueue，改成了微任务队列，这样做的好处是无论在什么地方都是批量更新，18之前如果按照updateQueue来实现的话
当setState放入setTimeout当中就不会批量更新了，而是每一次宏任务当中的setState都会触发一次forceUpdate */

class Component {
  static isReactComponent = true;

  constructor(props) {
    this.props = props;
    this.updater = new Updater(this);
  }

  setState(partialState, callback) {
    this.updater.addState(partialState, callback);
  }

  forceUpdate() {
    console.log("forceUpdate");
    let oldRenderVdom = this.oldRenderVdom;
    let oldDom = findDom(oldRenderVdom);
    if (this.constructor.contextType) {
      this.context = this.constructor.contextType._currentValue;
    }
    if (this.constructor.getDerivedStateFromProps) {
      let newState = this.constructor.getDerivedStateFromProps(
        this.props,
        this.state
      );
      if (newState) {
        this.state = newState;
      }
    }
    /* 调用snapShort快照 */
    let newRendeVdom = this.render();
    compareTwoDom(oldDom.parentNode, oldRenderVdom, newRendeVdom);
    this.oldRenderVdom = newRendeVdom;
    if (this.componentDidUpdate) {
      this.componentDidUpdate();
    }
  }
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
    this.callbacks = [];
  }

  addState(partialState, callback) {
    this.pendingState.push(partialState);
    if (callback) this.callbacks.push(callback);
    this.emitUpdate();
  }

  emitUpdate(nextProps) {
    this.nextProps = nextProps;
    /* 批量更新添加到队列，不更新 */
    if (updateQueue.isBatchingUpdate) {
      updateQueue.updaters.add(this);
    } else {
      this.updateComponent();
    }
  }

  updateComponent() {
    const { classInstance, pendingState, nextProps } = this;
    if (pendingState.length > 0 || nextProps) {
      let newState = this.getState();
      shouldUpdate(classInstance, nextProps, newState);
    }
    queueMicrotask(() =>
      /* 调用callbacks */
      this.callbacks.forEach((c) => c)
    );
  }
  getState() {
    const { classInstance, pendingState } = this;
    let { state } = classInstance;
    pendingState.forEach((nState) => {
      if (typeof nState === "function") {
        nState = nState(state);
      }
      state = { ...state, ...nState };
    });
    pendingState.length = 0;
    return state;
  }
}

function shouldUpdate(classInstance, nextProps, newState) {
  /* 表示是否要更新 */
  let willUpdate = true;
  /* 有方法并且执行结果为false，不需要更新 */
  if (
    classInstance.shouldComponentUpdate &&
    !classInstance.shouldComponentUpdate(nextProps, newState)
  ) {
    willUpdate = false;
  }
  if (classInstance.componentWillUpdate) {
    classInstance.componentWillUpdate();
  }
  if (nextProps) {
    classInstance.props = nextProps;
  }
  /* 但是无论是否要更新，都要更新state，
  但是不同的是，我们说的更新，定义是是否更新渲染Dom */
  classInstance.state = newState;
  if (willUpdate) {
    classInstance.forceUpdate();
  }
}

function createRef() {
  return { current: null };
}

function forwardRef(render) {
  return {
    $$typeof: REACT_FORWARD_REF,
    render,
  };
}
function createContext() {
  const context = {
    $$typeof: REACT_CONTEXT,
    _currentValue: undefined,
  };
  context.Provider = {
    $$typeof: REACT_PROVIDER,
    _context: context,
  };
  context.Consumer = {
    $$typeof: REACT_CONTEXT,
    _context: context,
  };
  return context;
}

/* PureComponent */
class PureComponent extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return (
      !shallowEqual(this.props, nextProps) ||
      !shallowEqual(this.state, nextState)
    );
  }
}

/* React.memo */
function memo(type, compare = null) {
  return {
    $$typeof: REACT_MEMO,
    compare,
    type,
  };
}

const React = {
  createElement,
  Component,
  createRef,
  forwardRef,
  Fragment: REACT_FRAGMENT,
  createContext,
  PureComponent,
  memo,
  useState,
};
export default React;

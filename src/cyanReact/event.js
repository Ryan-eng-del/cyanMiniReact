import { updateQueue } from "./react";
/* 合成事件代理 */
export function addEvent(dom, eventType, handler) {
  let store = dom.__store__ || (dom.__store__ = {});
  store[eventType] = handler;
  if (!document[eventType]) {
    document[eventType] = dispathcEvent;
  }
}
function dispathcEvent(event) {
  const { type, target } = event;
  const eventType = `on${type}`; //onclick
  updateQueue.isBatchingUpdate = true;
  let currentTarget = target;
  let syntheticEvent = createSyntheticEvent(event);
  while (currentTarget) {
    syntheticEvent.currentTarget = currentTarget;
    let { __store__ } = currentTarget;
    let handler = __store__ && __store__[eventType];
    handler && handler(syntheticEvent);
    if (syntheticEvent.isPropagationStopped === true) break;
    currentTarget = currentTarget.parentNode;
  }
  updateQueue.batchUpdate();
}

function createSyntheticEvent(event) {
  let syntheticEvent = {};
  for (const key in event) {
    let value = event[key];
    if (typeof value == "function") value = value.bind(event);
    syntheticEvent[key] = value;
  }
  syntheticEvent.nativeEvent = event;
  syntheticEvent.isPropagationStopped = false;
  syntheticEvent.isDefalutPrevented = false;
  syntheticEvent.preventDefault = preventDefault;
  syntheticEvent.stopPropagation = stopPropagation;

  return syntheticEvent;
}

function preventDefault() {
  this.isDefalutPrevented = true;
  let event = this.nativeEvent;
  if (event.preventDefault) {
    event.preventDefault();
  } else {
    event.returnValue = false;
  }
}
function stopPropagation() {
  this.isPropagationStopped = true;
  let event = this.nativeEvent;
  if (event.stopPropagation) {
    event.stopPropagation();
  } else {
    event.cancelBubble = false;
  }
}

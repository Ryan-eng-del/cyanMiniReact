import { updateQueue } from "./react";

export function addEvent(dom, eventType, handler) {
  let store = dom.__store__ || (dom.__store__ = {});
  store[eventType] = handler;
  if (!document[eventType]) {
    document[eventType] = dispathcEvent;
  }
}
function dispathcEvent(event) {
  console.log(event, "event dispathcEvent");
  const { type, target } = event;
  const eventType = `on${type}`; //onclick
  updateQueue.isBatchingUpdate = true;
  let currentTarget = target;
  while (currentTarget) {
    let { __store__ } = currentTarget;
    let handler = __store__ && __store__[eventType];
    handler && handler(event);
    currentTarget = currentTarget.parentNode;
  }
  updateQueue.batchUpdate();
}

import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

function render(vnode, container) {
  console.log(vnode, "vnode");
  const fiberRoot = {
    type: container.nodeName.toLocaleLowerCase(),
    stateNode: container,
    props: { children: vnode },
  };
  scheduleUpdateOnFiber(fiberRoot);
}

//eslint-disable-next-line
export default { render };

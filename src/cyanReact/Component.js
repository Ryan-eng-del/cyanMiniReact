function Component(props) {
  this.props = props;
}
// 区分函数组件和类组件的标识
Component.prototype.isReactComponent = {};
export default Component;

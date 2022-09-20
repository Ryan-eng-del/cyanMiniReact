import Component from "./cyanReact/Component";
import ReactDom from "./cyanReact/react-dom";
import "./index.css";
class ClassComponent extends Component {
  render() {
    return (
      <div className="border">
        <p>{this.props.name}</p>
      </div>
    );
  }
}

function FunctionComponent({ name }) {
  return <div>{name}函数式组件</div>;
}
const jsx = (
  <div className="border">
    <h1>第一个render函数实现</h1>
    <a href="https://www.baidu.com">cyan</a>
    <FunctionComponent name={"first function component"} />
    <ClassComponent name={"first class component"} />
  </div>
);
ReactDom.render(jsx, document.getElementById("root"));

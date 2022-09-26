import React from "./cyanReact/react.js";
import "./index.css";
import ReactDom from "./cyanReact/react-dom";

function FunctionComponent({ name }) {
  return (
    <div className="border">
      <div>{name}</div>
      <span>Hello This is MY function cpn</span>
    </div>
  );
}
class ClassCpn extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 1,
    };
  }
  handleClick = () => {
    this.setState({ count: this.state.count + 1 });
  };
  render() {
    return (
      <div className="border">
        <div>{this.props.name}</div>
        <div>{this.state.count}</div>
        <button onClick={this.handleClick}>+1</button>
        <span>Hello This is MY Class cpn</span>
      </div>
    );
  }
}
const jsx = (
  <div className="border">
    <FunctionComponent name={"second function component"} />
    <div>Hello World</div>
    <ClassCpn name={"class cpn"} />
  </div>
);
ReactDom.render(jsx, document.getElementById("root"));

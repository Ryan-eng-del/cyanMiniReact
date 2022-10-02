import React from "./cyanReact/react.js";
import "./index.css";
import ReactDom from "./cyanReact/react-dom";

/* 实现React 类组件基本生命周期 

 initialization  -> setup props and state
 mounting -> componentWillMount -> render -> componentDidMount
 update -> shouldComponentUpdate true -> componentWillUpdate -> forceupdate -> render ->  componentDidUpdate
                                 false -> 只负责更新state,但不会更新视图
*/

function FunctionComponent({ name }) {
  return (
    <div className="border">
      <div>{name}</div>
      <span>Hello This is MY function cpn</span>
    </div>
  );
}

function Fn(props, forwardRef) {
  return <div ref={forwardRef}>Hello</div>;
}
class Test extends React.Component {
  // eslint-disable-next-line
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        Test{this.props.count}
        <div>H</div>
      </div>
    );
  }
}
/* 实现forwardRef()转发函数式组件，使得支持获取函数式子组件的ref */
// const ForwardRef = React.forwardRef(Fn);
class ClassCpn extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 1,
      list: ["a", "b", "c", "d", "e", "f"],
    };
    this.a = React.createRef();
    this.b = React.createRef();
    this.c = React.createRef();
  }
  componentWillMount() {
    console.log("willmount --liftcycle");
  }
  componentDidMount() {
    console.log("didmount --liftcycle");
  }
  componentWillUpdate() {
    console.log("willupdate --liftcycle");
  }
  componentDidUpdate() {
    console.log("didupdate --liftcycle");
  }
  shouldComponentUpdate() {
    console.log("shouldupdate --liftcycle");
    return true;
  }
  handleDivClick = () => {
    console.log("handleDivClick");
  };
  handleChange = () => {
    this.setState({ list: ["a", "c", "e", "b", "g"] });
  };
  handleClick = (event) => {
    /* 实现setState传入函数 */
    this.setState((pre) => ({
      count: pre.count + 1,
    }));
    this.setState((pre) => ({
      count: pre.count + 1,
    }));
    /* 实现React.createRef */
    // console.log(this.a, this.b, this.c, "createRef");
    /* 实现阻止冒泡 */
    // event.stopPropagation();
    // this.setState({ count: 2 });
    // this.setState({ count: 1 });
    // this.setState({ count: 4 });
  };
  render() {
    console.log("render --liftcycle");
    return (
      <div className="border" onClick={this.handleDivClick}>
        <div ref={this.a}>{this.props.name}</div>
        <div ref={this.b}>{this.state.count}</div>
        <button onClick={this.handleClick}>+1</button>
        <span>Hello This is MY Class cpn</span>
        {/* <ForwardRef ref={this.c} /> */}
        {this.state.count === 5 ? null : <Fn ref={this.c} />}
        {/* React.createElement(ForwardRef (type名称是上面的forward对象), {ref: this.func}) */}
        <button onClick={this.handleChange}>diff move node</button>
        <Test count={this.state.count} />
        <ul>
          {this.state.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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

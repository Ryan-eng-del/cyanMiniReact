import React from "./cyanReact/react.js";
import "./index.css";
import ReactDom, {
  useState,
  useCallback,
  useMemo,
  useContext,
  useEffect,
  useRef,
  useImperativeHandle,
} from "./cyanReact/react-dom";
const ColorContext = React.createContext();

/* 实现React 类组件基本生命周期 

 initialization  -> setup props and state
 mounting -> componentWillMount -> render(React更新DOM 和 refs) -> componentDidMount
 update -> componentWillReceiveProps(子组件当中会用到)-> shouldComponentUpdate true -> componentWillUpdate -> forceupdate -> render ->  componentDidUpdate
                                                                            false -> 只负责更新state,但不会更新视图
*/

/* 新的生命周期
  mountint -> constructor -> setup props and state  -> render -> (React更新DOM 和 refs) -> componentDidMount
  update -> getDerivedStateFromProps（forceUpdate,(子组件当中会用到)） -> shouldComponentUpdate true -> -> render  -> render -> getSnapshotBeforeUpdate（update之前去执行） -> (React更新DOM 和 refs) -> componentDidUpdate                                                                                       false -> 只负责更新state,但不会更新视图
*/

function FunctionComponent({ name }) {
  return (
    <div className="border">
      <div>{name}</div>
      <span>Hello This is MY function cpn</span>
    </div>
  );
}

// function Fn(props, forwardRef) {
//   return <div ref={forwardRef}>Hello</div>;
// }

class Test extends React.Component {
  // eslint-disable-next-line
  constructor(props) {
    super(props);
    this.state = { color: "red" };
  }
  changeColor = () => {
    this.setState({
      color: "black",
    });
  };
  /* 新版生命周期，已经修改为静态方法：getDerivedStateFromProps */
  // componentWillReceiveProps(newProps) {}
  render() {
    const contextValue = {
      color: this.state.color,
      changeColor: this.changeColor,
    };

    return (
      <div>
        <ColorContext.Provider value={contextValue}>
          <div>
            <div>Hhhh</div>
            <TestProvider />
          </div>
        </ColorContext.Provider>
      </div>
    );
  }
}
class TestProvider extends React.Component {
  static contextType = ColorContext;

  handleChange = () => {
    console.log(this.context, "conetxt");
    this.context.changeColor();
  };
  render() {
    return (
      <div>
        <div style={{ color: this.context.color }}>Hhhhh</div>
        <button onClick={this.handleChange}>change black</button>
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
        {/* <div ref={this.a}>{this.props.name}</div>
        <div ref={this.b}>{this.state.count}</div>
        <button onClick={this.handleClick}>+1</button>
        <span>Hello This is MY Class cpn</span> */}
        {/* <ForwardRef ref={this.c} /> */}
        {/* {this.state.count === 5 ? null : <Fn ref={this.c} />} */}
        {/* React.createElement(ForwardRef (type名称是上面的forward对象), {ref: this.func}) */}
        {/* <button onClick={this.handleChange}>diff move node</button> */}
        <Test count={this.state.count} />
        {/* <ul>
          {this.state.list.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul> */}
      </div>
    );
  }
}
class Portal extends React.PureComponent {
  render() {
    return ReactDom.createPortal(
      <div>Dialog</div>,
      document.getElementById("dialog")
    );
  }
}
// eslint-disable-next-line
const jsx = (
  <div className="border">
    <FunctionComponent name={"second function component"} />
    <div>Hello World</div>
    <ClassCpn name={"class cpn"} />
    <Portal />
  </div>
);

/* React属性代理 */
/* 第一个是利用React高阶组件来封装一些固定功能和操作，第二个可以传递一个renderProps函数，这里可以使用装饰器来进行优化和简便 */

/* React反向继承 */
/* 拦截生命周期，拦截state，先让子类调用，在去父类调用，之后返回React.cloneElement() */

/* React性能优化 */
/* 类组件：React.PureComponent -> 实现了shouldComponentUpdate -> shouUpdate中去调用类组件实例的shouldComponentUpdate方法判断，更新采取forceUpdate */
/* 函数式组件：React.memo  */

/* Hooks */
const TestContext = React.createContext();
function Child({ count, handleCount }, ref) {
  console.log("child render");
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current.focus();
    },
  }));
  const context = useContext(TestContext);
  return (
    <div>
      <input ref={inputRef} />
      <div> {count?.count} ---memoValue</div>
      <div>{context.countValue} --- contextValue</div>
      <button onClick={() => handleCount()}>+1</button>
    </div>
  );
}
// const MemoChild = React.memo(Child);
const ForwardChild = React.forwardRef(Child);

function Counter() {
  const [count, setCount] = useState(0);
  const [show, setShow] = useState(true);
  /* 如何setState（异步执行）之后，拿到最新值，这里我们可以将
  最新值放入ref.current当中，这样每次去取ref.current就拿到的是最新值。
  */
  const ref = useRef();
  const valueRef = useRef();
  const handleShow = () => {
    setShow(!show);
  };

  const number = useMemo(
    () => ({
      count,
    }),
    [count]
  );
  /* useEffect， useLayoutEffect区别，两者的函数签名相同，
  前者是会在浏览器渲染结束之后执行useEffect当中的宏任务，后者在浏览器绘制之前执行执行useLayoutEffect当中的微任务
  当我们添加动画的时候，useEffect动画正常，useLayoutEffect动画在绘制之前就已经执行完了。
  */
  useEffect(() => {
    // debugger;
    const timer = setInterval(() => {
      console.log("开启一个定时器");
      setCount(count + 1);
    });
    clearInterval(timer);
    return () => {
      console.log("销毁一个定时器");
      clearInterval(timer);
    };
  }, [count]);

  const handleCount = useCallback(() => {
    const newValue = count + 1;
    valueRef.current = newValue;
    setCount(newValue);
    console.log(ref.current.focus(), "ref");
    console.log(valueRef, "count");
  }, [count]);
  // const handleCount = () => setCount(count + 1);

  return (
    <div>
      <div ref={ref}>{count} --countValue</div>
      <TestContext.Provider value={{ countValue: count }}>
        <div>
          {show ? <div>{count} --showValue</div> : null}
          <button onClick={() => handleShow()}>show</button>
          {/* <button onClick={() => handleCount()}>+1</button> */}
          <ForwardChild count={number} handleCount={handleCount} ref={ref} />
        </div>
      </TestContext.Provider>
    </div>
  );
}
//toDo 实现React.memo 和 React.PureComponent
ReactDom.render(<Counter />, document.getElementById("root"));

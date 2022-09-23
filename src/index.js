import { useReducer } from "./cyanReact/hooks";
import ReactDom from "./cyanReact/react-dom";
import "./index.css";

// v1.0支持类组件渲染，不支持其更新
// eslint-disable-next-line
// class ClassComponent extends Component {
//   render() {
//     return (
//       <div className="border">
//         <p>{this.props.name}</p>
//       </div>
//     );
//   }
// }

// 函数式组件支持Hook useReducer useState
function FunctionComponent({ name }) {
  const [count, setCount] = useReducer((x) => x + 1, 1);
  const [count1, setCount1] = useReducer((x) => x + 1, 1);
  // const [count1, setCount1] = useState(1);
  return (
    <div className="border">
      <div>{name}</div>
      <div className="hook">{count}</div>
      <div className="hook">{count1}</div>
      <button onClick={() => setCount()}>+1</button>
      <button onClick={() => setCount1()}>+1</button>
    </div>
  );
}

// v1.0函数式组件不支持hook
// const jsx = (
//   <div className="border">
//     <h1>第一个render函数实现</h1>
//     <a href="https://www.baidu.com">cyan</a>
//     <FunctionComponent name={"first function component"} />
//     <ClassComponent name={"first class component"} />
//   </div>
// );

// v2.0函数式组件支持hook
const jsx = (
  <div className="border">
    {/* <h1>第一个render函数实现</h1> */}
    {/* <Fcpn /> */}
    <FunctionComponent name={"first function component"} />
    {/* <FunctionComponent name={"second function component"} /> */}
  </div>
);
ReactDom.render(jsx, document.getElementById("root"));

const REACT_PROVIDER = Symbol("react.provider");
const type2 = {
  $$typeof: REACT_PROVIDER,
};
const type1 = {
  $$typeof: REACT_PROVIDER,
};
for (const attr in type1) {
  console.log(attr);
}

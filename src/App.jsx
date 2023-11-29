import { ComponentsProvider } from "./Context/ComponentsProvider";
import Main from "./Components/Main";

function App() {
  return (
    <>
      <ComponentsProvider>
        <Main />
      </ComponentsProvider>
    </>
  );
}

export default App;

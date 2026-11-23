
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Stuck from "./pages/Stuck";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/stuck" element={<Stuck />} />
    </Routes>
  );
}

export default App;

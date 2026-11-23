
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Stuck from "./pages/Stuck";
import Board from "./pages/Board";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/stuck" element={<Stuck />} />
      <Route path="/board" element={<Board />} />
    </Routes>
  );
}

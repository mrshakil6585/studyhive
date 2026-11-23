import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Stuck from "./pages/Stuck";
import Board from "./pages/Board";
import SignIn from "./pages/SignIn";
import SiteHeader from "./components/SiteHeader";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#FBF6EA] text-[#1F1B16]">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1
          className="text-4xl font-extrabold"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          Page not found
        </h1>
        <p className="mt-3 text-[#4a4338]">
          That page doesn't exist. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg border-2 border-[#1F1B16] bg-[#F5B82E] px-5 py-3 font-bold shadow-[3px_3px_0_#1F1B16]"
        >
          Go to StudyHive home
        </Link>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/stuck" element={<Stuck />} />
      <Route path="/board" element={<Board />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

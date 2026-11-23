import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../lib/auth-context";

const INK = "#1F1B16";
const display = { fontFamily: "'Fraunces', serif" };

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
        <polygon
          points="12,2 21,7 21,17 12,22 3,17 3,7"
          fill="#F5B82E"
          stroke={INK}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <polygon
          points="12,8 16,10.3 16,14.7 12,17 8,14.7 8,10.3"
          fill="#FBF6EA"
          stroke={INK}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-2xl font-extrabold tracking-tight" style={display}>
        StudyHive
      </span>
    </span>
  );
}

const links = [
  { label: "How it works", to: { pathname: "/", hash: "#how" } },
  { label: "Find a tutor", to: { pathname: "/", hash: "#tutors" } },
  { label: "Tutor board", to: "/board", nav: true },
  { label: "Ask for help", to: "/stuck", nav: true },
];

function AccountMenu({ displayName, email, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 items-center gap-2 rounded-lg border-2 border-[#1F1B16] bg-white px-2 pr-3 font-bold shadow-[3px_3px_0_#1F1B16] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1F1B16] bg-[#BFE3C0] text-sm"
        >
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-32 truncate">{displayName}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border-2 border-[#1F1B16] bg-white p-2 shadow-[4px_4px_0_#1F1B16]"
        >
          <p className="px-3 py-2 text-sm text-[#665A43]">
            Signed in as
            <span className="block truncate font-bold text-[#1F1B16]">
              {email}
            </span>
          </p>
          <Link
            role="menuitem"
            to="/board"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 font-semibold hover:bg-[#FBF6EA]"
          >
            My requests on the board
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-semibold text-red-700 hover:bg-red-50"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    try {
      setSignOutError("");
      await signOut();
      navigate("/");
    } catch (err) {
      setSignOutError(err.message);
    }
  }

  const linkClass = ({ isActive } = {}) =>
    `rounded-md px-1 hover:underline decoration-2 underline-offset-4 ${
      isActive ? "underline" : ""
    }`;

  return (
    <header className="relative z-20 mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" aria-label="StudyHive home">
          <Logo />
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-5 text-base font-medium md:flex"
        >
          {links.map((link) =>
            link.nav ? (
              <NavLink key={link.label} to={link.to} className={linkClass}>
                {link.label}
              </NavLink>
            ) : (
              <Link key={link.label} to={link.to} className={linkClass()}>
                {link.label}
              </Link>
            )
          )}

          {user ? (
            <AccountMenu
              displayName={displayName}
              email={user.email}
              onSignOut={handleSignOut}
            />
          ) : (
            <Link
              to="/signin"
              state={{ from: location.pathname }}
              className="flex min-h-11 items-center rounded-lg border-2 border-[#1F1B16] bg-[#F5B82E] px-4 font-bold shadow-[3px_3px_0_#1F1B16] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Sign in
            </Link>
          )}
        </nav>

        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-white md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="mt-4 rounded-xl border-2 border-[#1F1B16] bg-white p-3 shadow-[4px_4px_0_#1F1B16] md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 font-semibold hover:bg-[#FBF6EA]"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-2 border-t-2 border-[#1F1B16] pt-3">
            {user ? (
              <>
                <p className="px-3 pb-2 text-sm text-[#665A43]">
                  Signed in as{" "}
                  <span className="font-bold text-[#1F1B16]">{displayName}</span>
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left font-semibold text-red-700 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                state={{ from: location.pathname }}
                className="flex min-h-11 items-center justify-center rounded-lg border-2 border-[#1F1B16] bg-[#F5B82E] px-4 font-bold"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}

      {signOutError && (
        <p role="alert" className="mt-2 text-right text-sm font-medium text-red-700">
          {signOutError}
        </p>
      )}
    </header>
  );
}

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Arrow, media, type MountOptions } from "../../../packages/shared";
import { useDecorationInView } from "../../../packages/shared/use-decoration-in-view";
import "./styles.css";

const baseUrl = new URL(import.meta.env.BASE_URL, document.baseURI).href;
const options: MountOptions = {
  baseUrl,
  apiBase: import.meta.env.VITE_BFF_URL ? "/api" : undefined,
};
type Remote = { module: string; stylesheet: string };
let manifest: Promise<Record<string, Remote>> | undefined;
function getManifest() {
  return (manifest ??= fetch(new URL("mfe-manifest.json", baseUrl))
    .then((response) => {
      if (!response.ok)
        throw new Error("The workshop manifest could not be loaded.");
      return response.json();
    })
    .catch((error) => {
      manifest = undefined;
      throw error;
    }));
}
function MicroFrontend({ name, label }: { name: string; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, retry] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let unmount: (() => void) | undefined;
    setError(false);
    setLoading(true);
    async function load() {
      const remotes = await getManifest();
      const remote = remotes[name];
      if (!remote) throw new Error(`Unknown micro frontend: ${name}`);
      const cssUrl = new URL(remote.stylesheet, baseUrl).href;
      if (!document.querySelector(`link[data-mfe="${name}"]`)) {
        await new Promise<void>((resolve, reject) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = cssUrl;
          link.dataset.mfe = name;
          link.onload = () => resolve();
          link.onerror = () => {
            link.remove();
            reject(new Error("Stylesheet unavailable"));
          };
          document.head.append(link);
        });
      }
      const url =
        new URL(remote.module, baseUrl).href +
        (attempt ? `?retry=${attempt}` : "");
      const module = await import(/* @vite-ignore */ url);
      if (!cancelled && host.current) {
        unmount = module.mount(host.current, options);
        setLoading(false);
      }
    }
    load().catch((error) => {
      console.error(`Could not load ${name}`, error);
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      unmount?.();
    };
  }, [name, attempt]);
  return (
    <div data-mfe={name} aria-busy={loading}>
      {loading && (
        <div className="remote-loading wrap" role="status">
          Opening {label}…
        </div>
      )}
      {error && (
        <div className="remote-error wrap" role="alert">
          <p>{label} is taking a moment to load.</p>
          <button
            className="button button-outline"
            onClick={() => retry((value) => value + 1)}
          >
            Try again <Arrow />
          </button>
        </div>
      )}
      <div ref={host} />
    </div>
  );
}
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  const footerRef = useDecorationInView<HTMLElement>();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 40);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuToggle.current?.focus();
      }
    }
    if (menuOpen) window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [menuOpen]);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
        <div className="nav-inner wrap">
          <a className="wordmark" href="#top" aria-label="Broken Robot home">
            <img
              src={media(options, "studio-logo.webp")}
              alt=""
              width="1716"
              height="802"
            />
          </a>
          <button
            ref={menuToggle}
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="navigation"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? "Close" : "Menu"}{" "}
            <span aria-hidden="true">{menuOpen ? "−" : "+"}</span>
          </button>
          <nav
            id="navigation"
            className={menuOpen ? "nav-links is-open" : "nav-links"}
            aria-label="Main navigation"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#brickhold">The game</a>
            <a href="#workshop">Field guide</a>
            <a href="#studio">The studio</a>
            <a className="button nav-contact" href="#contact">
              Contact us <Arrow diagonal />
            </a>
          </nav>
        </div>
      </header>
      <main id="main">
        <MicroFrontend name="intro" label="the studio" />
        <MicroFrontend name="brickhold" label="Brickhold" />
        <MicroFrontend name="field-guide" label="the workshop" />
        <MicroFrontend name="studio" label="about the studio" />
      </main>
      <footer className="site-footer" ref={footerRef}>
        <div className="footer-inner wrap">
          <a
            className="footer-brand"
            href="#top"
            aria-label="Broken Robot home"
          >
            <img
              src={media(options, "studio-logo.webp")}
              alt=""
              width="1716"
              height="802"
              loading="lazy"
            />
          </a>
          <p>
            © {new Date().getFullYear()} Broken Robot. Built one brick at a
            time.
          </p>
          <a className="footer-to-top" href="#top">
            Back to top <span aria-hidden="true">↑</span>
          </a>
        </div>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

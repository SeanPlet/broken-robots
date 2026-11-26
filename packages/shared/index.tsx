import { createRoot } from "react-dom/client";
import { Component, useEffect, useState, type ReactNode } from "react";

export type MountOptions = { baseUrl: string; apiBase?: string };
export type CatalogEntry = {
  id: string;
  category: "traps" | "enemies";
  name: string;
  eyebrow: string;
  description: string;
  image: string;
  alt: string;
  kind: string;
  cost?: string;
};
export type SiteContent = {
  studio: { name: string; email: string };
  game: { title: string; status: string; description: string };
};
export const media = (options: MountOptions, filename: string) =>
  new URL(`media/${filename}`, options.baseUrl).href;
class SectionBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="remote-error wrap" role="alert">
        <p>This part of the workshop needs a reset.</p>
        <button
          className="button button-outline"
          onClick={() => window.location.reload()}
        >
          Reload the page
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function mountComponent(container: HTMLElement, component: ReactNode) {
  const root = createRoot(container);
  root.render(<SectionBoundary>{component}</SectionBoundary>);
  return () => root.unmount();
}
export function useContent<T>(options: MountOptions, endpoint: string) {
  const [state, setState] = useState<{ data?: T; error?: string }>({});
  useEffect(() => {
    const controller = new AbortController();
    const url = options.apiBase
      ? `${options.apiBase}/${endpoint}`
      : new URL(`data/${endpoint}.json`, options.baseUrl).href;
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Content request failed (${response.status})`);
        return response.json();
      })
      .then((data) => setState({ data }))
      .catch((error) => {
        if (error.name !== "AbortError")
          setState({
            error:
              "This part of the workshop is taking a moment. Please try again shortly.",
          });
      });
    return () => controller.abort();
  }, [options.baseUrl, options.apiBase, endpoint]);
  return state;
}
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} />
    </svg>
  );
}
export function Crystal({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 50 64"
      fill="none"
    >
      <path
        d="m25 3 19 19-4 25-15 14L10 47 6 22 25 3Z"
        fill="#9b6ce3"
        stroke="#342341"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="m25 3 4 21-19 23L6 22 25 3Z" fill="#d5b7ff" />
      <path d="m29 24 15-2-4 25-15 14 4-37Z" fill="#6b46b8" />
      <path
        d="m25 3 4 21 15-2M29 24 10 47l15 14M29 24 25 61"
        stroke="#f2dbff"
        strokeWidth="1.5"
      />
      <path
        d="m18 19 6-7"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Arrow,
  mountComponent,
  media,
  type MountOptions,
} from "../../../packages/shared";
import "./style.css";

function Intro({ options }: { options: MountOptions }) {
  const scene = useRef<HTMLElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!scene.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    });
    observer.observe(scene.current);
    return () => observer.disconnect();
  }, []);
  function lookAround(event: PointerEvent<HTMLElement>) {
    if (
      motionPaused ||
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty(
      "--scene-x",
      `${(event.clientX / bounds.width - 0.5) * 9}px`,
    );
    scene.current?.style.setProperty(
      "--scene-y",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * 6}px`,
    );
  }
  return (
    <section
      className="intro"
      id="top"
      aria-labelledby="intro-title"
      ref={scene}
      data-motion-paused={motionPaused || !inView}
      onPointerMove={lookAround}
      onPointerLeave={() => {
        if (motionPaused) return;
        scene.current?.style.setProperty("--scene-x", "0px");
        scene.current?.style.setProperty("--scene-y", "0px");
      }}
    >
      <div className="intro-world">
        <img
          src={media(options, "portal.webp")}
          alt="Brickhold gameplay: a troll and skeletons emerge from the glowing purple castle portal"
          width="1920"
          height="1080"
          fetchPriority="high"
        />
      </div>
      <div className="intro-shade" aria-hidden="true" />
      <div className="intro-runes" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="intro-center wrap">
        <p className="intro-presented">A Broken Robot game</p>
        <h1 id="intro-title" aria-label="Brickhold">
          <img
            className="intro-game-logo"
            src={media(options, "brickhold-logo.webp")}
            alt=""
            width="1756"
            height="340"
          />
        </h1>
        <p className="intro-tagline">
          Build together.
          <br className="intro-mobile-break" /> Hold together.
        </p>
        <p className="intro-description">
          A few good friends. A lot of bad skeletons.
          <br />
          One very important crystal.
        </p>
        <div className="intro-actions">
          <a className="button" href="#brickhold">
            Explore the game <Arrow />
          </a>
          <a className="intro-guide-link" href="#workshop">
            Traps &amp; troublemakers <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="intro-bottom wrap">
        <p className="intro-margin-note">
          Good plans.
          <br />
          <span>Questionable execution.</span>
          <svg aria-hidden="true" viewBox="0 0 100 65">
            <path d="M8 12c36-21 82 4 73 35m-13-6 13 9 10-13" />
          </svg>
        </p>
        <a
          href="#brickhold"
          className="intro-scroll"
          aria-label="Scroll to discover Brickhold"
        >
          <span aria-hidden="true" />
          <span>There’s trouble down here</span>
          <span aria-hidden="true">↓</span>
        </a>
        <p className="intro-state">
          <span className="intro-status-dot" aria-hidden="true" /> In
          development<small>Actual game capture</small>
          <button
            className="intro-motion-toggle"
            type="button"
            onClick={() => setMotionPaused((value) => !value)}
            aria-label={
              motionPaused
                ? "Resume decorative motion"
                : "Pause decorative motion"
            }
          >
            <svg
              aria-hidden="true"
              width="11"
              height="11"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              {motionPaused ? (
                <path d="m4 2 9 6-9 6z" />
              ) : (
                <path d="M3 2h3v12H3zm7 0h3v12h-3z" />
              )}
            </svg>
            {motionPaused ? "Resume motion" : "Pause motion"}
          </button>
        </p>
      </div>
      <div className="intro-battlements" aria-hidden="true" />
    </section>
  );
}
export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Intro options={options} />);

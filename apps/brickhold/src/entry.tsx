import { useCallback, useEffect, useRef, useState } from "react";
import {
  Arrow,
  Crystal,
  media,
  mountComponent,
  useContent,
  type SiteContent,
  type MountOptions,
} from "../../../packages/shared";
import "./style.css";
import { usePanelTransition } from "../../../packages/shared/use-panel-transition";
import { AmbientParticles } from "../../../packages/shared/ambient-particles";
import { useDecorationInView } from "../../../packages/shared/use-decoration-in-view";

const gallery: Record<
  string,
  {
    label: string;
    image: string;
    caption: string;
    alt: string;
    video?: string;
  }
> = {
  world: {
    label: "The world",
    image: "world.webp",
    caption: "The Playground",
    alt: "An aerial in-game view of Brickhold's castle arena, gardens and crystal",
  },
  build: {
    label: "Build",
    image: "gameplay.webp",
    caption: "Build between waves",
    alt: "Brickhold build mode: a hero positions a spike trap between barricades, with the four-player HUD visible",
  },
  funnel: {
    label: "Funnel",
    image: "funnel.webp",
    caption: "Make your own paths",
    alt: "Trolls are funneled between the player's barricades in Brickhold",
  },
  defend: {
    label: "Defend",
    image: "horde-poster.webp",
    caption: "A very bad day to be a skeleton",
    alt: "A horde crosses spike and fire traps while an arrow wall fires across Brickhold's portal lane",
    video: "horde-loop.mp4",
  },
  fight: {
    label: "Fight",
    image: "hero-fight-07.webp",
    caption: "Get stuck in",
    alt: "A hero fights the incoming enemies in Brickhold",
  },
  guardians: {
    label: "Guardians",
    image: "guard-post.webp",
    caption: "A little help from the Blue Knight",
    alt: "The Blue Knight archer at his brick-built guard post in Brickhold",
  },
};
const galleryOrder = Object.keys(gallery);
const rotationDelay = 60_000;

function Brickhold({ options }: { options: MountOptions }) {
  const [view, setView] = useState("defend");
  const [playing, setPlaying] = useState(false);
  const [rotationPaused, setRotationPaused] = useState(false);
  const [manualSelection, setManualSelection] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slidesRef = usePanelTransition(view, "gallery");
  const crystalRef = useDecorationInView<HTMLDivElement>();
  const { data } = useContent<SiteContent>(options, "site");
  const selectedShot = gallery[view];
  const selectView = useCallback((id: string) => {
    videoRef.current?.pause();
    if (id === "defend" && videoRef.current) videoRef.current.currentTime = 0;
    setView(id);
    setPlaying(false);
  }, []);
  useEffect(() => {
    if (rotationPaused) return;
    const timer = window.setTimeout(() => {
      const next = (galleryOrder.indexOf(view) + 1) % galleryOrder.length;
      selectView(galleryOrder[next]);
    }, rotationDelay);
    return () => window.clearTimeout(timer);
  }, [view, rotationPaused, manualSelection, selectView]);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (preference.matches) videoRef.current?.pause();
    };
    preference.addEventListener("change", stop);
    return () => preference.removeEventListener("change", stop);
  }, []);
  return (
    <section
      className="game-section"
      id="brickhold"
      aria-labelledby="game-title"
    >
      <div className="game-heading wrap">
        <AmbientParticles
          className="game-particles"
          shape="bricks"
          options={options}
        />
        <p className="eyebrow">
          <span /> Brick-built co-op portal defense <span />
        </p>
        <h2 id="game-title">
          They’ve got the numbers.
          <br />
          <span>You’ve got the bricks.</span>
        </h2>
        <p>
          The kingdom’s crystals are under attack.
          <br />
          Round up your fellow Shardkeepers. Build a defense. Get your hands
          dirty.
        </p>
      </div>
      <div className="game-main wrap">
        <div className="game-media">
          <span className="game-tape game-tape-left" aria-hidden="true" />
          <span className="game-tape game-tape-right" aria-hidden="true" />
          <div className="game-visual">
            <div className="game-slides" ref={slidesRef}>
              {Object.entries(gallery).map(([id, shot]) => (
                <div
                  key={id}
                  className="game-shot"
                  data-panel-key={id}
                  hidden={view !== id}
                  aria-hidden={view !== id}
                  inert={view !== id}
                >
                  {shot.video ? (
                    <video
                      ref={videoRef}
                      src={media(options, shot.video)}
                      poster={media(options, shot.image)}
                      aria-label={shot.alt}
                      preload="auto"
                      muted
                      loop
                      playsInline
                      width="1920"
                      height="1080"
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                    />
                  ) : (
                    <img
                      src={media(options, shot.image)}
                      alt={shot.alt}
                      loading="eager"
                      decoding="async"
                      width="1920"
                      height="1080"
                    />
                  )}
                </div>
              ))}
            </div>
            {selectedShot.video && (
              <button
                type="button"
                className="game-motion"
                aria-pressed={playing}
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  if (video.paused) {
                    void video.play().catch(() => setPlaying(false));
                  } else {
                    video.pause();
                  }
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  width="15"
                  height="15"
                  fill="currentColor"
                >
                  {playing ? (
                    <path d="M4 3h4v14H4zm8 0h4v14h-4z" />
                  ) : (
                    <path d="m6 3 11 7-11 7z" />
                  )}
                </svg>
                {playing ? "Pause gameplay" : "Play gameplay"}
              </button>
            )}
            <span className="game-image-label">
              <span key={view}>
                {selectedShot.video
                  ? playing
                    ? "Animated gameplay"
                    : "Gameplay paused"
                  : "In-game screenshot"}{" "}
                · {selectedShot.caption}
              </span>
            </span>
          </div>
          <div className="game-gallery-footer">
            <div
              className="game-tabs"
              role="group"
              aria-label="Brickhold screenshots"
            >
              {Object.entries(gallery).map(([id, entry]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={view === id}
                  onClick={() => {
                    // Even reselecting the current tab grants a full minute.
                    setManualSelection((selection) => selection + 1);
                    if (id !== view) selectView(id);
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
          <div className="game-rotation">
            <span>
              {rotationPaused ? "Slideshow paused" : "Changes every 60 seconds"}
            </span>
            <button
              type="button"
              onClick={() => setRotationPaused((paused) => !paused)}
            >
              {rotationPaused ? "Resume slideshow" : "Pause slideshow"}
            </button>
          </div>
          <p className="game-gallery-caption">
            A peek inside the actual game. Still building. Still breaking
            things.
          </p>
        </div>
        <div className="game-loop">
          <div className="game-loop-step">
            <span className="game-step-brick" aria-hidden="true">
              1
            </span>
            <div>
              <h3>Build a bad idea.</h3>
              <p>
                Barricades bend the route. Spikes, arrows and spinning hammers
                make it a very unfortunate journey.
              </p>
            </div>
          </div>
          <div className="game-loop-step">
            <span className="game-step-brick" aria-hidden="true">
              2
            </span>
            <div>
              <h3>Get stuck in.</h3>
              <p>
                Don’t let the traps have all the fun. Fight alongside your
                defenses and keep the crystal in one piece.
              </p>
            </div>
          </div>
          <div className="game-loop-step">
            <span className="game-step-brick" aria-hidden="true">
              3
            </span>
            <div>
              <h3>Try a worse idea.</h3>
              <p>
                Catch your breath between waves, rebuild the lane, and see what
                happens when you add one more trap.
              </p>
            </div>
          </div>
          <a className="game-link" href="#workshop">
            Let’s see the contraptions <Arrow />
          </a>
        </div>
      </div>
      <div className="game-development wrap" ref={crystalRef}>
        <Crystal />
        <p>
          <strong>{data?.game.status ?? "In development"}</strong>
          <span>
            Play solo or team up with up to three friends. Build. Defend.
            Repeat.
          </span>
        </p>
      </div>
    </section>
  );
}
export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Brickhold options={options} />);

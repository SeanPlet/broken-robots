import { useEffect, useState } from "react";
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

const gallery: Record<
  string,
  {
    label: string;
    image: string;
    caption: string;
    alt: string;
    animation?: string;
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
    image: "battle.webp",
    caption: "A very bad day to be a skeleton",
    alt: "A horde crosses spike and fire traps while an arrow wall fires across Brickhold's portal lane",
    animation: "horde-loop.webp",
  },
  fight: {
    label: "Fight",
    image: "gameplay-poster.webp",
    caption: "Get stuck in",
    alt: "A hero fights the incoming enemies in Brickhold",
    animation: "gameplay-loop.webp",
  },
  guardians: {
    label: "Guardians",
    image: "guard-post.webp",
    caption: "A little help from the Blue Knight",
    alt: "The Blue Knight archer at his brick-built guard post in Brickhold",
  },
};
function Brickhold({ options }: { options: MountOptions }) {
  const [view, setView] = useState("defend");
  const [playing, setPlaying] = useState(false);
  const { data } = useContent<SiteContent>(options, "site");
  const shot = gallery[view];
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      if (preference.matches) setPlaying(false);
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
            <img
              src={media(
                options,
                playing && shot.animation ? shot.animation : shot.image,
              )}
              alt={shot.alt}
              loading="lazy"
              width="1920"
              height="1080"
            />
            {shot.animation && (
              <button
                type="button"
                className="game-motion"
                aria-pressed={playing}
                onClick={() => setPlaying((value) => !value)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  width="15"
                  height="15"
                  fill="currentColor"
                >
                  {playing ? (
                    <path d="M4 4h12v12H4z" />
                  ) : (
                    <path d="m6 3 11 7-11 7z" />
                  )}
                </svg>
                {playing ? "Stop animation" : "Play gameplay"}
              </button>
            )}
            <span className="game-image-label">
              {playing ? "Animated gameplay" : "In-game screenshot"} ·{" "}
              {shot.caption}
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
                    setView(id);
                    setPlaying(false);
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
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
      <div className="game-development wrap">
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

import { useState } from "react";
import {
  Arrow,
  media,
  mountComponent,
  useContent,
  type SiteContent,
  type MountOptions,
} from "../../../packages/shared";
import "./style.css";

function Brickhold({ options }: { options: MountOptions }) {
  const [view, setView] = useState<"concept" | "gameplay">("concept");
  const { data } = useContent<SiteContent>(options, "site");
  return (
    <section
      className="game-section wrap"
      id="brickhold"
      aria-labelledby="game-title"
    >
      <div className="game-panel">
        <div className="game-topline">
          <p className="eyebrow">
            <span className="dot" /> Our first game
          </p>
          <span className="game-status">
            <span /> {data?.game.status ?? "In development"}
          </span>
        </div>
        <div className="game-main">
          <div className="game-copy">
            <p className="game-wordmark">BRICKHOLD</p>
            <h2 id="game-title">
              Good plans.
              <br />
              Glorious chaos.
            </h2>
            <p>
              Build a clever defense. Bring a few friends.
              <br />
              Try to keep it all in one piece.
            </p>
            <p className="game-description">
              A brick-built portal defense game where you place traps between
              waves, then jump into the fight alongside them. The best plan?
              Probably the one you haven’t tried yet.
            </p>
            <a href="#workshop" className="game-link">
              Step inside the workshop <Arrow diagonal />
            </a>
          </div>
          <div className="game-visual">
            <div
              className="game-tabs"
              role="group"
              aria-label="Brickhold image view"
            >
              <button
                aria-pressed={view === "concept"}
                onClick={() => setView("concept")}
              >
                The vision
              </button>
              <button
                aria-pressed={view === "gameplay"}
                onClick={() => setView("gameplay")}
              >
                In the engine
              </button>
            </div>
            <img
              src={media(
                options,
                view === "concept" ? "guard-post.webp" : "gameplay.webp",
              )}
              alt={
                view === "concept"
                  ? "Concept art of a blue knight archer guarding a brick-built tower in a green landscape"
                  : "Brickhold prototype running in Godot, with the player defending the portal lane"
              }
              loading="lazy"
              width="1000"
              height="1000"
            />
            <span className="game-image-label">
              {view === "concept"
                ? "Concept art · The world we’re building"
                : "Prototype gameplay · Work in progress"}
            </span>
          </div>
        </div>
        <div className="game-facts">
          <div>
            <span className="game-fact-number">01 /</span>
            <div>
              <h3>Build your defense</h3>
              <p>Make every trap placement count.</p>
            </div>
          </div>
          <div>
            <span className="game-fact-number">02 /</span>
            <div>
              <h3>Bring your people</h3>
              <p>Designed for four-player online co-op.</p>
            </div>
          </div>
          <div>
            <span className="game-fact-number">03 /</span>
            <div>
              <h3>Embrace the chaos</h3>
              <p>Fight. Rebuild. Try another wild idea.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Brickhold options={options} />);

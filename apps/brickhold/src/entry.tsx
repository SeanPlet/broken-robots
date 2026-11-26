import { useState } from "react";
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

function Brickhold({ options }: { options: MountOptions }) {
  const [view, setView] = useState<"concept" | "gameplay">("concept");
  const { data } = useContent<SiteContent>(options, "site");
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
          Something nasty is coming through that portal.
          <br />
          Round up your friends. Build a defense. Get your hands dirty.
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
                view === "concept" ? "guard-post.webp" : "gameplay.webp",
              )}
              alt={
                view === "concept"
                  ? "Concept art of the Blue Knight archer defending a brick-built guard post"
                  : "Brickhold prototype running in Godot, with a hero defending the portal lane"
              }
              loading="lazy"
              width="1000"
              height="625"
            />
            <span className="game-image-label">
              {view === "concept"
                ? "Concept art · A world worth defending"
                : "Prototype gameplay · Work in progress"}
            </span>
          </div>
          <div className="game-gallery-footer">
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
            <span className="game-photo-note">
              Actual bricks. Questionable odds.
              <svg aria-hidden="true" viewBox="0 0 75 45">
                <path d="M69 36C45 48 18 27 18 7m-10 9L18 5l13 8" />
              </svg>
            </span>
          </div>
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
            Designed for four-player online co-op. Still building. Still
            breaking things.
          </span>
        </p>
      </div>
    </section>
  );
}
export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Brickhold options={options} />);

import {
  Arrow,
  mountComponent,
  media,
  type MountOptions,
} from "../../../packages/shared";
import "./style.css";

function Intro({ options }: { options: MountOptions }) {
  return (
    <section className="intro wrap" id="top" aria-labelledby="intro-title">
      <div className="intro-copy">
        <p className="eyebrow">
          <span className="dot" /> An independent game studio
        </p>
        <h1 id="intro-title" aria-label="Small studio. Big play.">
          Small studio.
          <br />
          Big{" "}
          <span className="intro-play">
            play
            <svg aria-hidden="true" viewBox="0 0 240 20">
              <path d="M3 13Q115 -5 237 10M18 18Q119 5 220 17" />
            </svg>
          </span>
          <span className="intro-period">.</span>
        </h1>
        <p className="intro-description">
          We’re Broken Robots. We make playful worlds,
          <br className="desktop-break" /> wonderfully bad plans, and games
          worth
          <br className="desktop-break" /> gathering your friends for.
        </p>
        <a className="button" href="#brickhold">
          Meet our first game <Arrow diagonal />
        </a>
        <div className="intro-note">
          <span className="intro-spark" aria-hidden="true">
            ✳
          </span>
          <p>
            A little wonky. A lot of heart.
            <br />
            <span>That’s kind of our thing.</span>
          </p>
        </div>
      </div>
      <div className="intro-art">
        <div className="intro-poster">
          <img
            src={media(options, "portal.webp")}
            alt="Brickhold concept art: a glowing purple portal in a brick-built castle, with a skeleton marching out"
            fetchPriority="high"
            width="1200"
            height="900"
          />
          <div className="intro-poster-bottom">
            <span>BRICKHOLD</span>
            <span>WORLD NO. 001 ↗</span>
          </div>
        </div>
        <div className="intro-sticker">
          <span>CAUTION</span>
          <strong>
            PLAY
            <br />
            IN PROGRESS
          </strong>
          <svg aria-hidden="true" width="28" height="22" viewBox="0 0 28 22">
            <path
              d="m2 11 7 7L25 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>
        </div>
        <p className="intro-art-caption">
          <span className="status-dot" /> Currently building: Brickhold{" "}
          <span>Concept art</span>
        </p>
        <svg className="intro-doodle" aria-hidden="true" viewBox="0 0 90 80">
          <path
            d="M8 5q65 10 55 58m-16-11 16 14 15-16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>
      <div className="intro-divider">
        <span>BUILT FOR THE JOY OF IT.</span>
        <span>SCROLL TO EXPLORE ↓</span>
      </div>
    </section>
  );
}
export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Intro options={options} />);

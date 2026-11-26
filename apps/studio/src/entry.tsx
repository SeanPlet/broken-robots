import { useState } from "react";
import {
  Arrow,
  Robot,
  mountComponent,
  useContent,
  type SiteContent,
  type MountOptions,
} from "../../../packages/shared/index";
import "./style.css";

function Studio({ options }: { options: MountOptions }) {
  const { data } = useContent<SiteContent>(options, "site");
  const email = data?.studio.email ?? "hello@brokenrobotstudio.co.za";
  const [copyStatus, setCopyStatus] = useState("");
  async function copyEmail() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      setCopyStatus("Email address copied. Say hello when you’re ready!");
    } catch {
      setCopyStatus(
        "Couldn’t copy the address. Use the email link to open your mail app.",
      );
    }
  }

  return (
    <>
      <section
        className="studio-section wrap"
        id="studio"
        aria-labelledby="studio-title"
      >
        <div className="studio-panel">
          <div className="studio-drawing" aria-hidden="true">
            <div className="studio-orbit studio-orbit-one" />
            <div className="studio-orbit studio-orbit-two" />
            <span className="studio-spark studio-spark-one">✳</span>
            <span className="studio-spark studio-spark-two">+</span>
            <span className="studio-sketch-label studio-sketch-top">
              FIG. 01 — STILL FIGURING IT OUT
            </span>
            <Robot className="studio-big-robot" />
            <svg
              className="studio-sketch-arrow"
              viewBox="0 0 90 70"
              fill="none"
            >
              <path
                d="M81 9C57 0 24 15 26 45m-13-9 14 12 10-16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="studio-sketch-note">
              a few loose screws.
              <br />
              plenty of good ideas.
            </span>
            <div className="studio-drawing-stamp">
              WONKY BY DESIGN <span>★</span>
            </div>
          </div>
          <div className="studio-story">
            <p className="eyebrow">03 / MEET THE MAKERS</p>
            <h2 id="studio-title">
              A little wonky.
              <br />A lot of heart<span>.</span>
            </h2>
            <p>
              We're Broken Robots. An indie game studio with a soft spot for
              playful worlds, clever little systems, and the kind of chaos that
              gets better with friends.
            </p>
            <p>
              Right now, we're pouring that energy into Brickhold. Building,
              breaking, tinkering, and seeing what happens when we put one more
              trap in the way.
            </p>
            <a className="studio-text-link" href="#contact">
              Come say hello <Arrow diagonal />
            </a>
          </div>
        </div>
      </section>
      <section
        className="studio-contact"
        id="contact"
        aria-labelledby="contact-title"
      >
        <div className="wrap">
          <div className="contact-heading">
            <div>
              <p className="eyebrow">GOOD CONVERSATIONS START SOMEWHERE</p>
              <h2 id="contact-title">
                Let's make
                <br />
                some noise<span>.</span>
              </h2>
            </div>
            <span className="contact-spark" aria-hidden="true">
              ✳
            </span>
          </div>
          <div className="contact-bottom">
            <div>
              <p>
                Got a question, a wild idea, or just a friendly beep?
                <br />{" "}
                Our inbox is open.
              </p>
              <a className="contact-email" href={`mailto:${email}`}>
                {email}
              </a>
            </div>
            <div className="contact-actions">
              <a className="button orange" href={`mailto:${email}`}>
                Say hello <Arrow diagonal />
              </a>
              <button
                className="contact-copy"
                type="button"
                onClick={copyEmail}
              >
                Copy email address{" "}
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                >
                  <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" />
                  <path d="M12 6V3.5h-9v9H6" />
                </svg>
              </button>
            </div>
          </div>
          <p className="contact-copy-status" role="status" aria-live="polite">
            {copyStatus}
          </p>
        </div>
      </section>
    </>
  );
}

export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Studio options={options} />);

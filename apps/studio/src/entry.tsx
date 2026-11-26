import { useEffect, useState } from "react";
import {
  Arrow,
  media,
  mountComponent,
  useContent,
  type SiteContent,
  type MountOptions,
} from "../../../packages/shared/index";
import { AmbientParticles } from "../../../packages/shared/ambient-particles";
import { useDecorationInView } from "../../../packages/shared/use-decoration-in-view";
import "./style.css";

const copyFeedback = {
  idle: { label: "Copy email address", message: "" },
  copied: { label: "Email copied", message: "Email address copied." },
  failed: {
    label: "Could not copy",
    message: "Could not copy the address. You can use the email link instead.",
  },
} as const;

function Studio({ options }: { options: MountOptions }) {
  const { data } = useContent<SiteContent>(options, "site");
  const email = data?.studio.email ?? "hello@brokenrobotstudio.co.za";
  const studioName = data?.studio.name ?? "Broken Robot";
  const [copyStatus, setCopyStatus] =
    useState<keyof typeof copyFeedback>("idle");
  const signRef = useDecorationInView<HTMLDivElement>();
  const postcardRef = useDecorationInView<HTMLDivElement>();

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  async function copyEmail() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <>
      <section
        className="studio-section"
        id="studio"
        aria-labelledby="studio-title"
      >
        <div className="studio-layout wrap">
          <div className="studio-emblem" ref={signRef}>
            <AmbientParticles className="studio-particles" shape="sparks" />
            <div className="studio-logo-board">
              <span className="studio-board-stud" aria-hidden="true" />
              <span className="studio-board-stud" aria-hidden="true" />
              <span className="studio-board-stud" aria-hidden="true" />
              <span className="studio-board-stud" aria-hidden="true" />
              <img
                src={media(options, "studio-logo.webp")}
                alt="Broken Robot studio logo, with a battered robot and hand-drawn lettering"
                width="1716"
                height="802"
                loading="lazy"
              />
            </div>
          </div>
          <div className="studio-story">
            <p className="eyebrow">THE MINDS BEHIND THE MAYHEM</p>
            <h2 id="studio-title">
              A few loose screws.
              <br />
              <span>A lot of good ideas.</span>
            </h2>
            <p>
              We're <strong>{studioName}</strong>, an independent game studio
              making playful worlds and finding out what happens when a good
              plan meets a few very bad ideas.
            </p>
            <p>
              Right now, that means Brickhold: a castle full of contraptions,
              creatures, and one more reason to call your friends.
            </p>
            <a className="studio-text-link" href="#contact">
              Pull up a chair. Say hello. <Arrow />
            </a>
          </div>
        </div>
      </section>
      <section
        className="studio-contact"
        id="contact"
        aria-labelledby="contact-title"
      >
        <div className="contact-postcard wrap" ref={postcardRef}>
          <div className="contact-letterhead">
            <div className="contact-title-block">
              <p className="eyebrow">Contact {studioName}</p>
              <h2 id="contact-title">Send a raven.</h2>
            </div>
            <p className="contact-intro">
              Have a question about Brickhold or feedback from the playtest?
              We’d love to hear from you.
            </p>
            <div className="contact-postmark" aria-hidden="true">
              <span>{studioName.toUpperCase()}</span>
              <svg viewBox="0 0 90 66" fill="none">
                <g className="contact-raven">
                  <path
                    d="m14 45 24-15-7-18 25 11 16-5-3 13 9 7-19 1-12 15-9-13-24 4Z"
                    fill="currentColor"
                  />
                  <path
                    d="m20 52 17-4m-22 11 18-5M57 14l10-7m-3 9 11-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="64" cy="26" r="2" fill="var(--paper)" />
                </g>
              </svg>
              <span>RAVEN POST</span>
            </div>
          </div>
          <div className="contact-bottom">
            <a className="contact-email" href={`mailto:${email}`}>
              {email}
            </a>
            <div className="contact-actions">
              <a className="button" href={`mailto:${email}`}>
                Email us <Arrow diagonal />
              </a>
              <button
                className="contact-copy"
                type="button"
                onClick={copyEmail}
              >
                <span className="contact-copy-label">
                  <span aria-hidden="true">{copyFeedback.idle.label}</span>
                  <span>{copyFeedback[copyStatus].label}</span>
                </span>
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  {copyStatus === "copied" ? (
                    <path d="m4.5 10 3.5 3.5 7.5-7.5" />
                  ) : (
                    <>
                      <rect x="6.5" y="6.5" width="10" height="10" rx="1.5" />
                      <path d="M12 6V3.5h-9v9H6" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>
          <p className="contact-copy-status" role="status" aria-live="polite">
            {copyFeedback[copyStatus].message}
          </p>
        </div>
      </section>
    </>
  );
}

export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Studio options={options} />);

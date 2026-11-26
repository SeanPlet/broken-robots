import { useState } from "react";
import {
  Arrow,
  media,
  mountComponent,
  useContent,
  type SiteContent,
  type MountOptions,
} from "../../../packages/shared/index";
import "./style.css";

function Studio({ options }: { options: MountOptions }) {
  const { data } = useContent<SiteContent>(options, "site");
  const email = data?.studio.email ?? "hello@brokenrobotstudio.co.za";
  const studioName = data?.studio.name ?? "Broken Robot";
  const [copyStatus, setCopyStatus] = useState("");

  async function copyEmail() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      setCopyStatus("Address copied. We look forward to your message!");
    } catch {
      setCopyStatus(
        "Couldn't copy the address. You can use the email link instead.",
      );
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
          <div className="studio-emblem">
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
            <svg
              className="studio-hand-arrow"
              viewBox="0 0 100 50"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 41C13 10 62 1 90 17m-15-13 17 14-22 5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="studio-emblem-note">yep, that's us.</span>
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
        <div className="contact-postcard wrap">
          <div className="contact-postmark" aria-hidden="true">
            <span>{studioName.toUpperCase()}</span>
            <svg viewBox="0 0 90 66" fill="none">
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
            </svg>
            <span>AIR MAIL / SORT OF</span>
          </div>
          <div className="contact-title-block">
            <p className="eyebrow">TO: OUR NEW FAVOURITE HUMAN</p>
            <h2 id="contact-title">Send a raven.</h2>
            <p className="contact-aside">(An email is fine, too.)</p>
          </div>
          <div className="contact-bottom">
            <div className="contact-message">
              <p>
                Questions about Brickhold? A wonderfully ridiculous idea?
                <br /> We'd love to hear it.
              </p>
              <a className="contact-email" href={`mailto:${email}`}>
                {email}
              </a>
            </div>
            <div className="contact-actions">
              <a className="button" href={`mailto:${email}`}>
                Write to us <Arrow diagonal />
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
                  strokeWidth="1.8"
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
          <span className="contact-delivery-note" aria-hidden="true">
            NO ACTUAL RAVENS WERE INCONVENIENCED.
          </span>
        </div>
      </section>
    </>
  );
}

export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <Studio options={options} />);

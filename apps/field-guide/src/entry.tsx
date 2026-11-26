import { useEffect, useRef, useState } from "react";
import {
  Arrow,
  media,
  mountComponent,
  useContent,
  type CatalogEntry,
  type MountOptions,
} from "../../../packages/shared/index";
import "./style.css";

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M20 1 24 15 39 20 24 24 20 39 15 24 1 20 15 15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GuideContent({
  options,
  onRetry,
}: {
  options: MountOptions;
  onRetry: () => void;
}) {
  const { data, error } = useContent<CatalogEntry[]>(options, "catalog");
  const [category, setCategory] = useState<"traps" | "enemies">("traps");
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [selected]);

  const imageUrl = (entry: CatalogEntry) =>
    media(options, entry.image.replace(/^media\//, ""));
  const closeDetails = () => dialog.current?.close();
  const entries = data?.filter((entry) => entry.category === category);
  const count = (group: "traps" | "enemies") =>
    String(
      data?.filter((entry) => entry.category === group).length ?? 3,
    ).padStart(2, "0");

  return (
    <>
      <div className="guide-toolbar">
        <div
          className="guide-filters"
          role="group"
          aria-label="Field guide category"
        >
          <button
            type="button"
            aria-pressed={category === "traps"}
            onClick={() => setCategory("traps")}
          >
            The traps <span aria-hidden="true">{count("traps")}</span>
          </button>
          <button
            type="button"
            aria-pressed={category === "enemies"}
            onClick={() => setCategory("enemies")}
          >
            The troublemakers <span aria-hidden="true">{count("enemies")}</span>
          </button>
        </div>
        <p className="guide-hint">Choose a card. Get acquainted.</p>
      </div>
      {error ? (
        <div className="guide-state" role="alert">
          <p>{error}</p>
          <button
            className="button guide-reload"
            type="button"
            onClick={onRetry}
          >
            Try again <Arrow />
          </button>
        </div>
      ) : !entries ? (
        <p className="guide-state" role="status">
          Opening the field guide…
        </p>
      ) : (
        <div
          className="guide-grid"
          aria-label={
            category === "traps" ? "Brickhold traps" : "Brickhold enemies"
          }
        >
          {entries.map((entry, index) => (
            <button
              className={`guide-card guide-card-${entry.id}`}
              type="button"
              key={entry.id}
              aria-label={`Explore ${entry.name}`}
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setSelected(entry);
              }}
            >
              <span className="guide-card-top">
                <span className="guide-card-stud" aria-hidden="true" />
                <span>{entry.eyebrow}</span>
                <span className="guide-card-stud" aria-hidden="true" />
              </span>
              <span className="guide-card-image">
                <img
                  src={imageUrl(entry)}
                  alt={entry.alt}
                  loading="lazy"
                  width="720"
                  height="720"
                />
                <span className="guide-art-label">{entry.kind}</span>
              </span>
              <span className="guide-card-copy">
                <span className="guide-card-index" aria-hidden="true">
                  NO. 0{index + 1}
                </span>
                <span className="guide-card-title">
                  <span className="guide-card-name">{entry.name}</span>
                  <span className="guide-plus" aria-hidden="true">
                    +
                  </span>
                </span>
                <span className="guide-card-open">
                  Take a closer look <Arrow diagonal />
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="guide-bottom">
        <span>Small pieces. Big consequences.</span>
        <Spark />
        <span>More trouble in the making.</span>
      </div>
      <dialog
        className="guide-dialog"
        ref={dialog}
        aria-labelledby="guide-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDetails();
        }}
        onClose={() => {
          setSelected(null);
          trigger.current?.focus();
        }}
      >
        {selected && (
          <div className="guide-dialog-layout">
            <div className="guide-dialog-art">
              <img
                src={imageUrl(selected)}
                alt={selected.alt}
                width="720"
                height="720"
              />
              <span className="guide-art-label">{selected.kind}</span>
            </div>
            <div className="guide-dialog-copy">
              <button
                className="guide-dialog-close"
                type="button"
                onClick={closeDetails}
                autoFocus
                aria-label="Close artwork details"
              >
                ×
              </button>
              <p className="eyebrow">BRICKHOLD FIELD GUIDE</p>
              <h3 id="guide-dialog-title">{selected.name}</h3>
              <p className="guide-dialog-type">{selected.eyebrow}</p>
              <p>{selected.description}</p>
              <p className="guide-dialog-note">
                From the Brickhold workbench. The game is in development; these
                are concept visuals.
              </p>
              <button
                className="button guide-back"
                type="button"
                onClick={closeDetails}
              >
                Back to the field guide <Arrow />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function FieldGuide({ options }: { options: MountOptions }) {
  const [attempt, setAttempt] = useState(0);
  return (
    <section
      className="field-guide"
      id="workshop"
      aria-labelledby="workshop-title"
    >
      <div className="wrap guide-inner">
        <Spark className="guide-spark guide-spark-left" />
        <Spark className="guide-spark guide-spark-right" />
        <div className="guide-heading">
          <p className="eyebrow">THE BRICKHOLD FIELD GUIDE</p>
          <h2 className="section-title" id="workshop-title">
            <span>Pick your tools.</span>
            <br />
            Meet your problems.
          </h2>
          <p className="guide-intro">
            Some things are built to help you.
            <br className="guide-mobile-break" /> Others would rather see you in
            pieces.
          </p>
        </div>
        <GuideContent
          key={attempt}
          options={options}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      </div>
    </section>
  );
}

export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <FieldGuide options={options} />);

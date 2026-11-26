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
            The traps <span>03</span>
          </button>
          <button
            type="button"
            aria-pressed={category === "enemies"}
            onClick={() => setCategory("enemies")}
          >
            The troublemakers <span>03</span>
          </button>
        </div>
        <p className="guide-hint">
          A few things we've been tinkering with.{" "}
          <span aria-hidden="true">↙</span>
        </p>
      </div>
      {error ? (
        <div className="guide-state" role="alert">
          <p>{error}</p>
          <button className="guide-reload" type="button" onClick={onRetry}>
            Try again <span aria-hidden="true">↻</span>
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
              className="guide-card"
              type="button"
              key={entry.id}
              aria-label={`Explore ${entry.name}`}
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setSelected(entry);
              }}
            >
              <div className={`guide-card-image guide-card-${entry.id}`}>
                <img
                  src={imageUrl(entry)}
                  alt={entry.alt}
                  loading="lazy"
                  width="720"
                  height="640"
                />
                <span className="guide-art-label">{entry.kind}</span>
                <span className="guide-card-number" aria-hidden="true">
                  0{index + 1}
                </span>
              </div>
              <div className="guide-card-copy">
                <p className="eyebrow">{entry.eyebrow}</p>
                <div className="guide-card-title">
                  <h3>{entry.name}</h3>
                  <span className="guide-plus" aria-hidden="true">
                    +
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="guide-bottom">
        <span>Small pieces. Big consequences.</span>
        <span>
          BRICKHOLD FIELD NOTES <span aria-hidden="true">✳</span>
        </span>
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
              <p className="eyebrow">
                BRICKHOLD /{" "}
                {selected.category === "traps"
                  ? "THE TRAPS"
                  : "THE TROUBLEMAKERS"}
              </p>
              <h3 id="guide-dialog-title">{selected.name}</h3>
              <p className="guide-dialog-type">{selected.eyebrow}</p>
              <p>{selected.description}</p>
              <p className="guide-dialog-note">
                From the Brickhold workbench. The game is in development; these
                are concept visuals.
              </p>
              <button
                className="button button-outline guide-back"
                type="button"
                onClick={closeDetails}
              >
                Back to the workbench <Arrow />
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
      className="field-guide wrap"
      id="workshop"
      aria-labelledby="workshop-title"
    >
      <div className="guide-heading">
        <div>
          <p className="eyebrow">02 / THE WORKSHOP</p>
          <h2 className="section-title" id="workshop-title">
            Fresh from the
            <br />
            workbench<span className="guide-orange">.</span>
          </h2>
        </div>
        <p className="guide-intro muted">
          Meet the contraptions.
          <br />
          And the creatures they're built for.
        </p>
      </div>
      <GuideContent
        key={attempt}
        options={options}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    </section>
  );
}

export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <FieldGuide options={options} />);

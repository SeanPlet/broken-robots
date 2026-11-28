import { useRef, useState, type KeyboardEvent } from "react";
import {
  Arrow,
  media,
  mountComponent,
  useContent,
  type CatalogEntry,
  type SiteContent,
  type MountOptions,
} from "../../../packages/shared";
import "./style.css";
import { usePanelTransition } from "../../../packages/shared/use-panel-transition";
import { AmbientParticles } from "../../../packages/shared/ambient-particles";

const tabs = [
  { id: "shardkeepers", label: "Shardkeepers" },
  { id: "traps", label: "The traps" },
  { id: "enemies", label: "The troublemakers" },
  { id: "upgrades", label: "Upgrade Cards" },
  { id: "kingdoms", label: "Kingdoms" },
] as const;
type Category = (typeof tabs)[number]["id"];

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

function RosterCard({
  entry,
  index,
  options,
}: {
  entry: CatalogEntry;
  index: number;
  options: MountOptions;
}) {
  const titleId = `guide-name-${entry.id}`;
  return (
    <article
      className={`guide-card guide-card-${entry.id}`}
      data-category={entry.category}
      data-upgrade-type={entry.upgradeType}
      aria-labelledby={titleId}
    >
      <div className="guide-card-surface">
        <div className="guide-card-top">
          <span className="guide-card-stud" aria-hidden="true" />
          <span>{entry.eyebrow}</span>
          <span className="guide-card-stud" aria-hidden="true" />
        </div>
        <div className="guide-card-image">
          <img
            src={media(options, entry.image.replace(/^media\//, ""))}
            alt={entry.alt}
            loading="lazy"
            width={entry.category === "upgrades" ? "116" : "427"}
            height={
              entry.category === "upgrades"
                ? "116"
                : entry.category === "traps"
                  ? "241"
                  : "427"
            }
          />
        </div>
        <div className="guide-card-copy">
          <div className="guide-card-index">
            <span aria-hidden="true">
              NO. {String(index + 1).padStart(2, "0")}
            </span>
            {entry.cost && (
              <span className="guide-card-cost">{entry.cost}</span>
            )}
            {entry.rare && (
              <span className="guide-card-rarity">
                <span aria-hidden="true">★</span> Rare
              </span>
            )}
          </div>
          <h3 className="guide-card-name" id={titleId}>
            {entry.name}
          </h3>
          <p className="guide-card-description">{entry.description}</p>
        </div>
      </div>
    </article>
  );
}

function ShardkeeperPreview({ options }: { options: MountOptions }) {
  return (
    <div className="guide-heroes" aria-labelledby="guide-heroes-title">
      <AmbientParticles className="guide-hero-particles" shape="runes" />
      <img
        className="guide-hero-portrait"
        src={media(options, "hero.webp")}
        alt="A smiling yellow-headed Shardkeeper in a red torso and blue legs, standing in Brickhold's courtyard"
        loading="lazy"
        width="800"
        height="800"
      />
      <div className="guide-hero-copy">
        <p className="eyebrow">THE OTHER SIDE OF THE FIGHT</p>
        <h3 id="guide-heroes-title">Choose your Shardkeeper.</h3>
        <p>
          The heroes behind the defenses. We’ll introduce the playable roster
          here as it takes shape.
        </p>
      </div>
    </div>
  );
}

function GuideContent({
  options,
  category,
  setCategory,
  onRetry,
}: {
  options: MountOptions;
  category: Category;
  setCategory: (category: Category) => void;
  onRetry: () => void;
}) {
  const catalog = useContent<CatalogEntry[]>(options, "catalog");
  const site = useContent<SiteContent>(options, "site");
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const panelsRef = usePanelTransition(category, "collection");
  function count(id: Category) {
    return id === "kingdoms"
      ? site.data?.maps.length
      : catalog.data?.filter((entry) => entry.category === id).length;
  }
  function moveTab(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === category);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setCategory(tabs[next].id);
    tabButtons.current[next]?.focus();
  }
  return (
    <>
      <div className="guide-toolbar">
        <div
          className="guide-filters"
          role="tablist"
          aria-label="Field guide collections"
          onKeyDown={moveTab}
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`guide-tab-${tab.id}`}
              aria-controls={`guide-panel-${tab.id}`}
              aria-selected={category === tab.id}
              tabIndex={category === tab.id ? 0 : -1}
              ref={(node) => {
                tabButtons.current[index] = node;
              }}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
              {tab.id !== "shardkeepers" && (
                <span aria-hidden="true">
                  {count(tab.id) === undefined
                    ? "…"
                    : String(count(tab.id)).padStart(2, "0")}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="guide-panels" ref={panelsRef}>
        {tabs.map((tab) => {
          const isMaps = tab.id === "kingdoms";
          const error = isMaps ? site.error : catalog.error;
          const loading = isMaps ? !site.data : !catalog.data;
          const entries =
            catalog.data?.filter((entry) => entry.category === tab.id) ?? [];
          return (
            <div
              key={tab.id}
              className="guide-panel"
              data-panel-key={tab.id}
              role="tabpanel"
              id={`guide-panel-${tab.id}`}
              aria-labelledby={`guide-tab-${tab.id}`}
              tabIndex={0}
              hidden={category !== tab.id}
              aria-hidden={category !== tab.id}
              inert={category !== tab.id}
            >
              {tab.id === "shardkeepers" ? (
                <ShardkeeperPreview options={options} />
              ) : error ? (
                <div className="guide-state" role="alert">
                  <p>{error}</p>
                  <button className="button guide-reload" onClick={onRetry}>
                    Try again <Arrow />
                  </button>
                </div>
              ) : loading ? (
                <p className="guide-state" role="status">
                  Opening the field guide…
                </p>
              ) : isMaps ? (
                <>
                  <p className="guide-collection-intro">
                    Places worth defending. From castle courtyards to golden
                    fields and windmill walls.
                  </p>
                  <div className="guide-map-grid">
                    {site.data!.maps.map((map) => (
                      <article
                        className="guide-map-card"
                        key={map.id}
                        aria-labelledby={`guide-map-${map.id}`}
                      >
                        <img
                          src={media(
                            options,
                            map.image.replace(/^media\//, ""),
                          )}
                          alt={map.alt}
                          loading="lazy"
                          width="1920"
                          height="1080"
                        />
                        <div className="guide-map-copy">
                          <p className="eyebrow">{map.eyebrow}</p>
                          <h3 id={`guide-map-${map.id}`}>{map.name}</h3>
                          <p>{map.description}</p>
                          <span className="guide-map-note">{map.note}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="guide-collection-intro">
                    <span className="guide-roster-count">
                      {entries.length}{" "}
                      {tab.id === "traps"
                        ? "defenses"
                        : tab.id === "upgrades"
                          ? "upgrades"
                          : "troublemakers"}
                      .
                    </span>{" "}
                    {tab.id === "traps"
                      ? "Build a plan. Make it everyone's problem."
                      : tab.id === "upgrades"
                        ? "A roguelike twist between waves. Choose upgrade cards to strengthen your traps, grow your stud income, bolster your defenses or power up your heroes."
                        : "Know what is coming through that portal."}
                  </p>
                  <div className="guide-grid" data-category={tab.id}>
                    {entries.map((entry, index) => (
                      <div className="guide-card-slot" key={entry.id}>
                        <RosterCard
                          entry={entry}
                          index={index}
                          options={options}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="guide-bottom">
        <span>Small pieces. Big consequences.</span>
        <Spark />
        <span>The world of Brickhold.</span>
      </div>
    </>
  );
}
function FieldGuide({ options }: { options: MountOptions }) {
  const [attempt, setAttempt] = useState(0);
  const [category, setCategory] = useState<Category>("traps");
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
          <AmbientParticles className="guide-particles" shape="runes" />
          <p className="eyebrow">THE BRICKHOLD FIELD GUIDE</p>
          <h2 className="section-title" id="workshop-title">
            <span>Pick your tools.</span>
            <br />
            Meet your problems.
          </h2>
          <p className="guide-intro">
            The heroes, defenses, creatures, upgrades, and places worth protecting.
          </p>
        </div>
        <GuideContent
          key={attempt}
          options={options}
          category={category}
          setCategory={setCategory}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      </div>
    </section>
  );
}
export const mount = (container: HTMLElement, options: MountOptions) =>
  mountComponent(container, <FieldGuide options={options} />);

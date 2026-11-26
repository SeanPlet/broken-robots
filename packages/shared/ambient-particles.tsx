import { media, type MountOptions } from "./index";
import { useDecorationInView } from "./use-decoration-in-view";
import "./ambient-particles.css";

const brickColors = ["teal", "blue", "coral", "gold", "blue", "teal"];

type ParticleProps = {
  className: string;
} & (
  { shape: "bricks"; options: MountOptions } | { shape: "runes" | "sparks" }
);

export function AmbientParticles(props: ParticleProps) {
  const ref = useDecorationInView<HTMLDivElement>();
  return (
    <div
      className={`ambient-particles ${props.className}`}
      data-particle-shape={props.shape}
      aria-hidden="true"
      ref={ref}
    >
      {brickColors.map((color, index) => (
        <i
          key={index}
          style={
            props.shape === "bricks"
              ? {
                  backgroundImage: `url("${media(props.options, `particle-brick-${color}.png`)}")`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

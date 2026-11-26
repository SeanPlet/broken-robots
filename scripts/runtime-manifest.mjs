export const remotes = ["intro", "brickhold", "field-guide", "studio"];
export function runtimeManifest() {
  return Object.fromEntries(
    remotes.map((name) => [
      name,
      {
        module: `mfe/${name}/entry.js`,
        stylesheet: `mfe/${name}/style.css`,
      },
    ]),
  );
}

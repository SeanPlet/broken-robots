# Website media

The website now uses the actual game captures and branding supplied by the user in `C:/Users/sean.pletschke/Downloads`. The originals remain untouched. Optimized derivatives are committed under `apps/shell/public/media/`, so Downloads and the Godot repository are not needed to run or build the site.

Run `node scripts/import-assets.mjs` to regenerate from the current user's Downloads folder, or pass an explicit source directory. Only the named source files in the importer are read. Screenshot content is preserved; no game visuals or logo details are generated or redrawn.

| Website media                             | Original download                  | Use                                                         |
| ----------------------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| studio-logo.webp                          | broken_robot.png                   | Actual transparent studio logo in header, studio and footer |
| brickhold-logo.webp                       | brickhold_logo.png                 | Actual transparent Brickhold wordmark and swords            |
| portal.webp                               | 04_out_of_the_portal.jpg           | Opening scene                                               |
| world.webp                                | 05_the_playground.jpg              | Arena gallery view and the Playground Kingdoms card         |
| windwhistle-mill.webp                      | windwhistle-mill.png (chat attachment) | Supplied WindWhistle Mill artwork in the Kingdoms collection |
| gameplay.webp                             | 03_build_mode.jpg                  | Build-mode gallery view                                     |
| funnel.webp                               | 07_barricade_funnel.jpg            | Barricade routing gallery view                              |
| battle.webp                               | 01_horde_through_traps.jpg         | Trap-lane gallery view                                      |
| hero-fight-07.webp                        | hero_fight_07.jpg                  | Hero combat gallery view                                    |
| guard-post.webp                           | guard_post.jpg                     | Blue Knight gallery view                                    |
| guardians.webp                            | 06_guard_post.jpg                  | Additional guardian capture                                 |
| hero.webp                                 | hero.jpg                           | Supplied player portrait in the future Shardkeeper preview  |
| cover.webp                                | cover_1260x1000.png                | Supplied cover, available for future use                    |
| brickhold-social.jpg                      | cover.webp                         | 1200 × 630 link preview for Brickhold                       |
| particle-brick-*.png                      | Original geometric sprites         | Transparent floating brick icons                            |
| banner.webp                               | banner_1920x480.png                | Supplied banner, available for future use                   |
| trap-roster.webp                          | trap_roster.png                    | Complete eight-defense reference sheet                      |
| enemy-roster.webp                         | enemy_roster.png                   | Complete eleven-enemy reference sheet                       |
| gameplay-loop.webp / gameplay-poster.webp | brickhold_gameplay.gif             | Optional combat animation and still poster                  |
| horde-loop.webp / horde-poster.webp       | horde_through_traps.gif            | Optional horde animation and still poster                   |
| horde-loop.mp4                            | horde-loop.webp                    | Pausable Defend gameplay preview                            |
| catalog/*.webp                            | trap_roster.png / enemy_roster.png | Individual in-game portraits for all nineteen cards         |

The individual roster crops exclude the baked titles, captions and margins. Columns start at x = 60, 517, 974, 1431, width 427px. Trap rows start at y = 196, 588, height 241px. Enemy rows start at y = 196, 739, 1282, height 427px. These bounds and every ID are recorded in the importer. Card copy, prices and roles follow the supplied sheets. Each tab displays the full corresponding roster as static cards, with the descriptions directly visible; there are no detail dialogs or pagination.

The retained WebP animations preserve all source frames, frame delays and looping: gameplay has 56 frames over 4660ms, horde has 70 frames over 4670ms. The Defend gallery uses an H.264 MP4 converted from the horde animation, with the matching first-frame poster. One muted, inline video preloads and stays paused until a visitor selects **Play gameplay**. **Pause gameplay** holds the current frame; playing again resumes from that point without replacing the media. Switching gallery views or changing a motion preference to reduce pauses playback. Returning to Defend starts paused. Fight uses the supplied still hero image.

To regenerate the MP4 after importing media, run `node scripts/convert-gameplay-video.mjs` with FFmpeg 9 or newer on PATH, or pass its executable path as the first argument. The converter reads the committed WebP, so the original Downloads are not needed. FFmpeg is only needed for regenerating this asset, not for running or building the site.

WindWhistle Mill uses the image supplied in chat on 27 November 2026, converted to WebP at its original 1672 × 941 dimensions without cropping or redrawing. Save the attachment as `windwhistle-mill.png` in the source directory to regenerate it with the importer. Its Kingdoms card is labelled **Map artwork · In development**; the Playground retains its **In-game capture** caption.

Both logos preserve transparency. The favicon is a transparent crop of the actual studio robot's head; it is recorded as `faviconCrop` in the importer and written to `apps/shell/public/favicon.png`. The logo's spelling, **Broken Robot**, is used consistently in visible site copy.

Bungee and DM Sans remain self-hosted, with OFL notices beside their files under `apps/shell/public/fonts/`. The brick transitions, card frames, crystal decoration and raven postcard are code-drawn website decoration. The supplied logos and game imagery retain their original designs. No artwork or layout was extracted from itch.io or the inspiration websites.

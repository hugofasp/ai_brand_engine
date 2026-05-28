/**
 * Decorative atom rotating behind the hero headline.
 *
 * Three elliptical orbits tilted at 0°, 60°, and 120°, each carrying
 * one electron in an accent colour. The three electrons mirror the
 * three coloured words in the H1 (green / orange / blue) so the
 * background visually rhymes with the copy in front of it.
 *
 * Visual register:
 *  - Nucleus: a microchip schematic (flat line art with pins + traces),
 *    not a 3D sphere. Reads as the processing core every AI orbits.
 *    Soft halo around it; gentle scale-pulse on its own cadence (3.8s).
 *  - Orbits: dual-track strokes (a soft outer band plus a sharper
 *    inner line with a gradient that fades at the ends to suggest
 *    motion).
 *  - Electrons: solid accent disc + radial glow + inner specular dot.
 *
 * Pure CSS animation. Respects `prefers-reduced-motion` via the global
 * rule in globals.css.
 */

export function HeroAtomBackground() {
  return (
    <div aria-hidden="true" className="hero-atom">
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" fill="none">
        <defs>
          {/* Electron nebula gradients. Each electron is a small cloud
              with no hard edge: a hot bright core fades through a
              vibrant mid into a soft extended wisp. Colours are pushed
              brighter than the global accent tokens so the electrons
              read as glowing energy points, not flat disks. */}
          {/* Green: lime hot core → vivid green mid → soft fade */}
          <radialGradient id="atom-electron-green-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bbf7d0" stopOpacity="1" />
            <stop offset="18%" stopColor="#4ade80" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#22c55e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="atom-electron-green-wisp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#22c55e" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
          </radialGradient>

          {/* Orange: peach hot core → vivid orange mid → soft fade */}
          <radialGradient id="atom-electron-orange-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fed7aa" stopOpacity="1" />
            <stop offset="18%" stopColor="#fb923c" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#f97316" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="atom-electron-orange-wisp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#f97316" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
          </radialGradient>

          {/* Blue: sky hot core → vivid blue mid → soft fade */}
          <radialGradient id="atom-electron-blue-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#bfdbfe" stopOpacity="1" />
            <stop offset="18%" stopColor="#60a5fa" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="atom-electron-blue-wisp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </radialGradient>

          {/* Nucleus outer halo: soft purple glow. The chip is the
              brand's processing core, so it gets the platform identity
              colour as its aura. */}
          <radialGradient id="atom-nucleus-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-accent-purple)" stopOpacity="0.45" />
            <stop offset="45%" stopColor="var(--color-accent-purple)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--color-accent-purple)" stopOpacity="0" />
          </radialGradient>

          {/* Orbit stroke gradient. Fades at horizontal ends to suggest motion. */}
          <linearGradient id="atom-orbit-stroke" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="var(--color-border-strong)" stopOpacity="0" />
            <stop offset="20%" stopColor="var(--color-border-strong)" stopOpacity="0.45" />
            <stop offset="50%" stopColor="var(--color-border-strong)" stopOpacity="0.7" />
            <stop offset="80%" stopColor="var(--color-border-strong)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--color-border-strong)" stopOpacity="0" />
          </linearGradient>

          {/* Nebula core: a hotter, smaller cloud sitting inside the
              main halo. Bright purple at the centre, fading fast. */}
          <radialGradient id="atom-nebula-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.95" />
            <stop offset="20%" stopColor="var(--color-accent-purple)" stopOpacity="0.7" />
            <stop offset="55%" stopColor="var(--color-accent-purple-strong)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-accent-purple-strong)" stopOpacity="0" />
          </radialGradient>
          {/* Off-centre wisp: a second cloud blob, slightly displaced
              from centre, so the nebula doesn't look like a perfect
              ball. Adds the irregularity real nebulae have. */}
          <radialGradient id="atom-nebula-wisp" cx="38%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#ddd6fe" stopOpacity="0.5" />
            <stop offset="60%" stopColor="var(--color-accent-purple)" stopOpacity="0.1" />
            <stop offset="100%" stopColor="var(--color-accent-purple)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer atom halo — very faint quantum cloud */}
        <circle cx="200" cy="200" r="195" fill="url(#atom-nucleus-halo)" opacity="0.6" />

        {/* === Orbit 1 — green electron, 22s clockwise === */}
        <g className="hero-atom__orbit hero-atom__orbit--1">
          {/* Soft outer band */}
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="var(--color-border-strong)"
            strokeOpacity="0.12"
            strokeWidth="4"
          />
          {/* Sharper inner line with fade */}
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="url(#atom-orbit-stroke)"
            strokeWidth="1.2"
          />
          {/* Electron: layered nebula (wisp + core), pulsing opacity */}
          <circle
            className="hero-atom__electron hero-atom__electron--1"
            cx="384"
            cy="200"
            r="36"
            fill="url(#atom-electron-green-wisp)"
          />
          <circle
            className="hero-atom__electron-core hero-atom__electron-core--1"
            cx="384"
            cy="200"
            r="18"
            fill="url(#atom-electron-green-core)"
          />
        </g>

        {/* === Orbit 2 — orange electron, 16s counter-clockwise === */}
        <g className="hero-atom__orbit hero-atom__orbit--2">
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="var(--color-border-strong)"
            strokeOpacity="0.12"
            strokeWidth="4"
          />
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="url(#atom-orbit-stroke)"
            strokeWidth="1.2"
          />
          <circle
            className="hero-atom__electron hero-atom__electron--2"
            cx="384"
            cy="200"
            r="36"
            fill="url(#atom-electron-orange-wisp)"
          />
          <circle
            className="hero-atom__electron-core hero-atom__electron-core--2"
            cx="384"
            cy="200"
            r="18"
            fill="url(#atom-electron-orange-core)"
          />
        </g>

        {/* === Orbit 3 — blue electron, 19s clockwise === */}
        <g className="hero-atom__orbit hero-atom__orbit--3">
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="var(--color-border-strong)"
            strokeOpacity="0.12"
            strokeWidth="4"
          />
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="url(#atom-orbit-stroke)"
            strokeWidth="1.2"
          />
          <circle
            className="hero-atom__electron hero-atom__electron--3"
            cx="384"
            cy="200"
            r="36"
            fill="url(#atom-electron-blue-wisp)"
          />
          <circle
            className="hero-atom__electron-core hero-atom__electron-core--3"
            cx="384"
            cy="200"
            r="18"
            fill="url(#atom-electron-blue-core)"
          />
        </g>

        {/* === Orbit 4: second orange electron on a near-vertical axis
              (90° tilt), counter-clockwise on a 13s cadence. Breaks the
              symmetry of the 3-orbit composition and gives the system
              a fourth pulse point. === */}
        <g className="hero-atom__orbit hero-atom__orbit--4">
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="var(--color-border-strong)"
            strokeOpacity="0.12"
            strokeWidth="4"
          />
          <ellipse
            cx="200"
            cy="200"
            rx="184"
            ry="64"
            stroke="url(#atom-orbit-stroke)"
            strokeWidth="1.2"
          />
          <circle
            className="hero-atom__electron hero-atom__electron--4"
            cx="384"
            cy="200"
            r="36"
            fill="url(#atom-electron-orange-wisp)"
          />
          <circle
            className="hero-atom__electron-core hero-atom__electron-core--4"
            cx="384"
            cy="200"
            r="18"
            fill="url(#atom-electron-orange-core)"
          />
        </g>

        {/* === Nucleus: a soft purple nebula at the centre of the atom.
              No defined shape, no chip, no edges: layered radial gradients
              fading into the page. Each layer pulses on its own cadence
              so the cloud feels alive, never repeats exactly. */}
        <g className="hero-atom__nucleus">
          {/* Outermost diffuse haze: the widest, faintest layer. Slow
              breath. */}
          <circle
            className="hero-atom__nebula hero-atom__nebula--outer"
            cx="200"
            cy="200"
            r="120"
            fill="url(#atom-nucleus-halo)"
          />
          {/* Mid-range cloud: medium width, brighter than the outer
              haze. Different breath cadence so the layers drift in and
              out of phase. */}
          <circle
            className="hero-atom__nebula hero-atom__nebula--mid"
            cx="200"
            cy="200"
            r="72"
            fill="url(#atom-nebula-core)"
          />
          {/* Off-centre wisp: slightly displaced from the geometric
              centre to break perfect symmetry, the way real nebulae
              never sit on a clean axis. */}
          <circle
            className="hero-atom__nebula hero-atom__nebula--wisp"
            cx="200"
            cy="200"
            r="58"
            fill="url(#atom-nebula-wisp)"
          />
          {/* Hot core: smallest, brightest. Faster pulse, like a
              denser pocket of energy. */}
          <circle
            className="hero-atom__nebula hero-atom__nebula--core"
            cx="200"
            cy="200"
            r="22"
            fill="url(#atom-nebula-core)"
          />
        </g>
      </svg>
    </div>
  );
}

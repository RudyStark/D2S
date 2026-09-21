import { range, smootherstep } from "@/lib/math";

/**
 * Lobby → Services on desktop: a cinematic "focus pull" instead of a flat blur veil.
 * Driven by frame.services (0 = section below the fold, 1 = section at the top):
 *  - the camera keeps drifting towards the reception (dolly + slight tighten),
 *  - the depth of field first softens the room around May (reception) and the desk, which hold focus,
 *  - then the focus racks towards the lens and the whole lobby melts into bokeh under the page.
 * Mobile keeps the DOM veil (separate design to come).
 */
export const FOCUS_PULL = {
  /** Metres towards the desk (−Z), metres up, degrees of fov tightening, at the end of the move. */
  dolly: 1.3,
  rise: 0.08,
  tighten: 1.6,
  /** Where the focus rests first: the receptionist's torso behind the desk. */
  subject: [0, 1.75, -16.45] as const,
  /** Depth of field in world units: sharp band around the subject, then a near focus that blurs everything. */
  range: 3.2,
  nearDistance: 0.6,
  nearRange: 0.8,
  /** Maximum bokeh scale (half-resolution bokeh passes; higher shows the sampling pattern). */
  bokeh: 6,
  /** DOM veil blur at the end of the rack (px): smooths the bokeh into a calm backdrop. */
  veilBlur: 8,
};

export function focusPullCurve(services: number) {
  return {
    move: smootherstep(range(services, 0, 0.9)),
    soften: smootherstep(range(services, 0.04, 0.4)),
    rack: smootherstep(range(services, 0.32, 0.82)),
  };
}

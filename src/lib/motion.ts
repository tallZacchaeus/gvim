import { useEffect, type RefObject } from 'react';
import type { gsap as GsapType } from 'gsap';

/**
 * Motion layer.
 *
 * Two rules shape everything here:
 *
 * 1. CONTENT IS VISIBLE BY DEFAULT. Animations move elements *from* an offset
 *    *to* their natural state (gsap.from), never the reverse. If JS fails, the
 *    bundle is blocked, or an error throws mid-page, the reader still sees the
 *    page. A reveal that starts at opacity:0 and depends on JS to undo it is a
 *    content-loss bug waiting to happen.
 *
 * 2. REDUCED MOTION IS CHECKED ONCE, CENTRALLY. Every helper below no-ops when
 *    the user has asked for less motion, so no call site can forget.
 *
 * GSAP is loaded DYNAMICALLY. Core plus ScrollTrigger is ~45 kB gzipped — more
 * than the whole React app's growth budget — and motion is decoration. Bundling
 * it statically would delay first paint for every visitor to animate content
 * they can already read. As a lazy chunk the main bundle is unchanged and
 * nothing is fetched at all when reduced motion is requested.
 */

type Gsap = typeof GsapType;
type ScrollTriggerStatic = { refresh(): void; getAll(): unknown[] };

interface GsapLib { gsap: Gsap; ScrollTrigger: ScrollTriggerStatic }

let lib: GsapLib | null = null;
let loading: Promise<GsapLib | null> | null = null;

/** Load and register GSAP once. Resolves null when motion is not wanted. */
export async function loadGsap(): Promise<GsapLib | null> {
  if (typeof window === 'undefined' || prefersReducedMotion()) return null;
  if (lib) return lib;
  if (!loading) {
    loading = (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger')
      ]);
      gsap.registerPlugin(ScrollTrigger);
      lib = { gsap, ScrollTrigger: ScrollTrigger as unknown as ScrollTriggerStatic };
      return lib;
    })();
  }
  return loading;
}

/** True when the visitor has asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface RevealOptions {
  /** Children to stagger instead of animating the container itself. */
  children?: string;
  y?: number;
  duration?: number;
  stagger?: number;
  /** ScrollTrigger start position. */
  start?: string;
  /** Skip ScrollTrigger and play immediately — for above-the-fold content. */
  immediate?: boolean;
  delay?: number;
}

/**
 * Scroll-triggered reveal.
 *
 * gsap.context() scopes every selector to the ref and gives one revert() that
 * kills the tweens *and* their ScrollTriggers. Without it, React StrictMode's
 * double-mount in development registers each trigger twice, and route changes
 * leak triggers that fire against detached DOM nodes.
 */
export function useReveal(
  ref: RefObject<HTMLElement | null>,
  opts: RevealOptions = {}
) {
  const {
    children, y = 24, duration = 0.7, stagger = 0.08,
    start = 'top 85%', immediate = false, delay = 0
  } = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion: leave the DOM exactly as rendered — already visible, and
    // GSAP is never even fetched.
    if (prefersReducedMotion()) return;

    let ctx: { revert(): void } | null = null;
    let cancelled = false;

    loadGsap().then(loaded => {
      // The component may have unmounted while the chunk was in flight.
      if (!loaded || cancelled || !ref.current) return;
      const { gsap } = loaded;

      ctx = gsap.context(() => {
      const targets = children ? gsap.utils.toArray<HTMLElement>(children) : el;
      if (Array.isArray(targets) && targets.length === 0) return;

      /* fromTo with immediateRender:false, NOT from().
         gsap.from() applies the "from" state the instant the tween is created
         and only undoes it when the trigger fires. After a route change
         ScrollTrigger's cached positions are stale, so the trigger can fail to
         fire and the element stays at opacity 0 forever — a content-loss bug
         this helper exists to prevent. With immediateRender:false the element
         is left exactly as rendered until the animation actually runs, so the
         worst case is no animation rather than no content. */
      gsap.fromTo(targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger: children ? stagger : 0,
          ease: 'power2.out',
          immediateRender: false,
          // Transform and opacity only — nothing here may shift layout (CLS).
          force3D: true,
          ...(immediate ? {} : {
            scrollTrigger: { trigger: el, start, once: true }
          })
        }
      );
      }, el);

      /* Route changes alter page height, leaving ScrollTrigger with stale
         measurements. Without this, triggers for content already on screen
         never fire. */
      loaded.ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [ref, children, y, duration, stagger, start, immediate, delay]);
}

/** Refresh ScrollTrigger after async content changes the page height. */
export function refreshTriggers() {
  lib?.ScrollTrigger.refresh();
}

/** Live ScrollTrigger count — used by tests to prove nothing leaks. */
export function activeTriggerCount(): number {
  return lib ? lib.ScrollTrigger.getAll().length : 0;
}

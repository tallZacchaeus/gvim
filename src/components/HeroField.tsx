import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

/**
 * A slow light field behind the hero.
 *
 * ONE WebGL moment, not a 3D site. It sits behind the photo mosaic, which
 * remains the subject; this only tints the space around it in the brand navy
 * and gold. No models, no controls, no scroll-driven camera.
 *
 * Written against raw WebGL2 rather than Three.js. Three was tried first and
 * measured 127 kB gzipped as a lazy chunk, against a 60 kB budget — tree-shaking
 * cannot separate its renderer, program cache and material system. This effect
 * is a single full-screen fragment shader: no scene graph, no camera, no
 * geometry, no lighting. Three.js would have been a scene-graph library used
 * for no scene graph, at 127 kB. This costs nothing beyond the file.
 *
 * Everything here is defensive, because decoration must never cost a visitor
 * the page:
 *  - the module is dynamically imported, so Three.js is never in the main bundle
 *  - it renders nothing unless WebGL2, enough CPU cores, and motion are all
 *    available; the static hero is the DEFAULT, not a fallback
 *  - the loop pauses when the tab is hidden or the hero scrolls away
 *  - pixel ratio is capped at 1.5 and the frame rate at 30fps
 */
export default function HeroField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 0) < 4) return;

    // Probe WebGL2 without constructing the real renderer.
    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2')) return;

    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;
    const canvas = canvasRef.current;
    let dispose: (() => void) | null = null;

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

    const VERT = `#version 300 es
      void main() {
        // Fullscreen triangle from gl_VertexID — no buffers needed.
        vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
        gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
      }`;

    const FRAG = `#version 300 es
      precision mediump float;
      uniform float uTime;
      uniform vec2  uRes;
      out vec4 outColor;

      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uRes;
        float t = uTime * 0.03;
        float n = noise(uv * 2.2 + vec2(t, t * 0.6))
                + 0.5 * noise(uv * 4.4 - vec2(t * 0.8, t));

        vec3 navy = vec3(0.106, 0.145, 0.361);
        vec3 gold = vec3(0.98, 0.78, 0.31);
        vec3 col  = mix(navy, gold, smoothstep(0.45, 1.25, n));

        float vignette = smoothstep(1.1, 0.25, length(uv - 0.5));
        outColor = vec4(col, vignette * 0.16);
      }`;

    function compile(type: number, src: string) {
      const sh = gl!.createShader(type)!;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        console.error('[HeroField] shader failed:', gl!.getShaderInfoLog(sh));
        gl!.deleteShader(sh);
        return null;
      }
      return sh;
    }

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[HeroField] link failed:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uRes  = gl.getUniformLocation(prog, 'uRes');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    function resize() {
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (!w || !h) return;
      canvas.width = w; canvas.height = h;
      gl!.viewport(0, 0, w, h);
      gl!.uniform2f(uRes, w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    // Render only while the hero is on screen and the tab is visible.
    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(canvas);

    let raf = 0, last = 0;
    const FRAME = 1000 / 30;
    const start = performance.now();
    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (now - last < FRAME) return;
      last = now;
      gl!.uniform1f(uTime, (now - start) / 1000);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }
    raf = requestAnimationFrame(loop);

    dispose = () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      gl!.deleteProgram(prog);
      gl!.deleteShader(vs!);
      gl!.deleteShader(fs!);
    };

    return () => { dispose?.(); };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} className="hero-field" aria-hidden="true" />;
}

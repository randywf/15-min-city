<script lang="ts">
  // tweak these if you want
  export let density = 22;     // number of nodes
  export let duration = 3.6;   // seconds
</script>

<div class="bg" aria-hidden="true">
  <svg class="svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />
      </pattern>

      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <rect width="1000" height="700" fill="url(#grid)" />

    <!-- center point -->
    <circle cx="500" cy="350" r="5" fill="rgba(255,255,255,0.85)" class="center" />

    <!-- radial pulse -->
    <circle cx="500" cy="350" r="18" fill="none" stroke="rgba(81,199,192,0.35)" stroke-width="2" class="ring" />

    <!-- network edges (pre-placed nodes; looks organic) -->
    <g filter="url(#glow)">
      <!-- Lines: animate stroke-dashoffset (draw) -->
      <path class="edge d1" d="M500 350 L620 240" />
      <path class="edge d2" d="M500 350 L690 360" />
      <path class="edge d3" d="M500 350 L590 470" />
      <path class="edge d4" d="M500 350 L420 470" />
      <path class="edge d5" d="M500 350 L350 330" />
      <path class="edge d6" d="M500 350 L410 250" />
      <path class="edge d7" d="M500 350 L540 190" />
      <path class="edge d8" d="M500 350 L760 260" />
      <path class="edge d9" d="M500 350 L250 420" />
      <path class="edge d10" d="M500 350 L780 430" />
      <path class="edge d11" d="M500 350 L300 210" />
      <path class="edge d12" d="M500 350 L640 540" />

      <!-- Nodes: fade/scale in after their line draws -->
      <circle class="node n1"  cx="620" cy="240" r="4" />
      <circle class="node n2"  cx="690" cy="360" r="4" />
      <circle class="node n3"  cx="590" cy="470" r="4" />
      <circle class="node n4"  cx="420" cy="470" r="4" />
      <circle class="node n5"  cx="350" cy="330" r="4" />
      <circle class="node n6"  cx="410" cy="250" r="4" />
      <circle class="node n7"  cx="540" cy="190" r="4" />
      <circle class="node n8"  cx="760" cy="260" r="4" />
      <circle class="node n9"  cx="250" cy="420" r="4" />
      <circle class="node n10" cx="780" cy="430" r="4" />
      <circle class="node n11" cx="300" cy="210" r="4" />
      <circle class="node n12" cx="640" cy="540" r="4" />

      <!-- Secondary connections (appear later, lighter) -->
      <path class="edge2 s1" d="M620 240 L760 260" />
      <path class="edge2 s2" d="M590 470 L640 540" />
      <path class="edge2 s3" d="M350 330 L250 420" />
      <path class="edge2 s4" d="M410 250 L300 210" />
      <path class="edge2 s5" d="M690 360 L780 430" />
    </g>
  </svg>
</div>

<style>
  .bg{
  position:absolute;
  inset:0;
  overflow:hidden;
  z-index:0;
  background:
    radial-gradient(circle at 30% 20%, rgba(81,199,192,0.14), transparent 45%),
    radial-gradient(circle at 70% 70%, rgba(70,130,255,0.12), transparent 55%),
    #0b0f14;
}

.svg{
  width:100%;
  height:100%;
  opacity:0.95;
  /* subtle slow drift */
  animation: drift 12s ease-in-out infinite alternate;
}

@keyframes drift{
  0%{ transform: translate3d(0,0,0) scale(1); }
  100%{ transform: translate3d(-10px, 8px, 0) scale(1.01); }
}

.center{
  filter: drop-shadow(0 0 12px rgba(81,199,192,0.5));
}

/* ring pulse stays infinite */
.ring{
  opacity:0.7;
  animation: ring 1.8s ease-in-out infinite;
}
@keyframes ring{
  0%,100%{ transform: scale(1); opacity: .40; }
  50%{ transform: scale(1.25); opacity: .85; }
}

/* --- LOOP TIMELINE --- */
/* Total loop length: 6s */
:root{
  --loop: 6s;
}

/* Primary edges */
.edge{
  fill:none;
  stroke: rgba(81,199,192,0.42);
  stroke-width: 2.2;
  stroke-linecap: round;

  stroke-dasharray: 600;
  stroke-dashoffset: 600;

  /* Loop: draw (0-55%), hold (55-80%), fade/reset (80-100%) */
  animation: edgeLoop var(--loop) ease-in-out infinite;
}

/* Stagger delays */
.d1{  animation-delay: .05s; }
.d2{  animation-delay: .15s; }
.d3{  animation-delay: .25s; }
.d4{  animation-delay: .35s; }
.d5{  animation-delay: .45s; }
.d6{  animation-delay: .55s; }
.d7{  animation-delay: .65s; }
.d8{  animation-delay: .75s; }
.d9{  animation-delay: .85s; }
.d10{ animation-delay: .95s; }
.d11{ animation-delay: 1.05s; }
.d12{ animation-delay: 1.15s; }

@keyframes edgeLoop{
  0%   { stroke-dashoffset: 600; opacity: 0; }
  10%  { opacity: 0.9; }
  55%  { stroke-dashoffset: 0; opacity: 0.9; }
  80%  { stroke-dashoffset: 0; opacity: 0.55; }
  100% { stroke-dashoffset: 600; opacity: 0; }
}

/* Nodes */
.node{
  fill: rgba(255,255,255,0.78);
  opacity: 0;
  transform-origin: center;
  animation: nodeLoop var(--loop) ease-in-out infinite;
}

/* Nodes appear after their corresponding edges */
.n1{  animation-delay: .30s; }
.n2{  animation-delay: .40s; }
.n3{  animation-delay: .50s; }
.n4{  animation-delay: .60s; }
.n5{  animation-delay: .70s; }
.n6{  animation-delay: .80s; }
.n7{  animation-delay: .90s; }
.n8{  animation-delay: 1.00s; }
.n9{  animation-delay: 1.10s; }
.n10{ animation-delay: 1.20s; }
.n11{ animation-delay: 1.30s; }
.n12{ animation-delay: 1.40s; }

@keyframes nodeLoop{
  0%   { opacity: 0; transform: scale(0.75); }
  18%  { opacity: 0; transform: scale(0.75); }
  30%  { opacity: 0.9; transform: scale(1); }
  75%  { opacity: 0.75; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.75); }
}

/* Secondary edges (lighter, appear later) */
.edge2{
  fill:none;
  stroke: rgba(255,255,255,0.14);
  stroke-width: 1.6;
  stroke-linecap: round;

  stroke-dasharray: 600;
  stroke-dashoffset: 600;

  animation: edge2Loop var(--loop) ease-in-out infinite;
  animation-delay: 1.4s;
}

@keyframes edge2Loop{
  0%   { stroke-dashoffset: 600; opacity: 0; }
  20%  { opacity: 0.7; }
  55%  { stroke-dashoffset: 0; opacity: 0.7; }
  80%  { stroke-dashoffset: 0; opacity: 0.35; }
  100% { stroke-dashoffset: 600; opacity: 0; }
}

/* Optional subtle shimmer by alternating node brightness */
.node{
  filter: drop-shadow(0 0 6px rgba(81,199,192,0.18));
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce){
  .svg, .edge, .edge2, .node, .ring{ animation: none !important; }
  .node{ opacity: .85; transform: none; }
  .edge, .edge2{ stroke-dashoffset: 0; opacity: .6; }
}

</style>

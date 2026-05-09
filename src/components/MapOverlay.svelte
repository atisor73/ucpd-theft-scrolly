<script>
  export let activeHandScene = 'none';
  export let introMonthYearLabel = '';
  export let introTimelineProgress = 0;
  export let introTimelineDayLabel = '';
  export let mapLoaded = false;
  export let visibleHands = [];
  export let visibleCallouts = [];
  export let introHandLifetimeMs = 300;
  export let loading = false;
  export let error = '';
  let hoveredHand = null;

  function handMeta(hand) {
    if (!hand?.hotspotCount) {
      return '';
    }

    if (hand.mode === 'merchandise') {
      return `${hand.hotspotCount} merchandise reports at this hotspot`;
    }

    if (hand.mode === 'category-hotspot') {
      return `${hand.hotspotCount} ${hand.hotspotLabel || 'category'} reports at this hotspot`;
    }

    return '';
  }

  function showHandHover(hand) {
    if (hand.mode !== 'merchandise' && hand.mode !== 'category-hotspot') {
      return;
    }

    hoveredHand = hand;
  }

  function clearHandHover() {
    hoveredHand = null;
  }

  $: if (hoveredHand && !visibleHands.some((hand) => hand.id === hoveredHand.id)) {
    hoveredHand = null;
  }
</script>

{#if activeHandScene === 'intro' && introMonthYearLabel}
  <div class="timeline-chip">
    <div class="timeline-chip-month">{introMonthYearLabel}</div>
    <div class="timeline-track-wrap" aria-hidden="true">
      <div class="timeline-track"></div>
      <div class="timeline-marker" style={`left:${introTimelineProgress * 100}%;`}></div>
    </div>
    {#if introTimelineDayLabel}
      <div class="timeline-chip-day">{introTimelineDayLabel}</div>
    {/if}
  </div>
{/if}

{#if mapLoaded}
  <div class:disabled={activeHandScene === 'none'} class="hand-overlay" aria-hidden="true">
    {#each visibleHands as hand (hand.id)}
      <img
        class:aggregate-hand={hand.mode === 'aggregate'}
        class:merchandise-icon={hand.mode === 'merchandise'}
        class:category-icon={hand.mode === 'category-hotspot'}
        class:persistent-intro-hand={hand.mode === 'persistent-intro'}
        class="walking-hand"
        src={hand.assetPath}
        alt=""
        on:mouseenter={() => showHandHover(hand)}
        on:mouseleave={clearHandHover}
        style={`width:${hand.size}px; left:${hand.x - hand.size / 2}px; top:${hand.y - hand.size / 2}px; transform:rotate(${hand.rotation}deg); animation-duration:${hand.animationDurationMs || introHandLifetimeMs}ms; animation-delay:${hand.animationDelayMs || 0}ms; --hand-opacity:${hand.mode === 'aggregate' ? hand.opacity : 1}; --hand-rotation:${hand.rotation}deg;`}
      />
    {/each}

    {#if visibleCallouts.length}
      {#each visibleCallouts as callout (callout.id)}
        <div class="merch-callout-anchor" style={`left:${callout.x}px; top:${callout.y}px;`}>
          <div
            class="merch-callout-line"
            style={`width:${callout.lineLength}px; transform:rotate(${callout.lineAngle}rad);`}
          ></div>
          <div
            class="merch-callout-box"
            style={`transform:translate(${callout.offsetX}px, ${callout.offsetY}px);`}
          >
            <div class="merch-callout-title">{callout.title}</div>
            <div class="merch-callout-meta">{callout.metaText}</div>
            <div class="merch-callout-store">{callout.detailText}</div>
          </div>
        </div>
      {/each}
    {/if}

    {#if hoveredHand}
      <div
        class="hover-card"
        style={`left:${Math.max(hoveredHand.x + 18, 12)}px; top:${Math.max(hoveredHand.y - 12, 12)}px;`}
      >
        <div class="hover-card-title">{hoveredHand.locationName || hoveredHand.location || 'Hotspot'}</div>
        <div class="hover-card-meta">{handMeta(hoveredHand)}</div>
        {#if hoveredHand.firstComment}
          <div class="hover-card-text">{hoveredHand.firstComment}</div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

{#if loading}
  <div class="floating-note">Loading map and data...</div>
{:else if error}
  <div class="floating-note error">{error}</div>
{/if}

<style>
  .timeline-chip {
    position: absolute;
    top: 1.1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    min-width: 14rem;
    padding: 0.65rem 0.9rem 0.7rem;
    border-radius: 18px;
    background: rgba(75, 64, 62, 0.8);
    color: #fff8f2;
    box-shadow: 0 12px 28px rgba(25, 17, 16, 0.2);
  }

  .timeline-chip-month {
    font-size: 0.83rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
  }

  .timeline-track-wrap {
    position: relative;
    margin-top: 0.42rem;
    padding: 0 0.15rem;
  }

  .timeline-track {
    height: 1px;
    width: 100%;
    background: rgba(255, 248, 242, 0.34);
  }

  .timeline-marker {
    position: absolute;
    top: 50%;
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #f2c14e;
    box-shadow: 0 0 0 2px rgba(242, 193, 78, 0.18);
    transform: translate(-50%, -50%);
    transition: left 260ms ease;
  }

  .timeline-chip-day {
    margin-top: 0.36rem;
    color: rgba(255, 248, 242, 0.7);
    font-size: 0.68rem;
    letter-spacing: 0.06em;
    text-align: center;
    text-transform: uppercase;
  }

  .hand-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 3;
    opacity: 1;
    transition: opacity 320ms ease;
  }

  .hand-overlay.disabled {
    opacity: 0;
  }

  .walking-hand {
    position: absolute;
    transform-origin: 50% 50%;
    filter: drop-shadow(0 0 0.6px rgba(255, 255, 255, 0.98));
    user-select: none;
    opacity: 0;
    animation-name: handPulse;
    animation-timing-function: ease-in-out;
    animation-fill-mode: both;
    animation-iteration-count: 1;
  }

  .walking-hand.aggregate-hand {
    animation-name: aggregateHandAppear;
  }

  .walking-hand.merchandise-icon {
    opacity: 1;
    animation-name: merchandiseAppear;
    pointer-events: auto;
    cursor: help;
  }

  .walking-hand.category-icon {
    opacity: 1;
    animation-name: merchandiseAppear;
    pointer-events: auto;
    cursor: help;
  }

  .walking-hand.persistent-intro-hand {
    animation-name: persistentIntroAppear;
    animation-fill-mode: both;
  }

  .merch-callout-anchor {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    z-index: 5;
  }

  .merch-callout-anchor::after {
    content: '';
    position: absolute;
    left: -4px;
    top: -4px;
    width: 8px;
    height: 8px;
    border-radius: 999px;
  }

  .merch-callout-line {
    position: absolute;
    left: 0;
    top: 0;
    height: 2px;
    background: rgba(128, 0, 0, 0.75);
    transform-origin: 0 50%;
  }

  .merch-callout-box {
    position: absolute;
    left: 0;
    top: 0;
    width: 10.5rem;
    padding: 0.7rem 0.8rem 0.72rem;
    border-radius: 12px;
    background: rgba(255, 249, 244, 0.96);
    border: 1px solid rgba(128, 0, 0, 0.12);
    box-shadow: 0 12px 28px rgba(47, 27, 24, 0.14);
  }

  .merch-callout-title {
    color: #531818;
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.1;
  }

  .merch-callout-meta {
    margin-top: 0.28rem;
    color: #7a4f47;
    font-size: 0.71rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .merch-callout-store {
    margin-top: 0.3rem;
    color: #5f4b47;
    font-size: 0.74rem;
    line-height: 1.3;
  }

  .hover-card {
    position: absolute;
    z-index: 6;
    width: min(16rem, calc(100vw - 1.5rem));
    padding: 0.72rem 0.82rem 0.78rem;
    border-radius: 12px;
    background: rgba(255, 249, 244, 0.98);
    border: 1px solid rgba(90, 47, 38, 0.12);
    box-shadow: 0 14px 30px rgba(30, 18, 16, 0.16);
    transform: translateY(-100%);
    pointer-events: none;
  }

  .hover-card-title {
    color: #3d201c;
    font-size: 0.84rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .hover-card-meta {
    margin-top: 0.25rem;
    color: #7a4f47;
    font-size: 0.71rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .hover-card-text {
    margin-top: 0.42rem;
    color: #5f4b47;
    font-size: 0.78rem;
    line-height: 1.35;
  }

  @keyframes handPulse {
    0% {
      opacity: 0;
    }

    32% {
      opacity: 0.82;
    }

    68% {
      opacity: 0.82;
    }

    100% {
      opacity: 0;
    }
  }

  @keyframes aggregateHandAppear {
    0% {
      opacity: 0;
    }

    100% {
      opacity: var(--hand-opacity, 0.3);
    }
  }

  @keyframes merchandiseAppear {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes persistentIntroAppear {
    0% {
      opacity: 0;
      transform: rotate(var(--hand-rotation, 0deg)) scale(0.84);
    }

    100% {
      opacity: 0.94;
      transform: rotate(var(--hand-rotation, 0deg)) scale(1);
    }
  }

  .floating-note {
    position: absolute;
    left: 1.1rem;
    bottom: 1.1rem;
    z-index: 4;
    padding: 0.75rem 0.95rem;
    border-radius: 14px;
    background: rgba(35, 24, 22, 0.88);
    color: #fff8f2;
    font-size: 0.95rem;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
  }

  .floating-note.error {
    background: rgba(122, 24, 24, 0.92);
  }

  @media (max-width: 640px) {
    .floating-note {
      left: 0.8rem;
      right: 0.8rem;
      max-width: none;
    }

    .timeline-chip {
      top: 5.8rem;
      left: auto;
      right: 0.8rem;
      transform: none;
    }
  }
</style>

<script>
  import { fade } from 'svelte/transition';

  export let storyChapters = [];
  export let activeChapterId = 'intro';
  export let chapterRefs = [];
  export let buildingFeaturesLength = 0;
  export let incidentsLength = 0;
  export let hotspotScenes = {};
  export let sceneStats = {};
  export let loading = false;
  let visibleChapterStats = {};
  let activeChapter = null;
  let activeChapterIndex = 0;

  function emptyStats() {
    return {
      count: 0,
      uniqueHotspots: 0,
      largestHotspotCount: 0,
      topHotspotName: ''
    };
  }

  $: visibleChapterStats = Object.fromEntries(
    storyChapters
      .filter((chapter) => chapter.sceneId)
      .map((chapter) => [chapter.id, sceneStats[chapter.sceneId] || emptyStats()])
  );
  $: activeChapter =
    storyChapters.find((chapter) => chapter.id === activeChapterId) || storyChapters[0] || null;
  $: activeChapterIndex = Math.max(
    0,
    storyChapters.findIndex((chapter) => chapter.id === activeChapterId)
  );

  function setChapterRef(node, index) {
    chapterRefs[index] = node;

    return {
      destroy() {
        if (chapterRefs[index] === node) {
          chapterRefs[index] = null;
        }
      }
    };
  }

  function sceneFor(chapter) {
    return hotspotScenes[chapter.sceneId] || null;
  }

  function hasHtmlBody(chapter) {
    return /<[^>]+>/.test(String(chapter?.body || ''));
  }

  function statsFor(chapter) {
    return visibleChapterStats[chapter.id] || emptyStats();
  }

  function hasStatsFor(chapter) {
    return Boolean(sceneStats?.[chapter.sceneId]);
  }

  function scrollToChapter(index) {
    const target = chapterRefs[index];

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
</script>

<aside class="story-column">
  <div class="story-header">
    <div class="eyebrow">May 2025 - May 2026</div>
    <h1>Map of Reported Thefts to the University of Chicago's Police Department UCPD</h1>
    <p>
      This project explores a year of theft data reported around the University of Chicago’s campus,
      examining what items were most commonly stolen, where incidents occurred, and the unusual edge
      cases that appear throughout the records. Familiar hotspots emerge, including the Hyde Park
      Shopping Center, CCD/UCMED, and the Regenstein bike rack. 
      Note that this dataset only reflects thefts that were reported to UCPD, and likely represents 
      only a partial subset of theft in the area.
      <br/>
      <br/>
      Data was retrieved using Michael Plunkett’s tool that scrapes UCPD incident reports, published
      on the
      <a
        href="https://chicagomaroon.com/41255/grey-city/the-maroon-launches-uchicago-police-department-incident-reporter/"
        target="_blank"
        rel="noopener noreferrer"
      >
      Maroon's Incident Reporter Project
      </a>. Mapping logic was inspired by Austin Steinhart's work on mapping the 
      <a
        href="https://chicagomaroon.github.io/data-visualizations/2025/uchicago-property/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Expansion of UChicago in Hyde Park
      </a>.
      
    </p>
  </div>

  <div class="story-experience">
    <div class="story-stage">
      <div class="story-stage-frame" aria-live="polite">
        <div class="story-progress">
          <div class="story-progress-label">
            <span>Panel {activeChapterIndex + 1} of {storyChapters.length}</span>
          </div>
          <div class="story-progress-dots" aria-label="Story progress">
            {#each storyChapters as chapter, index}
              <button
                type="button"
                class:active={activeChapterId === chapter.id}
                class="story-dot"
                aria-label={`Jump to panel ${index + 1}: ${chapter.title}`}
                aria-current={activeChapterId === chapter.id ? 'step' : undefined}
                on:click={() => scrollToChapter(index)}
              ></button>
            {/each}
          </div>
        </div>

        {#if activeChapter}
          {#key activeChapter.id}
            <section class="story-step active" transition:fade={{ duration: 260 }}>
              <div class="step-kicker">{activeChapter.kicker}</div>
              <h2>{activeChapter.title}</h2>
              {#if hasHtmlBody(activeChapter)}
                <div class="story-body rich-text">
                  {@html activeChapter.body}
                </div>
              {:else}
                <p>{activeChapter.body}</p>
              {/if}

              {#if activeChapter.graphic === 'stats'}
                <div class="metric-grid">
                  <article>
                    <span>Building footprints</span>
                    <strong>{buildingFeaturesLength.toLocaleString()}</strong>
                  </article>
                  <article>
                    <span>Theft points</span>
                    <strong>{incidentsLength}</strong>
                  </article>
                </div>
              {/if}

              {#if sceneFor(activeChapter) && !loading && hasStatsFor(activeChapter)}
                {#key `${activeChapter.id}:${statsFor(activeChapter).count}:${statsFor(activeChapter).uniqueHotspots}:${statsFor(activeChapter).largestHotspotCount}:${statsFor(activeChapter).topHotspotName}`}
                  <div class="chart-card compact">
                    <div class="chart-title">{sceneFor(activeChapter)?.panelTitle || 'Category reports'}</div>
                    <div class="glyph-row" aria-hidden="true">
                      {#each sceneFor(activeChapter)?.previewGlyphs || [] as glyph, index}
                        <img
                          class="glyph"
                          class:hotspot={index === (sceneFor(activeChapter)?.previewGlyphs?.length || 1) - 1}
                          src={glyph}
                          alt=""
                        />
                      {/each}
                      {#if !(sceneFor(activeChapter)?.previewGlyphs?.length)}
                        <img class="glyph hotspot" src="/assets/hand1.svg" alt="" />
                      {/if}
                    </div>
                    <div class="big-number">{statsFor(activeChapter).count}</div>
                    <div class="chart-caption">
                      {statsFor(activeChapter).uniqueHotspots} {sceneFor(activeChapter)?.uniqueLabel || 'unique locations'}
                    </div>
                    {#if statsFor(activeChapter).topHotspotName}
                      <div class="compare-line">
                        Top hotspot: <strong>{statsFor(activeChapter).topHotspotName}</strong>
                      </div>
                    {/if}
                    <div class="compare-line">
                      Largest hotspot: <strong>{statsFor(activeChapter).largestHotspotCount}</strong>
                    </div>
                  </div>
                {/key}
              {/if}
            </section>
          {/key}
        {/if}
      </div>
    </div>

    <div class="story-track" aria-hidden="true">
      {#each storyChapters as chapter, index}
        <section
          use:setChapterRef={index}
          class="story-trigger"
          data-chapter-id={chapter.id}
        ></section>
      {/each}
    </div>
  </div>
</aside>

<style>
  .story-column {
    padding: 2rem 1.5rem 20vh;
  }

  .story-header {
    max-width: 40rem;
    min-height: 92vh;
    margin: 0 auto 5rem;
    padding: 0 0.85rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .story-experience {
    position: relative;
  }

  .story-stage {
    position: sticky;
    top: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    padding: 1rem 0;
    z-index: 1;
  }

  .story-stage-frame {
    display: grid;
    width: 100%;
  }

  .story-progress {
    grid-area: 1 / 1;
    align-self: start;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: min(40rem, 100%);
    margin: 0 auto;
    padding: 1rem 0.85rem 0;
    z-index: 2;
    pointer-events: auto;
  }

  .story-progress-label {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .story-progress-label span {
    color: #8c1d18;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .story-progress-dots {
    display: flex;
    align-items: center;
    gap: 0.42rem;
    flex-wrap: wrap;
    justify-content: end;
  }

  .story-dot {
    width: 0.62rem;
    height: 0.62rem;
    border: 0;
    border-radius: 999px;
    background: rgba(140, 29, 24, 0.16);
    box-shadow: inset 0 0 0 1px rgba(140, 29, 24, 0.12);
    transition:
      transform 180ms ease,
      background-color 180ms ease,
      box-shadow 180ms ease;
    cursor: pointer;
  }

  .story-dot:hover {
    transform: scale(1.12);
    background: rgba(140, 29, 24, 0.3);
  }

  .story-dot.active {
    background: #8c1d18;
    box-shadow: 0 0 0 4px rgba(140, 29, 24, 0.14);
    transform: scale(1.1);
  }

  .story-header h1,
  .story-step h2,
  .story-header p,
  .story-step p {
    margin: 0;
  }

  .story-header h1 {
    margin-top: 0.35rem;
    color: #201413;
    font-size: clamp(2rem, 4vw, 3.2rem);
    line-height: 0.96;
    letter-spacing: -0.04em;
  }

  .story-header p {
    margin-top: 0.95rem;
    color: #5e4a45;
    font-size: 1.02rem;
    line-height: 1.55;
  }

  .eyebrow,
  .step-kicker {
    color: #8c1d18;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .story-step {
    grid-area: 1 / 1;
    max-width: 40rem;
    min-height: 88vh;
    margin: 0 auto;
    padding: 1.1rem 0.85rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    opacity: 1;
    transform: translateY(20px);
    transition:
      opacity 220ms ease,
      transform 220ms ease;
  }

  .story-step.active {
    opacity: 1;
    transform: translateY(0);
  }

  .story-track {
    margin-top: -100vh;
  }

  .story-trigger {
    min-height: 88vh;
  }

  .story-step h2 {
    color: #201413;
    font-size: clamp(1.75rem, 3vw, 2.4rem);
    line-height: 1.02;
    letter-spacing: -0.03em;
  }

  .story-step p {
    color: #5e4a45;
    line-height: 1.65;
    font-size: 1rem;
    max-width: 34rem;
  }

  .story-body {
    color: #5e4a45;
    font-size: 1.04rem;
    line-height: 1.65;
    max-width: 34rem;
  }

  .story-body :global(p) {
    margin: 0;
  }

  .story-body :global(p:first-child) {
    color: #3f2d29;
    font-size: 1.12rem;
    font-weight: 600;
    line-height: 1.45;
  }

  .story-body :global(ul) {
    margin: 0.9rem 0 0;
    padding-left: 1.35rem;
  }

  .story-body :global(li + li) {
    margin-top: 0.34rem;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
    margin-top: 0.3rem;
  }

  .metric-grid.single {
    grid-template-columns: 1fr;
  }

  .metric-grid article,
  .chart-card {
    padding: 1rem;
    border-radius: 7px;
    background: rgba(247, 247, 247, 0.88);
    border: 1px solid rgba(67, 35, 31, 0.08);
    box-shadow: 0 18px 40px rgba(44, 25, 21, 0.06);
  }

  .metric-grid span,
  .chart-title,
  .chart-caption,
  .metric-grid small {
    color: #6b5751;
    font-size: 0.85rem;
  }

  .metric-grid strong,
  .big-number {
    display: block;
    margin-top: 0.35rem;
    color: #231715;
    font-size: 1.7rem;
    line-height: 1.05;
  }

  .chart-card {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .chart-card.compact {
    max-width: 18rem;
  }

  .compare-line {
    color: #3e2d29;
    font-size: 0.92rem;
  }

  .big-number {
    font-size: 3.15rem;
    font-weight: 700;
    letter-spacing: -0.04em;
  }

  .glyph-row {
    display: flex;
    align-items: end;
    gap: 0.9rem;
    min-height: 4.2rem;
  }

  .glyph {
    width: 2.5rem;
    height: 2.5rem;
    opacity: 1;
    filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.98));
  }

  .glyph.hotspot {
    width: 3.55rem;
    height: 3.55rem;
    opacity: 1;
  }

  @media (max-width: 980px) {
    .story-column {
      padding-top: 1.25rem;
    }

    .story-header {
      min-height: 82vh;
      margin-bottom: 4rem;
    }

    .story-stage {
      min-height: 72vh;
    }

    .story-step {
      min-height: 72vh;
    }

    .story-track {
      margin-top: -72vh;
    }

    .story-trigger {
      min-height: 72vh;
    }
  }

  @media (max-width: 640px) {
    .story-column {
      padding: 1rem 1rem 16vh;
    }

    .story-progress {
      align-items: start;
      flex-direction: column;
      padding-top: 0.65rem;
    }

    .story-progress-dots {
      justify-content: start;
    }

    .metric-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

<script>
  export let storyChapters = [];
  export let activeChapterId = 'intro';
  export let chapterRefs = [];
  export let buildingFeaturesLength = 0;
  export let incidentsLength = 0;
  export let hotspotScenes = {};
  export let hotspotStats = {};

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

  function statsFor(chapter) {
    return (
      hotspotStats[chapter.sceneId] || {
        count: 0,
        uniqueHotspots: 0,
        largestHotspotCount: 0
      }
    );
  }
</script>

<aside class="story-column">
  <div class="story-header">
    <div class="eyebrow">May 2025 - May 2026</div>
    <h1>Map of UChicago Police Department Reported Thefts</h1>
    <p>
      This project explores a year of theft data reported around the University of Chicago’s campus,
      examining what items were most commonly stolen, where incidents occurred, and the unusual edge
      cases that appear throughout the records. Familiar hotspots emerge, including the Hyde Park
      Shopping Center, CCD/UCMED.
      <br />
      Data was retrieved using Michael Plunkett’s tool that scrapes UCPD incident reports, published
      on the
      <a
        href="https://chicagomaroon.com/41255/grey-city/the-maroon-launches-uchicago-police-department-incident-reporter/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Maroon's Incident Reporter Project
      </a>.
    </p>
  </div>

  {#each storyChapters as chapter, index}
    <section
      use:setChapterRef={index}
      class:active={activeChapterId === chapter.id}
      class="story-step"
      data-chapter-id={chapter.id}
    >
      <div class="step-kicker">{chapter.kicker}</div>
      <h2>{chapter.title}</h2>
      <p>{chapter.body}</p>

      {#if chapter.graphic === 'stats'}
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

      {#if chapter.graphic === 'merchandise'}
        <div class="metric-grid single">
          <article>
            <span>Merchandise hotspots</span>
            <strong>Walgreens, Target, and CVS</strong>
            <small>Retail footprints highlighted with merchandise-only incidents</small>
          </article>
        </div>
      {/if}

      {#if chapter.graphic === 'hotspotPanel'}
        <div class="chart-card compact">
          <div class="chart-title">{sceneFor(chapter)?.panelTitle || 'Category reports'}</div>
          <div class="glyph-row" aria-hidden="true">
            {#each sceneFor(chapter)?.previewGlyphs || [] as glyph, index}
              <img
                class="glyph"
                class:hotspot={index === (sceneFor(chapter)?.previewGlyphs?.length || 1) - 1}
                src={glyph}
                alt=""
              />
            {/each}
            {#if !(sceneFor(chapter)?.previewGlyphs?.length)}
              <img class="glyph hotspot" src="/assets/hand1.svg" alt="" />
            {/if}
          </div>
          <div class="big-number">{statsFor(chapter).count}</div>
          <div class="chart-caption">
            {statsFor(chapter).uniqueHotspots} {sceneFor(chapter)?.uniqueLabel || 'unique locations'}
          </div>
          <div class="compare-line">
            Largest hotspot: <strong>{statsFor(chapter).largestHotspotCount}</strong>
          </div>
          <div class="chart-caption">
            Bigger glyphs on the map mean more repeat thefts at the same spot.
          </div>
        </div>
      {/if}
    </section>
  {/each}
</aside>

<style>
  .story-column {
    padding: 2rem 1.5rem 20vh;
  }

  .story-header {
    max-width: 40rem;
    margin: 0 auto 2rem;
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
    max-width: 40rem;
    min-height: 88vh;
    margin: 0 auto;
    padding: 1.1rem 0 2rem;
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
    border-radius: 18px;
    background: rgba(255, 252, 247, 0.88);
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
    opacity: 0.76;
    filter: drop-shadow(0 6px 12px rgba(64, 46, 40, 0.12));
  }

  .glyph.hotspot {
    width: 3.55rem;
    height: 3.55rem;
    opacity: 0.9;
  }

  @media (max-width: 980px) {
    .story-column {
      padding-top: 1.25rem;
    }

    .story-step {
      min-height: 72vh;
    }
  }

  @media (max-width: 640px) {
    .story-column {
      padding: 1rem 1rem 16vh;
    }

    .metric-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

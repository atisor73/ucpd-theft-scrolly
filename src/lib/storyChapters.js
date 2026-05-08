export const storyChapters = [
  {
    id: 'intro',
    kicker: ' ',
    title: ' ',
    body: `
      <p>In one year we observe 584 reported thefts, of which:</p>
      <ul>
        <li>258 involved merchandise</li>
        <li>72 involved bikes and scooters taken from at least 31 unique bike rack locations</li>
        <li>49 involved wallets, credit cards, or cash</li>
        <li>40 involved tech: 13 phones, 7 laptops, 5 AirPods, 4 iPads, 2 cameras, 1 TV</li>
        <li>28 involved cars</li>
        <li>22 involved bags or backpacks</li>
        <li>27 involved tools, taken mainly from maintenance vans</li>
        <li>20 involved packages or food deliveries</li>
        <li>11 involved articles of clothing, mostly jackets, and 3 pieces of jewelry</li>
      </ul>
    `,
    graphic: 'lede'
  },
  {
    id: 'buildings',
    kicker: 'Context',
    title: 'In the past year:',
    body: 'There were 584 reported thefts,',
    graphic: 'stats'
  },
  {
    id: 'merchandise',
    kicker: 'Anchor',
    title: 'Merchandise concentrates at a few retail hotspots',
    body:
      'Walgreens on 55th and Target on 53rd dominate merchandise thefts, with CVS as a small hotspot nearby.',
    graphic: 'merchandise'
  },
  {
    id: 'bikes',
    kicker: 'Hotspots',
    title: 'Bike and scooter thefts repeat at the same racks',
    body:
      'Isolating bikes and scooters makes the repeated rack hotspots easier to see. Larger bike glyphs mark locations with multiple reported thefts.',
    graphic: 'hotspotPanel',
    sceneId: 'bikes'
  },
  {
    id: 'cars',
    kicker: 'Hotspots',
    title: 'Car thefts and break-ins lean toward streets and parking edges',
    body:
      'Vehicle-related reports cluster along public ways and parking areas rather than inside the campus core buildings.',
    graphic: 'hotspotPanel',
    sceneId: 'cars'
  },
  {
    id: 'bags',
    kicker: 'Hotspots',
    title: 'Bag thefts are smaller in number but spread across common destinations',
    body:
      'Backpacks and bags show up in libraries, athletic spaces, medical buildings, and public ways without one dominant single hotspot.',
    graphic: 'hotspotPanel',
    sceneId: 'bags'
  },
  {
    id: 'wallets',
    kicker: 'Hotspots',
    title: 'Wallets, cards, and cash cluster around busy daily-use buildings',
    body:
      'Wallet and cash thefts are concentrated in a handful of high-traffic interior destinations, especially around athletic and medical buildings.',
    graphic: 'hotspotPanel',
    sceneId: 'wallets'
  },
  {
    id: 'tech',
    kicker: 'Hotspots',
    title: 'Tech thefts follow public circulation and study spaces',
    body:
      'Phones, laptops, tablets, and other devices appear in a mix of outdoor public ways and major campus interiors, with only a few repeat locations.',
    graphic: 'hotspotPanel',
    sceneId: 'tech'
  },
  {
    id: 'packages',
    kicker: 'Hotspots',
    title: 'Packages and deliveries are the most dispersed category',
    body:
      'Unlike retail thefts or bike-rack repeats, package and food-delivery incidents are scattered across many addresses with almost no repeated hotspot.',
    graphic: 'hotspotPanel',
    sceneId: 'packages'
  },
  {
    id: 'clothingJewelry',
    kicker: 'Hotspots',
    title: 'Clothing and jewelry split between everyday garments and a few valuables',
    body:
      'This category mixes stolen clothing with a smaller number of jewelry reports, so the panel alternates between jacket and ring glyphs based on the item described.',
    graphic: 'hotspotPanel',
    sceneId: 'clothingJewelry'
  },
  {
    id: 'tools',
    kicker: 'Hotspots',
    title: 'Tool thefts stand out for their repeated public-way pattern',
    body:
      'Tools are a smaller category overall, but they repeat enough at a few locations to create outsized hotspots compared with other low-volume categories.',
    graphic: 'hotspotPanel',
    sceneId: 'tools'
  },
  {
    id: 'miscellaneous',
    kicker: 'Hotspots',
    title: 'Miscellaneous thefts are the outlier bucket',
    body:
      'These reports range from instruments to food to keys, so the map reads less like one trend and more like a collection of unusual edge cases.',
    graphic: 'hotspotPanel',
    sceneId: 'miscellaneous'
  }
];

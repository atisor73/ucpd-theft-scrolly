export const storyChapters = [
  {
    id: 'intro',
    kicker: 'Animation',
    title: 'Each hand marks a reported theft location',
    body:
      'Each hand corresponds to one reported theft placed at its \
      recorded location. The animation is meant to convey the steady \
      rhythm of 1-2 theft reports per day over the course of the year.',
    graphic: 'lede'
  },
  {
    id: 'buildings',
    kicker: 'Overview',
    title: 'In one year we observe 584 reported thefts, of which:',
    body: `
      <ul>
        <li>258 involved merchandise (44%)</li>
        <li>72 involved bikes and scooters taken from at least 31 unique bike rack locations (12%)</li>
        <li>49 involved wallets, credit cards, or cash (8%)</li>
        <li>40 involved tech: 13 phones, 7 laptops, 5 AirPods, 4 iPads, 2 cameras, 1 TV (7%)</li>
        <li>28 involved cars (5%)</li>
        <li>17 involved tools, taken mainly from maintenance vans (3%)</li>
        <li>22 involved bags or backpacks (4%)</li>
        <li>20 involved packages or food deliveries (3%)</li>
        <li>11 involved articles of clothing, mostly jackets, and 3 pieces of jewelry (2%)</li>
      </ul>
    `,
    graphic: 'lede'
  },
  {
    id: 'merchandise',
    kicker: 'Merchandise',
    title: 'Merchandise concentrates at two predominant retail hotspots',
    body:`
      Merchandise thefts accounted for 44% of all theft incidents in this timeframe. \
      Walgreens on 55th (182) and Target on 53rd (49) thefts accounted for 90% of all merchandise thefts.\
      Smaller hotspots include CVS on 53rd (4), Akira on 53rd (4), and Ulta on S. Lake Park Ave (4). 
      <br/><br/>
      On campus, DCAM Café, UC Bookstore, and Hutchinson Commons each had one incident of theft. 
      Off campus, Subway, S. Harper Ave. Foods, Starbucks, Ace Hardware, and Marshalls had reported incidents of theft.
      `,
    graphic: 'merchandise',
    sceneId: 'merchandise'
  },
  {
    id: 'bikes',
    kicker: 'Bikes & E-scooters',
    title: 'Bike and e-scooter thefts are more dispersed geographically',
    body:`
    This is the second largest category of theft: 72 thefts occurred across 31 unique bike rack locations. 
      Compared to merchandise, bikes and e-scooter thefts are concentrated on campus and are dispersed. \
      The Regenstein Bike Rack accounted for 13% of bike thefts (9), Ratner 6% (4), and Campus North 6% (4).
    <br/><br/>
      Bikes don't appear to be very safe on either side of the Midway.
      `,
    graphic: 'hotspotPanel',
    sceneId: 'bikes'
  },
  {
    id: 'cars',
    kicker: 'Cars',
    title: 'Car thefts are distributed around campus, often outside a certain radius from campus.',
    body: `
      Of the 28 full vehicle thefts in this broader car/car-parts category, 24 were taken from public ways and 3 from parking lots, with very few occurring in the campus core. 
      Hondas were the most common make in the reports (8), followed by Acuras (5) and Hyundais (3).       
      Other makes included Jeep (2), Infiniti (2), GMC (1), Cadillac (1), Nissan (1), Volvo (1), Lexus (1), 
      and Kia (1), with 2 reports not specifying a make.
      <br/><br/>
      The stolen vehicles also skewed relatively recent: 2019 models appeared 6 times, 2025 models 4 times, and 2022 models 3 times.

    `,
    graphic: 'hotspotPanel',
    sceneId: 'cars'
  },
  {
    id: 'bags',
    kicker: 'Bags, Backpacks, Purses',
    title: 'Bag thefts are smaller in number but spread across common destinations',
    body: `
      Bag thefts were spread across everyday destinations rather than one dominant hotspot. Medical buildings accounted for the largest cluster: 2 reports at CCD, 2 at UCMED, 2 at Mitchell Hospital, and 1 at Comer Hospital.
      Cafes accounted for 3 more reports, with 1 at Plein Air Cafe, 1 at DCAM Cafeteria, and 1 at another cafe. Libraries added 2 reports, both at Regenstein Library.
      <br/><br/>
      The remaining cases were scattered across places including Ratner A.C., Logan Center, Main Quad, a restaurant, a rear parking lot, a shopping center courtyard, and public ways, suggesting that unattended bags were vulnerable in many different everyday settings.
    `,
    graphic: 'hotspotPanel',
    sceneId: 'bags'
  },
  {
    id: 'wallets',
    kicker: '$',
    title: 'Wallets, cards, and cash cluster around daily-use buildings',
    body: `
      Wallets, credit-cards, and cash thefts clustered most heavily in medical and academic buildings. Medical locations accounted for 13 reports: 5 at Mitchell Hospital, 4 at CCD, 2 at UCMED, 1 at Comer Hospital, and 1 at Billings Hospital.
      <br/><br/>
      Academic and campus-building locations accounted for another 13 reports, including 3 at Gordon Center, 3 at Kent Lab, and 1 each at Kersten Physics, Regenstein, Reynolds Club, Goldblatt, BSLC, Judd Hall, and Rosenwald Hall. Athletic spaces added 6 more reports, with 4 at Ratner A.C. and 2 at Knapp Center.
      <br/><br/>
      Cafes and restaurants accounted for 6 reports, with 3 at Plein Air Cafe, 2 at McDonalds, and 1 at Roux. The remaining cases were scattered across public ways, parked vehicles, stores, an apartment, a rideshare vehicle, Maroon Financial, UCPD HQ, and Walgreens.
    `,
    graphic: 'hotspotPanel',
    sceneId: 'wallets'
  },
  {
    id: 'tech',
    kicker: 'Devices',
    title: 'Tech thefts follow public circulation and study spaces',
    body: `
      Tech thefts were still primarily on campus: 28 of the 40 reports occurred on campus, while 12 took place off campus or on public ways. Phones were the most common item taken (13), followed by laptops (7), AirPods (5), and iPads (4).
      <br/><br/>
      On campus, these reports clustered in a few familiar settings. Medical buildings accounted for 9 reports, including 3 at Mitchell Hospital, 3 at CCD, 2 at UCMED, and 1 at Comer Hospital. Libraries accounted for 5 more, with 4 at Regenstein Library and 1 at S. Harper Ave. Library. Another 9 reports came from academic buildings such as Eckhart Hall (2) and one each at Swift Hall, Rosenwald Hall, Goldblatt, Booth School, Searle Lab, Law School, and Ida Noyes.
      <br/><br/>
      The remaining tech items were a smaller mix of backpacks (3), audio equipment (2), and one report each involving an Apple Watch, camera, camera-and-monitor setup, TV, DVD player, and other computer equipment. 
    `,
    graphic: 'hotspotPanel',
    sceneId: 'tech'
  },
  {
    id: 'packages',
    kicker: 'Packages',
    title: 'Packages and food deliveries are the most dispersed category',
    body:
      'Unlike retail thefts or bike-rack repeats, package and food-delivery incidents are scattered across many addresses with almost no repeated hotspot or distinct cluster. Of the 20 incidents in this category, 13 involved stolen packages and 7 involved food deliveries.',
    graphic: 'hotspotPanel',
    sceneId: 'packages'
  },
  {
    id: 'clothingJewelry',
    kicker: 'Clothing & Jewelry',
    title: 'Clothing and jewelry thefts mainly involved coats taken on-campus',
    body:
      'Coats and jackets were taken mainly from CCD, Mitchell Hospital, Eckhart Hall, Regenstein Library, Ratner A.C., and one off-campus apartment building on S. University Ave. Dresses and costumes appeared at Burton-Judson RH, Logan Center, and a dressing-room incident at Reynolds Club. All three jewelry reports came from UCMED.',
    graphic: 'hotspotPanel',
    sceneId: 'clothingJewelry'
  },
  {
    id: 'tools',
    kicker: 'Tools',
    title: 'Tool thefts stand out in their dispersion and opportunistic nature',
    body:
      'Tools are a smaller category overall, but show repeated patterns of opportunistic thefts\
      targeting maintenance and work vans across campus and beyond.',
    graphic: 'hotspotPanel',
    sceneId: 'tools'
  },
  {
    id: 'miscellaneous',
    kicker: 'Miscellaneous',
    title: 'Miscellaneous thefts',
    body:
      'Within the remaining items, a few subcategories emerge: musical instruments appear five times, food-related thefts appear three times if restaurant cooking oil is included, and a strange concentrated run of 10 fire-hose-cap thefts all occurred between June 13 and June 16, 2025. The rest are mostly one-offs, including a dog, two guns, a shovel, a walker, a painting, keys, and even a glass jar.',
    graphic: 'hotspotPanel',
    sceneId: 'miscellaneous'
  },
  {
    id: 'allReports',
    kicker: 'Final View',
    title: 'All reported thefts, accumulated across the year',
    body:
      'This final animation constructs the year’s reported thefts onto the map.',
    graphic: 'lede'
  }
];

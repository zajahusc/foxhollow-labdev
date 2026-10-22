/** Factual candidate sets for Negative Logic. False values are explicit, not missing data.
 * Geography uses UN M49 statistical subregions, not political/cultural continents.
 * A mainland capital lies on a continent rather than an offshore island; country
 * membership and coastline refer to the named sovereign state, including islands.
 * History quarters are years 01–25, 26–50, 51–75, 76–00 of a century.
 * Musical traits refer to ordinary acoustic versions and their standard construction.
 * Animal traits refer to healthy adult animals, and leg counts include vestigial legs but exclude wings/arms.
 */
export interface NegativeFactSet {
  category: string;
  candidates: { id: string; label: string; tags: Record<string, boolean>; sources: string[] }[];
  properties: { key: string; description: string }[];
}
function set(category: string, properties: { key: string; description: string }[], entries: [string, string[], string[]][]): NegativeFactSet {
  return { category, properties, candidates: entries.map(([label, trueKeys, sources]) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''), label,
    tags: Object.fromEntries(properties.map(({ key }) => [key, trueKeys.includes(key)])), sources,
  })) };
}
const m49 = 'https://unstats.un.org/unsd/methodology/m49/';
const landlocked = 'https://www.un.org/ohrlls/content/list-lldcs';
const geography = set('Geography: countries', [
  { key: 'eastern-asia', description: 'a country in UN M49 Eastern Asia' },
  { key: 'southern-asia', description: 'a country in UN M49 Southern Asia' },
  { key: 'western-asia', description: 'a country in UN M49 Western Asia' },
  { key: 'western-europe', description: 'a country in UN M49 Western Europe' },
  { key: 'northern-europe', description: 'a country in UN M49 Northern Europe' },
  { key: 'eastern-africa', description: 'a country in UN M49 Eastern Africa' },
  { key: 'southern-africa', description: 'a country in UN M49 Southern Africa' },
  { key: 'south-america', description: 'a country in UN M49 South America' },
  { key: 'landlocked', description: 'a landlocked country' },
  { key: 'coast', description: 'a country with a sea coastline' },
  { key: 'island-capital', description: 'a country whose capital is on an island' },
  { key: 'mainland-capital', description: 'a country whose capital is on a continental mainland' },
], [
  ['China', ['eastern-asia', 'coast', 'mainland-capital'], [m49, 'https://www.britannica.com/place/China']],
  ['Japan', ['eastern-asia', 'coast', 'island-capital'], [m49, 'https://www.britannica.com/place/Japan']],
  ['India', ['southern-asia', 'coast', 'mainland-capital'], [m49, 'https://www.britannica.com/place/India']],
  ['Nepal', ['southern-asia', 'landlocked', 'mainland-capital'], [m49, landlocked]],
  ['Saudi Arabia', ['western-asia', 'coast', 'mainland-capital'], [m49, 'https://www.britannica.com/place/Saudi-Arabia']],
  ['Armenia', ['western-asia', 'landlocked', 'mainland-capital'], [m49, landlocked]],
  ['France', ['western-europe', 'coast', 'mainland-capital'], [m49, 'https://www.britannica.com/place/France']],
  ['Austria', ['western-europe', 'landlocked', 'mainland-capital'], [m49, 'https://www.britannica.com/place/Austria']],
  ['United Kingdom', ['northern-europe', 'coast', 'island-capital'], [m49, 'https://www.britannica.com/place/United-Kingdom']],
  ['Finland', ['northern-europe', 'coast', 'mainland-capital'], [m49, 'https://um.fi/atcm45/about-helsinki']],
  ['Kenya', ['eastern-africa', 'coast', 'mainland-capital'], [m49, 'https://www.britannica.com/place/Kenya']],
  ['Ethiopia', ['eastern-africa', 'landlocked', 'mainland-capital'], [m49, landlocked]],
  ['South Africa', ['southern-africa', 'coast', 'mainland-capital'], [m49, 'https://www.britannica.com/place/South-Africa']],
  ['Lesotho', ['southern-africa', 'landlocked', 'mainland-capital'], [m49, landlocked]],
  ['Chile', ['south-america', 'coast', 'mainland-capital'], [m49, 'https://www.britannica.com/place/Chile']],
  ['Paraguay', ['south-america', 'landlocked', 'mainland-capital'], [m49, landlocked]],
]);
const elementEntries: [string, number, number, number][] = [
  ['Lithium', 3, 2, 1], ['Beryllium', 4, 2, 2], ['Fluorine', 9, 2, 17], ['Neon', 10, 2, 18],
  ['Sodium', 11, 3, 1], ['Magnesium', 12, 3, 2], ['Chlorine', 17, 3, 17], ['Argon', 18, 3, 18],
  ['Potassium', 19, 4, 1], ['Calcium', 20, 4, 2], ['Bromine', 35, 4, 17], ['Krypton', 36, 4, 18],
  ['Rubidium', 37, 5, 1], ['Strontium', 38, 5, 2], ['Iodine', 53, 5, 17], ['Xenon', 54, 5, 18],
];
const science = set('Science: chemical elements', [
  ...[2, 3, 4, 5].map(n => ({ key: `period-${n}`, description: `an element in period ${n} of the periodic table` })),
  ...[1, 2, 17, 18].map(n => ({ key: `group-${n}`, description: `an element in group ${n} of the periodic table` })),
], elementEntries.map(([name, number, period, group]) => [name, [`period-${period}`, `group-${group}`], [`https://periodic-table.rsc.org/element/${number}/${name.toLowerCase()}`]]));
const events: [string, number, string][] = [
  ['Jamestown settlement founded', 1607, 'https://www.nps.gov/jame/learn/historyculture/a-short-history-of-jamestown.htm'],
  ['Peace of Westphalia signed', 1648, 'https://germanhistorydocs.org/en/from-the-reformations-to-the-thirty-years-war-1500-1648/peace-treaties-of-westphalia-october-14-24-1648'],
  ['Great Fire of London', 1666, 'https://www.london-fire.gov.uk/museum/history-and-stories/the-great-fire-of-london/'],
  ['Glorious Revolution begins', 1688, 'https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/revolution/'],
  ['Acts of Union take effect', 1707, 'https://www.parliament.uk/about/living-heritage/evolutionofparliament/legislativescrutiny/act-of-union-1707/'],
  ['Treaty of Aix-la-Chapelle signed', 1748, 'https://wellcomecollection.org/works/wkf8wftz'],
  ['Seven Years’ War begins in Europe', 1756, 'https://www.nam.ac.uk/explore/seven-years-war'],
  ['French Revolution begins', 1789, 'https://en.chateauversailles.fr/discover/history/key-dates/versailles-heart-french-revolution'],
  ['Haitian independence declared', 1804, 'https://history.state.gov/milestones/1784-1800/haitian-rev'],
  ['California Gold Rush begins', 1848, 'https://www.nps.gov/cali/learn/historyculture/california-gold-rush.htm'],
  ['Suez Canal opens', 1869, 'https://www.suezcanal.gov.eg/English/About/SuezCanal/Pages/CanalHistory.aspx'],
  ['Eiffel Tower opens', 1889, 'https://www.toureiffel.paris/en/the-monument/history'],
  ['Wright brothers’ first powered flight', 1903, 'https://www.nps.gov/wrbr/learn/historyculture/thefirstflight.htm'],
  ['United Nations founded', 1945, 'https://www.un.org/en/about-us/history-of-the-un'],
  ['Apollo 11 Moon landing', 1969, 'https://www.nasa.gov/mission/apollo-11/'],
  ['Berlin Wall opens', 1989, 'https://about.visitberlin.de/en/press/press-releases/berlin-wall-history-glance'],
];
const history = set('History: dated events', [
  ...[17, 18, 19, 20].map(n => ({ key: `century-${n}`, description: `an event in the ${n}th century` })),
  { key: 'quarter-1', description: 'an event in years 01–25 of its century' },
  { key: 'quarter-2', description: 'an event in years 26–50 of its century' },
  { key: 'quarter-3', description: 'an event in years 51–75 of its century' },
  { key: 'quarter-4', description: 'an event in years 76–100 of its century' },
], events.map(([label, year, source]) => [label, [`century-${Math.ceil(year / 100)}`, `quarter-${Math.ceil(((year - 1) % 100 + 1) / 25)}`], [source]]));

const zoo = (name: string): string => `https://animals.sandiegozoo.org/animals/${name}`;
const animals = set('Animals: adult anatomy', [
  { key: 'mammal', description: 'a mammal' }, { key: 'bird', description: 'a bird' },
  { key: 'reptile', description: 'a reptile' }, { key: 'amphibian', description: 'an amphibian' },
  { key: 'arthropod', description: 'an arthropod' }, { key: 'mollusc', description: 'a mollusc' },
  { key: 'four-legs', description: 'an animal with four legs as an adult' },
  { key: 'six-legs', description: 'an animal with six legs as an adult' },
  { key: 'eight-legs', description: 'an animal with eight legs as an adult' },
  { key: 'flight', description: 'an animal capable of powered flight' },
  { key: 'shell', description: 'a reptile with a rigid bony shell' },
  { key: 'external-gills', description: 'an animal with external gills as an adult' },
  { key: 'eggs', description: 'an animal from an egg-laying species' },
  { key: 'flipper-wings', description: 'a bird with wings adapted into swimming flippers' },
], [
  ['Lion', ['mammal', 'four-legs'], [zoo('lion')]],
  ['Bat', ['mammal', 'flight'], [zoo('bat')]],
  ['Platypus', ['mammal', 'four-legs', 'eggs'], [zoo('platypus')]],
  ['Bottlenose dolphin', ['mammal'], ['https://www.fisheries.noaa.gov/species/common-bottlenose-dolphin']],
  ['Golden eagle', ['bird', 'flight', 'eggs'], ['https://www.allaboutbirds.org/guide/Golden_Eagle/overview']],
  ['African penguin', ['bird', 'eggs', 'flipper-wings'], [zoo('african-penguin')]],
  ['Ostrich', ['bird', 'eggs'], [zoo('ostrich')]],
  ['Crocodile', ['reptile', 'four-legs', 'eggs'], [zoo('crocodilian')]],
  ['King cobra', ['reptile', 'eggs'], ['https://nationalzoo.si.edu/animals/king-cobra']],
  ['Galápagos tortoise', ['reptile', 'four-legs', 'eggs', 'shell'], [zoo('galapagos-tortoise')]],
  ['American bullfrog', ['amphibian', 'four-legs', 'eggs'], ['https://animaldiversity.org/accounts/Lithobates_catesbeianus/']],
  ['Axolotl', ['amphibian', 'four-legs', 'eggs', 'external-gills'], ['https://sdzwildlifeexplorers.org/animals/axolotl']],
  ['Monarch butterfly', ['arthropod', 'six-legs', 'flight', 'eggs'], ['https://www.fws.gov/species/monarch-danaus-plexippus', 'https://www.nps.gov/indu/learn/nature/monarch-butterfly.htm']],
  ['Worker ant', ['arthropod', 'six-legs', 'eggs'], [zoo('ant')]],
  ['Spider', ['arthropod', 'eight-legs', 'eggs'], [zoo('spider')]],
  ['Giant Pacific octopus', ['mollusc', 'eggs'], ['https://www.montereybayaquarium.org/animals-the-ocean/animals-a-to-z/giant-pacific-octopus']],
]);

const yamaha = (name: string): string => `https://www.yamaha.com/en/musical_instrument_guide/${name}/`;
const percussion = 'https://philharmonia.co.uk/resources/instruments/percussion/';
const objects = set('Everyday objects: acoustic instruments', [
  { key: 'strings', description: 'an instrument that produces sound using vibrating strings' },
  { key: 'air', description: 'an instrument that produces sound using a vibrating air column' },
  { key: 'membrane', description: 'an instrument with a vibrating drumhead' },
  { key: 'solid', description: 'an instrument that produces sound using an idiophone component (a vibrating solid body)' },
  { key: 'bow', description: 'an instrument normally played with a bow' },
  { key: 'pluck', description: 'an instrument normally played by plucking its strings' },
  { key: 'frets', description: 'an instrument with frets on its fingerboard' },
  { key: 'keyboard', description: 'an instrument with a piano-style keyboard' },
  { key: 'keywork', description: 'a wind instrument with keywork covering tone holes' },
  { key: 'single-reed', description: 'a wind instrument using a single reed' },
  { key: 'double-reed', description: 'a wind instrument using a double reed' },
  { key: 'valves', description: 'a wind instrument using valves to change tube length' },
  { key: 'slide', description: 'a wind instrument using a telescopic slide to change pitch' },
  { key: 'pitched-drum', description: 'a drum designed to produce a definite musical pitch' },
  { key: 'snares', description: 'a drum fitted with a snare-wire assembly' },
  { key: 'jingles', description: 'an instrument fitted with small metal jingles' },
  { key: 'tuned-bars', description: 'an instrument with a set of tuned bars' },
  { key: 'metal-body', description: 'an instrument with a metal rod, plate, or jingle as an idiophone component' },
  { key: 'clashed', description: 'a pair of metal plates played by clashing them together' },
], [
  ['Violin', ['strings', 'bow'], [yamaha('violin')]],
  ['Concert harp', ['strings', 'pluck'], ['https://philharmonia-assets.s3.eu-west-1.amazonaws.com/uploads/2024/05/21122153/Schools-Teacher-Resource-booklet-5-Strings-and-percussion.pdf']],
  ['Classical guitar', ['strings', 'pluck', 'frets'], [yamaha('classical_guitar')]],
  ['Acoustic piano', ['strings', 'keyboard'], [yamaha('piano')]],
  ['Concert flute', ['air', 'keywork'], [yamaha('flute')]],
  ['Soprano recorder', ['air'], [yamaha('recorder')]],
  ['B-flat clarinet', ['air', 'keywork', 'single-reed'], [yamaha('clarinet')]],
  ['Oboe', ['air', 'keywork', 'double-reed'], [yamaha('oboe')]],
  ['Valve trumpet', ['air', 'valves'], [yamaha('trumpet')]],
  ['Slide trombone', ['air', 'slide'], [yamaha('trombone')]],
  ['Timpani', ['membrane', 'pitched-drum'], [yamaha('timpani')]],
  ['Snare drum', ['membrane', 'snares'], [percussion]],
  ['Headed tambourine', ['membrane', 'solid', 'jingles', 'metal-body'], [percussion]],
  ['Xylophone', ['solid', 'tuned-bars'], ['https://hub.yamaha.com/drums/percussion/whats-the-difference-between-marimba-and-xylophone/']],
  ['Triangle', ['solid', 'metal-body'], [percussion]],
  ['Crash cymbal pair', ['solid', 'metal-body', 'clashed'], [percussion]],
]);
export const negativeFactSets: NegativeFactSet[] = [geography, science, history, animals, objects];

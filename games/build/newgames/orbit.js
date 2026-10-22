import { normalize } from '../data.js';
const o = (id, category, answer, aliases, clue, explanation) => ({ id, category, answer, accepted: [answer, ...aliases.split('|').filter(Boolean)].map(normalize), rejected: [], clue, explanation, source: '' });
const p = (center, topic, orbits) => ({ id: `orbit-v1-${center}`, center, topic, orbits: orbits.map(x => ({ ...x, source: `https://www.merriam-webster.com/dictionary/${center}` })), review: { method: 'source-backed-construction', notes: 'Dictionary senses checked during construction; example associations and finite aliases explicitly reviewed in this change. No independent human editorial sign-off claimed. Unlisted associations can be flagged, not judged by an AI.', date: '2026-10-21' } });
export const orbitBank = [
    p('star', 'Symbols', [
        o('astronomy', 'Astronomy', 'sun', 'the sun|our sun', 'Our nearest example shines by day.', 'The Sun is the star nearest Earth.'),
        o('fame', 'Fame', 'celebrity', 'famous person|superstar|actor|performer', 'A famous person can be called this.', 'A celebrated performer can be called a star.'),
        o('authority', 'A badge of authority', 'sheriff', 'sheriffs|sheriff badge|police|badge', 'Think of a familiar Western badge.', 'The star-shaped sheriff badge connects the word to law enforcement.'),
        o('reviews', 'Reviews', 'rating', 'ratings|review|reviews|score', 'A review may award one through five.', 'Stars are units in familiar review-rating systems.'),
        o('wish', 'A night-sky tradition', 'wish', 'wishes|wishing|hope', 'People make one upon seeing a shooting star.', 'Wishing upon a star connects the sky to hopes and wishes.'),
        o('holiday', 'A seasonal decoration', 'christmas', 'christmas tree|xmas|tree topper', 'It may sit on top of a decorated tree.', 'A star is a traditional Christmas tree topper.'),
        o('shape', 'Geometry', 'pentagram', 'five pointed shape|five-pointed shape|five pointed star', 'A five-pointed figure drawn with crossing strokes.', 'A pentagram is a five-pointed star figure.'),
        o('navigation', 'Finding north', 'polaris', 'north star|pole star', 'This famous guide appears near the north celestial pole.', 'Polaris is the North Star, a familiar navigational reference.')
    ]),
    p('spring', 'Everyday meanings', [
        o('season', 'The calendar', 'season', 'springtime|vernal season', 'Between winter and summer.', 'Spring names the season following winter.'),
        o('water', 'A natural water source', 'fountain', 'water source|source|groundwater', 'Water emerges naturally from the ground.', 'A spring is a natural place where groundwater reaches the surface.'),
        o('elastic', 'A mechanical part', 'coil', 'coiled wire|elastic coil|spring coil', 'Compress it and it pushes back.', 'A coiled mechanical spring stores elastic energy.'),
        o('jump', 'A sudden movement', 'leap', 'jump|bound', 'A sudden upward or forward movement.', 'To spring can mean to leap or jump.'),
        o('food', 'A vegetable compound', 'onion', 'spring onion|scallion|scallions', 'A mild green-topped onion.', 'A spring onion is also known as a scallion.'),
        o('diving', 'A diving compound', 'board', 'springboard|diving board', 'A flexible platform at a swimming pool.', 'A springboard supplies a diver with an elastic launch.'),
        o('chores', 'A seasonal household task', 'cleaning', 'spring cleaning|clean', 'A thorough annual household tidy.', 'Spring cleaning names a thorough seasonal cleaning.'),
        o('fastener', 'A gripping compound', 'clip', 'spring clip|clamp', 'Elastic force holds two surfaces together.', 'A spring clip grips using elastic force.')
    ]),
    p('light', 'Everyday meanings', [
        o('seeing', 'Illumination', 'lamp', 'lantern|bulb|illumination', 'A familiar household source.', 'A lamp provides visible light.'),
        o('weight', 'Low weight', 'feather', 'lightweight|weightless', 'A common comparison for something weighing very little.', 'Light can describe something of low weight, like a feather.'),
        o('color', 'A pale color', 'pastel', 'pale|pale color', 'The opposite of a dark shade.', 'A light color is relatively pale.'),
        o('fire', 'Starting a flame', 'match', 'ignite|lighter|kindle', 'Strike this to start a small flame.', 'To light a match is to ignite it.'),
        o('road', 'A traffic signal', 'green', 'traffic signal|traffic light', 'The signal that permits traffic to proceed.', 'A green traffic light signals permission to proceed.'),
        o('photo', 'Photography', 'exposure', 'photograph|photography', 'A camera sensor receives it during this.', 'Exposure describes light reaching the photographic medium.'),
        o('food', 'A food description', 'diet', 'low calorie|low-calorie|reduced calorie', 'A food may be advertised as lower in calories.', 'Light can describe reduced-calorie food.'),
        o('understand', 'Understanding', 'insight', 'understanding|clarity|enlightenment', 'A difficult idea suddenly becomes clear.', 'Light is a familiar metaphor for understanding.')
    ]),
    p('key', 'Tools and ideas', [
        o('lock', 'Opening a mechanism', 'lock', 'door|unlock', 'It turns inside this mechanism.', 'A key operates a lock.'),
        o('instrument', 'A musical instrument', 'piano', 'keyboard instrument', 'Its black and white parts are pressed.', 'A piano is played by pressing keys.'),
        o('cipher', 'Secret writing', 'cipher', 'code|encryption|decrypt', 'It determines how coded text is decoded.', 'A cryptographic key supplies information for encryption or decoding.'),
        o('map', 'Reading a map', 'legend', 'map legend', 'A box explains symbols used on a map.', 'A map key, or legend, explains its symbols.'),
        o('solution', 'An exercise sheet', 'answer', 'answers|answer key|solution', 'Teachers may use this to mark exercises.', 'An answer key lists solutions to questions.'),
        o('island', 'A low island', 'cay', 'island|coral island', 'Think of a small low island.', 'Key can name a low island, also called a cay.'),
        o('typing', 'Computer input', 'keyboard', 'typing|type', 'These physical controls produce characters.', 'Typing uses the keys of a keyboard.'),
        o('tonal', 'Music theory', 'tonic', 'tonality|tonal center', 'The tonal center of a piece of music.', 'A musical key is organized around a tonal center.')
    ]),
    p('branch', 'Connected systems', [
        o('tree', 'Botany', 'bough', 'tree|limb|twig', 'It grows out from a trunk.', 'A tree branch is a subdivision of its stem.'),
        o('office', 'A local business location', 'office', 'local office|bank office', 'A business can operate several local locations.', 'A branch office is a local division of an organization.'),
        o('river', 'Waterways', 'tributary', 'stream|river', 'A smaller watercourse joins a larger one.', 'Branch can describe a subsidiary watercourse.'),
        o('government', 'Government', 'executive', 'judicial|legislative|judiciary', 'Think of separate divisions of government.', 'Executive, legislative and judicial functions are commonly called branches.'),
        o('family', 'Family history', 'lineage', 'family|family tree', 'One line of descent in a family tree.', 'A family branch denotes a line of descent.'),
        o('code', 'Version control', 'git', 'version control|development line', 'A separate line of software development.', 'A Git branch represents a line of development.'),
        o('study', 'A field of study', 'algebra', 'mathematics|geometry', 'A subdivision of mathematics.', 'Algebra is a branch of mathematics.'),
        o('road', 'A route divides', 'fork', 'road fork|junction', 'A route splits into separate directions.', 'A road may branch at a fork.')
    ]),
    p('pitch', 'Different senses', [
        o('sound', 'Sound', 'tone', 'frequency|musical note', 'High or low describes this property of sound.', 'Pitch describes the perceived highness or lowness of a sound.'),
        o('baseball', 'Baseball', 'throw', 'toss|baseball', 'A pitcher sends the ball toward the batter.', 'A pitch is the delivery of a baseball toward the batter.'),
        o('roof', 'Roof geometry', 'slope', 'incline|steepness', 'This describes how steep a roof is.', 'A roof pitch describes its slope.'),
        o('sales', 'Persuasion', 'proposal', 'sales proposal|sales presentation|presentation', 'A short persuasive presentation.', 'A sales pitch presents an idea persuasively.'),
        o('material', 'A sticky material', 'tar', 'resin|bitumen', 'A dark sticky substance.', 'Pitch can name a tar-like or resinous substance.'),
        o('field', 'A sports surface', 'field', 'playing field|soccer field|cricket field', 'In British English, a playing surface.', 'A pitch is a field used for certain sports.'),
        o('tent', 'Camping', 'tent', 'erect|set up', 'You can do this when setting up camp.', 'To pitch a tent is to erect it.'),
        o('ship', 'Motion at sea', 'tilt', 'heave|ship|boat', 'A vessel rocks fore and aft.', 'A ship pitches when its bow and stern move up and down.')
    ]),
    p('bank', 'Different senses', [
        o('finance', 'Finance', 'money', 'deposit|savings|financial institution', 'A place to deposit savings.', 'A bank accepts deposits and supplies financial services.'),
        o('river', 'A river edge', 'shore', 'riverbank|river shore|river', 'Land at the side of a river.', 'A river bank is its bordering land.'),
        o('aircraft', 'An aircraft turn', 'tilt', 'roll|airplane|aeroplane', 'A plane tilts while turning.', 'An aircraft banks by rolling into a turn.'),
        o('reserve', 'A stored collection', 'reserve', 'supply|collection|blood', 'A stored supply, such as donated blood.', 'Bank can mean a reserve or collection for future use.'),
        o('billiards', 'A billiards rebound', 'cushion', 'billiards|pool|rebound', 'A ball rebounds off the edge of the table.', 'A bank shot rebounds from a cushion.'),
        o('cloud', 'Weather', 'fog', 'cloud|clouds|fog bank', 'A mass of low cloud can be described this way.', 'A fog bank is a mass or accumulation of fog.'),
        o('snow', 'A winter pile', 'snowdrift', 'snow|snow bank|drift', 'Snow piled in a mound.', 'A snow bank is a built-up mass of snow.'),
        o('memory', 'Computing', 'memory', 'data|memory bank', 'A group of storage elements.', 'Memory bank describes a group of computer memory elements.')
    ]),
    p('scale', 'Measurement and change', [
        o('weigh', 'Weighing', 'balance', 'weight|weighing machine', 'A device measures how heavy something is.', 'A weighing scale measures weight.'),
        o('fish', 'Animal covering', 'fish', 'skin|fish skin', 'Small protective plates cover this animal.', 'Fish scales form part of the animal’s outer covering.'),
        o('music', 'Music', 'notes', 'musical notes|note sequence', 'A sequence of notes arranged by pitch.', 'A musical scale is an ordered series of notes.'),
        o('map', 'Map proportions', 'ratio', 'proportion|map', 'The map distance is compared with actual distance.', 'Map scale expresses a ratio between represented and real distances.'),
        o('climb', 'Climbing', 'climb', 'ascend|mountain', 'Go up the face of a wall or mountain.', 'To scale a wall is to climb it.'),
        o('resize', 'Changing size', 'resize', 'enlarge|shrink', 'Make a model bigger or smaller in proportion.', 'To scale an object is to change its size proportionally.'),
        o('deposit', 'A kettle deposit', 'limescale', 'mineral deposit|lime', 'Hard water leaves this on a kettle.', 'Scale can describe a mineral deposit on a surface.'),
        o('temperature', 'Reading temperature', 'thermometer', 'graduations|celsius', 'Marked divisions help measure temperature.', 'A thermometer uses a scale of marked values.')
    ]),
    p('root', 'Origins and foundations', [
        o('plant', 'Botany', 'soil', 'plant|ground', 'This anchors a plant below ground.', 'Plant roots commonly anchor and absorb from soil.'),
        o('math', 'Mathematics', 'square', 'square root|radical', 'A number multiplied by itself leads to this common expression.', 'A square root is a value whose square equals a given number.'),
        o('cause', 'A fundamental cause', 'origin', 'cause|source', 'The underlying cause of a problem.', 'The root of a problem is its underlying cause.'),
        o('language', 'Language', 'stem', 'word stem|base word', 'A base from which related words develop.', 'A word root is a base element carrying meaning.'),
        o('computing', 'System privileges', 'administrator', 'admin|superuser', 'The most privileged account on many Unix systems.', 'The root account is the system superuser.'),
        o('hair', 'Hair anatomy', 'follicle', 'hair|hair follicle', 'The embedded base of a hair.', 'A hair root lies in the skin within a follicle.'),
        o('cheer', 'Support for a team', 'cheer', 'support|fan', 'You can do this for your favorite team.', 'To root for someone is to support or cheer for them.'),
        o('tooth', 'Dentistry', 'tooth', 'teeth|dental', 'The embedded part anchors it in the jaw.', 'A tooth root anchors the tooth beneath the gum.')
    ]),
    p('bridge', 'Things that connect', [
        o('crossing', 'A physical crossing', 'river', 'crossing|road', 'It carries a route across an obstacle.', 'A bridge can span a river.'),
        o('music', 'Song structure', 'middle eight', 'song|music|contrasting section', 'A contrasting passage connects sections of a song.', 'A musical bridge provides a contrasting connecting section.'),
        o('dental', 'Dentistry', 'denture', 'teeth|tooth|dental prosthesis', 'A fixed restoration replaces missing teeth.', 'A dental bridge replaces missing teeth with an anchored prosthesis.'),
        o('cards', 'A card game', 'cards', 'contract bridge|card game', 'A trick-taking game played with partners.', 'Bridge is a partnership card game.'),
        o('network', 'Computer networks', 'network', 'networking|network segments|ethernet', 'A device connects network segments.', 'A network bridge connects network segments.'),
        o('ship', 'A ship’s command area', 'captain', 'ship|wheelhouse', 'A ship is controlled from this area.', 'A ship’s bridge is its navigation and command area.'),
        o('nose', 'The face', 'nose', 'glasses|spectacles', 'The raised part between the eyes.', 'The bridge of the nose supports the central part of spectacles.'),
        o('guitar', 'A stringed instrument', 'guitar', 'strings|violin', 'This part supports strings on an instrument.', 'An instrument’s bridge supports strings and transmits vibration.')
    ]),
    p('cell', 'Small compartments', [
        o('biology', 'Biology', 'organism', 'biology|living unit', 'A basic unit of living tissue.', 'A biological cell is a fundamental unit of life.'),
        o('electric', 'Electrical energy', 'battery', 'voltage|electrochemical', 'An electrochemical unit provides electrical energy.', 'An electrical cell converts chemical energy into electrical energy.'),
        o('prison', 'Confinement', 'inmate', 'prison|prisoner', 'A prisoner occupies this small room.', 'A prison cell is a room used to confine an inmate.'),
        o('spreadsheet', 'A spreadsheet', 'formula', 'spreadsheet|worksheet', 'A row-column intersection can contain a calculation.', 'A spreadsheet cell stores a value or formula.'),
        o('monastery', 'Monastic life', 'monk', 'nun|monastery|convent', 'A small private room in a monastery.', 'A monastic cell is a small room occupied by a monk or nun.'),
        o('honeycomb', 'A honeycomb', 'bee', 'bees|honey', 'A small wax compartment stores honey or brood.', 'A honeycomb is made of cells built by bees.'),
        o('mobile', 'A mobile network', 'tower', 'phone|mobile phone|coverage area', 'A network serves geographic coverage areas.', 'A cellular network divides coverage into cells.'),
        o('group', 'A secretive small group', 'spy', 'clandestine group|secret group', 'A small group works within a larger clandestine organization.', 'Cell can mean a small organizational group, including a clandestine one.')
    ]),
    p('ring', 'Shapes and signals', [
        o('jewel', 'Jewelry', 'finger', 'wedding|engagement', 'A band worn on this part of the hand.', 'A jewelry ring is commonly worn on a finger.'),
        o('phone', 'An audible signal', 'telephone', 'phone|bell|chime', 'A call produces this familiar sound.', 'A telephone or bell can ring.'),
        o('boxing', 'Boxing', 'arena', 'boxing|boxing ring', 'A bounded contest area, despite its square shape.', 'A boxing ring is the area in which a boxing contest takes place.'),
        o('geometry', 'Geometry', 'circle', 'circular band|annulus', 'A circular band or outline.', 'A ring can name a circular band or annular shape.'),
        o('tree', 'Tree growth', 'age', 'tree|growth rings', 'Annual growth can leave visible bands.', 'Tree rings can record successive periods of growth.'),
        o('crime', 'A cooperating group', 'gang', 'criminal group|crime', 'A group of people acting together illicitly.', 'A ring can mean an organized group engaged in a common activity.'),
        o('planet', 'Astronomy', 'saturn', 'planetary rings', 'A planet famous for its prominent surrounding bands.', 'Saturn is known for its planetary rings.'),
        o('chemistry', 'Molecular structure', 'benzene', 'cyclic molecule|molecule', 'A familiar molecule with a six-carbon cycle.', 'Benzene has a ring-shaped molecular structure.')
    ]),
];
export const orbitCount = (level) => [4, 5, 6, 6, 8][level - 1];
export const activeOrbits = (p, level) => p.orbits.slice(0, orbitCount(level));
export function validateOrbit(p) {
    const errors = [], ids = new Set(), answers = new Set();
    if (!p.center || p.orbits.length !== 8 || p.review.method !== 'source-backed-construction')
        errors.push('Missing center or source review');
    for (const o of p.orbits) {
        if (ids.has(o.id) || !o.id || !o.category || !o.clue || !o.explanation || !o.source)
            errors.push('Invalid relationship');
        ids.add(o.id);
        if (!o.accepted.includes(normalize(o.answer)))
            errors.push('Primary answer not approved');
        for (const a of o.accepted) {
            if (a !== normalize(a) || answers.has(a) || a === normalize(p.center) || o.rejected.includes(a))
                errors.push('Overlapping or rejected answer: ' + a);
            answers.add(a);
        }
    }
    return errors;
}
export function orbitGuess(s, p, raw) {
    const word = normalize(raw);
    if (s.phase !== 'playing' || !word)
        return { session: s, message: 'Enter a connection.' };
    if (s.guesses.some(x => normalize(x) === word))
        return { session: s, message: 'You have already tried that connection.' };
    const orbit = activeOrbits(p, s.level).find(o => o.accepted.includes(word));
    if (orbit && s.filled[orbit.id])
        return { session: s, message: 'That orbit is already filled. Try a different kind of connection.' };
    const next = { ...s, guesses: [...s.guesses, word], filled: orbit ? { ...s.filled, [orbit.id]: word } : s.filled, mistakes: s.mistakes + (orbit ? 0 : 1) };
    const done = Object.keys(next.filled).length === orbitCount(s.level);
    const hinted = Object.values(s.assistance).reduce((sum, n) => sum + [0, 15, 40, 80][n], 0);
    return { session: { ...next, phase: done ? 'solved' : 'playing', finished: done ? Date.now() : null, score: Math.max(0, Object.keys(next.filled).length * 100 - next.mistakes * 10 - hinted + (done && !s.hints ? 150 : 0)) }, message: orbit ? `Connected: ${orbit.category}.` : 'That word is not in this puzzle’s approved connections. A reasonable alternative can be flagged below.' };
}
export function orbitHint(s, id, p) {
    if (s.phase !== 'playing' || s.filled[id] || !activeOrbits(p, s.level).some(o => o.id === id) || (s.assistance[id] || 0) >= 3)
        return s;
    const limit = s.level === 4 ? 6 : s.level === 5 ? 8 : Infinity;
    if (s.hints >= limit)
        return s;
    return { ...s, hints: s.hints + 1, assistance: { ...s.assistance, [id]: (s.assistance[id] || 0) + 1 } };
}

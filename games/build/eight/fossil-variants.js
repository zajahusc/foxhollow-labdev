export const evolutionContent = [
    {
        id: 'evolution-church', level: 1,
        forms: ['cirice', 'chirche', 'church'],
        periods: ['Old English', 'Middle English', 'Modern English standard'],
        explanation: 'The dictionary records Old English cirice and Middle English chirche before the standard church spelling used today. These are English stages of one word; the ordering does not rely on its more distant, less certain transmission history.',
        sources: ['https://www.etymonline.com/word/church'],
        hints: ['The standard spelling used today belongs last.', 'The form beginning CI belongs to Old English.', 'Put cirice first, then the form with two CH spellings.'],
    },
    {
        id: 'evolution-ghost', level: 2,
        forms: ['gast', 'gost', 'ghost'],
        periods: ['Old English', 'Middle English', 'Modern English standard'],
        explanation: 'Old English gast became Middle English gost. The H-bearing spelling developed later under continental spelling influence and is the modern standard. This is a spelling history, not a claim that the H records an extra modern spoken consonant.',
        sources: ['https://www.etymonline.com/word/ghost'],
        hints: ['One silent letter arrived later in the spelling.', 'The A-vowel form is Old English; the O-vowel form without H is Middle English.', 'Order gast, then gost, then the modern spelling containing H.'],
    },
    {
        id: 'evolution-island', level: 3,
        forms: ['igland', 'yland', 'island'],
        periods: ['Old English', 'Middle English, around 1300', 'Modern standard; S spelling recorded in the 1590s'],
        explanation: 'The entry gives Old English igland, the later yland spelling around 1300, and island in the 1590s. The S was introduced through association with isle; the dictionary specifically distinguishes that association from true descent from isle.',
        sources: ['https://www.etymonline.com/word/island'],
        hints: ['The silent S was added later rather than inherited from the oldest listed form.', 'The Y-initial spelling is the middle stage.', 'The sequence starts with igland and ends with island.'],
    },
    {
        id: 'evolution-sheriff', level: 4,
        forms: ['scirgerefa', 'shir-reve', 'sheriff'],
        periods: ['Late Old English', 'Middle English', 'Modern English standard'],
        explanation: 'The dictionary records late Old English scirgerefa and Middle English shir-reve in the history of sheriff. The older compound referred to an official associated with a shire; contraction obscured those parts in the modern spelling.',
        sources: ['https://www.etymonline.com/word/sheriff'],
        hints: ['The oldest form is a compound whose parts are most visibly separated in the middle stage.', 'SCIR belongs to the Old English form; SHIR belongs to the Middle English form.', 'Start with scirgerefa, then shir-reve, and finish with the modern contraction.'],
    },
    {
        id: 'evolution-silly', level: 5,
        forms: ['gesælig', 'seli', 'silly'],
        periods: ['Old English', 'Middle English', 'Modern English standard'],
        explanation: 'Old English gesælig had favorable senses associated with happiness. The dictionary lists Middle English seli before the modern silly form and traces a gradual change toward the foolish sense, recorded in the 1570s. Spelling history and meaning history are related but are not identical single-step changes.',
        sources: ['https://www.etymonline.com/word/silly'],
        hints: ['The oldest spelling also had a more favorable meaning.', 'The GE-initial form is Old English; SELI is the middle stage.', 'Place gesælig first and the familiar modern spelling last.'],
    },
];
/**
 * These reconstruct modern English words from documented historical elements.
 * They do not pretend that English concatenation reproduces a Latin/Greek
 * inflected word or establish which exact route of borrowing a dictionary calls
 * uncertain. Difficulty estimates reflect vocabulary and morphological opacity.
 */
export const reconstructionContent = [
    {
        id: 'reconstruct-transport', level: 1,
        prefix: 'trans', root: 'port', suffix: '', answer: 'transport', aliases: ['transport'],
        language: 'Latin', meaning: 'carry across; convey from one place to another',
        explanation: 'Transport derives from Latin transportare, combining trans, across, with portare, to carry, through French and Latin transmission. The puzzle uses the modern combining spellings TRANS and PORT.',
        sources: ['https://www.etymonline.com/word/transport'],
        hints: ['The first element means across.', 'The second element concerns carrying.', 'Join TRANS to PORT to name carrying from place to place.'],
    },
    {
        id: 'reconstruct-microscope', level: 2,
        prefix: 'micro', root: 'scope', suffix: '', answer: 'microscope', aliases: ['microscope'],
        language: 'Greek elements through Modern Latin', meaning: 'an instrument for viewing very small things',
        explanation: 'Microscope comes through Modern Latin microscopium. MICRO reflects Greek mikros, small; SCOPE is the instrument-for-seeing element derived from Greek skopein, to examine. This is a later scientific formation from Greek elements, not the name of an ancient Greek instrument.',
        sources: ['https://www.etymonline.com/word/microscope', 'https://www.etymonline.com/word/micro-', 'https://www.etymonline.com/word/-scope'],
        hints: ['The first element means small.', 'The second element names an instrument for seeing.', 'Combine MICRO and SCOPE to identify an optical instrument.'],
    },
    {
        id: 'reconstruct-interject', level: 3,
        prefix: 'inter', root: 'ject', suffix: '', answer: 'interject', aliases: ['interject'],
        language: 'Latin', meaning: 'insert a remark; literally throw between',
        explanation: 'The historical elements are Latin inter, between, and iacere, to throw, whose compound participial forms explain the modern JECT spelling. The dictionary allows either direct derivation from the Latin participle or English back-formation from interjection; the puzzle does not choose between those routes.',
        sources: ['https://www.etymonline.com/word/interject'],
        hints: ['The first element means between.', 'The JECT family concerns throwing, as in eject.', 'Join INTER to JECT for inserting a remark between others.'],
    },
    {
        id: 'reconstruct-circumspect', level: 4,
        prefix: 'circum', root: 'spect', suffix: '', answer: 'circumspect', aliases: ['circumspect'],
        language: 'Latin', meaning: 'cautious; originally looking around',
        explanation: 'Circumspect comes from Latin circumspectus, associated with circumspicere: circum means around and specere means to look. The modern adjective preserves the SPECT form and the figurative sense of considering things carefully.',
        sources: ['https://www.etymonline.com/word/circumspect', 'https://www.etymonline.com/word/circum-'],
        hints: ['The prefix means around or on all sides.', 'The root is the looking family found in inspect.', 'Combine CIRCUM and SPECT to describe someone cautious.'],
    },
    {
        id: 'reconstruct-circumlocution', level: 5,
        prefix: 'circum', root: 'locut', suffix: 'ion', answer: 'circumlocution', aliases: ['circumlocution'],
        language: 'Latin', meaning: 'a roundabout way of speaking',
        explanation: 'Circumlocution comes from Latin circumlocutionem, combining circum, around, with a speaking noun based on the participial stem of loqui. LOCUT is that speaking stem; ION reflects the action-noun ending. The pieces reconstruct the English spelling rather than an uninflected Latin phrase.',
        sources: ['https://www.etymonline.com/word/circumlocution', 'https://www.etymonline.com/word/locution', 'https://www.etymonline.com/word/-ion'],
        hints: ['The prefix contributes around.', 'The root belongs to the speaking family seen in locution.', 'Put CIRCUM before LOCUT and add ION for speaking around a point.'],
    },
];

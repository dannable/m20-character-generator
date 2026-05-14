// Mage: The Ascension Tarot, full 78-card deck for the "Consult the Fates"
// character-creation oracle. Meanings drawn from the 1993/2001 White Wolf
// Mage Tarot booklet by Nicky Rea and Jackie Cassada. Affinity tags
// (factions, traditions, essence, nature archetypes, character concepts,
// spheres) are inferred from each card's booklet text and used by the
// concept-blend logic in the Tarot module below.

// Suit-to-faction mapping per the booklet (p. 8):
//   Questing → Traditions       (Fire / Wands)
//   Primordialism → Nephandi    (Water / Cups)
//   Dynamism → Marauders        (Air / Swords)
//   Pattern → Technocracy       (Earth / Pentacles)

M20.TAROT = [

  // ══════════════════════════════════════════════════════════════════════
  // MAJOR ARCANA (22)
  // ══════════════════════════════════════════════════════════════════════
  { id: 'fool', name: 'The Fool', number: 0, arcana: 'major', file: '00-fool.png',
    meaning: 'Possibility',
    upright: ['Courage','Ecstasy','Creative Expression','Risk-taking','Trust','Choice','Adventure'],
    flavor: 'Clad in the vestments of mortal experience and spiritual awareness, the child of the Dreaming stands poised on the edge of physical reality, open to the embrace of all possibility.',
    association: 'Marauders',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Visionary','Trickster','Child'], concepts: ['Wanderer','Dreamer','Cosmic Fool'], spheres: [] },

  { id: 'mage', name: 'The Mage', number: 1, arcana: 'major', file: '01-mage.png',
    meaning: 'Will',
    upright: ['Communication','Inherent Ability','Memory','Clarity of thought and feeling','Organization','Invention','Originality'],
    flavor: 'With an act of conscious thought, Dante grasps the wand of Prime, closing the link between the energy that gives him the power of magic and the tools that lie before him on the table of the world.',
    association: 'Virtual Adepts',
    factions: ['Traditions'], traditions: ['Virtual Adepts'], essence: 'Questing',
    nature: ['Architect','Director','Visionary'], concepts: ['Reality Hacker','Innovator'], spheres: ['prime'] },

  { id: 'high-priestess', name: 'The High Priestess', number: 2, arcana: 'major', file: '02-high-priestess.png',
    meaning: 'Enlightenment',
    upright: ['Intuition','Resourcefulness','Independence','Meditation','Growth','Evaluation','Consciousness','Mystery','Inner Illumination'],
    flavor: 'Mae Roberts, the keeper of the secret path, sits beside the waters of consciousness. Clasping the symbol of cosmic memory, she guards the passage between light and dark, dream and reality.',
    association: 'Dreamspeakers',
    factions: ['Traditions'], traditions: ['Dreamspeakers'], essence: 'Primordial',
    nature: ['Loner','Caretaker','Judge'], concepts: ['Mystic','Oracle'], spheres: ['mind','spirit'] },

  { id: 'empress', name: 'The Empress', number: 3, arcana: 'major', file: '03-empress.png',
    meaning: 'Fertility',
    upright: ['Wisdom','Earth-mother','Prophecy','Love of nature','Spiritual essence','Healing','Nurturing','Emotion','Creation','Cycles','Balance','Fruitfulness','Contentment'],
    flavor: 'Heasha Morninglade feels the flow of life-magic within her. Enthroned upon the world-tree, surrounded by fertile growth, she opens herself through the wand of the moon to the feminine principle of cyclic movement.',
    association: 'Verbena',
    factions: ['Traditions'], traditions: ['Verbena'], essence: 'Primordial',
    nature: ['Caretaker','Caregiver','Bon Vivant'], concepts: ['Healer','Witch','Earth-Mother'], spheres: ['life','spirit'] },

  { id: 'emperor', name: 'The Emperor', number: 4, arcana: 'major', file: '04-emperor.png',
    meaning: 'Government',
    upright: ['Leadership','Power','Decisions','Action','Negotiation','Inspiration','Motivation of others','Strength','Respect','Foundation','Self-assertion','Paternity','Mastery','Reason'],
    flavor: 'The lord of reason, Caeron Mustai, grasps the blade which symbolizes the power of his active will, commanding the forces of his physical and animal natures.',
    association: 'Order of Hermes',
    factions: ['Traditions'], traditions: ['Order of Hermes'], essence: 'Pattern',
    nature: ['Autocrat','Director','Architect','Traditionalist'], concepts: ['Aristocrat','Ruler','Hermetic Adept'], spheres: ['forces','prime'] },

  { id: 'hierophant', name: 'The Hierophant', number: 5, arcana: 'major', file: '05-hierophant.png',
    meaning: 'Morality',
    upright: ['Learning','Teaching','Wisdom','the Sacred','Initiator','Challenge','Commitment','Intention','Focus','Spirit','Remembrance','Resolution','Consultation','Counseling','Conformity','Society','Orthodoxy'],
    flavor: 'Clothed in ritual and bound by orthodox traditions, the ruler of conventional faith translates the secrets of the cosmic mind into palatable forms.',
    association: 'Celestial Chorus',
    factions: ['Traditions'], traditions: ['Celestial Chorus'], essence: 'Pattern',
    nature: ['Conformist','Pedagogue','Traditionalist','Judge'], concepts: ['Priest','Teacher','Cantor'], spheres: ['prime','mind'] },

  { id: 'lovers', name: 'The Lovers', number: 6, arcana: 'major', file: '06-lovers.png',
    meaning: 'Attraction',
    upright: ['Relationship','Curiosity','Loyalty','Commitment','Passion','Bonding','Duality','Sincerity','Openness','Sensitivity','Integration','Equality','Romance','Harmony'],
    flavor: 'Bathed in the emanations of a higher cosmic power, they seek the union of opposites. Unveiled to one another, the Lovers follow the pathway of the senses to inner and outer harmony.',
    association: 'Cult of Ecstasy',
    factions: ['Traditions'], traditions: ['Cult of Ecstasy'], essence: 'Primordial',
    nature: ['Bon Vivant','Gallant','Caregiver'], concepts: ['Lover','Sensualist','Ecstatic'], spheres: ['mind','time'] },

  { id: 'chariot', name: 'The Chariot', number: 7, arcana: 'major', file: '07-chariot.png',
    meaning: 'Triumph',
    upright: ['Change','Movement','Growth','Evolution','Progress','Opportunity','Exploration','Travel','Stimulation','Activity','Promotion','Conquest','Bulwark against temptation'],
    flavor: 'Aboard the sky-chariot of his own making, Jet Boy takes his place among the explorers of the possible. The triumph of mind over matter finds expression in the work of the charioteer.',
    association: 'Sons of Ether',
    factions: ['Traditions'], traditions: ['Sons of Ether'], essence: 'Dynamic',
    nature: ['Visionary','Director','Survivor'], concepts: ['Inventor','Pilot','Etherite Adventurer'], spheres: ['forces','correspondence','matter'] },

  { id: 'strength', name: 'Strength', number: 8, arcana: 'major', file: '08-strength.png',
    meaning: 'Strength',
    upright: ['Passion','Creativity','Risk-taking','Charisma','Radiance','Regeneration','Expression','Gifts','Taming','Overcoming fears','Lustiness','Strong faith','Trust in own abilities','Confidence','Unconditionality','Intuition','Domination','Harmony'],
    flavor: 'Strengthened by her passions, confident in her spiritual power, she wrestles the bestial and tainted sides of her nature, bringing them into a harmonious whole with her higher self.',
    association: 'Quintessence',
    factions: ['Traditions'], traditions: ['Verbena','Cult of Ecstasy'], essence: 'Dynamic',
    nature: ['Survivor','Bravo','Visionary','Bon Vivant'], concepts: ['Warrior','Tamer','Beast-Master'], spheres: ['prime','life'] },

  { id: 'hermit', name: 'The Hermit', number: 9, arcana: 'major', file: '09-hermit.png',
    meaning: 'Guidance',
    upright: ['Completion','Introspection','Contemplation','Experience','Detail','Revelation','Integrity','Respect','Leadership','Transitions','Discovery','Wisdom','Mentorship','Open-mindedness','Courage','Seeking'],
    flavor: 'Clothed in the guise of the seeker, he holds aloft the light of truth, illuminating the way for other wayfarers through the bitter night of ignorance.',
    association: 'Hollow Ones',
    factions: ['Disparates','Orphans'], traditions: ['Hollow Ones'], essence: 'Pattern',
    nature: ['Loner','Pedagogue','Penitent','Curmudgeon'], concepts: ['Outsider','Lantern-Bearer','Lost Sage'], spheres: ['mind','time'] },

  { id: 'wheel-of-fortune', name: 'Wheel of Fortune', number: 10, arcana: 'major', file: '10-wheel-of-fortune.png',
    meaning: 'Destiny',
    upright: ['Opportunity','Breakthrough','Prosperity','Abundance','Expansion','Flexibility','Originality','Pioneering','Fortune','Challenge','Synchronicity','Fate','Chance','Luck','Cycles'],
    flavor: 'The Wheel turns. Life and death play out their dance of perpetual motion in the progress toward Ascension. Behind the mask of personality, the eternal self expands its boundaries.',
    association: 'Euthanatos',
    factions: ['Traditions'], traditions: ['Euthanatos'], essence: 'Pattern',
    nature: ['Fatalist','Survivor','Judge'], concepts: ['Thanatoic Adept','Cycle-Walker'], spheres: ['entropy','time'] },

  { id: 'justice', name: 'Justice', number: 11, arcana: 'major', file: '11-justice.png',
    meaning: 'Justice',
    upright: ['Alignment','Balance','Realignment','Truth','Clarity','Simplification','Order','Authenticity','Visualization','Seeing through deceptions','Harmony'],
    flavor: 'Framed within the triptych of mind, body and spirit, Raging Eagle holds aloft the two-edged sword of Justice. Guided by knowledge of the balance, the master of the mind seeks first the inner truth.',
    association: 'Akashic Brotherhood',
    factions: ['Traditions'], traditions: ['Akashic Brotherhood'], essence: 'Pattern',
    nature: ['Judge','Traditionalist','Pedagogue'], concepts: ['Martial Artist','Ascetic','Truth-Seeker'], spheres: ['mind'] },

  { id: 'hanged-man', name: 'The Hanged Man', number: 12, arcana: 'major', file: '12-hanged-man.png',
    meaning: 'Perspective',
    upright: ['Surrender','Breaking old patterns','Resolution','Freedom from self-imposed limitations','Unlimited life-force','Different postures and perspectives','Awakening','Deep spiritual wisdom','Creativity','Intelligence','Prophecy'],
    flavor: 'The Wraith hangs suspended before the doorways that separate the physical world from the Shadowlands of the soul. Only by surrendering the trappings of identity can he discover the depths of knowledge from which his new pattern will emerge.',
    association: 'Paradox',
    factions: [], traditions: [], essence: 'Primordial',
    nature: ['Martyr','Visionary','Penitent','Masochist'], concepts: ['Mystic','Sacrifice','Sleepwalker'], spheres: ['spirit','entropy'] },

  { id: 'death', name: 'Death', number: 13, arcana: 'major', file: '13-death.png',
    meaning: 'Renewal',
    upright: ['Release','Detachment','Transformation','Irrepressible spiritual essence','Expanded consciousness','Emergence','Midwifery','Restructuring','Cycles','Rebirth','Change'],
    flavor: 'The game of life and Death is played out before the curtain of mystery. Renewal takes many forms; both the siren call of the immortal undead and the transforming power of Awakening emerge from the spirit\'s unquenchable restless sea.',
    association: 'Awakening',
    factions: ['Traditions','Disparates'], traditions: [], essence: 'Primordial',
    nature: ['Survivor','Visionary','Fatalist'], concepts: ['Reborn','Initiate','Survivor of Loss'], spheres: ['entropy','life','spirit'] },

  { id: 'temperance', name: 'Temperance', number: 14, arcana: 'major', file: '14-temperance.png',
    meaning: 'Adaptation',
    upright: ['Integration','Synergy','Balance of paradoxes','Union','Experience','Resolution of conflicts','Symmetry','Combinations','Alchemy','Tempering','Dream','Vision','Actualization','Adaptation','Coordination','Self-control'],
    flavor: 'He rests at the balance point between the peaks of wisdom and understanding, at the end or the beginning of the path. Saulot has transcended all conflicting emotions, integrating the unseen and the seen.',
    association: 'Technocracy',
    factions: ['Technocracy'], traditions: [], essence: 'Pattern',
    nature: ['Architect','Pedagogue','Caregiver','Director'], concepts: ['Alchemist','Synthesizer','Diplomat'], spheres: ['time','prime'] },

  { id: 'devil', name: 'The Devil', number: 15, arcana: 'major', file: '15-devil.png',
    meaning: 'Bondage',
    upright: ['Materialism','Fetters','Sensation','Bedevilment','Temptation','Degradation','Domination','Mirth','Hedonism','Centeredness','Sensuality','Sexuality','Resonance','Potency'],
    flavor: 'Those who serve the spirit of corruption and those who battle its pervasive influence are equally trapped within its destructive coils. To penetrate its illusionary domination over the sensate world is the first step towards freedom from its grasp.',
    association: 'Nephandi',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Deviant','Monster','Sadist','Conniver'], concepts: ['Tempter','Fallen','Hedonist','Cultist'], spheres: ['mind','entropy'] },

  { id: 'tower', name: 'The Tower', number: 16, arcana: 'major', file: '16-tower.png',
    meaning: 'Purification',
    upright: ['Ambition','Restoration','Renovation','Change','Restructuring','Awakening','Healing','Expansion','Authenticity','Building','Designing','Alignment'],
    flavor: 'No Tower built upon false foundations can withstand the raw energy of purification. Cast into the dimensions of uncertainty, those who dwelt in ignorance must face a new beginning.',
    association: 'Chantry',
    factions: ['Traditions'], traditions: [], essence: 'Dynamic',
    nature: ['Rebel','Survivor','Visionary'], concepts: ['Revolutionary','Refugee','Iconoclast'], spheres: ['forces','prime'] },

  { id: 'star', name: 'The Star', number: 17, arcana: 'major', file: '17-star.png',
    meaning: 'Inspiration',
    upright: ['Confidence','Self-esteem','Talent','Guidance','Expression','Innovation','Creativity','Radiance','Manifestation','Charisma','Magnetism','Instinct','Accomplishment','Internal balance','Spontaneity','Vitality','Nature','Hope','Insight','Meaning'],
    flavor: 'Surrounded by radiant Umbral energy, the eternal maiden pours forth the waters of inspiration into the pool of consciousness. The meditative phoenix rises from manifestation toward enlightenment.',
    association: 'Meditation',
    factions: ['Traditions'], traditions: ['Cult of Ecstasy','Dreamspeakers','Verbena'], essence: 'Questing',
    nature: ['Visionary','Bon Vivant','Gallant'], concepts: ['Artist','Inspiration','Beacon'], spheres: ['prime','spirit'] },

  { id: 'luna', name: 'Luna', number: 18, arcana: 'major', file: '18-luna.png',
    meaning: 'Intuition',
    upright: ['Femininity','Receptivity','Reflection','Mystery','Enigmas','Romance','Lunacy','Revelation of the true nature'],
    flavor: 'She surrenders completely to the lure of the unconscious. Is she drowning in the blood of her inner beasts, or rising, renewed by her plunge into the depths of imaginative vision?',
    association: 'Quiet',
    factions: ['Marauders'], traditions: ['Dreamspeakers'], essence: 'Primordial',
    nature: ['Visionary','Loner','Deviant'], concepts: ['Dreamer','Lunatic','Seer'], spheres: ['mind','spirit'] },

  { id: 'sun', name: 'The Sun', number: 19, arcana: 'major', file: '19-sun.png',
    meaning: 'Liberation',
    upright: ['Collaboration','Teamwork','Partnership','Cooperation','Unlimited energy','Life-force','Generation','Motivation','Stimulation','Exuberance','Organization','Shared visions','Exploration','Revitalization','Creation','Innovation','Attainment','Success','Achievement'],
    flavor: 'Glorying in his newfound awareness, the enlightened spirit has no further need for the outworn symbols of tradition. Like the sunflowers, the naked child stands fearless and joyful in the garden of eternal light.',
    association: 'Ascension',
    factions: ['Traditions','Disparates'], traditions: [], essence: 'Dynamic',
    nature: ['Bon Vivant','Caregiver','Visionary','Child'], concepts: ['Ascendant','Joybringer','Awakened'], spheres: ['prime','life','forces'] },

  { id: 'judgement', name: 'Judgement', number: 20, arcana: 'major', file: '20-judgement.png',
    meaning: 'Reunion',
    upright: ['Awakening','Consciousness','Discernment','Judgment','Perception','Insight','Assessment','Integration','Manifestation'],
    flavor: 'Liberated from their separate misunderstandings, the children of Gaia unite and transform. Called forth to a new Awakening, they ascend into mystery, becoming one with the universal consciousness.',
    association: 'Avatar',
    factions: ['Traditions','Disparates'], traditions: [], essence: 'Questing',
    nature: ['Visionary','Survivor','Judge'], concepts: ['Awakened Soul','Avatar','Apocalypse-Witness'], spheres: ['spirit','time'] },

  { id: 'gaia', name: 'Gaia', number: 21, arcana: 'major', file: '21-gaia.png',
    meaning: 'Fulfillment',
    upright: ['Reward','Freedom','Wholeness','Totality','Holism','Completion','Integration','Unification','Awareness','Vision','Environment'],
    flavor: 'The vision has become the reality. Centered within the circle of all that is, the cosmic dance both creates and defines itself. Gaia is never-ending, always-changing, the mirror of self-aware consciousness.',
    association: 'The Tellurian',
    factions: ['Traditions'], traditions: ['Verbena','Dreamspeakers'], essence: 'Pattern',
    nature: ['Caretaker','Visionary','Architect'], concepts: ['Earth-Walker','Master','Whole-Self'], spheres: ['spirit','life'] },

  // ══════════════════════════════════════════════════════════════════════
  // SUIT OF QUESTING (Wands / Fire / Traditions, Questing Essence)
  // ══════════════════════════════════════════════════════════════════════
  { id: 'questing-01', name: 'Ace of Questing', number: 1, arcana: 'minor', suit: 'questing', file: 'questing-01-ace.png',
    meaning: 'Birth',
    upright: ['Creativity','Self-realization','Questing','Truth','Uncontainable life-force','Awakening','Being'],
    flavor: 'All things spring forth from the fires of imagination. The union of the Spheres, the oneness of creation, the perpetual dance of opposing forces, all echo from the flames of the Questing spirit.',
    association: 'Ahl-i-Batin',
    factions: ['Traditions','Disparates'], traditions: ['Ahl-i-Batin'], essence: 'Questing',
    nature: ['Visionary','Child'], concepts: ['Initiate','Seeker'], spheres: [] },

  { id: 'questing-02', name: 'Two of Questing', number: 2, arcana: 'minor', suit: 'questing', file: 'questing-02.png',
    meaning: 'Dominance',
    upright: ['Rulership','Enterprise','Sovereignty','Power','Unification'],
    flavor: 'Within her grasp lies a city of light and harmony. The power to upset or maintain the balance resides in the twin centers of will and heart.',
    association: 'Sphere of Forces; Order of Hermes',
    factions: ['Traditions'], traditions: ['Order of Hermes'], essence: 'Questing',
    nature: ['Autocrat','Director'], concepts: ['Sovereign','Hermetic'], spheres: ['forces'] },

  { id: 'questing-03', name: 'Three of Questing', number: 3, arcana: 'minor', suit: 'questing', file: 'questing-03.png',
    meaning: 'Virtue',
    upright: ['Cooperation','Partnership','Integrity','Consistency','Congruency'],
    flavor: 'With his blessing, the ships of his people set out across the unknown sea. He stands between the twin poles of life and death, holding aloft the rod of the Questing spirit.',
    association: 'Sphere of Prime; Celestial Chorus',
    factions: ['Traditions'], traditions: ['Celestial Chorus'], essence: 'Questing',
    nature: ['Caregiver','Traditionalist','Director'], concepts: ['Cantor','Faithful'], spheres: ['prime'] },

  { id: 'questing-04', name: 'Four of Questing', number: 4, arcana: 'minor', suit: 'questing', file: 'questing-04.png',
    meaning: 'Celebration',
    upright: ['Completion','Peace','Triumph','Happiness','Festival','Achievement','New beginnings','Wholeness','Initiation'],
    flavor: 'The flames of ecstasy rise high into the air. The joining of animal and human natures in a paean to spiritual perfection crosses all boundaries of Time and space, Awakening the sleeping world.',
    association: 'Sphere of Time; Cult of Ecstasy',
    factions: ['Traditions'], traditions: ['Cult of Ecstasy'], essence: 'Questing',
    nature: ['Bon Vivant','Gallant'], concepts: ['Ecstatic','Reveler'], spheres: ['time'] },

  { id: 'questing-05', name: 'Five of Questing', number: 5, arcana: 'minor', suit: 'questing', file: 'questing-05.png',
    meaning: 'Strife',
    upright: ['Competition','Obstacles','Anxiety','Frustration','Freneticism','Hyperactivity'],
    flavor: 'A common goal does not preclude a conflict of wills. The beams of light illumine only what is in their path. Getting back to the right direction is essential for fruitful achievement.',
    association: 'Sphere of Correspondence; Virtual Adepts',
    factions: ['Traditions'], traditions: ['Virtual Adepts'], essence: 'Questing',
    nature: ['Rebel','Conniver','Bravo'], concepts: ['Hacker','Competitor'], spheres: ['correspondence'] },

  { id: 'questing-06', name: 'Six of Questing', number: 6, arcana: 'minor', suit: 'questing', file: 'questing-06.png',
    meaning: 'Victory',
    upright: ['Success','Advancement','Revitalization','Energy','Expansion'],
    flavor: 'He sits astride a metal steed, surrounded by those who would hail his dark victory. The candles of his acolytes light the warrior\'s path through the darkness of ignorance and superstition.',
    association: 'Sphere of Life; Verbena',
    factions: ['Traditions'], traditions: ['Verbena'], essence: 'Questing',
    nature: ['Director','Survivor','Bravo'], concepts: ['Champion','Warlord'], spheres: ['life'] },

  { id: 'questing-07', name: 'Seven of Questing', number: 7, arcana: 'minor', suit: 'questing', file: 'questing-07.png',
    meaning: 'Valor',
    upright: ['Development','Purpose','Courage','Energy','Perfection','Vision','Value'],
    flavor: 'To conquer one\'s self is to win the greatest battle. Fall Breeze contemplates her struggle for perfection of mind, body and spirit, both fragile and deadly.',
    association: 'Sphere of Mind; Akashic Brotherhood',
    factions: ['Traditions'], traditions: ['Akashic Brotherhood'], essence: 'Questing',
    nature: ['Judge','Survivor','Pedagogue'], concepts: ['Martial Artist','Ascetic'], spheres: ['mind'] },

  { id: 'questing-08', name: 'Eight of Questing', number: 8, arcana: 'minor', suit: 'questing', file: 'questing-08.png',
    meaning: 'Motion',
    upright: ['Journey','Ideas','Actions','Swiftness','Progress','Communication','Transformation','Problem-solving'],
    flavor: 'The secrets of the material world, of Matter in motion, fall to his Questing spirit. He takes flight, fueled by the energy released by the death of the old and the birth of the new.',
    association: 'Sphere of Matter; Sons of Ether',
    factions: ['Traditions'], traditions: ['Sons of Ether'], essence: 'Questing',
    nature: ['Visionary','Director'], concepts: ['Inventor','Pioneer'], spheres: ['matter'] },

  { id: 'questing-09', name: 'Nine of Questing', number: 9, arcana: 'minor', suit: 'questing', file: 'questing-09.png',
    meaning: 'Spirit',
    upright: ['Preparedness','Defense','Attainment','Vision','Spiritual and intuitive strength','Unlimited strength','Fortitude'],
    flavor: 'The vigil of the Spirit warrior is eternal. The guardian waits beyond the barricade erected by those who would conquer the natural and mystic worlds, ready to offer his vision of peace.',
    association: 'Sphere of Spirit; Dreamspeakers',
    factions: ['Traditions'], traditions: ['Dreamspeakers'], essence: 'Questing',
    nature: ['Survivor','Loner','Pedagogue'], concepts: ['Sentinel','Shaman'], spheres: ['spirit'] },

  { id: 'questing-10', name: 'Ten of Questing', number: 10, arcana: 'minor', suit: 'questing', file: 'questing-10.png',
    meaning: 'Oppression',
    upright: ['Burden','Trial','Ruin','Disruption','Failure','Limitations','Restrictions','Holding Back'],
    flavor: 'Suspended by the chains of ignorance, silenced by the cruel mask of disbelief, he bears the weight of his captivity. Without the will to break free, the Questing spirit withers in its own Entropic prison.',
    association: 'Sphere of Entropy; Euthanatos',
    factions: ['Traditions'], traditions: ['Euthanatos'], essence: 'Questing',
    nature: ['Martyr','Penitent','Fatalist'], concepts: ['Prisoner','Thanatoic'], spheres: ['entropy'] },

  { id: 'questing-page', name: 'Page of Questing', number: 11, arcana: 'minor', suit: 'questing', file: 'questing-page.png',
    meaning: 'Brilliance',
    upright: ['Learning','Courage','Beauty','Self-liberation','Release of fear','Spontaneous expression','Freedom','New directions','Adventure','Spring','Nothing to fear'],
    flavor: 'The Apprentice stands upon the threshold of a new awareness. Within her stirs the call to adventure; before her and behind her, strange horizons beckon.',
    association: 'Discovery',
    factions: ['Traditions'], traditions: [], essence: 'Questing',
    nature: ['Child','Visionary','Bon Vivant'], concepts: ['Apprentice','Adventurer'], spheres: [] },

  { id: 'questing-knight', name: 'Knight of Questing', number: 12, arcana: 'minor', suit: 'questing', file: 'questing-knight.png',
    meaning: 'Conflict',
    upright: ['Haste','Inspired creativity','Expression','Concentration','Expansion'],
    flavor: 'Driven by the Questing spirit, John Courage departs upon a journey of self-discovery and inner conflict. His only consistency is the quest itself.',
    association: 'Impetuousness',
    factions: ['Traditions'], traditions: [], essence: 'Questing',
    nature: ['Bravo','Rebel','Visionary'], concepts: ['Disciple','Wanderer','Knight Errant'], spheres: [] },

  { id: 'questing-queen', name: 'Queen of Questing', number: 14, arcana: 'minor', suit: 'questing', file: 'questing-queen.png',
    meaning: 'Control',
    upright: ['Command','Attraction','Honor','Self-knowledge','Transformation','Self-reclamation','Fluidity','Growth','Quick temper'],
    flavor: 'She rules. Transcendent reality emerges from the fires of her imagination. Just as the sunflower must follow the sun, so must others follow her.',
    association: 'Aspiration',
    factions: ['Traditions'], traditions: [], essence: 'Questing',
    nature: ['Autocrat','Director','Bon Vivant'], concepts: ['Adept','Queen','Visionary Leader'], spheres: [] },

  { id: 'questing-king', name: 'King of Questing', number: 13, arcana: 'minor', suit: 'questing', file: 'questing-king.png',
    meaning: 'Authority',
    upright: ['Leadership','Fatherhood','Inspired direction','Vision','Intuition','Evolution','Spiritual growth','Energy','Arrogance'],
    flavor: 'Herein lies the culmination of the quest. Porthos rests secure, conscious that all he sees is under his dominion, awaiting only the fires of inspiration for the ultimate Awakening.',
    association: 'Purpose',
    factions: ['Traditions'], traditions: ['Order of Hermes'], essence: 'Questing',
    nature: ['Autocrat','Pedagogue','Director','Traditionalist'], concepts: ['Master','Chantry Head','Magus'], spheres: [] },

  // ══════════════════════════════════════════════════════════════════════
  // SUIT OF PRIMORDIALISM (Cups / Water / Nephandi, Primordial Essence)
  // ══════════════════════════════════════════════════════════════════════
  { id: 'primordialism-01', name: 'Ace of Primordialism', number: 1, arcana: 'minor', suit: 'primordialism', file: 'primordialism-01-ace.png',
    meaning: 'Breakthrough',
    upright: ['Life-force','Open heart','Trusting heart','Spiritual heart','Expression'],
    flavor: 'Thrust forth from the Primordial ooze, the hand of creation and destruction grasps the vessel of the mind. The fertile spawning pool awaits the birth of self-awareness.',
    association: 'Feeling',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Visionary','Child','Bon Vivant'], concepts: ['Initiate','Heart-Awake'], spheres: ['life'] },

  { id: 'primordialism-02', name: 'Two of Primordialism', number: 2, arcana: 'minor', suit: 'primordialism', file: 'primordialism-02.png',
    meaning: 'Reflection',
    upright: ['Carnality','Passion','Love','Union','Partnership'],
    flavor: 'Alone before the mirror of her instincts, she confronts the depths of her desires. Her passions flow in two directions, merging inner lusts and outer ambitions.',
    association: 'Symbiosis',
    factions: ['Nephandi','Traditions'], traditions: ['Cult of Ecstasy'], essence: 'Primordial',
    nature: ['Bon Vivant','Gallant','Deviant'], concepts: ['Lover','Twin-Soul'], spheres: ['mind'] },

  { id: 'primordialism-03', name: 'Three of Primordialism', number: 3, arcana: 'minor', suit: 'primordialism', file: 'primordialism-03.png',
    meaning: 'License',
    upright: ['Pleasure','Overindulgence','Abundance','Liberality'],
    flavor: 'Unhampered by the dictates of convention, three weird sisters revel in their wanton sensuality. The nurturing fluid of unfulfilled creativity festers within the broken shells of self-indulgence.',
    association: 'Carnality',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Deviant','Bon Vivant','Bravo'], concepts: ['Hedonist','Reveler'], spheres: ['life'] },

  { id: 'primordialism-04', name: 'Four of Primordialism', number: 4, arcana: 'minor', suit: 'primordialism', file: 'primordialism-04.png',
    meaning: 'Dissipation',
    upright: ['Contemplation','Emotional luxury','Satisfaction','Apathy','Novelty','Wonder'],
    flavor: 'The pleasures of the world remind him only of his own mortality. The sated wastrel shuns the proffered cup of secret knowledge, immune to the headiness of its bestial temptations.',
    association: 'Ennui',
    factions: ['Nephandi','Disparates'], traditions: [], essence: 'Primordial',
    nature: ['Curmudgeon','Loner','Fatalist'], concepts: ['Burnout','Jaded Sensualist'], spheres: ['entropy'] },

  { id: 'primordialism-05', name: 'Five of Primordialism', number: 5, arcana: 'minor', suit: 'primordialism', file: 'primordialism-05.png',
    meaning: 'Disillusionment',
    upright: ['Disappointment','Sorrow','Loss','Fragility','Depression','Hope','Return','Inheritance'],
    flavor: 'Bitter with experience gone to waste, the Primordial spirit gazes in despair upon the gutted ruins of expectation. Having tasted loss, the prospect of unsampled pleasures holds no temptation.',
    association: 'Vulnerability',
    factions: ['Nephandi','Disparates'], traditions: ['Hollow Ones'], essence: 'Primordial',
    nature: ['Penitent','Martyr','Loner'], concepts: ['Mourner','Disillusioned'], spheres: ['entropy'] },

  { id: 'primordialism-06', name: 'Six of Primordialism', number: 6, arcana: 'minor', suit: 'primordialism', file: 'primordialism-06.png',
    meaning: 'Initiation',
    upright: ['Pleasure','Regeneration','Revitalization','Memory','Ecstasy'],
    flavor: 'Ripped from his unthinking, Primordial past and thrust into the heart of an alien existence, Jubuka offers sacrifices for his initiation into a world of new opportunities.',
    association: 'Opportunity',
    factions: ['Nephandi','Traditions'], traditions: [], essence: 'Primordial',
    nature: ['Survivor','Visionary','Penitent'], concepts: ['Convert','Reborn'], spheres: ['spirit'] },

  { id: 'primordialism-07', name: 'Seven of Primordialism', number: 7, arcana: 'minor', suit: 'primordialism', file: 'primordialism-07.png',
    meaning: 'Temptation',
    upright: ['Selfishness','Illusion','Debauchery','Addiction','Promiscuity'],
    flavor: 'Overwhelmed by illusionary possibilities, unable to choose between desires, temptation\'s victim loses his sense of self. Like a black hole, the dreamer exists only in the definition of his dreams.',
    association: 'Indulgence',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Deviant','Conniver','Fanatic'], concepts: ['Tempted','Addict','Faustian Bargainer'], spheres: ['mind'] },

  { id: 'primordialism-08', name: 'Eight of Primordialism', number: 8, arcana: 'minor', suit: 'primordialism', file: 'primordialism-08.png',
    meaning: 'Abandonment',
    upright: ['Rejection','Misery','Indolence','Inertia','Limits','Depletion','Exhaustion','Aimlessness','Retreat','Joy','Merriment','Acceptance'],
    flavor: 'Past achievements have lost their meaning, but abandonment brings with it a sense of liberation. The Primordial spirit sets forth upon an uncharted course, following the jagged road that leads to the unknown.',
    association: 'Stagnation',
    factions: ['Nephandi','Disparates','Orphans'], traditions: [], essence: 'Primordial',
    nature: ['Loner','Fatalist','Curmudgeon'], concepts: ['Outcast','Wanderer'], spheres: ['entropy'] },

  { id: 'primordialism-09', name: 'Nine of Primordialism', number: 9, arcana: 'minor', suit: 'primordialism', file: 'primordialism-09.png',
    meaning: 'Attainment',
    upright: ['Success','Happiness','Health','Opportunity','Expansion','Fulfillment','Well-being'],
    flavor: 'Devoured by the fulfillment of her wishes, she slumps before the fruits of her attainment. Opportunity is assured, but satisfaction lies elsewhere.',
    association: 'Completion',
    factions: ['Nephandi','Disparates'], traditions: [], essence: 'Primordial',
    nature: ['Bon Vivant','Director'], concepts: ['Sated','Wish-Fulfilled'], spheres: ['life'] },

  { id: 'primordialism-10', name: 'Ten of Primordialism', number: 10, arcana: 'minor', suit: 'primordialism', file: 'primordialism-10.png',
    meaning: 'Satiety',
    upright: ['Emotional Contentment','Vitality','Expressiveness','Energy','Enthusiasm'],
    flavor: 'They dance, oh how they dance! They have plunged themselves into the depths of their desires, surrendering to the serpentine rhythms of the danse macabre.',
    association: 'Satisfaction',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Bon Vivant','Deviant','Fanatic'], concepts: ['Reveler','Cultist'], spheres: ['life','time'] },

  { id: 'primordialism-page', name: 'Page of Primordialism', number: 11, arcana: 'minor', suit: 'primordialism', file: 'primordialism-page.png',
    meaning: 'Rebirth',
    upright: ['Emotional objectivity and detachment','Controlling','Bears messages from dreams'],
    flavor: 'Within the womb of Primordial emotion, a new awareness comes into being. Nurtured by the blood of countless sacrificial offerings, the Caul finds itself transformed into corruption\'s willing servant.',
    association: 'Possession',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Conniver','Conformist','Monster'], concepts: ['Cultist','Possessed'], spheres: ['spirit'] },

  { id: 'primordialism-knight', name: 'Knight of Primordialism', number: 12, arcana: 'minor', suit: 'primordialism', file: 'primordialism-knight.png',
    meaning: 'Emotion',
    upright: ['Desire','Tantric practices','Passion','Bliss'],
    flavor: 'The Beast rides upon the waves of its own emotions, submerging all thoughts of its distant humanity in the roiling seas of Primordial subconsciousness.',
    association: 'Bestiality',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Deviant','Monster','Bravo'], concepts: ['Beast','Tantric Adept'], spheres: ['life'] },

  { id: 'primordialism-queen', name: 'Queen of Primordialism', number: 14, arcana: 'minor', suit: 'primordialism', file: 'primordialism-queen.png',
    meaning: 'Imagination',
    upright: ['Emotional integrity','Self-reflection','Unconscious','New form','New identity','New life','Expressing oneself without blame or judgment'],
    flavor: 'Jodi Blake, imagination\'s queen, salutes the riot of her cacophonous visions. Her perversity is the key to her freedom from all limitations.',
    association: 'Perversity',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Deviant','Visionary','Bon Vivant'], concepts: ['Artist','Free Spirit','Queen of Pain'], spheres: ['mind'] },

  { id: 'primordialism-king', name: 'King of Primordialism', number: 13, arcana: 'minor', suit: 'primordialism', file: 'primordialism-king.png',
    meaning: 'Power',
    upright: ['Emotional loyalty and commitment','Spontaneity','Ego','Generosity','Responsibility'],
    flavor: 'From his throne room deep beneath the seas, Galarius watches the ripples of his power roil throughout his watery domain. For him, the sea of the subconscious is the font of all creation and destruction.',
    association: 'Vanity',
    factions: ['Nephandi'], traditions: [], essence: 'Primordial',
    nature: ['Autocrat','Monster','Director'], concepts: ['Dark Lord','Cult Master'], spheres: ['mind','spirit'] },

  // ══════════════════════════════════════════════════════════════════════
  // SUIT OF DYNAMISM (Swords / Air / Marauders, Dynamic Essence)
  // ══════════════════════════════════════════════════════════════════════
  { id: 'dynamism-01', name: 'Ace of Dynamism', number: 1, arcana: 'minor', suit: 'dynamism', file: 'dynamism-01-ace.png',
    meaning: 'Knowledge',
    upright: ['Conquest','Victory','Clarity','Inventiveness','Originality'],
    flavor: 'Emerging from the storm-filled skies, the taloned hand of chaos and instability grasps the sword of activation. The keen-edged symbol of the power of change severs the veil that hides the secrets of the world.',
    association: 'Innovation',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Visionary','Rebel','Trickster'], concepts: ['Innovator','Revealer'], spheres: ['mind'] },

  { id: 'dynamism-02', name: 'Two of Dynamism', number: 2, arcana: 'minor', suit: 'dynamism', file: 'dynamism-02.png',
    meaning: 'Precariousness',
    upright: ['Treachery','Blindness','Decision','Peace','Integrative mind'],
    flavor: 'Poised precariously upon the shaky structure of a divided consciousness, Miss Zhao has chosen the path of inner sight. She holds aloft the twin swords of creation and destruction.',
    association: 'Resolution',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Visionary','Loner','Fatalist'], concepts: ['Blind Seer','Balancer'], spheres: ['mind'] },

  { id: 'dynamism-03', name: 'Three of Dynamism', number: 3, arcana: 'minor', suit: 'dynamism', file: 'dynamism-03.png',
    meaning: 'Sorrow',
    upright: ['Upheaval','Negativity','Triangles','Limited view','Focusing on the past','Jealousy'],
    flavor: 'Severed from all save the anchoring rope of Dynamic flux, the abused consciousness suffers the threefold agonies of its loss of connection to spirit, mind and body.',
    association: 'Separation',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Penitent','Martyr','Loner'], concepts: ['Estranged','Heartbroken'], spheres: ['entropy'] },

  { id: 'dynamism-04', name: 'Four of Dynamism', number: 4, arcana: 'minor', suit: 'dynamism', file: 'dynamism-04.png',
    meaning: 'Reality',
    upright: ['Convalescence','Quiet','Conflict resolution','Truce','Rest','Solitude','Repose','Economy','Precaution'],
    flavor: 'Doomed to an existence in which he perpetually defends the constructs of imagination\'s realms, the self-appointed counselor of the damned seeks his repose after strife.',
    association: 'Repose',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Loner','Pedagogue','Caregiver'], concepts: ['Counselor','Hermit'], spheres: ['time'] },

  { id: 'dynamism-05', name: 'Five of Dynamism', number: 5, arcana: 'minor', suit: 'dynamism', file: 'dynamism-05.png',
    meaning: 'Defeat',
    upright: ['Degradation','Unfairness','Constriction','Fear','Distortion','Empty victory','Conquest','Threat','Menace'],
    flavor: 'Her victory is a hollow one, gained without honor. Smiling in malice, she surveys the tokens of her conquest, taking no thought for consequences.',
    association: 'Dishonor',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Bravo','Deviant','Monster'], concepts: ['Bully','Pyrrhic Victor'], spheres: ['forces'] },

  { id: 'dynamism-06', name: 'Six of Dynamism', number: 6, arcana: 'minor', suit: 'dynamism', file: 'dynamism-06.png',
    meaning: 'Passage',
    upright: ['Journey','Travel','Rationality','Objectivity','Consideration of the whole'],
    flavor: 'Steering a path between the choppy waves of activity and the calm waters of contemplation, Stephen of Warwick sets forth upon a journey of deliverance.',
    association: 'Synthesis',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Caregiver','Visionary','Pedagogue'], concepts: ['Refugee Shepherd','Ferryman'], spheres: ['correspondence'] },

  { id: 'dynamism-07', name: 'Seven of Dynamism', number: 7, arcana: 'minor', suit: 'dynamism', file: 'dynamism-07.png',
    meaning: 'Instability',
    upright: ['Futility','Unreliability','Helplessness','Hopelessness','Sabotage','Negativity','Lies','Counsel','Instruction'],
    flavor: 'She walks the tightrope of Dynamic change, uncertain of either starting point or destination. To cease her forward motion is to plummet into futility.',
    association: 'Betrayal',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Conniver','Trickster','Survivor'], concepts: ['Thief','Liar','Tightrope Walker'], spheres: ['mind'] },

  { id: 'dynamism-08', name: 'Eight of Dynamism', number: 8, arcana: 'minor', suit: 'dynamism', file: 'dynamism-08.png',
    meaning: 'Crisis',
    upright: ['Indecision','Restriction','Censure','Doubt','Mistrust','Over-analytical mind','Confusion','Interference'],
    flavor: 'Surrounded by the weapons of violent change, captured in the twisted bonds of convoluted thought, she has become the victim of her own demented Inquisition.',
    association: 'Captivity',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Penitent','Loner','Conformist'], concepts: ['Prisoner of Doubt','Self-Trapped'], spheres: ['mind'] },

  { id: 'dynamism-09', name: 'Nine of Dynamism', number: 9, arcana: 'minor', suit: 'dynamism', file: 'dynamism-09.png',
    meaning: 'Despair',
    upright: ['Misery','Desolation','Disaster','Self-criticism','Mental cruelty','Suspicion','Doubt','Shame'],
    flavor: 'Nightmares of disaster haunt her sleep. Awakening, she faces only further intimations of her desolate existence. The way of the Marauder leads as easily to despair as to enlightenment.',
    association: 'Suffering',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Penitent','Masochist','Martyr'], concepts: ['Haunted','Insomniac'], spheres: ['mind','entropy'] },

  { id: 'dynamism-10', name: 'Ten of Dynamism', number: 10, arcana: 'minor', suit: 'dynamism', file: 'dynamism-10.png',
    meaning: 'Ruin',
    upright: ['Pain','Fear of ruin','Mental despair','Paradox','Advantage','Profit','Impermanence','Delusion'],
    flavor: 'The ruined carcass of delusion, pierced by the destructive instruments of change, surrenders to desolation. Paradoxically, the end of one reality betokens the beginning of another.',
    association: 'Failure',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Fatalist','Penitent','Survivor'], concepts: ['Paradox-Touched','Ruin'], spheres: ['entropy'] },

  { id: 'dynamism-page', name: 'Page of Dynamism', number: 11, arcana: 'minor', suit: 'dynamism', file: 'dynamism-page.png',
    meaning: 'Aggression',
    upright: ['Activation','Ferociousness','Practical tangible thinking','Acting upon ideas'],
    flavor: 'He stands as a buffer between the world of the mind and the concrete structures of external reality. Ready to do battle, he is imagination\'s sentinel.',
    association: 'Battle',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Bravo','Fanatic','Rebel'], concepts: ['Gibberer','Vanguard','Brawler'], spheres: ['forces'] },

  { id: 'dynamism-knight', name: 'Knight of Dynamism', number: 12, arcana: 'minor', suit: 'dynamism', file: 'dynamism-knight.png',
    meaning: 'Impulsiveness',
    upright: ['Courage','Intuitive thinking','Unrestricted mind'],
    flavor: 'Descending from the cloud-filled sky, the Dragon of Dynamism visits destruction upon the pitiful fruits of prideful creation, bathing the mundane world in the flames of its purifying spirit.',
    association: 'Wrath',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Bravo','Fanatic','Deviant'], concepts: ['Dragon','Wild Magus','Storm-Caller'], spheres: ['forces'] },

  { id: 'dynamism-queen', name: 'Queen of Dynamism', number: 14, arcana: 'minor', suit: 'dynamism', file: 'dynamism-queen.png',
    meaning: 'Perception',
    upright: ['Confidence','Rational','Objective','Consulting intelligence'],
    flavor: 'The visions of her bloody past merge with her perceptions of the future. Made wise through suffering, she observes the world below her through eyes maddened by clarity.',
    association: 'Observation',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Visionary','Curmudgeon','Loner'], concepts: ['Sibyl','Mad Oracle','Tormented Seer'], spheres: ['mind','time'] },

  { id: 'dynamism-king', name: 'King of Dynamism', number: 13, arcana: 'minor', suit: 'dynamism', file: 'dynamism-king.png',
    meaning: 'Judgment',
    upright: ['Counsel','Wisdom','Focus','Intention','Concentration'],
    flavor: 'Sheltered in a world of his own imaginings, Robert Davenport dwells within a happier time. Crowned by the roses of his desires, he contemplates immortality within his own mind.',
    association: 'Determination',
    factions: ['Marauders'], traditions: [], essence: 'Dynamic',
    nature: ['Autocrat','Visionary','Trickster'], concepts: ['Prankster King','Mad Monarch'], spheres: ['mind','time'] },

  // ══════════════════════════════════════════════════════════════════════
  // SUIT OF PATTERN (Pentacles / Earth / Technocracy, Pattern Essence)
  // ══════════════════════════════════════════════════════════════════════
  { id: 'pattern-01', name: 'Ace of Pattern', number: 1, arcana: 'minor', suit: 'pattern', file: 'pattern-01-ace.png',
    meaning: 'Prosperity',
    upright: ['Inheritance','Success','Production','Practical organization'],
    flavor: 'Breaking free from the aimless flux of change without direction, order imposes its Pattern upon the world. Material prosperity becomes the center for a new beginning.',
    association: 'The Syndicate',
    factions: ['Technocracy'], traditions: ['Syndicate'], essence: 'Pattern',
    nature: ['Architect','Director','Conformist'], concepts: ['Financier','Builder'], spheres: ['matter','prime'] },

  { id: 'pattern-02', name: 'Two of Pattern', number: 2, arcana: 'minor', suit: 'pattern', file: 'pattern-02.png',
    meaning: 'Balance',
    upright: ['Change','Harmony','Stability','Adaptability'],
    flavor: 'Without balance, Patterned existence falls prey to inner corrosion. Only constant motion provides the appearance of static harmony.',
    association: 'Speculation',
    factions: ['Technocracy'], traditions: ['Syndicate'], essence: 'Pattern',
    nature: ['Conniver','Director','Survivor'], concepts: ['Speculator','Balancer'], spheres: ['forces','matter'] },

  { id: 'pattern-03', name: 'Three of Pattern', number: 3, arcana: 'minor', suit: 'pattern', file: 'pattern-03.png',
    meaning: 'Effort',
    upright: ['Persistence','Tenacity','Priorities','Commitments','Focus','Intention','Direction'],
    flavor: 'Superimposing a new vision upon the traditions of the past, the artisan of order directs her talents to the mastery of her environment.',
    association: 'Construction',
    factions: ['Technocracy'], traditions: [], essence: 'Pattern',
    nature: ['Architect','Pedagogue','Director'], concepts: ['Artisan','Engineer'], spheres: ['matter'] },

  { id: 'pattern-04', name: 'Four of Pattern', number: 4, arcana: 'minor', suit: 'pattern', file: 'pattern-04.png',
    meaning: 'Inheritance',
    upright: ['Greed','Solidity','Miserliness','Power','Vitality','Forcefulness','Empowerment','Possessiveness'],
    flavor: 'From his perch at the center of his universe, Void Engineer Ambrose Channing seeks to fathom the secrets of the cosmos and unlock the mystery of the physical world.',
    association: 'Direction',
    factions: ['Technocracy'], traditions: ['Void Engineers'], essence: 'Pattern',
    nature: ['Director','Architect','Conformist'], concepts: ['Inheritor','Cosmic Investigator'], spheres: ['correspondence','matter'] },

  { id: 'pattern-05', name: 'Five of Pattern', number: 5, arcana: 'minor', suit: 'pattern', file: 'pattern-05.png',
    meaning: 'Impoverishment',
    upright: ['Destitution','Loss','Loneliness','Worry','Concern','Preoccupation'],
    flavor: 'Impoverished in mind, body and soul, the victim of the chains of spiritless reality stands before the face of pitiless intellect within the dark circle of his own making.',
    association: 'Anxiety',
    factions: ['Technocracy','Orphans'], traditions: ['Hollow Ones'], essence: 'Pattern',
    nature: ['Penitent','Loner','Curmudgeon'], concepts: ['Destitute','Forgotten'], spheres: ['entropy'] },

  { id: 'pattern-06', name: 'Six of Pattern', number: 6, arcana: 'minor', suit: 'pattern', file: 'pattern-06.png',
    meaning: 'Philanthropy',
    upright: ['Charity','Attainment','Accomplishment','Productivity','Tangibility'],
    flavor: 'Seeking to share the benefits of his Technocratic vision, the devotee of Pattern whets the appetite of others with the fruits of his own material success.',
    association: 'Gifts',
    factions: ['Technocracy'], traditions: ['New World Order'], essence: 'Pattern',
    nature: ['Caregiver','Pedagogue','Director'], concepts: ['Philanthropist','Reformer'], spheres: ['life','matter'] },

  { id: 'pattern-07', name: 'Seven of Pattern', number: 7, arcana: 'minor', suit: 'pattern', file: 'pattern-07.png',
    meaning: 'Re-evaluation',
    upright: ['Indecision','Failure','Fear of success','Delay','Impatience','Uncertainty'],
    flavor: 'His work all but complete, momentary indecision leads to the partial loss of precious stores. The fear of success is as costly as the fear of failure.',
    association: 'Stress',
    factions: ['Technocracy'], traditions: [], essence: 'Pattern',
    nature: ['Penitent','Conformist','Loner'], concepts: ['Doubter','Reluctant Engineer'], spheres: ['time'] },

  { id: 'pattern-08', name: 'Eight of Pattern', number: 8, arcana: 'minor', suit: 'pattern', file: 'pattern-08.png',
    meaning: 'Skill',
    upright: ['Artistry','Prudence','Attention to detail','Organization','Centeredness'],
    flavor: 'Centered upon his appointed task, enhanced by the grafting of technological precision to the creative mind, the artisan of Pattern focuses on the precise replication of his orderly designs.',
    association: 'Employment',
    factions: ['Technocracy'], traditions: [], essence: 'Pattern',
    nature: ['Architect','Conformist','Pedagogue'], concepts: ['Artisan','Specialist'], spheres: ['matter','prime'] },

  { id: 'pattern-09', name: 'Nine of Pattern', number: 9, arcana: 'minor', suit: 'pattern', file: 'pattern-09.png',
    meaning: 'Gain',
    upright: ['Prudence','Benefit','Balance','Order','Organization','Unification'],
    flavor: 'She extracts the vital essences from the lushness of her material surroundings. Through prudence and discernment, she has gathered the benefits of a Patterned existence.',
    association: 'Profit',
    factions: ['Technocracy'], traditions: [], essence: 'Pattern',
    nature: ['Director','Architect','Survivor'], concepts: ['Magnate','Discerning Adept'], spheres: ['matter','life'] },

  { id: 'pattern-10', name: 'Ten of Pattern', number: 10, arcana: 'minor', suit: 'pattern', file: 'pattern-10.png',
    meaning: 'Stability',
    upright: ['Riches','Abundance','Prosperity','Enrichment'],
    flavor: 'Raising his glass in a toast to the success of his vision, the autocrat of Pattern sees the culmination of all for which he has so zealously striven. Stability is assured.',
    association: 'Wealth',
    factions: ['Technocracy'], traditions: ['Syndicate'], essence: 'Pattern',
    nature: ['Autocrat','Architect','Conformist'], concepts: ['Patriarch','Magnate'], spheres: ['matter','prime'] },

  { id: 'pattern-page', name: 'Page of Pattern', number: 11, arcana: 'minor', suit: 'pattern', file: 'pattern-page.png',
    meaning: 'Perseverance',
    upright: ['Diligence','Creativity','Mutation','Incubation'],
    flavor: 'Despite the barrenness of her surroundings, Void Engineer Karen Brewster draws sustenance for her belief in the cosmic order from the radiant energy of the stars above her.',
    association: 'Void Engineers',
    factions: ['Technocracy'], traditions: ['Void Engineers'], essence: 'Pattern',
    nature: ['Visionary','Survivor','Architect'], concepts: ['Astronaut','Cosmic Explorer'], spheres: ['correspondence','spirit'] },

  { id: 'pattern-knight', name: 'Knight of Pattern', number: 12, arcana: 'minor', suit: 'pattern', file: 'pattern-knight.png',
    meaning: 'Reliability',
    upright: ['Patience','Methodicity','Physicality','Architect','Reform','Solidity'],
    flavor: 'Within his cybernetic spirit, the reliability of the machine enhances the ingenuity of the man to form a dedicated guardian of Pattern. The Cyberknight rests patiently upon his mechanized steed.',
    association: 'Iteration X',
    factions: ['Technocracy'], traditions: ['Iteration X'], essence: 'Pattern',
    nature: ['Conformist','Architect','Director'], concepts: ['Cyberknight','Enforcer'], spheres: ['matter','forces'] },

  { id: 'pattern-queen', name: 'Queen of Pattern', number: 14, arcana: 'minor', suit: 'pattern', file: 'pattern-queen.png',
    meaning: 'Creativity',
    upright: ['Talent','Fertility','Health','Nurturing','Stability','Fulfillment'],
    flavor: 'Creation is the task at hand. The Progenitor Queen of Pattern manipulates the structure of life itself. Her fertile imagination conceives of possibilities as yet unperceived.',
    association: 'Progenitors',
    factions: ['Technocracy'], traditions: ['Progenitors'], essence: 'Pattern',
    nature: ['Architect','Caregiver','Director'], concepts: ['Bioengineer','Life-Shaper'], spheres: ['life','matter'] },

  { id: 'pattern-king', name: 'King of Pattern', number: 13, arcana: 'minor', suit: 'pattern', file: 'pattern-king.png',
    meaning: 'Industry',
    upright: ['Solidity','Prosperity','Harvest','Abundance','Practicality','Finances','Diagnostician'],
    flavor: 'At rest upon a throne carved from the ruins of the past, Montego Diaz-Quetzalcoatl oversees the progress of the New World Order\'s dominion. Crowned by his technological achievements, his rule is absolute.',
    association: 'New World Order',
    factions: ['Technocracy'], traditions: ['New World Order'], essence: 'Pattern',
    nature: ['Autocrat','Director','Conformist'], concepts: ['Spymaster','Mandarin','Technocrat'], spheres: ['mind','correspondence'] },
];

// ══════════════════════════════════════════════════════════════════════
// FIVE-CARD MAGE SPREAD
// Each position maps to a character-creation aspect. The blend logic
// below weights the card's affinity tags by position to compose suggestions.
// ══════════════════════════════════════════════════════════════════════
// Which traditions and conventions belong to which top-level faction.
// Used by the concept-blend synthesis to avoid pairing, say, Technocracy
// with the Euthanatos in the same paragraph.
M20.FACTION_TRADITIONS = {
  Traditions:  ['Order of Hermes','Verbena','Celestial Chorus','Cult of Ecstasy','Sons of Ether','Virtual Adepts','Akashic Brotherhood','Dreamspeakers','Euthanatos','Hollow Ones','Ahl-i-Batin'],
  Technocracy: ['Syndicate','Iteration X','New World Order','Progenitors','Void Engineers'],
  Disparates:  ['Hollow Ones','Ahl-i-Batin'],
  Orphans:     ['Hollow Ones'],
  Nephandi:    [],
  Marauders:   [],
};

// Factions the "Character Idea" synthesis is allowed to recommend.
// Marauders and Nephandi are antagonist factions in M20 and are normally
// run by the Storyteller rather than played, so they are skipped here.
M20.TAROT_PLAYABLE_FACTIONS = ['Traditions','Technocracy','Disparates'];

// Pre-computed deck-level frequency of each tradition and each faction so
// the synthesis can normalize popular tags. Without this, a tradition that
// appears in five cards would win the tally far more often than a tradition
// that appears in one, no matter what was drawn.
M20.TAROT_TRADITION_COUNTS = (() => {
  const counts = {};
  M20.TAROT.forEach(c => (c.traditions || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  return counts;
})();
M20.TAROT_FACTION_COUNTS = (() => {
  const counts = {};
  M20.TAROT.forEach(c => (c.factions || []).forEach(f => { counts[f] = (counts[f] || 0) + 1; }));
  return counts;
})();

M20.TAROT_SPREAD = [
  { key: 'seeker',    name: 'The Seeker',    blurb: 'Your core archetype, the self that walks the path.',          aspect: 'Nature & Demeanor' },
  { key: 'awakening', name: 'The Awakening', blurb: 'How you came to magick, and what fire shaped your Avatar.', aspect: 'Essence' },
  { key: 'path',      name: 'The Path',      blurb: 'The road you walk, the company you keep.',                  aspect: 'Affiliation & Tradition' },
  { key: 'practice',  name: 'The Practice',  blurb: 'How you work magick, and the Spheres that call to you.',    aspect: 'Practice & Spheres' },
  { key: 'future',    name: 'The Future',    blurb: 'Who you are becoming, the seed of your concept.',           aspect: 'Concept' },
];

// ══════════════════════════════════════════════════════════════════════
// TAROT MODULE
// Modal UI, WAAPI animation, Web Audio cues, concept-blend renderer.
// ══════════════════════════════════════════════════════════════════════
const Tarot = {
  _audioCtx: null,
  _muted: false,
  _drawn: null,    // current 5-card draw, set when modal opens

  // ── Entry point ─────────────────────────────────────────────────────
  open() {
    this._drawn = this._draw();
    this._renderModal();
    this._animateSpread();
  },

  close() {
    document.getElementById('tarot-overlay')?.remove();
  },

  // ── Draw 5 unique cards in random order ─────────────────────────────
  _draw() {
    const pool = [...M20.TAROT];
    const picks = [];
    for (let i = 0; i < M20.TAROT_SPREAD.length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(idx, 1)[0]);
    }
    return picks;
  },

  // ── Build the modal DOM ─────────────────────────────────────────────
  _renderModal() {
    this.close(); // clear any prior modal
    const overlay = document.createElement('div');
    overlay.id = 'tarot-overlay';
    overlay.innerHTML = `
      <div class="tarot-modal" role="dialog" aria-label="Consult the Fates">
        <header class="tarot-header">
          <h2 class="tarot-title">Consult the Fates</h2>
          <p class="tarot-subtitle">A five-card Mage Spread to inspire your character. The cards speak in hints, not commands. Take what serves your story.</p>
          <div class="tarot-header-actions">
            <button class="btn-ghost tarot-redraw" type="button">⟳ Shuffle again</button>
            <button class="btn-ghost tarot-mute" type="button" aria-pressed="${this._muted}">${this._muted ? '🔇 Sound off' : '🔊 Sound on'}</button>
            <button class="btn-ghost tarot-close" type="button" aria-label="Close">✕</button>
          </div>
        </header>
        <div class="tarot-spread-area">
          <div class="tarot-deck" aria-hidden="true">
            ${Array.from({ length: 5 }, () => `<div class="tarot-deck-card"><img src="/tarot/cardback.png" alt=""></div>`).join('')}
          </div>
          <div class="tarot-spread" id="tarot-spread">
            ${this._drawn.map((card, i) => this._renderSlot(card, i)).join('')}
          </div>
        </div>
        <section class="tarot-reading" id="tarot-reading" aria-live="polite"></section>
      </div>
    `;
    document.body.appendChild(overlay);

    // Wire controls
    overlay.querySelector('.tarot-close').addEventListener('click', () => this.close());
    overlay.querySelector('.tarot-redraw').addEventListener('click', () => this.open());
    overlay.querySelector('.tarot-mute').addEventListener('click', e => {
      this._muted = !this._muted;
      const btn = e.currentTarget;
      btn.textContent = this._muted ? '🔇 Sound off' : '🔊 Sound on';
      btn.setAttribute('aria-pressed', this._muted);
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) this.close(); });
    // Pointer-follow tilt on each face card (added once it's revealed)
    overlay.addEventListener('pointermove', e => this._pointerTilt(e));
  },

  _renderSlot(card, idx) {
    const pos = M20.TAROT_SPREAD[idx];
    return `
      <div class="tarot-slot" data-slot="${idx}" data-card="${card.id}">
        <div class="tarot-pos-label"><span class="tarot-pos-name">${pos.name}</span><span class="tarot-pos-aspect">${pos.aspect}</span></div>
        <div class="tarot-card" data-flipped="false">
          <div class="tarot-face tarot-face-back"><img src="/tarot/cardback.png" alt="" draggable="false"></div>
          <div class="tarot-face tarot-face-front">
            <img src="/tarot/${card.file}" alt="${card.name}" draggable="false">
          </div>
        </div>
        <div class="tarot-card-label">
          <strong class="tarot-card-name">${card.name}</strong>
          <span class="tarot-card-meaning">${card.meaning}</span>
        </div>
      </div>
    `;
  },

  // ── WAAPI: shuffle hover → deal to positions → flip stagger ─────────
  _animateSpread() {
    const overlay = document.getElementById('tarot-overlay');
    if (!overlay) return;
    const deck = overlay.querySelectorAll('.tarot-deck-card');
    const slots = overlay.querySelectorAll('.tarot-slot');

    // Hide slot cards until they are dealt
    slots.forEach(slot => slot.classList.add('tarot-slot-hidden'));

    // Phase 1: Shuffle wiggle on the deck stack
    this._playShuffle();
    deck.forEach((c, i) => {
      c.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', offset: 0 },
          { transform: `translate(${(Math.random() - 0.5) * 14}px, ${(Math.random() - 0.5) * 8}px) rotate(${(Math.random() - 0.5) * 14}deg)`, offset: 0.4 },
          { transform: `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 6}px) rotate(${(Math.random() - 0.5) * 8}deg)`, offset: 0.7 },
          { transform: 'translate(0,0) rotate(0deg)', offset: 1 },
        ],
        { duration: 700 + i * 30, easing: 'cubic-bezier(.22,.61,.36,1)' }
      );
    });

    // Phase 2: After the shuffle, deal each slot card from the deck's screen position
    setTimeout(() => {
      const deckRect = overlay.querySelector('.tarot-deck').getBoundingClientRect();
      slots.forEach((slot, i) => {
        const slotRect = slot.getBoundingClientRect();
        const dx = deckRect.left - slotRect.left + (deckRect.width - slotRect.width) / 2;
        const dy = deckRect.top - slotRect.top + (deckRect.height - slotRect.height) / 2;
        slot.classList.remove('tarot-slot-hidden');
        slot.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) rotate(-12deg) scale(0.85)`, opacity: 0, offset: 0 },
            { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) rotate(-6deg) scale(0.95)`, opacity: 0.9, offset: 0.7 },
            { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1, offset: 1 },
          ],
          { duration: 520, easing: 'cubic-bezier(.16,.86,.4,1)', delay: i * 220, fill: 'forwards' }
        );
      });

      // Phase 3: Flip each card face-up, staggered
      slots.forEach((slot, i) => {
        setTimeout(() => {
          this._playFlip();
          const cardEl = slot.querySelector('.tarot-card');
          cardEl.setAttribute('data-flipped', 'true');
          // First flip also begins composing the reading once revealed
          if (i === slots.length - 1) {
            setTimeout(() => this._renderReading(), 650);
          }
        }, slots.length * 220 + 400 + i * 380);
      });
    }, 720);
  },

  // ── Pointer-follow subtle tilt on revealed cards ────────────────────
  _pointerTilt(e) {
    const card = e.target.closest('.tarot-card[data-flipped="true"]');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const rx = (-py * 6).toFixed(2);
    const ry = (px * 8).toFixed(2);
    card.style.setProperty('--tarot-tilt-x', `${rx}deg`);
    card.style.setProperty('--tarot-tilt-y', `${ry}deg`);
  },

  // ── Web Audio cues ──────────────────────────────────────────────────
  _audio() {
    if (this._muted) return null;
    if (!this._audioCtx) {
      try { this._audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    return this._audioCtx;
  },

  _playShuffle() {
    const ctx = this._audio();
    if (!ctx) return;
    // Two short noise bursts through a band-pass to imitate riffled paper
    for (let i = 0; i < 2; i++) {
      const start = ctx.currentTime + i * 0.18;
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let n = 0; n < data.length; n++) data[n] = (Math.random() * 2 - 1) * (1 - n / data.length);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.7;
      const gain = ctx.createGain(); gain.gain.value = 0.12;
      src.connect(bp).connect(gain).connect(ctx.destination);
      src.start(start);
    }
  },

  _playFlip() {
    const ctx = this._audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Quick percussive transient: a short filtered noise click plus a low thump
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let n = 0; n < data.length; n++) data[n] = (Math.random() * 2 - 1) * Math.pow(1 - n / data.length, 2);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.5;
    const gain = ctx.createGain(); gain.gain.value = 0.18;
    src.connect(bp).connect(gain).connect(ctx.destination);
    src.start(t);
    // Low thump
    const osc = ctx.createOscillator(); osc.type = 'sine';
    const og = ctx.createGain();
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.08);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.14, t + 0.005);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(og).connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.12);
  },

  // ── Concept-blend renderer ──────────────────────────────────────────
  // For each spread position, pull the relevant affinity tags off the card
  // and write a short paragraph. Then synthesize a final concept paragraph.
  _renderReading() {
    const overlay = document.getElementById('tarot-overlay');
    if (!overlay) return;
    const out = document.getElementById('tarot-reading');
    if (!out) return;

    const cards = this._drawn;
    const lines = [];

    // Per-position interpretation
    cards.forEach((card, i) => {
      const pos = M20.TAROT_SPREAD[i];
      lines.push(`<div class="tarot-read-line">
        <div class="tarot-read-pos"><strong>${pos.name}</strong> <span class="tarot-read-aspect">${pos.aspect}</span></div>
        <div class="tarot-read-card">${card.name} <span class="tarot-read-meaning">(${card.meaning})</span></div>
        <p class="tarot-read-text">${this._positionalText(card, pos.key)}</p>
      </div>`);
    });

    // Synthesize the final concept paragraph from accumulated tags
    const synth = this._synthesizeConcept(cards);
    lines.push(`<div class="tarot-read-concept">
      <div class="tarot-read-concept-title">A character idea</div>
      <p>${synth}</p>
    </div>`);

    out.innerHTML = lines.join('');
    out.classList.add('tarot-reading-revealed');
  },

  // Per-card, per-position prose. We weight tags by the position's aspect.
  _positionalText(card, posKey) {
    const flavor = card.flavor || '';
    const join = (arr, fallback) => (arr && arr.length ? arr.slice(0, 3).join(', ') : fallback);
    switch (posKey) {
      case 'seeker': {
        const nat = join(card.nature, 'an open soul');
        return `As your Seeker, ${card.name} suggests an archetype shaped by ${card.meaning.toLowerCase()}. Consider a Nature or Demeanor of ${nat}. ${flavor}`;
      }
      case 'awakening': {
        const ess = card.essence || 'Pattern';
        return `Your Awakening burns with the ${ess} Essence. ${card.name} marks the spark: ${flavor}`;
      }
      case 'path': {
        const fact = join(card.factions, 'an unaffiliated soul');
        const trad = card.traditions && card.traditions.length ? ` Within that, the lore of the ${card.traditions[0]} resonates strongly.` : '';
        return `Your Path leans toward ${fact}.${trad} ${card.name} guides the road: ${flavor}`;
      }
      case 'practice': {
        const sph = card.spheres && card.spheres.length ? card.spheres.map(s => s[0].toUpperCase() + s.slice(1)).join(', ') : null;
        const sphereLine = sph ? `The Spheres of ${sph} pull at your magick.` : 'Your magick flows through whichever Spheres your story most needs.';
        return `${sphereLine} ${card.name} hints at the form: ${flavor}`;
      }
      case 'future': {
        const con = join(card.concepts, 'a soul still becoming');
        return `Your Future shapes into ${con}. ${card.name} promises ${card.meaning.toLowerCase()}: ${flavor}`;
      }
      default:
        return flavor;
    }
  },

  // Final blended paragraph. Tally tags weighted by position importance.
  _synthesizeConcept(cards) {
    // Position weights: Seeker, Awakening, Path, Practice, Future
    const w = [1.5, 1.0, 1.3, 1.0, 1.2];
    const tallies = { factions: {}, traditions: {}, essence: {}, nature: {}, concepts: {}, spheres: {} };
    const bump = (bucket, key, weight) => {
      if (!key) return;
      tallies[bucket][key] = (tallies[bucket][key] || 0) + weight;
    };
    cards.forEach((c, i) => {
      (c.factions || []).forEach(f => bump('factions', f, w[i]));
      (c.traditions || []).forEach(t => bump('traditions', t, w[i]));
      bump('essence', c.essence, w[i]);
      (c.nature || []).forEach(n => bump('nature', n, w[i] * 0.7));
      (c.concepts || []).forEach(co => bump('concepts', co, w[i] * 0.7));
      (c.spheres || []).forEach(s => bump('spheres', s, w[i]));
    });
    const top = (bucket, n = 1) =>
      Object.entries(tallies[bucket]).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]);
    // Restrict factions to those a player would actually pick. Marauders
    // and Nephandi are antagonists in M20, so even if their tags win the
    // raw tally we route around them and fall back to the next playable
    // pick, or to an unaffiliated reading if none of the cards offered one.
    const playable = M20.TAROT_PLAYABLE_FACTIONS || ['Traditions','Technocracy','Disparates'];
    const rankedFacts = Object.entries(tallies.factions)
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0])
      .filter(f => playable.includes(f));
    const fact = rankedFacts[0] || 'an unaffiliated soul';
    // Normalize tradition tallies by how often each tradition appears in
    // the deck so a tag that shows up on five cards does not automatically
    // outrank a tag that shows up on one. Then filter to only traditions
    // that belong to the chosen faction so the synthesis cannot pair, for
    // example, Technocracy with the Euthanatos. If none of the drawn cards
    // offered a tradition compatible with the winning faction, leave the
    // tradition line off entirely.
    const validTrads = M20.FACTION_TRADITIONS[fact] || [];
    const tradCounts = M20.TAROT_TRADITION_COUNTS || {};
    const rankedTrads = Object.entries(tallies.traditions)
      .map(([t, score]) => [t, score / Math.max(1, tradCounts[t] || 1)])
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0])
      .filter(t => validTrads.includes(t));
    const trad = rankedTrads[0];
    const ess  = top('essence')[0]    || 'Pattern';
    const nat  = top('nature', 2);
    const con  = top('concepts', 2);
    const sph  = top('spheres', 2);

    const natFrag = nat.length ? nat.join(' / ') : 'an open temperament';
    const conFrag = con.length ? con.join(' or ') : 'a still-unwritten role';
    const sphFrag = sph.length ? ` The Spheres of ${sph.map(s => s[0].toUpperCase() + s.slice(1)).join(' and ')} call most strongly.` : '';
    const tradFrag = trad ? ` Within the ${fact}, the road of the ${trad} fits the cards best.` : '';

    return `Pulling these five cards together, the deck suggests a ${ess}-Essence mage tied to ${fact}.${tradFrag} The Seeker reads as ${natFrag}, becoming, in time, ${conFrag}.${sphFrag} Take any of this that sparks something. Leave the rest.`;
  },
};

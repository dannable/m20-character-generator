/* M20 Sorcerer catalogue — generated from the book text; see tools/reports/sorcerer-catalogue.md. */
const SORCERER = {
 "SOURCE": {
  "title": "M20 Sorcerer",
  "publisher": "Paradox Interactive / Onyx Path",
  "year": 2022,
  "developer": "Travis Legge",
  "chargenPage": 103
 },
 "CREATION": {
  "attrPoints": {
   "primary": 6,
   "secondary": 4,
   "tertiary": 3
  },
  "abilityPoints": {
   "primary": 11,
   "secondary": 7,
   "tertiary": 4
  },
  "abilityMax": 3,
  "backgroundDots": 5,
  "numinaDots": 5,
  "startWillpower": 5,
  "freebiePoints": 21,
  "ritualsPerDot": 1,
  "psychicCapDivisor": 2
 },
 "FREEBIE_COSTS": {
  "attribute": {
   "label": "Attribute",
   "cost": 5
  },
  "ability": {
   "label": "Ability",
   "cost": 2
  },
  "newAbility": {
   "label": "New Ability",
   "cost": 3
  },
  "numina": {
   "label": "Path / Phenomenon",
   "cost": 7
  },
  "ritual": {
   "label": "Ritual",
   "cost": 3
  },
  "background": {
   "label": "Background",
   "cost": 1
  },
  "willpower": {
   "label": "Willpower",
   "cost": 1
  },
  "merit": {
   "label": "Merit",
   "cost": "as listed"
  },
  "flaw": {
   "label": "Flaw (bonus)",
   "cost": "as listed",
   "maxBonus": 7
  }
 },
 "XP_COSTS": {
  "newAbility": 3,
  "ability": "current x2",
  "newNumina": 7,
  "numina": "current x7",
  "affinityPath": "current x6",
  "secondaryNumina": 21,
  "willpower": "current rating",
  "attribute": "current x4",
  "newRitual": "rating of ritual",
  "background": "current x3"
 },
 "BACKGROUNDS": {
  "base": [
   "Allies",
   "Alternate Identity",
   "Arcane/Cloaking",
   "Backup",
   "Blessing",
   "Certification",
   "Contacts",
   "Cult",
   "Demesne",
   "Destiny",
   "Fame",
   "Familiar/Companion",
   "Influence",
   "Library",
   "Mentor",
   "Past Lives",
   "Patron",
   "Rank",
   "Resources",
   "Spies",
   "Status",
   "Totem",
   "Artifact"
  ],
  "traditions": [
   "Chantry",
   "Node",
   "Retainers",
   "Sanctum"
  ],
  "disparates": [
   "Chantry",
   "Node",
   "Retainers",
   "Sanctum"
  ],
  "technocracy": [
   "Construct",
   "Hypercram",
   "Enhancement",
   "Node",
   "Requisitions",
   "Laboratory",
   "Secret Weapons"
  ],
  "artifactLevels": [
   {
    "level": 1,
    "text": "A minor Artifact (Pecos Bill’s Revolvers (–1 on difficulty to aimed shots))"
   },
   {
    "level": 2,
    "text": "A useful Artifact (Anna Pavlova’s Ballet Shoes (+2 for dice involved in movement))"
   },
   {
    "level": 3,
    "text": "An Artifact of significant power (Lillian Head’s Broom (Witch’s Steed))"
   },
   {
    "level": 4,
    "text": "A much-sought Artifact mentioned in legends (Skull of Merlin (Vision Skull))"
   },
   {
    "level": 5,
    "text": "An artifact of incredible power (Deshayes’ Fatal Cup)"
   }
  ],
  "text": "Backgrounds presented in Mage 20 p. 301-328 can work for most sorcerers, but several only apply to mages.\n\nArtifact\n\nArtifacts are items that are inherently supernatural with a power of their own. This Trait allows you to begin play with an artifact, whether it was a family heirloom, a gift from a Mentor, or a discovery that someone has not taken from you. The Storyteller will create the Artifact based on your suggestions; a player does not create such items without use of the Enchantment Path (p. 26). Mythical artifacts of legends are not valid objects for this Trait but should be the goals of quests. As a Background, Artifacts should also include story elements like curses, prophecies, restrictions that might hold back hidden powers of the Artifact, or a rival family who wishes to reclaim what is theirs. Work with your Storyteller to figure out what might be interesting for your character to delve into. Each dot in this Background indicates an increasingly powerful Artifact, and the Storyteller should ensure the Artifact is roughly equivalent to an Enchanted item made with the Enchantment Path."
 },
 "ASPECTS": [
  {
   "name": "Area",
   "levels": [
    "1-foot radius",
    "3-foot radius",
    "6-foot radius",
    "12-foot radius",
    "25-foot radius"
   ],
   "note": ""
  },
  {
   "name": "Damage/Healing",
   "levels": [],
   "note": "For each level of this Aspect, up to two dice of lethal damage can be healed or caused. An additional two successes spent on this Aspect converts the damage healed or caused to aggravated."
  },
  {
   "name": "Distance",
   "levels": [
    "Only a few feet",
    "Up to around 20 feet",
    "Up to 100 feet",
    "Up to half a mile",
    "Up to five miles"
   ],
   "note": "These ranges are guidelines for populated regions. For less populated ones, the numbers may be doubled or even tripled. Distance is used for travel, movement, and remote effects. For effects emanating directly from the hedge wizard, such as combat spells, use Range instead."
  },
  {
   "name": "Duration",
   "levels": [
    "A few minutes",
    "One scene",
    "A day or two",
    "A couple of weeks",
    "Several months"
   ],
   "note": ""
  },
  {
   "name": "Number of Targets",
   "levels": [
    "A single target",
    "Two targets",
    "Up to 10",
    "Up to 50",
    "Hundreds"
   ],
   "note": ""
  },
  {
   "name": "Metaphysical Weight",
   "levels": [
    "Simple creatures such as small, unintelligent animals, most minor Gafflings and the smallest beings in the hosts of a heaven or hell",
    "Larger creatures such as bears or wolves, more powerful Gafflings, ghosts that have begun to learn to navigate their existence but have no experience",
    "Humans and truly intelligent beings, like most Jagglings, ghosts who can navigate the underworld effectively, minor angels, servitor demons, and notable elementals",
    "Enhanced humans like ghouls, kinfolk, and other sorcerers, as well as powerful Jagglings, Umbrood Preceptors, and infernal tempters",
    "Powerful beings such as the truly supernatural (vampires, werewolves, mages, fae, etc.), Incarnae, the barons of hell and the generals of the heavenly host"
   ],
   "note": ""
  },
  {
   "name": "Passengers",
   "levels": [
    "Yourself, but no clothing or equipment",
    "Yourself, your clothing, and a small amount of stuff",
    "Yourself and one extra person or equivalent weight in stuff",
    "Two passengers",
    "Three passengers"
   ],
   "note": ""
  },
  {
   "name": "Range",
   "levels": [
    "Touch only (requires a successful Brawl attack if the target is unwilling)",
    "Less than 10 feet",
    "Less than 25 feet",
    "About 50 feet",
    "Within 150 feet"
   ],
   "note": ""
  },
  {
   "name": "Sympathetic Connection",
   "levels": [
    "Direct physical contact",
    "True Name",
    "Body part, including blood, nail clippings, etc.",
    "Prized possession",
    "Any possession"
   ],
   "note": ""
  },
  {
   "name": "Travel Speed",
   "levels": [
    "About three times faster than foot",
    "Roughly driving speed",
    "Driving without speed limits or red lights",
    "Miles are covered in seconds",
    "Instantaneous travel"
   ],
   "note": ""
  },
  {
   "name": "Weight",
   "levels": [
    "Less than an ounce",
    "A few pounds",
    "Up to 100 pounds",
    "Up to 1000 pounds",
    "Large objects such as cars or elephants can be moved"
   ],
   "note": ""
  }
 ],
 "CORE_RULES": {
  "pathMagic": "When a person begins studying hedge magic, they choose a casting Attribute and an Affinity Path from their Fellowship’s list. Unaligned hedge magicians may choose any Attribute and Affinity Path. Upon learning a Path, the magician must assign it to a practice (see Mage 20 p. 573-586, and M20 Book of Secrets p. 196-205 for more information on practices and the Abilities associated with them) that determines how the magician goes about casting it. They also assign an Ability the Path is based on. This Ability, in addition to being part of the dice pool to use the Path, acts as a cap on the Path rating. A character who uses Occult for the Path of Hellfire cannot have Hellfire 5 with only Occult 3.\n\nAs an example, Eleanor is playing Petrus, a member of the Ancient Order of the Aeon Rite. As a member, his casting Attribute is Intelligence, so every time he casts a spell or performs a ritual, Intelligence is that Attribute he uses. Eleanor decides Petrus starts with two Paths: Fortune and Alchemy. She chooses to associate Fortune to the High Ritual Magick Practice and Alchemy to the Alchemy Practice. Looking through the Associated Abilities of those practices, she decides that her dice pool for Alchemy should be Intelligence + Esoterica (Alchemy), and for Fortune it should be Intelligence + Occult. These reflect that when Petrus is mixing up tinctures and potions, he’s acting like a traditional alchemist, but when he’s working with blessings and curses, he’s instead relying on general knowledge of superstitions.\n\nEach Path is divided into spells and rituals. Spells are relatively quick pieces of magic and can be put together spontaneously when necessary. Spells only take one turn per level of the Path being cast. Rituals, on the other hand, are larger workings, taking 10 minutes per level of the ritual to cast. In both cases, the magician spends a point of Willpower, then rolls their casting Attribute + Path Ability rating at a difficulty of the Path level + 4. This is referred to as a Path roll.\n\nIf enough successes are rolled (see Aspects below), the spell succeeds as planned. If not, it fails. Changing a spell to a weaker version after casting due to lack of successes is impossible. On a botch, the caster suffers some catastrophic effect. Though hedge magicians aren’t subject to Paradox directly, their attempts to manipulate reality can still go horribly wrong. Possible outcomes of botches are described in each individual Path listing.\n\nSpells\n\nPath magic effects, commonly referred to as spells, are created using the following rules.\n\nAspects\n\nMost Paths have several components associated with them called Aspects. These are variables like the number of targets, the duration, or the amount of damage done by a given spell. When the hedge magician casts a spell, they must choose what level of each Aspect they want to include, with the default being zero — and therefore, no effect — in each. Hedge wizards can increase a given Aspect as high as the Path level, and the highest Aspect determines the level of the spell. When the spell is cast, it requires one success for each rank in each Aspect.\n\nSpells may contain any of the general Aspects listed here, modified and expanded by any Aspects listed in the Path’s description. A hedge wizard only needs to purchase Aspects they require for the spell. A result of no effect purchased in one Aspect doesn’t impede any other Aspect.\n\nGoing beyond the fifth dot in an Aspect may be possible but is the stuff of legend most magicians never see, much less accomplish.\n\n[Aspect tables: see the `aspects` array.]\n\nRituals\n\nThough a hedge magician may cast spells more quickly, for many, rituals make up the bulk of their practice. In exchange for taking longer to enact, rituals can be significantly more powerful than spells of the same level. This additional power can take one of three forms.\n\nFirst, a ritual can empower the magician to attain a level of aptitude they cannot normally access, permitting them to cast a spell as though they had one additional rank of their Path. This might manifest through a new expression of power or by increasing Aspects beyond their usual threshold.\n\nThe second form of ritual expands the scope of the intended effect. Using a ritual grants the magician their Path Ability rating in additional successes with which to purchase Aspects for the spell, provided they achieve a success when performing the ritual.\n\nFinally, rituals can bring more power to bear than spells by going beyond what the base spells of the Path can achieve. These rituals express the ultimate form of the Path by stretching the limitations of the Path. This allows the hedge wizard to create specialized and powerful effects within the Path’s purview.\n\nThe following Paths include lists of sample rituals. These lists are by no means complete, and players and Storytellers are encouraged to come up with their own rituals. Regardless of Path, rituals take 10 minutes per level to cast. All Paths that include rituals also contain the following ritual:\n\nStore Spell (•••••)\n\nWith this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells below. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path.\n\nComplications\n\nThe systems above describe the basics of using hedge magic. For many hedge magicians, things get a bit more complicated. They often look for faster ways to cast their spells, to build more successes upon a ritual, or even to protect themselves from enemy magics. Many of the following are optional rules meant to give more flexibility, simplify bookkeeping at the table, or keep hedge magicians in check.\n\nSimplified Aspects\n\nAspects can be complicated, requiring bookkeeping and making hedge magic cost many successes. Optionally, each Aspect can cost a single success to include at the hedge wizard’s Path rating rather than one success per rank. This makes hedge magic more powerful but easier to keep track of. It also causes the primary cost of high Aspects to be the increased difficulty of the spell involved rather than the high number of successes required to attain an effect.\n\nCountermagic\n\nSometimes the most important thing for a hedge magician isn’t to cast their own spell, but to stop or unmake someone else’s. For that, there’s countermagic. Countermagic comes in two varieties: normal countermagic and unweaving.\n\nWhen the target of some sort of magic, the magician may roll the dice pool of their Affinity Path at difficulty 8 to subtract successes from the caster’s roll. If they reduce the incoming magic to zero successes, then the magic is canceled. The hedge wizard’s arcane foundation need not have anything in common with the caster at all; defending oneself from unwanted magic is as instinctual as an eyeblink.\n\nUnweaving applies when a magician finds an existing spell they want to remove from something or someone. Here, they need to have the same Path as the original caster for spells created through hedge magic or else a Path relevant to the sort of magic being unwoven. After choosing a relevant Path, roll the hedge wizard’s dice pool for the appropriate Path at difficulty 8. The hedge magician needs more successes than the original caster to unweave the spell. Unweaving can be done as an extended action.\n\nBy default, a hedge magician can use either sort of countermagic against other hedge magicians and against Awakened magick, but nothing else. For other sources of magic, they must have at least the second rank of the relevant Lore/RD Data Knowledge and then spend 3 XP. Possible types of magic to counter include vampiric magic (Thaumaturgy, Necromancy, etc.), spirit Gifts and Charms (including those given to shapeshifters), Fae Cantrips, the powers of the dead, and psychic phenomena, among others.\n\nHanging Spells\n\nWith how slow hedge magic can be, many magicians prefer to prepare their magic in advance. Powerful hedge magicians may use a ritual to imbue a spell into an item, and Alchemists and Enchanters can both prepare objects for later use, but every hedge wizard can attempt to hang a spell or ritual. Hanging a spell consists of the hedge magician doing everything they need to in order to cast the spell, but then stopping right before its completion. They then internalize the unfinished spell, holding it within awaiting rapid release at some point in the future.\n\nHanging a spell or ritual requires the hedge magician to spend a point of Willpower and at least one point of Quintessence or dram of suitable Tass. They still roll the spell’s dice pool and note down details such as Aspects and their number of successes. Later, they can release the spell with only a single turn’s effort, making these prepared spells much more useful in a tight situation. The downside is that these spells take up a lot of mental space. For every two spells the hedge magician hangs, they add +1 difficulty to all rolls.\n\nWitnesses\n\nHedge magic is easiest to accomplish far from prying eyes. Obvious spells and rituals generally fail when performed in public, preventing a hedge magician with the Path of Conjuration from throwing a city bus at someone in the middle of town. It’s possible to overcome this effect, but the larger the number of witnesses to a spell, the more challenging it is to manifest the magic. For the purposes of this chart, witnesses include anyone considered a Sleeper. Remove successes when calculating the final result of the spell or ritual as indicated on the chart.\n\nNumber of Witnesses / Successes Removed\n1 / 1\n2-5 / 2\n6-10 / 3\n20-100 / 4\n100+ / 5\n\nQuintessence\n\nLike the Awakened, hedge magicians can use Quintessence to make their magic easier. However, they are less efficient than those with an Awakened Avatar. To reduce the difficulty of a spell or ritual by 1 requires a hedge magician spend two points of Quintessence. Even this is impossible for many magicians, as they require the Path of Quintessence Manipulation to use Quintessence at all. Otherwise, it needs to be in the form of Tass, and only Tass with relevant Resonance works.\n\nFast Casting and Extended Rolls\n\nSometimes, one turn per level of the spell being cast is just too slow. A magician may need to use Conveyance urgently to escape a charging werewolf, or Hellfire to fight off a vampire. When time is of the essence, the magician may attempt to fast cast. Fast casting increases the difficulty by one for each turn being shaved off the casting time for the spell. So, a Conveyance 3 spell to escape a dangerous situation has a +2 difficulty penalty to cast in a single turn, and using Hellfire 5 to incinerate a vampire has a +4 difficulty, making it nigh impossible.\n\nIf instead of trying to hurry, the hedge magician takes their time to get things right, spells can be cast as extended actions. This follows the usual rules for extended actions (see Mage 20 p. 389-390). Each roll beyond the first requires only a single turn.\n\nTeamwork\n\nFor spells and rituals of great scope, the number of successes needed can be prohibitive. One hedge magician, even with an extended action, may not be able to manage it. This is especially true at higher difficulties. Many hedge magicians solve this problem by working together, creating more impressive spells and rituals than they could accomplish alone.\n\nThis sort of teamwork divides the hedge magicians into three groups. The first consists of the leader, who must have the appropriate Path at a high enough rank to be able to attempt the spell on their own. The second group consists of the assistants who have the Path — possibly at a lower level — and either share the leader’s practice for it or their Path Ability. The third and final group are hedge magicians who follow instructions but cannot contribute their own magic to the group.\n\nEach hedge magician other than the leader and the first assistant increases the casting time by one turn for a spell and 10 minutes for a ritual. The assistants in the second group, who can apply their mystical knowledge and skills, each make a Path roll. For each successful roll, the difficulty of the spell or ritual decreases by one, and for each botch it increases by two. Anyone involved can spend Willpower to gain successes on the roll.\n\nOnce the spell or ritual is complete, the leader makes their Path roll, with the difficulty modified by their assistants. If the roll succeeds, the spell or ritual goes off as expected. However, on a botch, everyone involved in the casting suffers the consequences, and often the consequences are more severe than they would be for an individual caster.\n\nGreater Rituals\n\nIn addition to the usual methods of teamwork, clever and determined hedge magicians can use and develop Greater Rituals. Greater Rituals are the only way for multiple Paths to be combined to achieve a single effect, and always require multiple magicians to work in concert. Each magician must contribute the appropriate level of one Path, and each Path requires a distinct magician to cast it. Additionally, all of the requirements for working together above must be satisfied by the group: There must be a leader, and all members must share a practice or the Ability they roll with them.\n\nOnce preparations are complete, the magicians must spend the required 10 minutes/level of a ritual along with 10 minutes for each caster beyond the first. Each of the magicians must roll their dice pool at the appropriate difficulty number for the level of the Path they are contributing. If all the casters succeed, the Greater Ritual goes off, and the combined effect occurs.\n\nCreating New Paths and Rituals\n\nHedge magic may be a static discipline, but it doesn’t stay the same. Paths fall out of favor and are lost, while clever hedge wizards develop new approaches over time. Most new Paths disappear relatively quickly, not spreading beyond the creator or their immediate circle. But some end up lodging themselves into the Tapestry, spreading beyond their creators as other practitioners independently work out their own methods for realizing identical outcomes. Rituals are much simpler. They don’t truly open new ground, being new configurations of powers hedge wizards already have. They also spread over time, as one magician teaches another, and just as commonly disappear when they stop being useful enough to transmit.\n\nNew Paths\n\nThe creation of a new Path is often the undertaking of a magician’s lifetime. Before they can even begin, they must have mastered a Path completely. Until they do, attempts to blaze new trails fail miserably, but harmlessly. Once they master their first Path, however, they can truly begin the long and demanding task of creating something new.\n\nThe process begins with conceptualization. Without a clear idea of what the Path does, the magician can’t begin. They must decide if the Path has Aspects (and what they are) with each dot increasing the potency and diversity of the spells it can cast, or whether there are a set of specific magics connected by a common theme. They shouldn’t be too flashy and cannot be quick, those both fall into the realm of Sphere magick. Instead, new Paths are generally subtle, at least at first.\n\nOnce the Path is clearly conceptualized, the magician begins the actual work of establishing it. Research and experimentation is difficult and dangerous. Before acquiring the first dot, the magician assigns their Path Ability for the new Path and rolls their dice pool once each month at difficulty 8. They need to acquire a total of 25 successes before they can buy the first dot of their new Path. Failure means they simply made no progress; they may try again the next month. Botches, however, taint the whole process, requiring the magician to start over from scratch.\n\nThe magician must do this whole procedure again for each dot until they have mastered the new Path. For most, this process takes years to complete, and many hedge magicians give up long before completion. For those few who manage to complete their new Paths, they can cement it by spending a permanent point of Willpower. Once they do, they can teach it to other hedge magicians, and it can even be rediscovered by others.\n\nNew Rituals\n\nRituals are much easier to create than new Paths. For one, the magician only needs their Path rating to be higher than the rating of the ritual they are creating. A magician with Oneiromancy 4 could make a rank 3 ritual. Creating rank 5 rituals requires mystical acumen usually relegated to myth and legend and should be the focus of a story in and of itself. Hunting down a lost ritual is usually easier than creating a new one, as is finding someone to teach a particularly obscure ritual.\n\nOnce their Path rating is high enough to create the ritual, the magician needs to spend a month per level doing research and experimentation before they can attempt it. They then perform a single roll of their Path’s casting Attribute + Ability dice pool at difficulty 9. On a botch, the ritual backfires (see individual Path write-ups for details) and the magician must start the process over from the beginning. A failure means they can try again the next month, as does rolling only one or two successes. If they manage to achieve three successes on their roll, the ritual is created and can be used and taught normally from there on out. If the magician rolls six or more successes on a single roll, the ritual gains some additional benefit: it may be treated as one level lower, have a shorter casting time, or gain an additional, related effect.",
  "pathMagicPage": 12,
  "pathMagicSidebars": [
   {
    "title": "Awakened Hedge Magic",
    "page": 12,
    "text": "Awakened mages and hedge magicians appear to achieve similar results by performing nearly identical actions. Both a Hermetic mage and a Hermetic hedge magician may activate the pentacle of Mars to call down fire on their enemies. But while the mage channels Forces through the power of will, thereby risking Paradox, the hedge magician accesses Hellfire through formulae or faith. This dichotomy prevents the Awakened from ever learning hedge magic and causes hedge magicians who Awaken to lose their Paths. Once a character Awakens, the linear Paths are barred to them. Their attempts to change the world are filtered through their Avatar, manifesting as Sphere-based magick, rendering hedge magic impossible for them."
   },
   {
    "title": "Mages and New Paths",
    "page": 16,
    "text": "While most new Paths are created by hedge magicians themselves, mages can also create them. The process is arduous and resembles the creation of a Talisman (Mage 20 p. 652-653, Book of Secrets p. 151-158). However, the “Talisman” in this instance has an ephemeral form: the concept of the Path. The mage must spend a similar amount of effort defining the Path as they would creating a Talisman’s physical form, and then they must use Prime 5 to infuse this ephemeral Pattern with magick.\n\nThe Technocratic Union particularly favors this method. They’ve built a pipeline wherein Enlightened Scientists create fundamentally new science and then formalize it into Paths for Extraordinary Citizens. Those Citizens then bring the Path out into the world, making the new techniques first coincidental, and then mundane."
   }
  ],
  "psychic": "In many ways, psychic phenomena are simpler than hedge magic. Phenomena have no Aspects to worry about, no rituals, and by default, no teamwork. Each Phenomenon stands on its own, with unique mechanics separating it from all others. Two psychics practicing the same Phenomenon may not immediately recognize each other as doing so.\n\nWhile hedge magic is all about training and discipline and depends on Attribute + Ability dice pools, psychic phenomena depend almost entirely on a single trait: Willpower. When the power comes directly from your mind, the strength of your will is the only thing that matters for making it happen. Every time a psychic tries to activate a Phenomenon, they first spend a Willpower point and then roll their Willpower rating against a difficulty equal to the Phenomenon level they are using + 3. Unless otherwise noted, a single success suffices. Botches can be extremely painful and, in addition to the Phenomenon-specific consequences, tend to leave the psychic with a headache for days.\n\nWillpower also controls psychic advancement. All Phenomena are capped at half of Willpower, rounded down. This means a character with Willpower 1 can’t have any Psychic Phenomena at all until they strengthen their will. It also means only the strongest, most willful people can reach the fifth rank of any given Phenomenon, making such psychics incredibly rare.\n\nLearning new Phenomena is simple: the psychic merely spends the XP and discovers a new talent. However, this should always be tied into a story. Learning a new Phenomenon puts the psychic into a small minority among the already small population of psychics. A new Phenomenon should change the psychic in some way. It transforms how they see the world as new pieces of it open to them, and they realize they can do things they couldn’t before.",
  "psychicPage": 54
 },
 "CREATION_TEXT": "This chapter contains all the rules and information you need to bring hedge wizard and psychic characters to life in your chronicle. Whether fleshing out the support staff of your Mage troupe’s chantry, running a game focused on hedge wizards as the protagonists, or bringing a hedge wizard character to play in a group with several character types, these rules allow you to build and improve your character. The guidelines presented in this chapter reference Mage: The Ascension 20th Anniversary Edition and use the traits presented in that book unless otherwise noted.\n\nCharacter Creation\n\nThe process of creating a sorcerer is similar to that of making a Mage, with a few differences. For additional advice on general character creation see Mage 20 p. 246-339.\n\nStep One: Character Concept\n\nThis is the starting point for your character. Here you choose the basic building blocks of the person whose role you will assume in your chronicle.\n\nConcept\n\nBest encapsulated in a short phrase, this should describe your character in a general sense and can help you inform your own decisions in the character creation process. You can expect that, though similar, a “paranormal investigator with a YouTube channel” and “UFO-hunting engineer” will have different focuses, strengths, and weaknesses.\n\nAffiliation\n\nMost sorcerers learn from a mentor and associates who initially shaped their knowledge of magic. This Affiliation is usually a lifelong bond because, even if they separate on poor terms, other communities have a different view on the Art that is incompatible with what they learned and was the foundation of their belief. Examine the societies presented in Chapter Three and select one that matches your character concept, meshes with the other players, and is not disruptive of your Storyteller’s vision of the game.\n\nWhile the societies presented in Chapter Three describe very stereotypical sorcerers of that Affiliation, your character need not adhere to those stereotypes. They should be a person that others know by name, not by Affiliation. A sorcerer’s Affiliation and beliefs tint their view of the world, but do not control it.\n\nNature, Demeanor, and Essence\n\nSelect a Nature and Demeanor that matches your character and an Essence that fits your concept and Affiliation. The Avatar’s influence will be more subtle than in an Awakened mage, but that guiding force will be there with a sorcerer. See Mage 20 p. 266-273 for additional explanation of Nature, Demeanor, and Essences.\n\nStep Two: Select Attributes and Abilities\n\nIn this stage of character creation, you assign points to your character’s game traits to reflect their capabilities, strengths, and weaknesses.\n\nAttributes\n\nDetermine which Attributes are most significant to your character, prioritizing between Physical, Social, and Mental attributes, providing 6 dots to spend on the highest priority, 4 for the second, and 3 for the tertiary Attributes.\n\nAbilities\n\nNext, prioritize Abilities that represent your sorcerer’s studies, practice, and skills. As with Attributes, you’ll prioritize between Talents, Skills, and Knowledges. Spend 11 dots on the primary Ability category, 7 on the secondary, and 4 on the tertiary. No Ability may receive higher than 3 dots at this stage, but you will be able to spend freebie points on them later in character creation.\n\nStep Three: Select Advantages\n\nAdvantages reflect unique aspects to your character that go beyond the basic Attributes and Abilities. Some sorcerers may have plentiful magical allies and tools at hand, while others are more in touch with the mundane world, possessing political power and money.\n\nBackgrounds\n\nYou have 5 dots to spend on Backgrounds to reflect your sorcerer’s history and personal power. These can be spent freely on Allies, Alternate Identity, Arcane/Cloaking, Backup, Blessing, Certification, Contacts, Cult, Demesne, Destiny, Fame, Familiar/Companion, Influence, Library, Mentor, Past Lives, Patron, Rank, Resources, Spies, Status, and Totem. Characters aligned with the Disparate Alliance or the Traditions may include Chantry, Node, Retainers, and Sanctum in their available Background choices. Those loyal to the Technocratic Union may add Construct, Hypercram, Enhancement, Node, Requisitions, Laboratory, and Secret Weapons to their Background choices.\n\nNumina\n\nEach sorcerer has 5 dots of Numina to spend to determine the skill and power the sorcerer has developed. These aren’t limited to 3 dots per Path, but may only be spent within one style of Numina that will determine what type of Numina your character may learn (Hedge Magic Paths or Psychic Phenomena). If you are building a hedge wizard, each level of Path rating you purchase allows you to select one ritual. The ritual must be of a level equal to or less than your Path rating. You can’t take a ritual of a specific level without having at least one at each lower level. Thus, you need to have a Level One ritual and a Level Two ritual to take a Level Three ritual.\n\nWhile most sorcerers stick to their initial instructions of magic, some begin to investigate other powers that are similar to their own. Such sorcerers learn how to combine hedge magic with psychic phenomena, though it is exceedingly difficult to take on these new Numina and requires dedication to the work that most sorcerers simply do not have the patience and interest in. This is not done during character creation but through expenditure of experience points and with Storyteller approval.\n\nStep Four: Finishing Touches\n\nThese elements round out your character’s capabilities and provide opportunities for customization.\n\nWillpower\n\nSorcerers are naturally willful and stubborn, which allows them to persevere through training and challenges of their Art. They receive 5 dots of Willpower to reflect this and may have more if you spend freebie points on it.\n\nQuintessence, and Paradox\n\nSorcerers do not suffer from Paradox, as they work within the confines of fundamental reality, rather than bending reality to their will.\n\nFreebie Points\n\nFinally, you have 21 freebie points to spend to fill in any gaps in your character. Are there ratings that should be higher, to represent the heights that your sorcerer has already reached, or additional Background points to cover their history or additional skills? Consult the Character Creation chart for the freebie points costs. If your Storyteller is using Merits and Flaws, this is the appropriate time to choose them. As always, Merits and Flaws are optional and should be approved by the Storyteller to ensure they fit the story and character.\n\nSpecialties\n\nAfter freebie points have been spent, you should assign a specialty for each Attribute, Ability, and Path rated at four or higher. Any time you perform an action that uses an Attribute, Ability, or Path that relies on or incorporates the specialty, any 10s rolled are counted as two successes. For more on specialties see Mage 20 p. 274\n\nFinishing Touches\n\nAt this point, your sorcerer should exist mechanically, but you should spend some time now truly bringing them to life. What is their favorite color? What do they even look like? Who are their close associates? All the things that make your sorcerer into a real person. Remember that any significant detail should have a matching trait, though one of the best ways to do this is to include functional dot ratings into the description of your character.",
 "PATHS": [
  {
   "id": "alchemy",
   "name": "Alchemy",
   "page": 18,
   "description": "The study of transformation and purification, Alchemy is an ancient art and science. Practitioners draw from disparate practices, both magical and scientific, to understand the hidden properties of matter and the soul. The most traditional goal of alchemy is not the more famous transformation of base matter into more “noble” counterparts — such as lead into gold — but rather the perfection of the alchemist.\n\nAs a Path, Alchemy creates one-use magic items and transformations. Many of the things it produces are meant to be ingested, though few are made with taste or even the health and wellness of the consumer in mind. Alchemy also produces coatings that may be applied to the skin or objects, and reagents that catalyze transmutations of base elements into other matter.\n\nThough often studied as a means of perfecting the soul, this pursuit is very much bound up with actual Alchemical practice. Other practices put their own spin on it: Practitioners of Witchcraft call the Path Herbalism and focus on natural ingredients and effects related to them, while Hypertech engineers and tinkerers utilizing Weird Science call it Advanced Chemistry, and completely eschew the metaphysical implications the Alchemy practice places on the Path.\n\nIn all cases, the Path of Alchemy is expensive. For most versions of the Path, it requires a well-equipped laboratory and strange ingredients. The most powerful applications require increasingly exotic components and extremely specialized Tass. Though the Herbalism variant tends to be cheaper in terms of money, it requires more time and effort, with plants and fungi collected under strict conditions.\n\nMany applications of this Path have passed into legend. Few alchemists are known to have actually completed the so-called “Great Work,” the creation of a Philosopher’s Stone, or any other product conducive to immortality, but most masters of the Path make an attempt.\n\nThis Path has no spells. It does everything through rituals called recipes.",
   "system": {
    "text": "Modifiers: Once the magician successfully follows a recipe three times, the difficulty is reduced by one.\n\nTime: Alchemy takes longer to obtain results than most Paths. Recipes require one day per level to prepare, but this can be shortened if the Path Ability exceeds the recipe level. Each dot of the Ability higher than the ritual level reduces the total time spent by one day. If this would reduce preparation time below one day, instead assume several hours of work.\n\nDuration: Effects last for a single scene unless otherwise noted.\n\nEffects: Alchemy doesn’t have Aspects; instead, each dot increases the practitioner’s power and control. Except for the most potent recipes, they only require a single success to make. Additional successes are split between providing additional doses and keeping those doses potent for one day per success spent.\n\n• Distillations at this level do not appear magical in any way. These recipes are simply more advanced versions of extant chemicals and concoctions, producing more potent painkillers, poisons, glues, solvents, etc., and increasing the Toxin Rating of the chemical by one (as per Mage 20 p. 442). Higher Path levels can further alter the Toxin Rating, increasing or decreasing the rating by one per dot.\n\n•• Now the substances created let the imbiber exceed their usual physical limits. Any one Attribute can be increased by one dot, up to a maximum of five, for the scene. Special preparations can expand one’s mystical awareness, mostly through induced dreams or hallucinations. These visions are left to the Storyteller’s discretion and should remain cryptic and uncertain. Visions attained at this level lack the power of a system benefit and are included as a narrative device.\n\n••• Not only can the alchemist now enhance their targets beyond the normal capabilities of humans, but they can also grant low-level psychic abilities (see Chapter Two) for an hour at a time. These psychic abilities begin at a single dot, but every additional two successes provides an additional dot, to a maximum of the alchemist’s Path rating.\n\n•••• Alchemists can bring about truly potent improvements to living beings. They can increase a single Attribute or Ability by two or two Attributes or Abilities each by one, and the normal human limit of five no longer applies.\n\n••••• The alchemist can now craft recipes that reproduce up to three dots worth of supernatural powers. Each dot reproduced this way mimics a single effect — chosen when the recipe is crafted — even if the replicated power offers multiple effects. These are some of the hardest potions to produce and require exotic components, such as pieces of the supernatural being in question.\n\nPrice of Failure: Working with volatile compounds is dangerous in and of itself. Even mere failure results in broken equipment and ruined reagents, requiring expensive replacements. In the best-case scenario with an actual botch, the alchemical product explodes, potentially damaging the magician (as well as their neighbors). More commonly, though, the botched recipe appears to come together perfectly, but produces undesirable, and possibly harmful, effects. Even an unexpected but benign effect can be catastrophic at the wrong time.",
    "aspects": [],
    "modifiers": "Modifiers: Once the magician successfully follows a recipe three times, the difficulty is reduced by one.",
    "priceOfFailure": "Price of Failure: Working with volatile compounds is dangerous in and of itself. Even mere failure results in broken equipment and ruined reagents, requiring expensive replacements. In the best-case scenario with an actual botch, the alchemical product explodes, potentially damaging the magician (as well as their neighbors). More commonly, though, the botched recipe appears to come together perfectly, but produces undesirable, and possibly harmful, effects. Even an unexpected but benign effect can be catastrophic at the wrong time."
   },
   "levels": [
    {
     "level": 1,
     "kind": "effect",
     "text": "Distillations at this level do not appear magical in any way. These recipes are simply more advanced versions of extant chemicals and concoctions, producing more potent painkillers, poisons, glues, solvents, etc., and increasing the Toxin Rating of the chemical by one (as per Mage 20 p. 442). Higher Path levels can further alter the Toxin Rating, increasing or decreasing the rating by one per dot."
    },
    {
     "level": 2,
     "kind": "effect",
     "text": "Now the substances created let the imbiber exceed their usual physical limits. Any one Attribute can be increased by one dot, up to a maximum of five, for the scene. Special preparations can expand one’s mystical awareness, mostly through induced dreams or hallucinations. These visions are left to the Storyteller’s discretion and should remain cryptic and uncertain. Visions attained at this level lack the power of a system benefit and are included as a narrative device."
    },
    {
     "level": 3,
     "kind": "effect",
     "text": "Not only can the alchemist now enhance their targets beyond the normal capabilities of humans, but they can also grant low-level psychic abilities (see Chapter Two) for an hour at a time. These psychic abilities begin at a single dot, but every additional two successes provides an additional dot, to a maximum of the alchemist’s Path rating."
    },
    {
     "level": 4,
     "kind": "effect",
     "text": "Alchemists can bring about truly potent improvements to living beings. They can increase a single Attribute or Ability by two or two Attributes or Abilities each by one, and the normal human limit of five no longer applies."
    },
    {
     "level": 5,
     "kind": "effect",
     "text": "The alchemist can now craft recipes that reproduce up to three dots worth of supernatural powers. Each dot reproduced this way mimics a single effect — chosen when the recipe is crafted — even if the replicated power offers multiple effects. These are some of the hardest potions to produce and require exotic components, such as pieces of the supernatural being in question."
    },
    {
     "level": 1,
     "kind": "recipe",
     "text": "A powder that enhances alcohol. The drinker must roll Stamina (difficulty 8) or spend a point of Willpower or else fall asleep immediately. They must try again (at a difficulty of one less than the prior roll) each turn until they fail, or the difficulty drops below 3. Those affected sleep for (10 - Stamina) hours. Vampires are resistant, rolling at –2 difficulty and rolling Stamina + Fortitude. Even if they fail, they sleep for only ten minutes, minus one for each dot of Stamina or Fortitude they possess. Werewolves in their natural form, however, are more susceptible (difficulty +1)."
    },
    {
     "level": 1,
     "kind": "recipe",
     "text": "A drug that lets the user ignore wound penalties up to the Injured level until wounded again."
    },
    {
     "level": 1,
     "kind": "recipe",
     "text": "A tonic that instantly sobers the drinker up, no matter how drunk they are."
    },
    {
     "level": 1,
     "kind": "recipe",
     "text": "A mirror that is nigh impossible to chip or break."
    },
    {
     "level": 2,
     "kind": "recipe",
     "text": "An enhanced form of LSD that lets the taker either see a vision of the future or discover connections between disparate elements within the story. These relationships always appear in symbolic form, making the visions difficult to interpret."
    },
    {
     "level": 2,
     "kind": "recipe",
     "text": "A potion that doubles the running speed of anyone who takes it. At the end of the scene, the user rolls Stamina (difficulty 6) or feels out of breath for the next hour, suffering a +2 difficulty on all physical rolls."
    },
    {
     "level": 2,
     "kind": "recipe",
     "text": "A cure for the common cold or flu, at least for 24 hours. It can also halve the recovery time for the illness."
    },
    {
     "level": 2,
     "kind": "recipe",
     "text": "An energy drink that lets the user go an entire week sleeping one hour per night."
    },
    {
     "level": 3,
     "kind": "recipe",
     "text": "An extremely strong, light, and easy to work with metal alloy. It can retain an edge forever; melee weapons made from it do an extra die of damage and have –1 difficulty to hit. Armor made with it soaks an extra die of bashing and lethal damage."
    },
    {
     "level": 3,
     "kind": "recipe",
     "text": "A dust that reveals invisible objects or creatures and disrupts illusions."
    },
    {
     "level": 4,
     "kind": "recipe",
     "text": "A metabolic accelerator that raises Strength and Stamina by one each. Anyone who takes it will be hungry during the time to fuel the change. This may increase Attributes above 5."
    },
    {
     "level": 4,
     "kind": "recipe",
     "text": "A regimen of drugs or potions that slows aging. For each year of life on this regimen, the user only ages one month. If they ever go off of it, however, their age catches up at a rate of one month per day until they die or resume the regimen."
    },
    {
     "level": 4,
     "kind": "recipe",
     "text": "A salve that can be applied to the eyes to allow the user to see through the Shroud for one night."
    },
    {
     "level": 4,
     "kind": "recipe",
     "text": "A bullet that bursts into flames on impact. It does an additional two dice of fire damage and ignites anything it hits."
    },
    {
     "level": 4,
     "kind": "recipe",
     "text": "A powder that, when inhaled by mouth, gives an extra dot of Manipulation and Expression."
    },
    {
     "level": 5,
     "kind": "recipe",
     "text": "A pungent chemical that drives back werewolves (and most humans, simply due to the smell). When worn, any sort of shapeshifter cannot approach within ten feet of the user. Of course, this only protects against melee combat, they can still throw things, as some alchemists learn when they start taunting. Similar recipes exist for other Night-Folk."
    },
    {
     "level": 5,
     "kind": "recipe",
     "text": "A potion that mimics the physical prowess of a vampire. The user gains an extra action, an automatic success on Strength rolls, and an extra soak die for the scene. They also have quite a temper and thirst for blood. Resisting provocation or the opportunity to feed on an open wound requires a Willpower roll (difficulty 8)."
    },
    {
     "level": 5,
     "kind": "recipe",
     "text": "More directly, an elixir can be made using at least five points of vampire blood to simulate three dots of Potence for three hours. It leaves the user desperately hungry and suffering from bloodlust as above."
    },
    {
     "level": 5,
     "kind": "recipe",
     "text": "A powder that allows the consumer to heal bashing and lethal damage at a rate of one level every other turn for the duration of a story. This requires some werewolf fur and causes the user to sweat heavily and smell like an animal in a cage, giving +1 difficulty to all social rolls."
    }
   ],
   "rituals": [],
   "sidebars": [
    {
     "title": "What Happened to Herbalism?",
     "text": "In previous editions, specifically Ascension’s Right Hand and World of Darkness: Sorcerer, there was a separate Path of Herbalism/Brewing. In Sorcerer Revised, this was merged into the Path of Alchemy, and it remains so merged. Both Paths, as well as an implied but never published Path of Advanced Chemistry, produce one-off magical effects and transformations. The primary differences have to do with practice: Herbalism aligns best with the practice of Witchcraft, for instance, and Advanced Chemistry with Hypertech. Mechanically, all three use the same systems, grouped under the Path of Alchemy."
    }
   ],
   "notes": "Alchemy has no named rituals; it works through unnamed recipes. The levels array holds both the dot-by-dot effects from the System section (kind: effect) and the unnamed Sample Recipes (kind: recipe). The source has a stray empty bullet between the sleep-powder recipe and the wound-penalty drug, and the energy-drink recipe carries no bullet of its own in the extraction; it was placed at level 2 (••), following the cold cure it is grouped with."
  },
  {
   "id": "conjuration",
   "name": "Conjuration",
   "page": 21,
   "description": "Conjuration is the quintessential Path of stage magicians: pulling rabbits from hats and cards from an audience member’s pocket are common examples of its most basic applications. Sorcerers who wish to make a living from their studies often learn Conjuration. Because of this inextricable association with stage magic, Sleepers tend to rationalize Conjuration as simply expert sleight-of-hand.\n\nThe path of Conjuration is the ability to move or summon an object or being. While a novice might only perform parlor tricks like coin spinning, an advanced Conjuration sorcerer can hang a spell on their companion before entering a dangerous situation, letting them pull their friend from the (perhaps literal) jaws of death if need be.\n\nNearly as important as what Conjuration is is what Conjuration is not. Conjuration is very similar to the path of Conveyance mechanically, to the point that there’s often confusion between the two paths — especially among Awakened Mages who can achieve results common to both Paths with the Correspondence Sphere. Conjuration can’t move the sorcerer wielding it, whereas Conveyance can. A sorcerer also may not use this path to “summon” elemental attacks — that’s the domain of Hellfire. Conjuration can summon a bucket of sand but cannot create a sandstorm.",
   "system": {
    "text": "Modifiers: For any application that can be played off as — or described similarly enough to — stage magic, keep one success that would’ve otherwise been removed by witnesses. Even rational consensus is primed by pop culture to believe conjuring an elephant from nowhere is possible with clever visual trickery. Note that actions causing obvious physical harm can’t be explained in this manner.\n\nUsing Conjuration on an object in the grasp of someone actively resisting incurs a +1 difficulty. Attempting Conjuration to move a resisting target incurs a +2 difficulty. Apply a –1 difficulty for an object well-known to the sorcerer (see also Object Permanence below).\n\nAspects: Conjuration uses the Aspects of Distance, Number of Targets, and Weight. Conjuration notably doesn’t use Speed. The summoned target appears instantaneously on the successful completion of a spell or ritual. The sorcerer may also choose to buy the following effects with additional successes:\n\n• 1 success to be able to use Conjuration to clumsily attack without touching the weapon (–1 die penalty to attack).\n\n• 2 successes to attack as above but without penalty, or to give fine motor control to any object conjured, such as using a set of lock picks from a distance.\n\n• 1 success for each additional round the sorcerer wishes to maintain the effect. The Sorcerer can’t drastically change the effect, such as throwing a puppet to strike someone after making the puppet dance, without rolling Conjuration again.\n\nPrice of Failure: While simple failure means no item is transported, a Conjuration botch runs the gamut from highly inconvenient to gruesome. A sorcerer might send an object to the wrong place, such as sending an item further out of reach or conjuring a prepared weapon directly to their own hand. Sometimes the sorcerer summons the wrong object entirely. Alternatively, a sorcerer might only conjure part of the intended item, and one only needs to imagine the horror of botching the Conjuration of a living being.",
    "aspects": [
     "Distance",
     "Number of Targets",
     "Weight"
    ],
    "modifiers": "Modifiers: For any application that can be played off as — or described similarly enough to — stage magic, keep one success that would’ve otherwise been removed by witnesses. Even rational consensus is primed by pop culture to believe conjuring an elephant from nowhere is possible with clever visual trickery. Note that actions causing obvious physical harm can’t be explained in this manner.\n\nUsing Conjuration on an object in the grasp of someone actively resisting incurs a +1 difficulty. Attempting Conjuration to move a resisting target incurs a +2 difficulty. Apply a –1 difficulty for an object well-known to the sorcerer (see also Object Permanence below).",
    "priceOfFailure": "Price of Failure: While simple failure means no item is transported, a Conjuration botch runs the gamut from highly inconvenient to gruesome. A sorcerer might send an object to the wrong place, such as sending an item further out of reach or conjuring a prepared weapon directly to their own hand. Sometimes the sorcerer summons the wrong object entirely. Alternatively, a sorcerer might only conjure part of the intended item, and one only needs to imagine the horror of botching the Conjuration of a living being."
   },
   "levels": [],
   "rituals": [
    {
     "id": "object_permanence",
     "name": "Object Permanence",
     "level": 2,
     "text": "Hedge magicians naturally have an easier time summoning targets they have a strong connection to, such as a beloved pet or the ritual knife their mentor gifted them. With Object Permanence, the hedge magician forces a supernatural connection to objects for future summoning. This treats the target as “well-known to the sorcerer,” even if the sorcerer found it in a dumpster an hour ago. The sorcerer meditates within 10 feet of the target and spends a point of Willpower. Every success represents a day the target maintains the supernatural connection to the sorcerer. A hedge magician may have a maximum number of targets bound this way at once as they have dots in Conjuration."
    },
    {
     "id": "always_armed",
     "name": "Always Armed",
     "level": 3,
     "text": "The sorcerer doesn’t have to appear armed to have a weapon at the ready. Due to the nature of this ritual, it’s nearly always hung before the sorcerer enters a potentially dangerous situation. If they need to access the weapon, the sorcerer completes the ritual by reaching into their trenchcoat or a convenient shadow to summon it. Traditionally, sorcerers used this ritual to conjure swords, but in modern times it’s most common for a sorcerer to summon a shotgun or rifle. The summoned weapon can’t be larger than a shotgun or long sword."
    },
    {
     "id": "shitstorm",
     "name": "Shitstorm",
     "level": 3,
     "text": "The hedge magician surrounds themself and companions within 25 feet of them with a swirling shell of small inanimate objects. This adds +1 difficulty to hit anyone covered by the effect with a ranged attack for every 2 activation successes. Additionally, anyone attempting close combat against those affected by the ritual must soak [activation successes] in damage. This is usually bashing, unless the sorcerer was in a room filled with broken glass, small knives, or other sharp objects, in which case the damage is lethal. The sorcerer doesn’t have to target any enemy in particular for this to occur. Anyone, friend or foe, who gets too close to the flying debris is hit and must soak the damage."
    },
    {
     "id": "extraction",
     "name": "Extraction",
     "level": 4,
     "text": "Another ritual commonly hung “just in case”, Extraction allows the sorcerer to take fallen or overwhelmed companions out of battle and to safety. The sorcerer first moves out of range of combat, typically behind cover, and pulls their companions out of a shadow. There isn’t a difficulty increase or success penalty if the companions aren’t resisting and aren’t immediately being targeted — the chaos of combat can hide this ritual’s use. Once the sorcerer and their companions are out of range, they aren’t counted as being in combat unless a combatant finds them and attacks. This powerful ritual can work on up to 10 companions, who the sorcerer must define when initially performing the ritual."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The page-20 footer is split in the extraction (a lone “20”, then a lone “Sorcerer” some lines later, both before the Conjuration heading); the heading sits on the page that ends with the “21” footer, so page 21 is recorded. The schema example’s page 20 could not be confirmed from the text."
  },
  {
   "id": "conveyance",
   "name": "Conveyance",
   "page": 22,
   "description": "Whether dreaming of teleportation or flying broomsticks, people have always wanted to travel quickly from place to place. No matter how quickly they can manage it, it’s never fast enough, and many turn to magic and strange sciences to get where they’re going that much sooner. To hedge magicians, these feats may not be routine, but few of them worry about being booked to a middle seat on an airline.\n\nUntil they reach the pinnacles of Path mastery, a hedge magician using the Path of Conveyance requires some sort of vehicle, which is prepared for a single journey by the magician. Mystics tend to favor seven-league boots, flying carpets and brooms, and stranger things like chariots drawn by divine cats, while the more scientific magicians use jet packs, transforming cars, and the like.\n\nPowerful wielders of this Path, however, can cover distance without crossing the intervening space. Teleportation need not be instantaneous, but it tends not to need a vehicle; usually a ritual or device at the point of origin will suffice to send the magician wherever they want to go.",
   "system": {
    "text": "Modifiers: +2 difficulty for each unwilling target, –1 difficulty for well-known locations\n\nAspects: In addition to the Aspects of Distance, Travel Speed, and Passengers, the following each increase the number of successes needed:\n\n• 1 success to travel to a location the magician has never been to.\n\n• 2 successes to teleport, even if not instantaneous This is required to attempt to use Conveyance offensively.\n\n• Each barrier crossed costs one success. Barriers must be possible to bypass. This Path can’t penetrate hermetically sealed chambers.\n\nPrice of Failure: Mishaps with the Path of Conveyance can be extremely dangerous. Failures are innocuous enough, as simply nothing happens. Botches, however, tend to be specific to the method of transportation used and tend to impact the conjurer (pun intended) part way through the trip. Flying broomsticks fall out of the sky, seven-league boots leave you stranded leagues from your destination, and entire bodies of science-fiction discuss what happens when teleportation goes badly.",
    "aspects": [
     "Distance",
     "Travel Speed",
     "Passengers"
    ],
    "modifiers": "Modifiers: +2 difficulty for each unwilling target, –1 difficulty for well-known locations",
    "priceOfFailure": "Price of Failure: Mishaps with the Path of Conveyance can be extremely dangerous. Failures are innocuous enough, as simply nothing happens. Botches, however, tend to be specific to the method of transportation used and tend to impact the conjurer (pun intended) part way through the trip. Flying broomsticks fall out of the sky, seven-league boots leave you stranded leagues from your destination, and entire bodies of science-fiction discuss what happens when teleportation goes badly."
   },
   "levels": [],
   "rituals": [
    {
     "id": "sprint",
     "name": "Sprint",
     "level": 1,
     "text": "Sometimes, a magician needs to travel a short distance quickly. Though preparations vary, mostly by practice and Ability, this ritual always concludes by lacing up a pair of blue sneakers. Once they are on, the magician can run faster than any mundane human, so long as no one sees them do so. Each success on the ritual doubles the running speed and grants one minute of running. At the end, the ritual leaves the magician exhausted, and they must rest for five minutes."
    },
    {
     "id": "teleport_ward",
     "name": "Teleport Ward",
     "level": 2,
     "text": "Hedge magicians studying the Path of Conveyance quickly learn to defend themselves from it. By marking out a room or building in an appropriate way — a chalk circle, sigils on the walls, or anti-teleportation field projectors, etc. — they can make it harder for other hedge magicians to use the Path to enter the area. After the ritual is set, each success must be overcome by a caster trying to enter the bounded area. This protection degrades at a rate of one success per month, but a single success on another ritual roll restores it."
    },
    {
     "id": "get_me_the_heck_outta_here",
     "name": "Get Me the Heck Outta Here!",
     "level": 3,
     "text": "One of the most useful tools a magician can have in their pocket is an escape route for when things go badly. This ritual instantly brings the magician back to a pre-prepared home location within 50 miles of them. It requires at least four successes to cast, though additional successes 20 miles apiece to the ritual’s range. An additional roll when casting the ritual allows the magician to return to a secondary location if their dedicated home is too far away. This ritual is almost always cast as a hanging ritual."
    },
    {
     "id": "information_superhighway",
     "name": "Information Superhighway",
     "level": 4,
     "text": "For technology-based magicians, there’s an unusual means of transportation often overlooked by mystics. It’s harder to access than others but can sometimes reach places Conveyance normally can’t. This ritual allows the caster to travel from any electrical outlet to any other, by converting the magician into electricity. The range is limited to 5 miles per success. This travel takes one minute per 5 miles. However, the archetypical sealed room Conveyance can’t access is usually not sealed off from electricity: If an outlet exists, then the magician can get to it."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    },
    {
     "id": "teleportal",
     "name": "Teleportal",
     "level": 5,
     "text": "Masters of the Path of Conveyance can do more than simply transport themselves and others from place to place. They can create stable gateways between two locations. First, the magician must prepare both sites for the portal to be created. This takes three days of preparation at each site using trappings and materials appropriate to the caster’s Path Ability. Once the appropriate preparations are complete, the magician makes an extended roll, with one roll per hour. It requires at least one success per 10 miles between the portals. Each extra success adds five uses of the portal or a condition at one or both ends, such as a restriction on who can use it or making the portal one way. Creating this portal costs one permanent Willpower point, which is not refunded if the portal dissipates. Teleportal is a complex ritual, best accomplished with assistants."
    }
   ],
   "sidebars": [],
   "notes": "The printed text of Get Me the Heck Outta Here! reads “though additional successes 20 miles apiece to the ritual’s range” (a verb such as “add” appears to be missing in the source); transcribed as printed. The “2 successes to teleport” bullet lacks a period after “instantaneous” in the source."
  },
  {
   "id": "divination",
   "name": "Divination",
   "page": 23,
   "description": "Reading tea leaves, casting rune stones or bones, studying the night sky — all these are examples of traditional practices of Divination, variations of which span a multitude of cultures. As long as there’s been the concept of a future, there’ve been people wanting to know what it held for them. Some of the newest, though more difficult, practices involve using advanced computer programming based on extraordinary sciences and hypermath.\n\nA hedge magician performing acts of Divination attempts to predict the future. However, the future’s an ever-changing and muddied mess. A sorcerer may use Divination to find clues to the most likely outcomes, but the wise seer knows the value of accurately interpreting the imprecise and dream-like symbolism to judge likely probability changes.\n\nRarely is anything about the future set in stone. Mortals die, but the where, when, and how are determined by infinite variables: choices of action and inaction alike. The mere decision to scry the future and tell anyone about it could drastically change outcomes.\n\nBecause Divination leans on ritualistic practices, there’s no distinction between spells and rituals for this Path save casting time and effort. Divination rarely qualifies as vulgar magic, and many hedge magicians skilled in this art find it profitable to perform in the open. However, some practices such as Haruspicy (predicting the future by studying the entrails of a sacrifice) run the risk of legal consequences if discovered. Most Diviners choose one practice, but it’s not unheard of for sorcerers to have a few practices they use depending on the situation or client, especially if a favored practice is illegal or subject to being thwarted by the weather, such as with astrology.",
   "system": {
    "text": "Modifiers: +1 difficulty if using Extraordinary Science, but this Practice gives more precise probabilities.\n\n–1 difficulty when under the influence of mind-altering substances. Visions and signs may come easier and more vibrant in altered states but remain up to interpretation.\n\nAspects: Divination uses the following:\n\nTime Period\n• one day\n•• one week\n••• one month\n•••• one year\n••••• 10 years\n\nAccuracy\n• Visions and signs are incredibly vague and difficult to interpret with any certainty\n•• Typically accurate but deeply buried in symbolism\n••• Accurate but vague and open to misinterpretation\n•••• The truth’s there under layers of symbolism, but not terribly difficult to interpret\n••••• Accurate and often easy to understand, though still subject to human error\n\nQuery\n• A simple question that could be answered yes or no if you were talking to a person rather than stars or entrails\n•• A specific question that can be answered with a short and simple explanation. For example, “Which road ahead is safest?” but not “What’s our enemy’s plan?”\n••• The question could be researched and answered with public source knowledge if only you had the hours to put in.\n•••• The question may be detailed and require hidden information, but the information could be uncovered given enough time and know-how.\n••••• A very detailed query that would normally require lost, destroyed, or deliberately hidden information to answer.\n\nPrice of Failure: In the best-case scenario, the sorcerer simply receives no visions or intuition due to failure. A botch, however, can give patently false or dangerously misleading readings. The hedge magician may divine that there’s no security at the location their coven is planning on breaking into, when the place uses enough security to rival Fort Knox. Alternatively, the sorcerer might correctly divine that a door’s lock is broken but fail to understand that the owner knows this and placed armed guards to watch it. The Storyteller should vary approaches to Divination botches lest they become predictable in and out of character.",
    "aspects": [
     "Time Period",
     "Accuracy",
     "Query"
    ],
    "modifiers": "Modifiers: +1 difficulty if using Extraordinary Science, but this Practice gives more precise probabilities.\n\n–1 difficulty when under the influence of mind-altering substances. Visions and signs may come easier and more vibrant in altered states but remain up to interpretation.",
    "priceOfFailure": "Price of Failure: In the best-case scenario, the sorcerer simply receives no visions or intuition due to failure. A botch, however, can give patently false or dangerously misleading readings. The hedge magician may divine that there’s no security at the location their coven is planning on breaking into, when the place uses enough security to rival Fort Knox. Alternatively, the sorcerer might correctly divine that a door’s lock is broken but fail to understand that the owner knows this and placed armed guards to watch it. The Storyteller should vary approaches to Divination botches lest they become predictable in and out of character."
   },
   "levels": [],
   "rituals": [],
   "sidebars": [
    {
     "title": "Example Divination Practices",
     "text": "This list is by no means exhaustive — there are countless methods within the Path of Divination, and every Diviner puts something of themself into their practice. A cartomancer might have a favorite tarot deck or spread, and a bibliomancer might swear their divination is only accurate when they use works by the Brontë sisters. Players are encouraged to research divination methods and find one or more practices that best suit their character and chronicle.\n\nAbacomancy: Divination using dust, sand, or ashes of the dead dropped on a surface\n\nAstrology: Studying the interactions and positions of celestial bodies to predict the future\n\nBibliomancy: Prediction by opening books, often religious texts, to random pages\n\nCartomancy: Using a deck of cards to predict the future — often, but not always, tarot or other specialized decks\n\nCasting: Throwing carved rune stones, bones, or sticks and reading the patterns made\n\nFelidomancy: Observation of cat behavior to predict the future\n\nHaruspicy: Reading the entrails and livers of sacrificed animals\n\nOneiromancy: Interpretation of dreams\n\nOrinthomancy: Observation of bird behavior for predictions. Also known as Augury.\n\nPalmistry: Divining another’s future by reading the lines on their palm\n\nProbability Analysis: Using extraordinary science and chaos math to predict probability of future events\n\nScrying: Reading the future in pools of water, crystal balls, mirrors, clouds, etc.\n\nVideomancy: Reading the future through moving images"
    },
    {
     "title": "Storyteller Notes: Managing Divination",
     "text": "Divination can be one of the most difficult Paths for a Storyteller to allow player characters to learn. Abuse of the Path can throw a wrench in even the best laid plans and severely hinder Storytellers who rely heavily on improvisation. Storytellers are encouraged to take one or more steps to reduce Divination misuse; some suggestions are included here:\n\n• Ban Divination for player characters and only use it with Storyteller characters to advance the plot.\n\n• Roll Divination secretly for players. The hedge magician never knows for sure how accurate their visions and interpretations of such might be. If the Storyteller rolls in secret, they may distribute remaining successes among Aspects based on the specificity of the Sorcerer’s question.\n\n• Remember: Divination works in symbolism and doesn’t give precise answers without high successes or the Storyteller needing a device to advance plot. Even when using technomagic and hypermath, the sorcerer generally gets probabilities rather than certain outcomes. It’s also easier to have vague predictions come to pass than highly specific ones.\n\n• Disallow use for trivial matters, such as which coffee to order, though Willpower cost should discourage this.\n\n• When planning plot, be sure to have the question, “What if they roll Divination on this?” in the back of your mind.\n\n• Even if players dodge a negative prediction, the Storyteller might still have the prediction occur by technicality — perhaps in a way that’s not as dire or doesn’t directly affect the player characters. For example, if the sorcerer divines future personal loss, they might save their spouse’s life but lose their wedding ring in the process."
    }
   ],
   "notes": "Divination lists no Sample Rituals in the source. The Example Divination Practices sidebar is printed as a two-column table (practice name / description); it is transcribed here as “Name: description” lines. The book’s spelling “Orinthomancy” is kept as printed. The Time Period, Accuracy and Query Aspect tables are kept inside system.text."
  },
  {
   "id": "ephemera",
   "name": "Ephemera",
   "page": 25,
   "description": "Some magicians — those focusing on the Path of Summoning, Binding, and Warding — command spirits. Those who follow the Path of Ephemera seek a relationship of greater familiarity with them. To magicians who use the Path of Ephemera, their relationship to spirits is more like family and friends than master and servant. When they call for a spirit, it’s an invitation, not a subpoena.\n\nInstead of binding and commanding spirits, the Path of Ephemera allows the magician to negotiate with them. This process, called chiminage, is a give-and-take. Each spirit wants something different, related to their nature. The spirit’s request depends on the power of the spirit and the size of the task involved. Asking an Incarna to undertake a difficult and long-term task requires a lot from the magician, perhaps something only possible with a difficult quest of their own. Asking a Gaffling to do something simple that ties directly into their nature (e.g., asking a fire spirit to light a candle) would, conversely, require almost nothing of the magician, perhaps only the opportunity to do it. This process, naturally, has a steep learning curve. Most magicians find themselves on the worse end of a deal or two before they get a sense of it.\n\nThis Path almost always focuses on the Middle Umbra and, more rarely, on the Low Umbra. Rumors of versions that work with the High Umbra are persistent but remain nothing more than hearsay.",
   "system": {
    "text": "Modifiers: –2 to +2 difficulty depending on the spirit’s opinion of the magician.\n\nAspects: Metaphysical Weight and Spiritual Reach.\n\nSpiritual Reach\n• The magician can sense spirits and get their attention but can do little else.\n•• The magician is restricted to calling upon a general type of spirit\n••• Now specific spirits can be called through tailor-made rituals, and almost always show up unless the magician has offended them in some way.\n•••• Spirits begin to approach the magician unprompted. The magician can see into the Penumbra, which increases the numbers and types of spirit they can interact with. The magician can also fight back against spirits if they need to, though most try to avoid it.\n••••• The magician can now go to the spirits instead of needing them to come to the physical world. Though physical travel into the Umbra is still impossible, the magician can astrally project there, using Wits for Dexterity, Manipulation for Strength, Intelligence as Stamina, and Willpower as Health Levels. They are connected to their body by a silver thread, and if they run out of Willpower, it snaps, severing their connection and leaving them stranded.\n\nPrice of Failure: Dealings with spirits can be dangerous, especially at the early stages when all a magician can do is get the attention of whatever is nearby. Even at the higher levels, the most dangerous thing possible on a botch is to call the wrong spirit, with banes being particularly common.",
    "aspects": [
     "Metaphysical Weight",
     "Spiritual Reach"
    ],
    "modifiers": "Modifiers: –2 to +2 difficulty depending on the spirit’s opinion of the magician.",
    "priceOfFailure": "Price of Failure: Dealings with spirits can be dangerous, especially at the early stages when all a magician can do is get the attention of whatever is nearby. Even at the higher levels, the most dangerous thing possible on a botch is to call the wrong spirit, with banes being particularly common."
   },
   "levels": [
    {
     "level": 1,
     "text": "The magician can sense spirits and get their attention but can do little else."
    },
    {
     "level": 2,
     "text": "The magician is restricted to calling upon a general type of spirit"
    },
    {
     "level": 3,
     "text": "Now specific spirits can be called through tailor-made rituals, and almost always show up unless the magician has offended them in some way."
    },
    {
     "level": 4,
     "text": "Spirits begin to approach the magician unprompted. The magician can see into the Penumbra, which increases the numbers and types of spirit they can interact with. The magician can also fight back against spirits if they need to, though most try to avoid it."
    },
    {
     "level": 5,
     "text": "The magician can now go to the spirits instead of needing them to come to the physical world. Though physical travel into the Umbra is still impossible, the magician can astrally project there, using Wits for Dexterity, Manipulation for Strength, Intelligence as Stamina, and Willpower as Health Levels. They are connected to their body by a silver thread, and if they run out of Willpower, it snaps, severing their connection and leaving them stranded."
    }
   ],
   "rituals": [],
   "sidebars": [],
   "notes": "The levels array holds the Spiritual Reach Aspect table (dot-by-dot), which is the only level-by-level text in this entry; it is also kept inside system.text. No Sample Rituals appear for Ephemera in this chunk (the file ends where Enchantment begins)."
  },
  {
   "id": "enchantment",
   "name": "Enchantment",
   "page": 26,
   "description": "The Path of Enchantment rewards patience and forethought more than any other Path. There are no spells in this Path, only rituals, causing the hedge wizard to need to learn — or invent — a new ritual each time they want to make an Artifact they haven’t made before. Each of these Artifacts must be carefully crafted by the Enchanter. The first step is to create the mundane base item. Usually these are hand-crafted by the Enchanter, pushing their mundane skills to their limits to make just the right vessel for their magic. Sometimes, however, the right vessel can be found in the form of a rare or ancient object. Once the vessel has been made or found, the Enchanter can get to the process of infusing the object with magical energy to be used later. The first stage is usually accomplished through Crafts rolls (or, for technosorcerers, Technology or Hypertech rolls), while the latter is a Path roll.\n\nThe Artifacts created through Enchantment differ in several key ways from the recipes of Alchemy. Artifacts are usually persistent, or at least can be used many times. Some may be permanent, or nearly so, while others can be used a fixed number of times before their magic dissipates. Additionally, they tend to be weaker than the Wonders created by mages, and more focused. An Artifact can only have a single power, a restriction Wonders don’t have.\n\nEnchanters tend to spend a lot of time and effort on their workshops. Whatever sort of crafting they do to make their Artifacts defines them. They often see themselves as blacksmiths, jewelers, electronics engineers, or woodworkers first, and the magic they can do comes later. This leads Enchanters to pursue high levels of the Resources Background, as well as others representing a safe and secure space to do their work and the ability to acquire high quality and often exotic raw materials.",
   "system": {
    "text": "Modifiers: Once a magician creates a Talisman three times, the difficulty is reduced by 1.\n\nTime: Crafting time for the object, plus 1-3 days per level of the enchantment\n\nEffects: Enchantment doesn’t have Aspects, instead it has the following Effects:\n\n• The Enchanter can create minor items that are rarely noticeably magical to those who aren’t already aware of their powers. This can add one (or, for restricted circumstances, two) dice to an Attribute or Ability roll or decrease the difficulty by 1 for an attack or skill. Other small boons are also possible.\n\n•• More powerful versions of already possible Artifacts offer two additional dice or a –2 difficulty on a task. Some of the objects created at this level can change reality in a subtle way, being more magical than previously possible.\n\n••• Obviously magical items are now possible, though they’ll still seem merely “very weird” to the magically unaware. These include items that offer two additional dice on up to three different Attribute or Ability rolls, and those that confer supernatural perceptions to the user by replicating supernatural powers of no greater than a single dot.\n\n•••• Objects of truly superhuman power. These can raise Attributes above 5, duplicate powers (up to the second dot) of other supernatural beings, and otherwise warp reality in significant ways.\n\n••••• Extremely powerful items often bordering on the mythic. Minor miracles are possible, and often these powers are quite blatant. Items created at this level can reproduce up to three dots worth of supernatural powers. Each dot reproduced this way mimics a single effect — chosen when the item is crafted — even if the replicated power offers multiple effects.\n\nPrice of Failure: Failure usually means the magician has wasted days or weeks of their time, possibly ruining the item they were trying to enchant, but nothing worse. Botches tend to be more varied. They can result in explosions that destroy the workshop. Worse, though, they can result in objects that seem to work, but have some sort of unanticipated side effect. These cursed items tend to be hard to destroy or get rid of, often lingering long after the Enchanter is gone and even finding their way into Sleeper hands.",
    "aspects": [],
    "modifiers": "Modifiers: Once a magician creates a Talisman three times, the difficulty is reduced by 1.",
    "priceOfFailure": "Price of Failure: Failure usually means the magician has wasted days or weeks of their time, possibly ruining the item they were trying to enchant, but nothing worse. Botches tend to be more varied. They can result in explosions that destroy the workshop. Worse, though, they can result in objects that seem to work, but have some sort of unanticipated side effect. These cursed items tend to be hard to destroy or get rid of, often lingering long after the Enchanter is gone and even finding their way into Sleeper hands."
   },
   "levels": [
    {
     "level": 1,
     "text": "Army surplus jacket granting two dots of Arcane when worn."
    },
    {
     "level": 1,
     "text": "A custom handgun subtracting one from the difficulty of all aimed shots."
    },
    {
     "level": 1,
     "text": "A stuffed animal guaranteeing restful sleep to anyone sleeping in the same bed as it."
    },
    {
     "level": 1,
     "text": "A silver chain bearing a hawk’s eye medallion with a chrysoprase in that can, once per day, add 2 dice to a long-distance sight-based Perception roll."
    },
    {
     "level": 1,
     "text": "A silver toe-ring that, when worn on otherwise bare feet, protects from projectiles, adding 2 dice to all attempts to dodge them."
    },
    {
     "level": 1,
     "text": "A colored candle that, when burned, grants two dots of a Background for the purposes of a one-time favor."
    },
    {
     "level": 1,
     "text": "An oak frame that preserves anything placed in it for as long as it remains intact. It can only hold flat things, like documents and photographs, and must be sealed with almond oil and sprinkled with pure water."
    },
    {
     "level": 2,
     "text": "A pocket flask that attracts bullets when carried in a breast pocket. It can only take one impact, but it provides three dice of lethal soak before being destroyed. This enchantment is very popular among soldiers heading onto a battlefield and may have originated during World War II."
    },
    {
     "level": 2,
     "text": "Enhanced bullets dealing 2 additional dice of damage on hits. Each success on the Enchantment roll creates one bullet."
    },
    {
     "level": 2,
     "text": "A silver dancer’s anklet adding to dice to rolls involving dance when worn and visible."
    },
    {
     "level": 2,
     "text": "An iron nail that, when driven into someone’s footprint, causes them to painfully stub their toe."
    },
    {
     "level": 2,
     "text": "A small golden charm alerting the wearer when a single person it is attuned to is in danger. It must be reset each time by sprinkling it with wine. The charm works once per success on the Enchantment roll."
    },
    {
     "level": 2,
     "text": "A rowan ring which counteracts fae magic used on the wearer. This cancels one instance of fae magic per success on the Enchantment roll."
    },
    {
     "level": 3,
     "text": "Running shoes doubling the speed of the wearer when trying to outrun pursuit."
    },
    {
     "level": 3,
     "text": "A sword for ghost-slaying. It has a core of liquid mercury and does aggravated damage to the Risen and lethal damage to wraiths. It must be blessed by a priest every fortnight or the magic ends."
    },
    {
     "level": 3,
     "text": "A salve that heals three non-aggravated health levels in minutes. It must be applied under the light of the moon by someone who loves the wounded. Each success on the Enchantment roll creates one application."
    },
    {
     "level": 3,
     "text": "A bull torque made of pure obsidian. When smeared with blood it grants three dots of Strength to the wearer for one scene per success on the Enchantment roll."
    },
    {
     "level": 3,
     "text": "A handkerchief which can clean any mundane spill or stain. It requires the user to hum while mopping with it and works once per success on the Enchantment roll."
    },
    {
     "level": 4,
     "text": "An amulet warding against sorcery. Three times a day it subtracts dice equal to the successes on the Enchantment roll from spells targeting the wearer. It must be kept in a special jewelry box carved from a single crystal when not worn, or it loses one success permanently per night until it stops working."
    },
    {
     "level": 4,
     "text": "A silver torc granting superhuman Strength. The wearer has Strength 5 when using it, and once per day for each success on the Enchantment roll, may gain 3 automatic successes on a task involving Strength. When not worn, it must be kept exposed to the moon whenever the moon is visible."
    },
    {
     "level": 4,
     "text": "A silvered mail tunic that automatically converts up to 4 dice of lethal damage per turn to bashing. Upon each use, a few links fall out, and eventually it falls apart (after one use per success on the Enchantment roll). If any attempt at cleaning or repair is made, the magic is lost."
    },
    {
     "level": 4,
     "text": "A book that will, once per success on the Enchantment roll, translate anything written in it into the reader’s native language. To activate it, the page must be sprinkled with paper ash. When set down, the writing reverts to the original language."
    },
    {
     "level": 4,
     "text": "Heartseeker, a stiletto which unerringly aims for the heart when wielded in rage. It deals Strength + 5 dice of lethal damage. It must be bathed in the blood of each kill it makes or else it loses its potency."
    },
    {
     "level": 4,
     "text": "The skull of a dead wizard allowing the user to contact them for assistance. The user “donates” a pint of blood to the skull and can ask one question per success on the Enchantment roll. These questions need not be yes/no, and follow-ups (as determined by the Storyteller) do not count as additional questions. It may only be used during the new moon and requires a Willpower roll at difficulty equal to 4 plus the number of times the skull has been used. The skull crumbles to dust after the last question if the Willpower roll fails. Recently, rumors have begun to surface suggesting the skull of Porthos Fitz-Empress was recovered and enchanted in this way, though everyone has heard it from a friend of a friend."
    },
    {
     "level": 5,
     "text": "A money pouch that never quite empties. So long as at least one quarter (or other medium denomination coin for other currencies) remains in it, up to four times a day it will contain about five dollars (or equivalent) in quarters. If ever used a fifth time in one day, the magic is lost forever."
    },
    {
     "level": 5,
     "text": "An amulet of protection from physical harm. When worn, it grants five dice of soak against all damage, including aggravated. However, each use subtracts five years from the user’s life, visible on their organs, but not on the outside."
    },
    {
     "level": 5,
     "text": "An amulet hiding the user from magical detection. When worn, it adds 4 successes to the total required to find the wearer with any sort of supernatural power. Each use requires the wearer to solve a new riddle, puzzle, or enigma, activating it for one week per success on the Enchantment roll."
    },
    {
     "level": 5,
     "text": "A cloak that hides the movements of the user. It allows them to move silently and undetected even across squeaky floors. Legends say it was developed to defeat the Nightingale floors of Nijo Castle. The wearer is perfectly silent until they speak aloud. When created, one silver thread per success on the Enchantment roll is woven into the cloak, and each use breaks one of those threads. When the last one breaks, the magic is lost forever."
    },
    {
     "level": 5,
     "text": "A piano anyone can play like a master once they give a prayer to the nine Muses (by name)."
    },
    {
     "level": 5,
     "text": "An animated servant, such as a homunculus or robot. It has 10 dots of Attributes and 7 dots of Abilities, with human senses and Health levels (though no wound penalties). It doesn’t need to eat or sleep, though most robots require some sort of recharging."
    }
   ],
   "rituals": [
    {
     "id": "eldritch_mark",
     "name": "Eldritch Mark",
     "level": 1,
     "text": "By inscribing a symbol or mark onto an object or the forehead of a person, the magicians marks them as theirs. The mark is invisible to the naked eye, but obvious to anyone with magically enhanced perceptions of any sort. The mark informs anyone looking at it of the name of the magician who created the mark. This ritual takes five minutes to cast and has no Willpower cost. The mark lasts until the next new moon."
    },
    {
     "id": "enhance_craftsmanship",
     "name": "Enhance Craftsmanship",
     "level": 2,
     "text": "Sometimes, instead of a magic item, what a magician needs is an otherwise normal but perfectly crafted object. This ritual creates unbreakable blades, sweaters that don’t unravel, and similar objects whose only enhancement is in the extreme quality of their crafting. These objects cannot be enchanted further, however. Enhanced items are not magical, but an Enchanter or Alchemist can roll Perception + Occult (difficulty 6) to recognize that they were created in this manner. This ritual must be cast during the creation of the object, or takes 15-20 minutes after the fact, and costs no Willpower."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "Enchantment has no Aspects; its dot-rated Effects (1-5) are kept in system.text. The 'levels' array holds the book's 'Sample Creations' list, one entry per item at its printed dot rating. The silver torc entry had no dot marker in the extraction (sandwiched between •••• entries); it is placed at level 4 based on position and its 'Strength 5' effect. Both rituals are listed under 'Sample Rituals' although the Path has only rituals."
  },
  {
   "id": "fascination",
   "name": "Fascination",
   "page": 28,
   "description": "Stories of the enthralling sorcerer or the bewitching magician are found in folktales across the world. Devious enchanters bring the innocent under their sway, and deals struck for power entrap the hearts and minds of those so foolish as to sign away their souls to such bargains. The kernel of truth to this old trope is solid as diamond. Unscrupulous magicians bending the minds of others to their will have practiced this Path as long as anyone has wished another would just act or think in an agreeable manner.\n\nThe methods vary, but the result is the same: Break the subject’s will and enthrall them. A sorcerer employing a mystical practice may apply makeup that makes their eyes sparkle with entrancing radiance. They may spritz themselves with an alluring fragrance, drawing the attention of anyone within wafting distance. Others may simply hone their confidence into a razor’s edge, impossible to resist. Extraordinary Citizens carry tested and approved harmonic resonators that emit a subsonic frequency that rebalances neurotransmitters to facilitate compliance.\n\nThose with mind-altering powers already can resist with powers of their own if they are the specific target of a power. This goes both ways, as a student of this Path may recognize other uses of mind-altering effects and prepare themselves to resist or overcome them.",
   "system": {
    "text": "Modifiers: +1 difficulty for being disliked by the target, +2 difficulty for being hated by the target\n\nAspects: In addition to the Aspects of Number of Targets, Range, and Sympathetic Connection, Fascination uses the Allure and Willbending Aspects:\n\nAllure\n\n• Add 1 die to social die pools\n\n•• Add 2 dice to social die pools\n\n••• Add 3 dice to social die pools\n\n•••• Add 4 dice to social die pools\n\n••••• Add 5 dice to social die pools\n\nWillbending\n\n• Intriguing: You draw attention even in a crowd, and individuals find you interesting in one-on-one conversation. You may make mild suggestions that align with the target’s personality and situation such as getting another drunk if they are at a bar.\n\n•• Alluring: Almost everyone at the gathering knows you were there, and individuals will try to find a way to see you again. You may make strong suggestions that align with the target’s personality and situation, such as heading home with the hedge wizard after a fun night.\n\n••• Beguiling: Everyone assumes that you had a hand in setting up the party, and individuals around you will vie for your attention. You may make suggestions that don’t necessarily align with the target’s personality and situation, such as suggesting they break up with their long-term partner to give the caster of the spell a one-off chance.\n\n•••• Entrancing: Invitations or not, the party is held for you by everyone’s estimation. Individuals no longer just want your attention, they crave your approval, possibly making fools of themselves in the process. You may make strong suggestions that don’t align with the target’s personality or interests, such as suggesting that the target fight another to defend the magician’s honor.\n\n••••• Enthralling: If you started throwing things, this place would become a full-scale riot; those present find themselves hard-pressed to resist your requests, doing almost anything you might request. Hell, they may even kill for you or put their life on the line for you if you ask the right way. You may make strong suggestions that wildly defy the target’s character and circumstances, such as suggesting that the spell’s victim burns down a bar for daring to announce last call.\n\nPrice of Failure: The consequences of failure when manipulating hearts and minds tend to be based on the context of the situation. A simple failure at a party may go largely unnoticed after a moment of minor embarrassment, such as a spilled drink during an attempt at a grand flourish or stepping on others’ toes while making tracks across the dance floor. A botch, however, inevitably leads to humiliation, or worse. This can be represented by reversing any bonus into a penalty for the duration. The target of enchantment becomes a sworn enemy instead of a paramour or may lose the ability to feel emotions at all. The subject of the latter effect becomes numb to all forms of empathy and sympathy and requires great lengths or the passage of time to return to normal. The converse may see the victim become unhinged, transforming into a violently jealous abuser that will harm anyone they perceive as encroaching upon their claim.",
    "aspects": [
     "Number of Targets",
     "Range",
     "Sympathetic Connection",
     "Allure",
     "Willbending"
    ],
    "modifiers": "Modifiers: +1 difficulty for being disliked by the target, +2 difficulty for being hated by the target",
    "priceOfFailure": "Price of Failure: The consequences of failure when manipulating hearts and minds tend to be based on the context of the situation. A simple failure at a party may go largely unnoticed after a moment of minor embarrassment, such as a spilled drink during an attempt at a grand flourish or stepping on others’ toes while making tracks across the dance floor. A botch, however, inevitably leads to humiliation, or worse. This can be represented by reversing any bonus into a penalty for the duration. The target of enchantment becomes a sworn enemy instead of a paramour or may lose the ability to feel emotions at all. The subject of the latter effect becomes numb to all forms of empathy and sympathy and requires great lengths or the passage of time to return to normal. The converse may see the victim become unhinged, transforming into a violently jealous abuser that will harm anyone they perceive as encroaching upon their claim."
   },
   "levels": [],
   "rituals": [
    {
     "id": "belle_of_the_ball",
     "name": "Belle/Beau/Bright of the Ball",
     "level": 3,
     "text": "With knowledge of an upcoming social event and proper preparation, a sorcerer can make themselves quite the sensation. With an invitation in hand, whether intended for them or not, the magician infuses their presence into the upcoming gathering. For the duration of the specified party, they receive VIP treatment from all attendees and hired staff. The organizers give their blessing and offer a hearty “have a great night” without second-guessing their guest list."
    },
    {
     "id": "love_potion_number_9",
     "name": "Love Potion Number 9",
     "level": 4,
     "text": "Regardless of its classic and iconic nature, usage of the “love potion” has fallen out of fashion for obvious reasons. As societies have become more insistent on the importance of consent, sorcerers have had less call to take the time and resources required to perform this ritual. Those that are still willing to make the potent mixture of love and loyalty do so with hesitancy and charge a premium price.\n\nA lock of hair, a dram of blood, or a sentimental personal effect is required to create the right connection to the heart in question. When performed for an individual other than the sorcerer themselves, some part of the client is usually required as well. The ritual takes the form of the traditional potion in some practices; in others it is a sort of ritualized binding with a knotted cord. In all cases, the victim is tied to the anchor point of the sorcerer or their client.\n\nOnce performed, the victim finds themselves uneasy and sick to their stomach. The lingering nausea vanishes when the anchor is near, or when they are performing a task that they know would please the anchor."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Allure and Willbending Aspect tables (1-5 each) are kept in system.text. The extraction interleaved this Path's System and description paragraphs with the Enchantment rituals; the paragraphs were reassembled by content."
  },
  {
   "id": "fortune",
   "name": "Fortune",
   "page": 30,
   "description": "Fate is fickle, even before accounting for the manipulations of magicians. The Path of Fortune allows them to wield luck like a weapon, cutting down their enemies with curses or fortifying their allies with blessings. While methods and explanations may vary, from the Evil Eye, to the Hand of God, to probability manipulation, the Path of Fortune never makes the truly impossible happen, only the exceedingly unlikely. It’s also one of the least precise Paths: While the hedge magician sets Fortune in motion and controls the magnitude and general range of potential outcomes, the effects of this Path often surprise them or disappear into the noise of daily life.\n\nNight-Folk are harder to curse with this Path than Sleepers are. They make a Willpower roll against 4 + the magician’s Path rating, and effects without an Aspect at 5 require only a single success to negate. Those extremely powerful curses can be ignored with only two successes, though the difficulty will be 9, making it quite challenging. To resist, the victim must be aware of the magician’s curse and actively attempt to resist it. Discovering an unannounced curse can be difficult, but is possible through supernatural perceptions, such as aura reading. Mages with Prime or Entropy might notice it, and magicians with the Path of Fortune can usually recognize the work of one of their own.\n\nThe Arcane/Cloaking Background provides an additional layer of protection against curses. Targeting anyone with that Background without their explicit permission subtracts a success from the roll for each dot of Arcane they have.",
   "system": {
    "text": "Modifiers: –1 difficulty with a weak sympathetic connection (object owned by the target), –2 difficulty for a strong sympathetic connection (prized possession of target, piece of the target such as hair or nail clippings)\n\nAspects: Fortune uses the Duration Aspect, but treats all durations as one higher, with Duration 5 consisting of spells lasting for several years. Additionally, it uses the Number of Targets Aspect, but all targets must be related (members of a family, the population of a small town, etc.). The Fortune Path also uses an Aspect called Severity, as follows:\n\nSeverity\n\n• A minor blessing or curse, generally something simple, such as a Freudian slip or managing to just barely catch a bus the target needs.\n\n•• A lasting but non-permanent inconvenience, injury, or small benefit. Sprains, non-life-threatening illness, and broken objects are standard bad luck, whereas good luck might be as simple as avoiding the flu for a season, a minor combat advantage, or the resolution of a minor obstacle.\n\n••• A major setback or bonus. Temporary but grave illnesses and serious social faux pas are the most common curses, while finding helpful bureaucrats, success with gambling or relationships, or an additional die to combat pools are the most common blessings.\n\n•••• Now the blessings and curses can have serious and permanent effects. Debilitating injuries, bankruptcy, a social tragedy that leaves the target a pariah, winning the lottery, surviving almost certain death, or just a chance encounter that changes the target’s social standing are all possible.\n\n••••• Curses at this level almost always result in a painful and unusual death. Targets get decapitated, suffer incurable wasting illnesses, experience horrific car accidents, and more. Blessings are similarly dramatic, such as being rescued from state execution by a call from the governor. Other last-minute saves from certain death are possible, but also victories far rarer than one in a million: An enemy in combat may trip and break their neck, the beneficiary might find a lost tome in a used bookstore bargain bin, or they could win political office with no name recognition.\n\nPrice of Failure: Some failed Fortune spells are undetectable. The target is either lucky or unlucky naturally, resulting in the appearance of a success. Botches are a more serious matter. A twisted blessing or curse still results. Blessings first appear beneficial but every time it helps the target there are horrible consequences. Curses likewise appear to be harmful but turn out to benefit the target of the magician’s ire. This is especially dangerous for a magician who attempts to use the Path of Fortune on themself. Instead of twisted blessings, the full force of a more powerful curse, often the most powerful the magician can cause, targets them. Worst of all, the magician cannot unweave the spell they botched on themself, though they can on others.",
    "aspects": [
     "Duration",
     "Number of Targets",
     "Severity"
    ],
    "modifiers": "Modifiers: –1 difficulty with a weak sympathetic connection (object owned by the target), –2 difficulty for a strong sympathetic connection (prized possession of target, piece of the target such as hair or nail clippings)",
    "priceOfFailure": "Price of Failure: Some failed Fortune spells are undetectable. The target is either lucky or unlucky naturally, resulting in the appearance of a success. Botches are a more serious matter. A twisted blessing or curse still results. Blessings first appear beneficial but every time it helps the target there are horrible consequences. Curses likewise appear to be harmful but turn out to benefit the target of the magician’s ire. This is especially dangerous for a magician who attempts to use the Path of Fortune on themself. Instead of twisted blessings, the full force of a more powerful curse, often the most powerful the magician can cause, targets them. Worst of all, the magician cannot unweave the spell they botched on themself, though they can on others."
   },
   "levels": [],
   "rituals": [
    {
     "id": "death_curse",
     "name": "Death Curse",
     "level": 1,
     "text": "One of the most extreme rituals a magician can perform, the Death Curse always results in their death, and usually the destruction of their enemies. The magician spends all of their permanent Willpower, gaining a pool of successes equal to their value for the final spell. This ritual allows them to increase the level of Aspects to 2 higher than their Path rating, allowing relatively powerful magicians to sacrifice themselves for legendary curses (or, more rarely, blessings). Curses that resound for generations with fates worse than death for entire towns aren’t unheard of for the most powerful of magicians who find themselves willing to make the sacrifice. They make their Path roll at a difficulty determined by the Aspects as usual, but with that additional pool of automatic successes. Upon completing the ritual, the magician collapses, having spent their life in the casting; they’re often dead before they even hit the floor."
    },
    {
     "id": "step_on_a_crack",
     "name": "Step on a Crack",
     "level": 2,
     "text": "A common rhyme among children says, “If you step on a crack, you break your mother’s back.” It’s just a childish version of an ancient belief that touching cracks brings misfortune. This belief is made manifest in this ritual. Unlike most curses, the magician must inform their target of the curse for it to take effect, and the curse doesn’t automatically occur. Instead, the victim can attempt to evade the curse by not touching cracks. This, of course, inevitably proves to be impossible, triggering a curse bringing some non-life-threatening but potentially permanent harm to the victim or to their loved ones. If they can unweave (see p. 15) this curse before stepping on a crack, it is done at –2 difficulty. However, once the curse is triggered, any attempt to rid the victim of it is at +2 difficulty instead, as their actions were the direct cause of their misfortune, unfair as that may be."
    },
    {
     "id": "bashert",
     "name": "Bashert",
     "level": 3,
     "text": "Though this ritual existed in ancient times in one form or another, it has been popularized in its current form by Anne Richard and Judith Marquette. Fate may be fickle, but some matches are almost impossible to keep apart. With even a single success, the target of this ritual is nearly guaranteed to meet a perfect match, someone with the potential to be their True Love (as per the Merit on Book of Secrets p. 59), within the next year. Each additional success divides the time: two successes brings them together within six months, three decreases the wait to four months, and so on."
    },
    {
     "id": "freudian_slip",
     "name": "Freudian Slip",
     "level": 4,
     "text": "Speaking your thoughts at the wrong time can be social suicide. It can end friendships, destroy careers, and create lifelong hatreds with other consequences down the line. Magicians who study the Path of Fortune have refined this this ritual to take advantage of this knowledge. Freudian Slip curses its victim to say the worst possible thing they actually believe at their next important social event or encounter. This can include political speeches, job interviews, dates, family events, and more. Whatever the context, the next time they are trying to conceal their true feelings in a situation where revealing them would cause significant and lasting harm, they must make a Willpower roll (difficulty 8) to avoid simply blurting them out. If they avoid significant social events for a year and a day, the curse dies off, leaving them safe."
    },
    {
     "id": "generational_wealth",
     "name": "Generational Wealth",
     "level": 5,
     "text": "There are only so many ways to become wealthy enough to last for generations. Other than simple luck, all of them require a substantial sacrifice. For most, this sacrifice is borne by others, through exploitative labor practices or criminal enterprise. In fact, due to the fickle nature of luck, exploitation has always been the easier and more reliable path to wealth. This ritual allows luck to be tamed and guaranteed. It still requires a sacrifice; after all, nothing comes for free. But rather than sacrificing others, taking advantage of their desperation, the parent who seeks security for their family voluntarily sacrifices themself. Though the sacrifice must be willing, few magicians are willing to perform this ritual. Those who are willing must perform the sacrifice in some way appropriate to their practice. The beneficiaries of the sacrifice find themselves suddenly extremely lucky, able to win enough money gambling so they, their children, and their children’s children, will never have to work another day in their lives. Even if they somehow manage to throw away this vast wealth, the next generation will be just as lucky and regain it. The blessing lasts for seven generations, after which the descendants are on their own."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Severity Aspect table (1-5) is kept in system.text."
  },
  {
   "id": "healing",
   "name": "Healing",
   "page": 32,
   "description": "Wherever humanity thrives, there’s a need for healing. Since the dawn of civilization, healers sprung up out of empathy and community need. Long before science knew what germ theory was, healers learned how to serve their people from tradition, communing with spirits, trial and error, and a host of other ways. Now, even when science can prevent and cure horrifying diseases, many remain without access to such techniques. In medical deserts and communities who have historically been wronged by the medical establishment, there’s still need. People still desperately seek healers. They may not fully believe in magic or miracles, but between the choice of assured agony and a sliver of hope, many take the chance.\n\nHedge magic can achieve miraculous results. A master healer can cure cancers and speed up the healing of grievous injury beyond what should be possible, but they don’t advertise this. Even when so many are ignored and failed by the medical establishment, it’s illegal to practice medicine without a license. Beyond that, fame can be a heavy burden to carry. Many eager and empathetic hedge magicians begin learning the path of Healing, but few master it — they often burn out early from the cold and thankless world, switching to other Arts if they continue practicing magic at all.\n\nThough not always required by their Practice, many hedge magician Healers do learn some form of medicine. Those who don’t rely on extraordinary science often learn forms of healing not based on modern medicine. At the very least, in instances they do learn the basics of modern medical science, their approach to treatment can be wildly different in philosophy and technique.\n\nA healer might heal mild to moderate congenital illnesses or deformities, but more extreme examples such as regenerating limbs or raising the recently dead are the realm of legend.",
   "system": {
    "text": "Modifiers: Fast casting may only be used to stabilize lethal or aggravated damage or reduce wound penalties. All other uses must use regular spells, extended roll spells, or rituals.\n\n• 1 additional success to fix a badly healed wound\n\n• +1 difficulty to heal an uncooperative patient\n\nAspects: This path uses the Damage/Healing Aspect. Bashing damage can be healed with one success per damage level. Additionally, each success can reduce a toxin, disease, or wound penalty (caused by pain rather than a missing limb, for example) by one level. See Mage 20 p. 406 for information on wound penalties and p. 442 for the toxin and disease chart.\n\nPrice of Failure: A failure simply means the magic didn’t work; the damage was beyond the sorcerer’s ability to heal. A botch can turn horrific quickly. A Healer might make the person more susceptible to the toxin they’re trying to fight off, increasing the effective Toxin Rating. They might outright cause damage or heal something incorrectly, such as fusing eyelids shut or setting a bone crooked, so that it needs to be re-broken later. The healer might also infect themself with the disease they were trying to heal.",
    "aspects": [
     "Damage/Healing"
    ],
    "modifiers": "Modifiers: Fast casting may only be used to stabilize lethal or aggravated damage or reduce wound penalties. All other uses must use regular spells, extended roll spells, or rituals.\n\n• 1 additional success to fix a badly healed wound\n\n• +1 difficulty to heal an uncooperative patient",
    "priceOfFailure": "Price of Failure: A failure simply means the magic didn’t work; the damage was beyond the sorcerer’s ability to heal. A botch can turn horrific quickly. A Healer might make the person more susceptible to the toxin they’re trying to fight off, increasing the effective Toxin Rating. They might outright cause damage or heal something incorrectly, such as fusing eyelids shut or setting a bone crooked, so that it needs to be re-broken later. The healer might also infect themself with the disease they were trying to heal."
   },
   "levels": [],
   "rituals": [
    {
     "id": "healing_slumber",
     "name": "Healing Slumber",
     "level": 1,
     "text": "The healer treats a willing (or unconscious) patient and sends them into a deep, energizing sleep. On success, the patient remains asleep for 9 hours; when they awake, all bashing damage is healed, and the patient regains a point of Willpower. For every success above one, subtract one hour from the required sleep time. The healer cannot treat lethal or aggravated wounds in this way."
    },
    {
     "id": "jolt",
     "name": "Jolt",
     "level": 2,
     "text": "The sorcerer spends a point of Willpower and magically awakens a person who is sleeping, unconscious, or comatose. This normally requires one success but requires the toxin’s rating in successes to wake someone who is drugged, and four successes to wake the comatose. Reversing a magickal effect requires successes equal to the original effect +1 to reverse it. This power doesn’t heal the underlying illness, injury, or poisoning, and the patient falls unconscious again at the end of the scene if the healer doesn’t resolve the underlying issue. This can be used to help identify the patient and gather information about who or what put them in that state."
    },
    {
     "id": "mikes_cure_all",
     "name": "Mike’s Cure-All",
     "level": 3,
     "text": "While similar rituals were performed for centuries, or longer, this version was first recorded in Chicago during Prohibition and was based on Victorian era Cure-Alls. The healer can force a patient’s body to purge all drugs and toxins through any, and sometimes all, possible exits. This includes vomiting, sweat, tears, diarrhea, etc. The process is incredibly unpleasant but can save a poisoning victim or someone who’s overdosed. The sorcerer must get at least as many successes as the Toxin Rating for the most potent toxin in the patient’s system. No damage is healed, but the patient suffers no further ill effects. This can purge magical potions as well."
    },
    {
     "id": "humor_alignment",
     "name": "Humor Alignment",
     "level": 4,
     "text": "This is an old ritual for curing chronic and congenital conditions. It dates back to the Middle Ages when Humorism was in vogue. The healer bleeds the patient with leeches, a ritual knife, or another tool suited to their practice, which deals one level of lethal damage. The healer spends a point of Willpower and must roll at least 5 successes. The healer may perform this ritual as an extended action. The patient rests for three days, after which the lethal damage and the condition are healed. This rest needn’t be solely sleep. The patient may move minimally to perform basic bodily functions but otherwise should be laying down. If the patient is too active during the three days, the ritual fails automatically. The ritual will also fail if the patient suffers significant mental or emotional stress, such as trying to work from bed or having a heated argument."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "hellfire",
   "name": "Hellfire",
   "page": 32,
   "description": "The Path of Hellfire remains one of the most popular Paths of hedge magic, despite there being something of a bad reputation associated with it. For most people, the allure of throwing elemental power around and destroying your enemies outweighs the belief it may somehow be tainted by evil, if not outright infernal. Despite these sentiments, many hedge magicians specialize in the pyrotechnics this Path makes available to them, being one of the more dramatic Paths of hedge magic.\n\nEven beginning students of Hellfire are often accorded respect, and not a small amount of fear, by their fellows. They learn early that they can summon lightning and fire, cause earthquakes, and drown their enemies should they so choose, even if they don’t personally know how. Apprentices are also given one essential warning: They are not immune to their own powers. This vulnerability is not limited to botched attempts at magic (see the Price of Failure below). Practitioners must be careful not to be within the areas they target, and fire, once unleashed, can be difficult to control.",
   "system": {
    "text": "Aspects: Damage, Range, Area, and the following Special Effects can be added:\n\n• Decay: Instead of damaging living targets, the spell breaks down anything they are wearing or carrying. For each point of damage it would inflict, it can turn three pounds of material to junk.\n\n• Dust Storm: The spell summons a storm of dust, scouring the area (which must have at least three dots) and, in addition to damage, causing blindness in the area for one turn per health level inflicted.\n\n• Sleet: A stream of ice and freezing water causes brief blindness and leaves the ground slippery. This cannot be made aggravated.\n\n• Smoke: The caster emits a cloud of poisonous smoke that envelops the area (which must be at least three dots in the Area Aspect). Everyone within the cloud takes one level of damage per turn unless protected. A normal gas mask provides two turns of protection before becoming useless. Beings that do not need to breathe are immune to this damage. Vision, even if enhanced, is completely obscured while in the cloud.\n\n•• Earthquake: the spell causes the ground to split open and engulf, then crush, the target. They can roll Strength at difficulty 6 to try to dig free. They need as many successes as health levels of damage they suffered. This cannot be made aggravated.\n\n•• Lightning: Instead of fire, the spell fires a bolt of electricity. Anyone in contact with the target through a conductive material takes the same damage as the target.\n\n•• Tanglewood: Plants flail and attack the target, throwing thorns, splinters, and other bits of wood at it. With extreme luck (at least three successes beyond the spell’s requirement) this can stake a vampire, but a magician who counts on it will likely be badly disappointed. If the target is standing in dense undergrowth, they are captured by the plants. A creature restrained in this fashion cannot move until they accumulate as many successes on a Strength roll (difficulty 7) as damage dealt by the spell. This cannot be made aggravated.\n\n•••• Drowning Tide: This requires an Olympic sized swimming pool or larger body of water. The target is pulled underwater by a sudden wave or undertow, causing them to start drowning (see M20 page 440-441). Escape from the water requires an extended Strength roll, difficulty 8, with at least two successes necessary, often more. This only does drowning damage.\n\nThe Special Effects above must be purchased with Freebie or Experience Points at a cost of the dot rating + 1.\n\nPrice of Failure: When you play with fire sometimes you get burned. Botching when using the Path of Hellfire typically results in the spell rebounding on the caster. They take whatever damage they were attempting to inflict on their target.",
    "aspects": [
     "Damage",
     "Range",
     "Area"
    ],
    "modifiers": "",
    "priceOfFailure": "Price of Failure: When you play with fire sometimes you get burned. Botching when using the Path of Hellfire typically results in the spell rebounding on the caster. They take whatever damage they were attempting to inflict on their target."
   },
   "levels": [],
   "rituals": [
    {
     "id": "fires_weal",
     "name": "Fire’s Weal",
     "level": 2,
     "text": "Fire is one of the most dangerous hazards in the World of Darkness; even natural flames can easily cause permanent damage to powerful supernatural beings. With this ritual, the magician can give protection against fire of all sorts. With two successes, the ritual allows the target to soak fire damage, even supernatural flame, as though it were bashing, regardless of what damage it causes. Successes in excess of two reduce the difficulty on soak rolls against fire (to a maximum modifier of –3), so four total successes result in soaking fire damage at –2 difficulty."
    },
    {
     "id": "hellblade",
     "name": "Hellblade",
     "level": 2,
     "text": "A flashy ritual, Hellblade attunes a weapon, traditionally a sword, to the Path of Hellfire. Once attuned, the magician can spend one Willpower to engulf the weapon in flame. The flame causes the weapon to inflict two additional dice of damage and converts its damage to aggravated. This lasts for a scene, though the ritual ends if the weapon leaves the caster’s hand. This ritual requires a minimum of two successes."
    },
    {
     "id": "purification_of_the_inferno",
     "name": "Purification of the Inferno",
     "level": 3,
     "text": "After an unfortunate encounter with a vampire, Charles Moran developed this ritual to protect himself in the future. Unfortunately, this ritual does not discriminate friend from foe, making it an extremely risky ritual to cast when the magician might be in close quarters with others, such as in an elevator. Purification of the Inferno acts as a defensive failsafe. The first person to touch the magician after the ritual immediately bursts into flames, suffering four dice of aggravated damage. The flames then become entirely mundane, dealing three lethal damage per turn, which can be soaked at difficulty 8 until they are put out. The ritual requires three successes on casting."
    },
    {
     "id": "smoldering_ruin",
     "name": "Smoldering Ruin",
     "level": 5,
     "text": "The most common target of the Hellfire Path is an individual enemy. It’s directly offensive magic, and magicians know it and use it as such. Sometimes, targeting individuals and even groups is too small scale. Sometimes a magician really wants to just cut loose, and hedge magic doesn’t offer very many outlets to do so. Masters of Hellfire, however, developed this ritual in order to do just that: cut loose and cause damage to their enemies all at once. Smoldering Ruin requires a full three hours to cast, and in all its forms a Stamina roll (difficulty 6) must be made just to complete the exhausting ritual. Once completed, the magician spends 3 points of Willpower and must achieve at least 5 successes. Despite the difficulty, success is worth the effort: The ritual lights a building on fire, burning it to the ground. No mundane efforts can extinguish this fire, fueled by the caster’s desire for destruction, though supernatural means are capable of doing so. It can even burn buildings made out of normally fire-resistant and fireproof materials. Notably, the caster must perform the ritual while inside the building, and then hope they can escape before becoming trapped inside."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Special Effects list (dot-rated, purchased at dot rating + 1 with Freebie or Experience Points) is kept in system.text; there is no Modifiers paragraph for this Path."
  },
  {
   "id": "illusion",
   "name": "Illusion",
   "page": 35,
   "description": "One of the most fundamental magics is the power to deceive others into believing what the magician wants. The Path of Illusion confounds the senses, making its targets perceive things that aren’t there or altering their perception of what is there. Most people trust their senses. “Seeing is believing,” but when an illusionist is nearby, this old adage can kill you.\n\nThe Path of Illusion is much less direct in most of its applications than some of the other Paths. Illusionists tend to be clever manipulators, at the least in order to choose just the right false vision for whatever task must be completed. This often requires strange patterns of thought and lateral thinking, leading illusionists to become eccentric over time.\n\nWhen targeted with the Path of Illusion, avoiding the deception is always a possibility. A Perception + Alertness roll at difficulty (4 + Realism Aspect) for spells, and difficulty (4 + Rank) for rituals reveals the slight imperfections in the illusion. This requires one success for each sense covered by the illusion, though in cases where an essential sense, as determined by the Storyteller, is left out, the number of successes required may decrease. Anyone who makes this roll can tell that what they are perceiving isn’t real, though they perceive both it and the truth. If they alert others to this fact, they can reroll once.",
   "system": {
    "text": "Modifiers: –1 to –3 difficulty if using a base similar to the goal (making a table appear differently is easier than making a table appear from nothing)\n\nAspects: Duration, Number of Targets, and the following:\n\nSenses\n• Affects one sense\n•• Affects two senses\n••• Affects three senses\n•••• Affects four senses\n••••• Full sensory range\n\nRealism\n• Completely immobile and fixed; if visual, flat\n•• Changes with perspective so the viewer moving doesn’t disrupt it immediately\n••• Illusions can have moving parts, but only large ones\n•••• Smaller motions and variations are possible, but there are still subtle tells\n••••• Fully immersive, this level completely fools all targeted senses\n\nPrice of Failure: Naive magicians think botching an illusion must be no big deal. The spell did nothing real, so nothing real should happen when it goes awry. On the contrary, the caster’s perceptions are altered. Worse, most of the alterations are subtle and easily missed. For larger spells, though, there will eventually be a substantial change, likely when most dangerous for the caster to be caught unaware.",
    "aspects": [
     "Duration",
     "Number of Targets",
     "Senses",
     "Realism"
    ],
    "modifiers": "Modifiers: –1 to –3 difficulty if using a base similar to the goal (making a table appear differently is easier than making a table appear from nothing)",
    "priceOfFailure": "Price of Failure: Naive magicians think botching an illusion must be no big deal. The spell did nothing real, so nothing real should happen when it goes awry. On the contrary, the caster’s perceptions are altered. Worse, most of the alterations are subtle and easily missed. For larger spells, though, there will eventually be a substantial change, likely when most dangerous for the caster to be caught unaware."
   },
   "levels": [
    {
     "level": 1,
     "text": "Senses: Affects one sense"
    },
    {
     "level": 2,
     "text": "Senses: Affects two senses"
    },
    {
     "level": 3,
     "text": "Senses: Affects three senses"
    },
    {
     "level": 4,
     "text": "Senses: Affects four senses"
    },
    {
     "level": 5,
     "text": "Senses: Full sensory range"
    },
    {
     "level": 1,
     "text": "Realism: Completely immobile and fixed; if visual, flat"
    },
    {
     "level": 2,
     "text": "Realism: Changes with perspective so the viewer moving doesn’t disrupt it immediately"
    },
    {
     "level": 3,
     "text": "Realism: Illusions can have moving parts, but only large ones"
    },
    {
     "level": 4,
     "text": "Realism: Smaller motions and variations are possible, but there are still subtle tells"
    },
    {
     "level": 5,
     "text": "Realism: Fully immersive, this level completely fools all targeted senses"
    }
   ],
   "rituals": [
    {
     "id": "cruel_whispers",
     "name": "Cruel Whispers",
     "level": 2,
     "text": "Illusionists must often be masters of psychological warfare. They can’t create anything truly real, so they play on the fears and anxieties of their targets to control them. One of the key rituals for this is Cruel Whispers. A purely auditory illusion, Cruel Whispers follows its target around for twenty-four hours. Though the magician may never know what the whispers are saying, the victim hears voices, just barely audible, pointing out every flaw, every insecurity, and ever misstep they make during the day. This distracts them, giving them +1 difficulty on all rolls for the day, and whenever they botch they must make a Willpower roll (difficulty 6) or else suffer the effects of the Chronic Depression Flaw (BoS p. 51) for one week."
    },
    {
     "id": "hard_light_constructs",
     "name": "Hard-Light Constructs",
     "level": 3,
     "text": "A popular ritual among technosorcerers, Hard-Light Constructs are illusions everyone involved knows are fake. This creates scenery, furniture, etc., that looks and feels real, though putting your weight onto it wouldn’t be the best idea. It’s often used to simulate visuals where every single detail isn’t needed, but which have moving parts. It creates the illusion for all onlookers, rather than a fixed set of targets. At least one Extraordinary Citizen has been reprimanded for using Hard-Light Constructs to run their World of Shadows game."
    },
    {
     "id": "instant_feast",
     "name": "Instant Feast",
     "level": 4,
     "text": "Illusory food is deceptively hard to create. Taste, smell, image, and texture all need to be just right to fool someone into thinking they’re eating a real meal. The target rolls Perception + Alertness (difficulty 7). On failure, they believe they are eating real food for the duration of the meal, whatever food the magician can imagine. However, they’re still hungry. This provides no sustenance (unless the illusion is covering up some other food), though if six or more successes are rolled on the casting, hunger cues are suppressed for a number of hours equal to the target’s Stamina, before they feel hungry again. This can’t alleviate the effects of starvation."
    },
    {
     "id": "oubliette",
     "name": "Oubliette",
     "level": 5,
     "text": "One of the most terrifying rituals of the Path of Illusion, Oubliette has broken some of the strongest people in the world. The magician must be within a few feet of their target for the entirety of a three-hour ritual, which requires at least 5 successes. If they can accomplish this, then the ritual removes all five senses from the victim. They are trapped in a world without any sensation until either the magician releases them or they accumulate 5 successes on Perception rolls at difficulty 9, making one every hour. The victim must start over on a botch. Often, the victims of this ritual are being punished for heinous crimes, and have it cast on them before they are thrown into a hole and forgotten, left to starve without even knowing they are starving."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Senses and Realism tables are Path-specific Aspect ratings; they are reproduced in system.text and also as levels entries prefixed with the Aspect name."
  },
  {
   "id": "maelstroms",
   "name": "Maelstroms",
   "page": 37,
   "description": "Discovered by accident, the Path of Maelstroms was originally an attempt to rediscover Weather Control. Traditionally referred to as “Whistle” (as in, “whistling up a storm”), the magicians using it sought to conjure intense gales of wind and rain in the world of the living. It took until the 19th century to discover that these tempests were stolen from the Shadowlands.\n\nMaelstrom pulls the energy to create its storms from two sources. The first is the caster’s force of will. Spells and rituals of this Path cost one Willpower point per level rather than the usual flat one point for most Paths. The other source of power is the Shadowlands itself, pulling its energy out and rendering ghosts in the area calm or forcibly driving the dead from the area depending on the size of the storm.\n\nThe most common instrument for this Path is, by far, music. Most users say that from the moment they learned it, they could hear music in their head, and some believe it grows louder when the storms they can draw from are stronger. For these people, their Alertness is capped at 3, due to the distraction of the music. Others, however, don’t experience this effect and suffer no penalty.",
   "system": {
    "text": "Aspects: Area, Duration, and Intensity\n\nIntensity\n• Drawing a breeze and fog from the underworld into the world of the living pacifies the local Shadowlands. Ghosts in the area are calmed. They’ll defend themselves, but otherwise they won’t attack anyone in the area for the duration without succeeding on a Willpower roll (difficulty 6).\n•• A rainstorm is summoned, and it drains so much energy from the underworld that ghosts are frozen in place unless they make a Willpower roll (difficulty 7). They’re made just corporeal enough that the magician can physically move them. Usually, they remove the ghosts from an area where they are unwelcome.\n••• Calling a full-scale thunderstorm does even more to quiet the Shadowlands. This drains the power of Oblivion from the area. Ghosts are sedated as in the first rank, but those under control of their Shadows are restored to reason. Results vary with spectres, but legends exist of hedge magicians with this Path pulling a spectre away from Oblivion.\n•••• Powerful storms in the world of the living, with gale-force winds, hail, and plenty of property damage can truly sap the power of Oblivion in the Shadowlands. Spectres and other deeply malicious ghosts who fail a Willpower roll (difficulty 8) disappear within the barrage of wind and hail. No hedge magician knows for sure what happens to these spirits, but they are never seen in the location where the power was evoked for a year and a day.\n••••• A massive storm draining all energy from the corresponding region of the Shadowlands. Both the area and its reflection in the Shadowlands becomes utterly uninhabitable for ghosts. The Restless Dead must flee the area, or else suffer five dice of damage per round until they do so.\n\nPrice of Failure: The magician’s control over these storms is tenuous at best. On a failure, the Willpower is still expended but nothing happens. Botches, however, result in storms that go out of control, both in the world of the living and the Shadowlands. When a hedge magician loses control of the energies of this Path, they call forth a piece of the Tempest. This causes normal ghosts to become disoriented and have difficulty moving around. Spectres, on the other hand, thrive in this environment. These most malicious of spirits ride the Tempest directly up to the Shadowlands and have an easier time manifesting in the area for the duration the spell would have had.",
    "aspects": [
     "Area",
     "Duration",
     "Intensity"
    ],
    "modifiers": "",
    "priceOfFailure": "Price of Failure: The magician’s control over these storms is tenuous at best. On a failure, the Willpower is still expended but nothing happens. Botches, however, result in storms that go out of control, both in the world of the living and the Shadowlands. When a hedge magician loses control of the energies of this Path, they call forth a piece of the Tempest. This causes normal ghosts to become disoriented and have difficulty moving around. Spectres, on the other hand, thrive in this environment. These most malicious of spirits ride the Tempest directly up to the Shadowlands and have an easier time manifesting in the area for the duration the spell would have had."
   },
   "levels": [
    {
     "level": 1,
     "text": "Intensity: Drawing a breeze and fog from the underworld into the world of the living pacifies the local Shadowlands. Ghosts in the area are calmed. They’ll defend themselves, but otherwise they won’t attack anyone in the area for the duration without succeeding on a Willpower roll (difficulty 6)."
    },
    {
     "level": 2,
     "text": "Intensity: A rainstorm is summoned, and it drains so much energy from the underworld that ghosts are frozen in place unless they make a Willpower roll (difficulty 7). They’re made just corporeal enough that the magician can physically move them. Usually, they remove the ghosts from an area where they are unwelcome."
    },
    {
     "level": 3,
     "text": "Intensity: Calling a full-scale thunderstorm does even more to quiet the Shadowlands. This drains the power of Oblivion from the area. Ghosts are sedated as in the first rank, but those under control of their Shadows are restored to reason. Results vary with spectres, but legends exist of hedge magicians with this Path pulling a spectre away from Oblivion."
    },
    {
     "level": 4,
     "text": "Intensity: Powerful storms in the world of the living, with gale-force winds, hail, and plenty of property damage can truly sap the power of Oblivion in the Shadowlands. Spectres and other deeply malicious ghosts who fail a Willpower roll (difficulty 8) disappear within the barrage of wind and hail. No hedge magician knows for sure what happens to these spirits, but they are never seen in the location where the power was evoked for a year and a day."
    },
    {
     "level": 5,
     "text": "Intensity: A massive storm draining all energy from the corresponding region of the Shadowlands. Both the area and its reflection in the Shadowlands becomes utterly uninhabitable for ghosts. The Restless Dead must flee the area, or else suffer five dice of damage per round until they do so."
    }
   ],
   "rituals": [
    {
     "id": "rest_in_peace",
     "name": "Rest in Peace",
     "level": 2,
     "text": "By summoning a thunderstorm from the underworld, the magician can place nearby ghosts into a state of Slumber. Slumber is similar in many ways to sleep for the living. It is restorative for the ghost’s ephemeral form and restful for their minds and personalities. While in Slumber, the ghost loses awareness of their surroundings, instead experiencing vivid dreams. Usually those dreams are lively and colorful, focused on the ghost’s passions, but with a darkness overlaying them due to the Shadow. The Slumber created by this ritual brings better, more peaceful dreams. The Shadow’s influence over them is diminished to nothing, and even Spectres find themselves having positive dreams for the first time since they fell to their Shadows. A single success always puts a willing target into Slumber, but unwilling targets (like most Spectres) roll Willpower (difficulty 6) and must achieve more successes than the ritual in order to stay awake."
    },
    {
     "id": "calm_above_hell_below",
     "name": "Calm Above, Hell Below",
     "level": 3,
     "text": "Spells for the Path of Maelstroms generally bring Tempest energy from the Underworld into the physical world. This creates the storms above and calms the below. This ritual reverses that. It can only be performed during a storm, and when complete, any normal storm in the area dies down. Extreme weather events are largely unaffected and can be used to perform this ritual several times, even decreasing the difficulty by one. However, it is rarely a good idea to sit outside in a hurricane for several hours. The storm’s energy enrages the ghosts in the area. On a single success, they must make Willpower rolls (difficulty 6), or they begin lashing out, attacking each other and even the living if they have the power to do so. If the caster achieves five or more successes, this additionally creates a Maelstrom, causing most ghosts to attempt to flee the area, before being attacked by the spectres such disturbances inevitably attract."
    },
    {
     "id": "shelter_for_the_dead",
     "name": "Shelter for the Dead",
     "level": 5,
     "text": "A powerful but only situationally useful ritual, Shelter for the Dead can only be performed with the largest storms from the Underworld: The Great Maelstroms. No one knows how or when it was developed, but it was first used to protect the ghosts of Constantinople during the Great Maelstrom caused by the Black Death. The ritual is passed down by those few who know it to their students, hoping that it will never be necessary but knowing how valuable it can be if the worst happens. At the cost of risking an extreme storm battering the lands of the living, Shelter for the Dead creates a region, no more than the size of a modern city block, where the Maelstrom cannot enter. Rather, if the pieces of the Great Maelstrom do enter, they immediately are transformed into brutal storms, with extreme wind, hailstones the size of fists, and other strange things, regardless of the usual weather in the area. The ritual requires ten successes, almost always necessitating a group, and lasts for one day, plus one for each additional success beyond the minimal ten."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Intensity table is a Path-specific Aspect rating; reproduced in system.text and as levels entries."
  },
  {
   "id": "necromancy",
   "name": "Necromancy",
   "page": 39,
   "description": "Some things should stay buried. Chief among them: the dead. But those who follow the Path of Necromancy see things a bit differently. Like Hellfire, Necromancy has a reputation for being foul, practiced only by the worst of the worst. Unlike Hellfire, this reputation is at least somewhat deserved. Even the simplest of Necromancy spells involve forcibly bending the dead to the magician’s will, and the most powerful of them can manipulate the powers of the Shadowlands to affect the living as well.\n\nThough methods vary wildly with practice, Necromancy always requires that the magician’s first instruments include the preserved piece of the corpse of someone they cared for, almost always a family member. This creates the link between the magician and the underworld, allowing them to become a conduit for the energies of death itself. While for mystical magicians, crafting such an instrument often feels natural, technomagicians tend to find themselves with unique, grisly objects, like keyboards with keys made of bone or computer chips with brain neurons embedded in the circuitry.\n\nUsing this Path is difficult. Not in the sense of technique — it is no more complex to use than any other Path. Rather, it takes an emotional toll on the magician. The living are not meant to channel the energies of death so directly. They feel the grief of their ancestors, back for centuries, perhaps millennia. This overwhelming despair at the loss of countless generations leads to complications, particularly for magicians who are low on Willpower. Finally, those energies cause harm to the user, and each spell or ritual causes the caster to take one level of bashing damage per level of the power being invoked, unless otherwise mentioned in the description.",
   "system": {
    "text": "Aspects: Duration along with Ghost Binding:\n\nGhost Binding\n• The caster can see, hear, and speak to ghosts in their vicinity, whichever side of the Shroud they are on.\n•• The magician can now terrify the restless dead. Filling themself with the necrotic energy of the Shadowlands, the dead can see them as alive but infused with the power of death. This results in a –2 difficulty on all Intimidation and Subterfuge rolls against the dead.\n••• The caster forces a ghost to take on a corporeal form, whether they could do so on their own or not. For the duration, the ghost is for all intents and purposes a living person again, including the usual seven Health levels. If killed, however, they don’t simply return to being a ghost. Instead, the experience transforms the ghost into a spectre, a ghost consumed by and subservient to the powers of Oblivion. And this spectre has a grudge against the caster.\n•••• Any ghost can be summoned to the caster at this level. All the magician needs is the ghost’s True Name and to win a contested Willpower roll. If the necromancer is successful, the ghost must then immediately arrive. Keep in mind that most dead people do not become ghosts, and most ghosts do not appreciate being summoned.\n••••• Masters of Necromancy can compel obedience from the dead. In addition to the Path roll, they must win a contested Willpower roll. If they do so, they can demand the ghost perform one simple task or answer one simple question to the best of their ability. For tasks, the Duration Aspect covers how long the ghost must attempt to accomplish it.\n\nPrice of Failure: Failure for most Paths simply results in nothing happening. For Necromancy, the despair of generations overwhelms them, resulting in a derangement, usually severe depression, for an hour. If they have less than three temporary Willpower points, then the derangement instead lasts a week. Botches are truly dangerous, with not only the derangements lasting longer (a full month) and the near certainty of very angry ghosts, but the magician runs the risk of being pulled out of his body, leaving it apparently comatose while their mind spends the month “living” as one of the restless dead.",
    "aspects": [
     "Duration",
     "Ghost Binding"
    ],
    "modifiers": "",
    "priceOfFailure": "Price of Failure: Failure for most Paths simply results in nothing happening. For Necromancy, the despair of generations overwhelms them, resulting in a derangement, usually severe depression, for an hour. If they have less than three temporary Willpower points, then the derangement instead lasts a week. Botches are truly dangerous, with not only the derangements lasting longer (a full month) and the near certainty of very angry ghosts, but the magician runs the risk of being pulled out of his body, leaving it apparently comatose while their mind spends the month “living” as one of the restless dead."
   },
   "levels": [
    {
     "level": 1,
     "text": "Ghost Binding: The caster can see, hear, and speak to ghosts in their vicinity, whichever side of the Shroud they are on."
    },
    {
     "level": 2,
     "text": "Ghost Binding: The magician can now terrify the restless dead. Filling themself with the necrotic energy of the Shadowlands, the dead can see them as alive but infused with the power of death. This results in a –2 difficulty on all Intimidation and Subterfuge rolls against the dead."
    },
    {
     "level": 3,
     "text": "Ghost Binding: The caster forces a ghost to take on a corporeal form, whether they could do so on their own or not. For the duration, the ghost is for all intents and purposes a living person again, including the usual seven Health levels. If killed, however, they don’t simply return to being a ghost. Instead, the experience transforms the ghost into a spectre, a ghost consumed by and subservient to the powers of Oblivion. And this spectre has a grudge against the caster."
    },
    {
     "level": 4,
     "text": "Ghost Binding: Any ghost can be summoned to the caster at this level. All the magician needs is the ghost’s True Name and to win a contested Willpower roll. If the necromancer is successful, the ghost must then immediately arrive. Keep in mind that most dead people do not become ghosts, and most ghosts do not appreciate being summoned."
    },
    {
     "level": 5,
     "text": "Ghost Binding: Masters of Necromancy can compel obedience from the dead. In addition to the Path roll, they must win a contested Willpower roll. If they do so, they can demand the ghost perform one simple task or answer one simple question to the best of their ability. For tasks, the Duration Aspect covers how long the ghost must attempt to accomplish it."
    }
   ],
   "rituals": [
    {
     "id": "deathsight",
     "name": "Deathsight",
     "level": 1,
     "text": "Normally, a necromancer can only see the ghosts around them. They can’t see the environment the ghosts call home. This ritual changes that. With it, a magician not only sees the Restless Dead, but can actually peer into the Shadowlands. This effect lasts for one minute per success on the ritual. While under the influence of this ritual, the necromancer cannot perceive the normal world; only the Shadowlands are visible to them."
    },
    {
     "id": "wrapped_in_a_shroud",
     "name": "Wrapped in a Shroud",
     "level": 3,
     "text": "The Shroud separates the world of the living from the world of the dead. It can be difficult to cross this barrier, a fact which protects the living and the dead both from each other. Usually, either a necromancer must reach across from the land of the living to the world of the dead, or a ghost must have crossed to accomplish something among the living, in order for them to interact. For one minute per success on this ritual, the necromancer manages to actually stand between worlds, able to interact directly with both without further magic. Both human beings and ghosts can interact freely with the magician, for better or for worse."
    },
    {
     "id": "forced_medium",
     "name": "Forced Medium",
     "level": 4,
     "text": "Some people are naturally easier for ghosts to possess. These mediums may view this as a gift or a curse, but it marks them apart. These are the people who deal with the spirit worlds, and who ghosts will come to in order to either ask them to solve a problem or else take over their body to compel them do so. This ritual gives the target the merit Medium (BoS p. 69) for a week, along with a –2 difficulty on attempts by ghosts to possess them."
    },
    {
     "id": "steal_life",
     "name": "Steal Life",
     "level": 5,
     "text": "One of the darkest arts of Necromancy, masters of the Path can steal the life energy from another living person. The caster first fills themself with death energy but doesn’t shape it directly into a spell. Instead, before it can absorb their own life force, they push it into their victim. This transfer takes with it the most recent five health levels of damage the caster currently suffers from. The caster heals those injuries. Most versions of this ritual involve carving sigils into the victim (or piercing them with electrical wires, or any number of other techniques) causing additional harm. Needless to say, very few survive this process, and those who do often hunt the necromancer until the end of their days."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Ghost Binding table is a Path-specific Aspect rating; reproduced in system.text and as levels entries."
  },
  {
   "id": "necronics",
   "name": "Necronics",
   "page": 41,
   "description": "One of the newest Paths, only discovered by ghost hunters in the late 1990s, the Path of Necronics was first studied by “Black Hat” hackers attempting to combine their understanding of electronics with the world of the dead. They use various techniques to manipulate their own bioelectricity, or life energy, to affect the world of the dead in some way. Because living energy is antithetical to the Shadowlands, this tends to result in impeding ghosts’ efforts to manage their hauntings.\n\nAs a new Path, there’s a lot not yet understood about Necronics. Almost all current practitioners use electronic devices — usually computers, phones, and tablets — to cast Necronics spells. Though analogues in traditional cultures exist, those Paths may or may not be the same as Necronics, using lower-tech and more traditional methods. Ghost hunters investigating Necronics tend to be fascinated by these practices. They think studying them will provide new techniques they can apply to handle hauntings.\n\nIn addition to the consequences of botching noted below, Necronics holds one other great danger for the magician. Because users are manipulating their bioelectricity so strongly, touching them while they are working is dangerous. Even the lightest touch by another living thing throws off the magician’s focus and control of bioelecticity, causing a feedback loop to form. This feedback causes them to take a level of aggravated damage and fail the spell or ritual. The magician needs immediate medical attention to stabilize them and is left weakened (–1 die to all actions) for one week per level of the spell or ritual disrupted.",
   "system": {
    "text": "Aspects: Area, Duration, and Impedance:\n\nImpedance\n• The magician floods the local underworld with electrical energy, shutting down all active ghostly powers. Ghosts may ignore this, continuing as they were, if they succeed on a Willpower roll (difficulty 8).\n•• At this level, instead of merely stopping a haunting, the magician can increase the Shroud rating. This costs one success per rank increased, with the first rank included in the base cost of the spell (so in addition to the regular requirements, 2 successes are needed to increase the Shroud from 6 to 9).\n••• Places can be defended from haunting by the simple technique of tricking the ghost into haunting somewhere else. At this rank, the magician can create a trap, a fake realm the ghost can haunt instead of the real location. A ghost can realize they’ve been tricked with a Wits + Enigmas roll (difficulty 8) and can escape with another one.\n•••• At this level, the magician may directly use their bioelectricity as an attack against a ghost. When using this rank of Necronics, the Area and Duration Aspects are replaced by Damage and Range.\n••••• Masters of this Path are capable of devastating a region of the Shadowlands and its inhabitants. They call it “creating a zero,” and they “format” the space to a default pattern. When successful, there’s nothing left. For the duration of the spell, the region becomes uninhabitable to ghosts, causing the Restless Dead to lose Corpus at a rate of 3 per turn until they can escape the area. If they fail to escape before running out of Corpus levels, they disappear. Magicians generally believe these ghosts have been destroyed completely, rather than the usual consequences of running out of Corpus. As no Necronics expert has ever seen one that survived being “zeroed out,” this seems to be the best guess.\n\nPrice of Failure: Because the Necronics magician uses their own bioelectricity to interact with the dead, botches are particularly risky. They aren’t just extending mystical senses, but rather a very real and physical part of themself. On a botch, the intended effect doesn’t happen. Instead, all ghosts in the area gain Pathos and Angst equal to the level of the spell or ritual being performed. They also become acutely aware of the magician trying to control or banish them and can affect the magician directly with their powers as though they were a ghost, rather than having to work through the Shroud or specific powers allowing them to touch the living.",
    "aspects": [
     "Area",
     "Duration",
     "Impedance"
    ],
    "modifiers": "",
    "priceOfFailure": "Price of Failure: Because the Necronics magician uses their own bioelectricity to interact with the dead, botches are particularly risky. They aren’t just extending mystical senses, but rather a very real and physical part of themself. On a botch, the intended effect doesn’t happen. Instead, all ghosts in the area gain Pathos and Angst equal to the level of the spell or ritual being performed. They also become acutely aware of the magician trying to control or banish them and can affect the magician directly with their powers as though they were a ghost, rather than having to work through the Shroud or specific powers allowing them to touch the living."
   },
   "levels": [
    {
     "level": 1,
     "text": "Impedance: The magician floods the local underworld with electrical energy, shutting down all active ghostly powers. Ghosts may ignore this, continuing as they were, if they succeed on a Willpower roll (difficulty 8)."
    },
    {
     "level": 2,
     "text": "Impedance: At this level, instead of merely stopping a haunting, the magician can increase the Shroud rating. This costs one success per rank increased, with the first rank included in the base cost of the spell (so in addition to the regular requirements, 2 successes are needed to increase the Shroud from 6 to 9)."
    },
    {
     "level": 3,
     "text": "Impedance: Places can be defended from haunting by the simple technique of tricking the ghost into haunting somewhere else. At this rank, the magician can create a trap, a fake realm the ghost can haunt instead of the real location. A ghost can realize they’ve been tricked with a Wits + Enigmas roll (difficulty 8) and can escape with another one."
    },
    {
     "level": 4,
     "text": "Impedance: At this level, the magician may directly use their bioelectricity as an attack against a ghost. When using this rank of Necronics, the Area and Duration Aspects are replaced by Damage and Range."
    },
    {
     "level": 5,
     "text": "Impedance: Masters of this Path are capable of devastating a region of the Shadowlands and its inhabitants. They call it “creating a zero,” and they “format” the space to a default pattern. When successful, there’s nothing left. For the duration of the spell, the region becomes uninhabitable to ghosts, causing the Restless Dead to lose Corpus at a rate of 3 per turn until they can escape the area. If they fail to escape before running out of Corpus levels, they disappear. Magicians generally believe these ghosts have been destroyed completely, rather than the usual consequences of running out of Corpus. As no Necronics expert has ever seen one that survived being “zeroed out,” this seems to be the best guess."
    }
   ],
   "rituals": [
    {
     "id": "shroud_bubble",
     "name": "Shroud Bubble",
     "level": 3,
     "text": "Sometimes, when all else fails, the best thing a magician can do when faced with a troublesome haunting is to hide and wait it out. The problem being that ghosts have a nasty tendency to walk through walls and most other protective barriers. They also tend to be relentless, often obsessed when their minds are turned to a task. Desperate magicians being haunted by perseverant ghosts invented the concept of the Shroud Bubble to protect themselves, especially when waiting for backup to arrive to handle the ghost more directly. The ritual requires three successes but increases the Shroud to 10 near the magician. In fact, the Shroud rating increases in a sphere just large enough to contain them. The effect remains stationary, so the magician can’t leave the area without increasing their risk from ghosts and lasts for 8 hours."
    },
    {
     "id": "shut_it_down",
     "name": "Shut It Down",
     "level": 3,
     "text": "Hauntings can vary in scale. For ones confined to a room or two, it’s fairly simple to shut down the powers the ghosts are using to interact with the physical world. More often, though, there’s a whole building or larger area being haunted, and if the ghost is denied one room, they’ll just go to another. With Shut It Down, a much larger area than usual can be quieted, such that ghostly powers are impossible to use. The magician must mark the corners of the building or area, which can be as large as a full city block of empty land or a single building. The ritual requires at least 3 successes, and ghosts inside can only use their powers if they succeed on a Willpower roll at difficulty 8."
    },
    {
     "id": "doxxing",
     "name": "Doxxing",
     "level": 4,
     "text": "By reading the currents generated by a ghost and its movements, the magician can glean information from it. Each piece of information comes with a cost and must be declared and paid for before the casting. Any resources spent in this way are not refunded if the ritual fails. No information is gained if the ritual fails to achieve the number of successes required for the information being sought out:\n• Identifying a Passion — One success each. This identifies both the Passion and the emotion it is tied to.\n• Nature, Demeanor, and Shadow Archetype — One success and one point of Willpower each.\n• Identifying a Fetter — Much more difficult, this requires two successes and a point of Willpower.\n• The True Name of the ghost — This requires five successes and two points of Willpower."
    },
    {
     "id": "overwrite",
     "name": "Overwrite",
     "level": 5,
     "text": "The ultimate expression of the Path of Necronics, the practitioner concludes that all ghosts are electromagnetic signals trapped in the matrix of a formerly living person’s personality. This explains why they’re so malleable, for good or ill. With this ritual, the magician can rewrite the nature of the ghost on a fundamental level. To do so, they must know the ghost’s True Name and possess one of the ghost’s Fetters. The ritual takes 12 hours and requires two Stamina rolls (at difficulty 6) to complete. For this entire time, the ghost must be held within the same room as the caster, roughly a 10-foot by 10-foot space. Upon completion of the ritual, significant changes can be made to the ghost, but each has a cost. They last for one lunar cycle by default but become permanent if the costs are doubled. Some of the possible changes are:\n• 1 success and 1 Willpower point per level to change Passions, and an extra Willpower to change to a different emotion.\n• 2 successes and 1 Health Level — not damage, the Health Level itself disappears for the duration — to add or remove a point of Angst.\n• 5 successes and 5 Willpower to overwrite the ghost entirely with another specific personality."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Impedance table is a Path-specific Aspect rating; reproduced in system.text and as levels entries."
  },
  {
   "id": "oneiromancy",
   "name": "Oneiromancy",
   "page": 42,
   "description": "The Realm of Dreams is a fluid place that responds to the mood and imagination of the dreamer. Some people, particularly those with the Lucid Dreaming Talent (Mage 20 p. 294), can take control of their own dreams, rendering normal bad dreams controllable, good dreams fun experiences, and other dreams possible sources of insight into themselves. Without magic, though, the greater Realm of Dreams is still locked away, with each dreamer confined to their own psyche.\n\nMagicians who learn the Path of Oneiromancy learn to walk into the dreams of others. Once there, they try to take control, and can glean information or alter dreams to the benefit or harm of the dreamer. At the peak of their power, oneiromancers can even bring several people together in a shared dream. According to legend, some can even make dreams real or become capable of physically entering dreams.",
   "system": {
    "text": "Aspects: The Path of Oneiromancy has two Aspects: Sympathetic Connection and Dreamwalking\n\nDreamwalking\n• Basic Oneiromancy allows the magician to touch the dreams of others, seeing flashes of imagery that could be interpreted to get insights into their target’s nature and history.\n•• The oneiromancer can now enter the dreams of others, not merely see them. They become a part of the dream, forced to take on a role appropriate to the dream itself. Once in the dream, changes can be made. The magnitude of the changes determines the difficulty of an additional Oneiromancy roll, with creating small items being difficulty 6 but violating the theme of the dream being difficulty 8, perhaps with a Threshold.\n••• Dreamwalkers can now watch dreams from the outside, seeing them clearly but not being pulled into them. They can now truly transform the dreams they encounter. With this rank, they can create terrors mimicking the Nightmares Flaw or soothe a dream to the point of helping the dreamer regain an additional point of temporary Willpower.\n•••• Dream Sendings become available to the caster at this level. They can craft specific and detailed dream sequences for their target that repeat once per success. If they repeat more than once or twice per night, the target can become suspicious that their dreams are being manipulated.\n••••• Masters of Oneiromancy can create shared dreams, bringing one person into the dream for each success on the casting roll. The environment begins as a mixture of their subconscious influences, but the oneiromancer can manipulate it further using lower levels of the Path.\n\nPrice of Failure: Botching on Oneiromancy tends to be psychologically harmful. Many oneiromancers get tossed into a Nightmare Realm, which torments them in a way similar to the Paradox Realms (Mage 20 p. 102-103) feared by mages. At best, they lose control of any dream they’re interacting with. Of course, even if they succeed, interacting with the dreams of someone with the Nightmares Flaw can be its own sort of hell.",
    "aspects": [
     "Sympathetic Connection",
     "Dreamwalking"
    ],
    "modifiers": "",
    "priceOfFailure": "Price of Failure: Botching on Oneiromancy tends to be psychologically harmful. Many oneiromancers get tossed into a Nightmare Realm, which torments them in a way similar to the Paradox Realms (Mage 20 p. 102-103) feared by mages. At best, they lose control of any dream they’re interacting with. Of course, even if they succeed, interacting with the dreams of someone with the Nightmares Flaw can be its own sort of hell."
   },
   "levels": [
    {
     "level": 1,
     "text": "Dreamwalking: Basic Oneiromancy allows the magician to touch the dreams of others, seeing flashes of imagery that could be interpreted to get insights into their target’s nature and history."
    },
    {
     "level": 2,
     "text": "Dreamwalking: The oneiromancer can now enter the dreams of others, not merely see them. They become a part of the dream, forced to take on a role appropriate to the dream itself. Once in the dream, changes can be made. The magnitude of the changes determines the difficulty of an additional Oneiromancy roll, with creating small items being difficulty 6 but violating the theme of the dream being difficulty 8, perhaps with a Threshold."
    },
    {
     "level": 3,
     "text": "Dreamwalking: Dreamwalkers can now watch dreams from the outside, seeing them clearly but not being pulled into them. They can now truly transform the dreams they encounter. With this rank, they can create terrors mimicking the Nightmares Flaw or soothe a dream to the point of helping the dreamer regain an additional point of temporary Willpower."
    },
    {
     "level": 4,
     "text": "Dreamwalking: Dream Sendings become available to the caster at this level. They can craft specific and detailed dream sequences for their target that repeat once per success. If they repeat more than once or twice per night, the target can become suspicious that their dreams are being manipulated."
    },
    {
     "level": 5,
     "text": "Dreamwalking: Masters of Oneiromancy can create shared dreams, bringing one person into the dream for each success on the casting roll. The environment begins as a mixture of their subconscious influences, but the oneiromancer can manipulate it further using lower levels of the Path."
    }
   ],
   "rituals": [
    {
     "id": "symbol_interpretation",
     "name": "Symbol Interpretation",
     "level": 1,
     "text": "In their rush to control the dreams of others, many oneiromancers forget even the meaning of the name of their Path. Though none forget that oneiros means dream, they think “mancy” simply refers to magic, rather than being derived from manteia, or divination. A growing movement among oneiromancers across Fellowships — spearheaded by Prof. Jeremiah Marquette, who specializes in using dreams to access blocked or forgotten memories — is reviving lost information by gathering aspects of the Path forgotten by many practitioners. He’s popularized a new ritual allowing an oneiromancer to find the answer to any one yes/no question the dreamer has ever known the answer to by reading the symbols of their dreams. The magician must have something of the target’s in their possession. They then must succeed at a Path roll and spend the night observing their target’s dreams with a specific yes or no question in mind. At the end, they must make an Intelligence + Enigmas or Intelligence + Esoterica (Dream Interpretation) roll. If they succeed, they find the answer to their question in the target’s dreams."
    },
    {
     "id": "bedtime_story",
     "name": "Bedtime Story",
     "level": 2,
     "text": "The most dangerous moment for an oneiromancer is that first step into a dream. The narrative of the dream is in effect, and they are forcibly adapted to it, sometimes losing themselves to it. Enterprising oneiromancers developed a ritual to take control of the dream as it forms, mitigating the risk that they’ll lose control. This ritual must be completed as the subject goes to sleep and requires the oneiromancer be in the room with them. However, a single success allows the oneiromancer to direct the forming dream, broadly guiding its narrative and themes."
    },
    {
     "id": "invade_demesne",
     "name": "Invade Demesne",
     "level": 3,
     "text": "Normally, the space created by the Demesne background is inviolate. Only powerful mages capable of finding them through astral travel can reach them. oneiromancers, however, have tricks few others can reproduce. This ritual lets the oneiromancer enter the Demesne of their target. Once there, they can try to seize control, though this requires a Path roll at difficulty 9, opposed by the Demesne’s owner rolling Wits + Demesne (difficulty 6). This is highly risky, and only the most well-prepared oneiromancers should try it."
    },
    {
     "id": "dream_scream",
     "name": "Dream Scream",
     "level": 4,
     "text": "While powerful oneiromancers can simply send dreams to people as spells, with this ritual, they can send a message to several people at once through their dreams. The magician chooses a message consisting of a single sentence, fixes it in their mind, and performs the ritual. At completion, they can send the message to one person per success within a 10-mile radius."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The Dreamwalking table is a Path-specific Aspect rating; reproduced in system.text and as levels entries. Sympathetic Connection has no table in this section (presumably the general Aspect from chapter four)."
  },
  {
   "id": "quintessence_manipulation",
   "name": "Quintessence Manipulation",
   "page": 43,
   "description": "Nearly all sorcerers can agree on one fact. There is a flow of power that fuels their works. The name of that power has taken on a multitude of faces and philosophies: mana, qi, gnosis, shakti, sekhem, and many others. Every magician can describe the flow of energy as they work their will on reality. Coursing through them like charge through a powerline, it can be felt, and for some it can be directly harnessed. Through Practices like those of geomancy and feng shui, hedge wizards can sense and redirect the unrefined energy of the universe.\n\nIn contrast, very few sorcerers consider this to be a Path of its own. Most look to Quintessence Manipulation as a standard exercise and refinement of their already defined craft. Each magician’s personal style already informs them how to achieve manipulations to perform all their other spells. Wands direct the energy, drawn patterns on boxes create traps to hold it, while knives cut and disrupt as they perform all their other works. Yet, those who focus on mastering this fundamental skill on its own find their work is never without a source to draw on, and their mystical surroundings are rarely a mystery.",
   "system": {
    "text": "Modifiers: –1 to –3 difficulty based on distractions in the surrounding area, with –1 representing a loud sound system playing in the same room and –3 representing Time Square at midnight on New Years.\n\nAspects: Area and Duration as well as Flow listed below:\n\nFlow\n\n• Sense Surroundings: Sensing the energies of the area becomes a routine task. With a moment of meditation or invocation, a sorcerer determines if an area or item is charged with power (whether Quintessence, vampire blood, Gnosis, or another mystic source). With three successes, the sorcerer identifies the Resonance of said energy.\n\n•• Focused Awareness: The ability to sense the ebb and flow of energy transcends local surroundings and the inanimate and crosses into the realm of individuals. Now the sorcerer can perceive another individual using subtle magics and allow them to see obstructed meridians or occluded energy flows. This reveals curses left on individuals or blocked Quintessence flow through the body imposed by malicious disruptions. The ability to gauge magical potential in a subject also becomes available. While especially useful in identifying potential threats, the amount of information gleaned in this way lacks detailed nuance to fully define if the subject is a supernatural creature or a normal human with a certain aptitude.\n\n••• Disrupt: No longer held to observing, now the skilled sorcerer can begin to affect the Quintessence around them. Still unable to bend and gracefully manipulate the energy, the practitioner of this path is at least versed enough to cause disruptions to the flow around them. With their invocation or focus, the sorcerer can quell the flow in the local area, causing a Quintessence source to become dormant for a time. Disruption also can mean diverting. A flow of Quintessence may be turned aside and sent along a new path in much the same way. Alternatively, with some effort a practitioner can trap a mote of Quintessence in a simple object for a limited amount of time.\n\n•••• Control: Mere brute force gives way to nuanced control of the flow of Quintessence within themselves, the world around them, and within the pattern of others. The flows of energy through themselves are now flowing rivers with metered channels and locks allowing the practitioner to harness the Quintessence in a place of power. Each success on an effort of this type allows the sorcerer to channel one point of Quintessence per success, up to the limit of that area’s power. Quintessence drawn this way dissipates unless used within the next turn.\n\nAn enemy’s flow of energy is now a viable target for disruption at this level of understanding. Stripping the energy from another’s pool destroys one Quintessence for every success rolled. More alien energies of other supernatural creatures are still accessible, but doing so is more taxing. The energy of other supernatural creatures is disrupted by one point for every two successes.\n\nThe flow of energy through an individual’s pattern is essential to their health. A sorcerer with this knowledge can cause great harm or provide great help, albeit over an extended period through something akin to a curse or boon. Altering the flow of another’s life energy can promote or deteriorate their health but takes a great deal of time to become evident. They become ill more often, finding it difficult to fight off a mere cold, and take longer to recover from simple injury. If left unchecked they will inevitably fall victim to an environmental carcinogen or a malady that runs in their family history. On the other hand, benefitting the flow of Quintessence in an individual will see the recipient barely ever falling ill for more than a day, bouncing back from any injury as though it were a mere inconvenience and living to a ripe old age. Through this function the hedge wizard can grant physical Merits or inflict physical Flaws, by spending 2 successes per point of the Merit or Flaw.\n\n••••• Rule: Masters of Quintessence Manipulation have attained a level of understanding that puts the flow of energy at their beck and call, impressing even the Awakened. Now, stored Quintessence can be directly infused into countermagic, adding dice to countermagic pools. Sensing Quintessence being directed, the sorcerer can interrupt the flow of energy, preventing another sorcerer from using Quintessence of their own. Each success blocks a point of Quintessence or Tass from empowering an effect.",
    "aspects": [
     "Area",
     "Duration",
     "Flow"
    ],
    "modifiers": "Modifiers: –1 to –3 difficulty based on distractions in the surrounding area, with –1 representing a loud sound system playing in the same room and –3 representing Time Square at midnight on New Years.",
    "priceOfFailure": ""
   },
   "levels": [
    {
     "level": 1,
     "name": "Sense Surroundings",
     "text": "Sense Surroundings: Sensing the energies of the area becomes a routine task. With a moment of meditation or invocation, a sorcerer determines if an area or item is charged with power (whether Quintessence, vampire blood, Gnosis, or another mystic source). With three successes, the sorcerer identifies the Resonance of said energy."
    },
    {
     "level": 2,
     "name": "Focused Awareness",
     "text": "Focused Awareness: The ability to sense the ebb and flow of energy transcends local surroundings and the inanimate and crosses into the realm of individuals. Now the sorcerer can perceive another individual using subtle magics and allow them to see obstructed meridians or occluded energy flows. This reveals curses left on individuals or blocked Quintessence flow through the body imposed by malicious disruptions. The ability to gauge magical potential in a subject also becomes available. While especially useful in identifying potential threats, the amount of information gleaned in this way lacks detailed nuance to fully define if the subject is a supernatural creature or a normal human with a certain aptitude."
    },
    {
     "level": 3,
     "name": "Disrupt",
     "text": "Disrupt: No longer held to observing, now the skilled sorcerer can begin to affect the Quintessence around them. Still unable to bend and gracefully manipulate the energy, the practitioner of this path is at least versed enough to cause disruptions to the flow around them. With their invocation or focus, the sorcerer can quell the flow in the local area, causing a Quintessence source to become dormant for a time. Disruption also can mean diverting. A flow of Quintessence may be turned aside and sent along a new path in much the same way. Alternatively, with some effort a practitioner can trap a mote of Quintessence in a simple object for a limited amount of time."
    },
    {
     "level": 4,
     "name": "Control",
     "text": "Control: Mere brute force gives way to nuanced control of the flow of Quintessence within themselves, the world around them, and within the pattern of others. The flows of energy through themselves are now flowing rivers with metered channels and locks allowing the practitioner to harness the Quintessence in a place of power. Each success on an effort of this type allows the sorcerer to channel one point of Quintessence per success, up to the limit of that area’s power. Quintessence drawn this way dissipates unless used within the next turn.\n\nAn enemy’s flow of energy is now a viable target for disruption at this level of understanding. Stripping the energy from another’s pool destroys one Quintessence for every success rolled. More alien energies of other supernatural creatures are still accessible, but doing so is more taxing. The energy of other supernatural creatures is disrupted by one point for every two successes.\n\nThe flow of energy through an individual’s pattern is essential to their health. A sorcerer with this knowledge can cause great harm or provide great help, albeit over an extended period through something akin to a curse or boon. Altering the flow of another’s life energy can promote or deteriorate their health but takes a great deal of time to become evident. They become ill more often, finding it difficult to fight off a mere cold, and take longer to recover from simple injury. If left unchecked they will inevitably fall victim to an environmental carcinogen or a malady that runs in their family history. On the other hand, benefitting the flow of Quintessence in an individual will see the recipient barely ever falling ill for more than a day, bouncing back from any injury as though it were a mere inconvenience and living to a ripe old age. Through this function the hedge wizard can grant physical Merits or inflict physical Flaws, by spending 2 successes per point of the Merit or Flaw."
    },
    {
     "level": 5,
     "name": "Rule",
     "text": "Rule: Masters of Quintessence Manipulation have attained a level of understanding that puts the flow of energy at their beck and call, impressing even the Awakened. Now, stored Quintessence can be directly infused into countermagic, adding dice to countermagic pools. Sensing Quintessence being directed, the sorcerer can interrupt the flow of energy, preventing another sorcerer from using Quintessence of their own. Each success blocks a point of Quintessence or Tass from empowering an effect."
    }
   ],
   "rituals": [
    {
     "id": "quintessence_infusion",
     "name": "Quintessence Infusion",
     "level": 2,
     "text": "The ability to store and redirect Quintessence is useful on a near daily basis for the sorcerer on the go. Thinking in advance, a sorcerer prepares themselves for situations where they may begin to run dry of available quintessence by infusing drinks or snacks with their own reserves for later use. Classically, this was a potion of great power. In modern nights, the savvy sorcerer may decide the espresso in a can or a protein bar may be just as handy, serving as the perfect inconspicuous consumable. The one drawback to this task is the fueling and the resource of the ritual. For every Quintessence stored, another Quintessence must be channeled to infuse the receptacle."
    },
    {
     "id": "shape_quintessence",
     "name": "Shape Quintessence",
     "level": 3,
     "text": "Following elaborate diagrams or practices that align with their style, the sorcerer can manipulate the flow of Quintessence within an area. A gambling hall could be made luckier for the house, or a particularly well-respected ER could suffer higher mortality rates despite the best efforts of the staff simply by manipulating the ley lines beneath the surface. The energies will eventually return to their original pattern, as the ritual holds it in an elastic state for only so long. With proper maintenance and continued observation, a location could be made to take on the new aspects permanently."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The levels array holds the Path-specific Flow Aspect (dots 1-5)."
  },
  {
   "id": "shadows",
   "name": "Shadows",
   "page": 45,
   "description": "Power over darkness is a cliché that some sorcerers have no problem clinging to out of ironic giddiness or genuine belief. One wouldn’t be remiss in guessing the Path of Shadows as the source of the concept that dark forces empower the mystic arts, given how often hucksters make the claim. Regardless of its reputation, the Path does carry a foreboding and intimidating air, as it shapes and shifts the substance of instinctual fear — shadows and darkness.\n\nPractitioners have found the application of the Path of Shadows far more malleable than other Paths. Shadows are omnipresent, and even in the brightest days stand out and provide contrast. The availability of shadows and the potential of adjusting the depth of shades grants greater possibilities than less versatile Paths.\n\nOne may think that the Path manipulates the quality of ambient light, focusing it away from darker areas to make shadows appear deeper and more menacing. This is patently false. Whether it’s a magical implement or a dark matter enhancement field of the more technologically minded, this Path manipulates the very stuff of shadows. The actual nature of this substance is the source of much debate in the magical communities, with a range of theories just as diverse as those concerning the mechanism of Awakening. What practitioners do agree on is that shadowstuff can be used to great effect in a variety of useful ways.",
   "system": {
    "text": "Aspects: The Aspects of Area, Distance, Duration, and Number of Targets, as well as Shadowgrip listed below:\n\nShadowgrip\n\nThe severity and persistence of the controlled shadows is gauged by one’s Shadowgrip. When a target attempts to resist the Path of Shadows, they make a Willpower test with a difficulty determined by the selected Aspect. Any success ends the effect on the following turn or after one minute.\n\n• Deepening: Bringing shadows deeper into our vision can create a distracting and intimidating atmosphere. Within an area the overall lighting itself may not change per se, but the shadows deepen, and even sounds become slightly smothered at the edges. These shadows can also be cast upon others to confer the Path’s benefits, such as a bonus to Stealth tests in shadowy conditions.\n\n•• Shaping: Taking further mastery of the dark material that comprises shadow, the sorcerer now crafts pattern and intent behind their shadow weaving. Upon a successful casting, the sorcerer adds two dice to any pools involving Intimidation or Stealth as well as any Subterfuge test to hide their identity. Conversely, the shadows can surround an individual and cast doubt and confusion upon the victim’s senses. At this level of mastery, they are strong enough to cause the target to hesitate or reconsider their actions due to the unidentifiable unease. This causes the target a –1 penalty to rolls made to dodge or that rely on quick reaction time. A Willpower test at difficulty 6 allows the victim to shake the shadows from their eyes and focus on their task at hand.\n\n••• Entrenching: Not content with merely strengthening shadows, the sorcerer now animates the shadowstuff itself, letting it shift and roil about them. Should they take their deepening skills further, light now withers in the target location, and color will desaturate before the shadows. Affecting another is now far more effective. Shadows shift and distort in their eyes, and unsettling whispers can be heard when the victim gets too close to a pool of gathered shade. Being harried in such a way causes a –1 difficulty on all tests. The effect can be broken with a Willpower test at difficulty 7. Finally, the caster can cause shadows to flutter or shake creating visual diversions and increasing the difficulty of all ranged attacks made against the beneficiary by one.\n\n•••• Commanding: The shadow’s “willingness” to act has become outright eagerness. The torment the shadowstuff visits upon the sorcerer’s foes is maddening and now causes a –2 difficulty on all tests made by the target. Any attempt to shake free calls for a Willpower test at difficulty 8 and may send some enemies into a frenzy or rage if they fail. Wreathing a target in benevolent shadows gives a +4 on all Intimidation and Stealth dice pools and any Subterfuge dice pool that is used to mask one’s identity.\n\n••••• Ruling: Shadows know who their master is and immediately act with abandon at the sorcerer’s call. Enemies may be reduced to a gibbering heap on the floor from the horrific maleficent shades. Opponents must succeed at a difficulty 9 Willpower test or be reduced to uselessness, crumpling to the ground. This test can be repeated on each of the target’s turns, but the target may only act normally on a turn in which they gain a success. If the target leaves the affected area, they regain the ability to act normally. The darkness that engulfs those who wish to remain unseen is nigh impenetrable from without and within, save for the sorcerer themselves, decreasing the difficulty of Stealth tests by one. This darkness carries a weight so palpable, it may damage recording equipment engulfed by its influence.",
    "aspects": [
     "Area",
     "Distance",
     "Duration",
     "Number of Targets",
     "Shadowgrip"
    ],
    "modifiers": "",
    "priceOfFailure": ""
   },
   "levels": [
    {
     "level": 1,
     "name": "Deepening",
     "text": "Deepening: Bringing shadows deeper into our vision can create a distracting and intimidating atmosphere. Within an area the overall lighting itself may not change per se, but the shadows deepen, and even sounds become slightly smothered at the edges. These shadows can also be cast upon others to confer the Path’s benefits, such as a bonus to Stealth tests in shadowy conditions."
    },
    {
     "level": 2,
     "name": "Shaping",
     "text": "Shaping: Taking further mastery of the dark material that comprises shadow, the sorcerer now crafts pattern and intent behind their shadow weaving. Upon a successful casting, the sorcerer adds two dice to any pools involving Intimidation or Stealth as well as any Subterfuge test to hide their identity. Conversely, the shadows can surround an individual and cast doubt and confusion upon the victim’s senses. At this level of mastery, they are strong enough to cause the target to hesitate or reconsider their actions due to the unidentifiable unease. This causes the target a –1 penalty to rolls made to dodge or that rely on quick reaction time. A Willpower test at difficulty 6 allows the victim to shake the shadows from their eyes and focus on their task at hand."
    },
    {
     "level": 3,
     "name": "Entrenching",
     "text": "Entrenching: Not content with merely strengthening shadows, the sorcerer now animates the shadowstuff itself, letting it shift and roil about them. Should they take their deepening skills further, light now withers in the target location, and color will desaturate before the shadows. Affecting another is now far more effective. Shadows shift and distort in their eyes, and unsettling whispers can be heard when the victim gets too close to a pool of gathered shade. Being harried in such a way causes a –1 difficulty on all tests. The effect can be broken with a Willpower test at difficulty 7. Finally, the caster can cause shadows to flutter or shake creating visual diversions and increasing the difficulty of all ranged attacks made against the beneficiary by one."
    },
    {
     "level": 4,
     "name": "Commanding",
     "text": "Commanding: The shadow’s “willingness” to act has become outright eagerness. The torment the shadowstuff visits upon the sorcerer’s foes is maddening and now causes a –2 difficulty on all tests made by the target. Any attempt to shake free calls for a Willpower test at difficulty 8 and may send some enemies into a frenzy or rage if they fail. Wreathing a target in benevolent shadows gives a +4 on all Intimidation and Stealth dice pools and any Subterfuge dice pool that is used to mask one’s identity."
    },
    {
     "level": 5,
     "name": "Ruling",
     "text": "Ruling: Shadows know who their master is and immediately act with abandon at the sorcerer’s call. Enemies may be reduced to a gibbering heap on the floor from the horrific maleficent shades. Opponents must succeed at a difficulty 9 Willpower test or be reduced to uselessness, crumpling to the ground. This test can be repeated on each of the target’s turns, but the target may only act normally on a turn in which they gain a success. If the target leaves the affected area, they regain the ability to act normally. The darkness that engulfs those who wish to remain unseen is nigh impenetrable from without and within, save for the sorcerer themselves, decreasing the difficulty of Stealth tests by one. This darkness carries a weight so palpable, it may damage recording equipment engulfed by its influence."
    }
   ],
   "rituals": [
    {
     "id": "lifting_shadows",
     "name": "Lifting Shadows",
     "level": 1,
     "text": "Shadows and shades hide secrets for those who wish to hide them, but the learned sorcerer may reveal those secrets to those they trust. Smearing ink into a pair of contacts or funneling smoke into tight swimming goggles, the sorcerer brings the sight of the recipient into the realm of shadows. For the next eight hours, night may be as bright as day. Once blessed, the sorcerer or their ally may treat all darkness as daylight when making Alertness tests based on sight."
    },
    {
     "id": "grip_of_shades",
     "name": "Grip of Shades",
     "level": 3,
     "text": "Within every crevasse hides a little shadow. Within every shadow hides an ally to a sorcerer of the Path of Shadowcasting. It is access to these allies that gives the sorcerer leverage in ways that many would never anticipate. By hardening the shadowstuff within the shadows on their person, the sorcerer may afford themselves a modicum of protection against impacts and benefits from an advantage in hand-to-hand combat. For 24 hours after bathing in coal-infused oils, the sorcerer has rating 2 armor when soaking bashing or lethal damage and adds two to all Brawl and Martial Arts dice pools that involve grappling."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "The levels array holds the Path-specific Shadowgrip Aspect (dots 1-5). The Grip of Shades ritual text refers to the Path as the “Path of Shadowcasting” as printed."
  },
  {
   "id": "shapeshifting",
   "name": "Shapeshifting",
   "page": 47,
   "description": "Even among primal magics, the ability to change into an animal stands out as exceptional. Many monsters haunting the night have the power of transformation, including those who are true shapeshifters. Hedge magicians who study the Path of Shapeshifting mimic a certain amount of their power, transforming first pieces of themselves and later their entire body in dramatic ways.\n\nMost think of this Path as turning oneself or others into animals. When shapeshifting magicians choose subtlety, they can be remarkable spies. They can make cosmetic changes to look like a different person, and then supplement their disguise with sharpened senses. They can transform into something more dangerous if their cover is blown.\n\nThe biggest risk of this Path is that the human mind is not equipped to change shapes. Every transformation incurs risk, but it’s greatest when making a full shift to an animal form. Then, even without a botch, the magician needs to roll Willpower (difficulty 6) to retain their own mind, rather than losing themself to their animal nature.",
   "system": {
    "text": "Duration: Scene\n\nAspects: None of the standard Aspects apply to Shapeshifting. Instead, it uses:\n\nScale\n\n• Cosmetic changes only, such as eye color or growing hair.\n\n•• Small but noticeable changes, such as growing claws or scales.\n\n••• The magician can change a single body part to that of some other creature.\n\n•••• Half-Shift: the magician can either change half of their body to an animal’s or take a form halfway between human and animal.\n\n••••• Full Shifting: The magician can change completely into an animal.\n\nSubject\n\n••• The magician can only affect themselves.\n\n•••• The magician may transform another target.\n\n••••• The magician may affect two subjects at once.\n\nDisparity\n\n••• Only a single animal feature.\n\n•••• The magician can take on two unrelated shifts, such as the head of one animal and the body of another.\n\n••••• Three unrelated shifts are possible.\n\nPrice of Failure: When a shapeshifter botches, the best-case scenario consists of an unexpected and unpleasant transformation. They can also lose themselves to their other form, functionally going feral. In a worst-case scenario, they can experience a rampage similar to the Berserker/Stress Atavism Flaw (Mage 20 p. 644).",
    "aspects": [
     "Scale",
     "Subject",
     "Disparity"
    ],
    "modifiers": "",
    "priceOfFailure": "Price of Failure: When a shapeshifter botches, the best-case scenario consists of an unexpected and unpleasant transformation. They can also lose themselves to their other form, functionally going feral. In a worst-case scenario, they can experience a rampage similar to the Berserker/Stress Atavism Flaw (Mage 20 p. 644)."
   },
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "Cosmetic changes only, such as eye color or growing hair."
    },
    {
     "level": 2,
     "name": "",
     "text": "Small but noticeable changes, such as growing claws or scales."
    },
    {
     "level": 3,
     "name": "",
     "text": "The magician can change a single body part to that of some other creature."
    },
    {
     "level": 4,
     "name": "Half-Shift",
     "text": "Half-Shift: the magician can either change half of their body to an animal’s or take a form halfway between human and animal."
    },
    {
     "level": 5,
     "name": "Full Shifting",
     "text": "Full Shifting: The magician can change completely into an animal."
    }
   ],
   "rituals": [
    {
     "id": "face_theft",
     "name": "Face Theft",
     "level": 1,
     "text": "The key ritual for Shapeshifting-based spycraft, Face Theft allows the magician to take on the precise form of another human being. They must have some piece of the person, such as strands of hair or nail clippings. The ritual requires one success for a person broadly similar to the caster, and an additional success each if the form differs in race, sex, or by more than 20 years of age."
    },
    {
     "id": "fix_the_true_form",
     "name": "Fix the True Form",
     "level": 4,
     "text": "Shapeshifters often find themselves in conflict with one another. They also run into stranger things with multiple forms. Fix the True Form was developed by one who claimed descent from werewolves. It forces anyone targeted by it to take on their “true” form if they fail at a Willpower roll (difficulty 8). For magicians, they simply revert to their natural form, as do most other shapeshifters. Ironically, despite being created in part to force werewolves into their human or wolf forms, this ritual forces Garou and Fera to take on their mixed forms instead, often with terrible consequences for an overconfident hedge magician."
    },
    {
     "id": "megafauna_transformation",
     "name": "Megafauna Transformation",
     "level": 5,
     "text": "The Path of Shapeshifting allows the caster to assume animal forms, including partial transformations. But in the end, the caster can normally only fully transform into a normal animal. This ritual allows them to become a gigantic version of whatever animal they want to transform into. In most cases, this is a full throwback to an extinct version of the animal, such as the megatherium (giant sloth) of the Americas. This requires at least five successes."
    },
    {
     "id": "store_spell",
     "name": "Store Spell",
     "level": 5,
     "generic": true,
     "text": "With this ritual, the magician may store a single spell in an object for later use. The hedge wizard determines a release trigger when casting this ritual, which can be anything from a spoken word or gesture made with the object, to using a finger to make rhythmic taps on a specific area of the object. Once the trigger is set, anyone who knows and performs it can release the stored spell. This spell doesn’t count against the limits in Hanging Spells. However, this can only store a single spell at a time. If Store Spell is cast on an object before a previous spell is released from the object, the old spell is lost. This ritual must be bought separately for each Path."
    }
   ],
   "sidebars": [],
   "notes": "Duration is fixed at Scene. Three Path-specific Aspects (Scale, Subject, Disparity) replace the standard Aspects; Subject and Disparity have entries only at dots 3-5. The levels array holds the Scale Aspect (dots 1-5); Subject and Disparity are in system.text only. In the extraction the Scale table was displaced into the middle of the Shadows ritual Lifting Shadows; it has been restored here."
  },
  {
   "id": "starlight",
   "name": "Starlight",
   "page": 48,
   "description": "There are Paths that go back centuries and then there are some that only arise from the unique environments of the modern night. Urban sprawls gave sorcerers a unique worldview and provided a compass for the lands beyond the Shroud. Peering into the lands of the dead is not a new concept to the magical community, but those who walk the concrete valley started to see a pattern in the stars of the Shadowland skies that matched the lights of their cities. Through study and the broadening of their understanding, the Path known as Starlight was born. Much to the dismay and jealousy of the inhabitants of the Shadowlands, only those gifted in Starlight seem able to see the stars that they use.\n\nLike navigators of the golden age of sail, Starlight practitioners understand the unique sky of the Shadowlands and chart courses to safely travel through the realm of the dead. Simply knowing where they are going is only the start of the power these navigators have. Their minds produce a sort of protection and preservation shield for any mortals traveling with them. This becomes a necessity for travel since the shadowlands have no air and the very ground is anathema to the living. This is no physical shield against all harm, though, and any violent wraith that means them harm can easily indulge that urge. Should the duration of the spell expire, those traveling will be exposed to the lethal environment of the Shadowlands.\n\nIt is knowledge of the guiding lights of the Shadowland skies that also allow navigators to open doorways into the Shadowlands directly, completely bypassing the Shroud in the process. Any door can lead to the Shadowlands; it just takes a lot of preparation, and the journey begins. Moving quickly towards the destination is advised, considering few navigators have been able to complete a journey that took longer than one day.",
   "system": {
    "text": "Modifiers: Decrease difficulty by –1 if carrying a personal item of the recently deceased\n\nAspects: The Aspects of Duration, Passengers, and Wending:\n\nWending\n\n• The threshold is the first obstacle a navigator must master. With focus and will, any doorway can serve as a threshold into the Shadowlands. The door only remains open for the navigator and will allow them and their passengers to pass. Traveling companions benefit from the same life preserving effect as the caster so long as they remain within sight of their navigator. Anyone attempting to reopen the doorway once closed will find the mundane corresponding threshold. This door collapses after it has been reopened and closed again by the navigator during their return from the Shadowlands, or willfully collapsed by the navigator to close the way behind them. A different doorway in the Shadowlands can be used to re-enter the Skinlands, but another activation of Starlight must be performed to create the new threshold. There is a drawback to this technique; The destination in the Skinlands is difficult to know without more capabilities as a navigator.\n\n•• The Shadowlands are more familiar to a navigator of this level. Confidence swells in their chest, and the realm of the dead seems far less frightening. While traveling in the Shadowlands, the navigator benefits from –1 difficulty on all Awareness, Leadership, Survival, and Occult rolls concerning this environment, as well as Willpower rolls to overcome fear and intimidation.\n\n••• The navigator has found a point in the Shadowlands that is akin to their own personal North Star. No matter where they are in the Shadowlands, so long as they can see this star, the navigator has a general understanding of where they may exit into the Skinlands when opening a new threshold.\n\n•••• The familiarity with the Shadowlands is now palpable to any traveling companions the navigator has brought along. Traveling companions of the navigator benefit from a –1 difficulty to Willpower rolls made to overcome fear and intimidation, as well as Awareness and Survival rolls made within the Shadowlands.\n\n••••• The navigator’s guiding light within the Shadowlands is visible to them even with their eyes closed. No matter how deep they travel or how turned around they may get, the navigator will always be able to find their way to a door back to the Skinlands. Furthermore, they know exactly where their exit from the Shadowlands will lead.",
    "aspects": [
     "Duration",
     "Passengers",
     "Wending"
    ],
    "modifiers": "Modifiers: Decrease difficulty by –1 if carrying a personal item of the recently deceased",
    "priceOfFailure": ""
   },
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "The threshold is the first obstacle a navigator must master. With focus and will, any doorway can serve as a threshold into the Shadowlands. The door only remains open for the navigator and will allow them and their passengers to pass. Traveling companions benefit from the same life preserving effect as the caster so long as they remain within sight of their navigator. Anyone attempting to reopen the doorway once closed will find the mundane corresponding threshold. This door collapses after it has been reopened and closed again by the navigator during their return from the Shadowlands, or willfully collapsed by the navigator to close the way behind them. A different doorway in the Shadowlands can be used to re-enter the Skinlands, but another activation of Starlight must be performed to create the new threshold. There is a drawback to this technique; The destination in the Skinlands is difficult to know without more capabilities as a navigator."
    },
    {
     "level": 2,
     "name": "",
     "text": "The Shadowlands are more familiar to a navigator of this level. Confidence swells in their chest, and the realm of the dead seems far less frightening. While traveling in the Shadowlands, the navigator benefits from –1 difficulty on all Awareness, Leadership, Survival, and Occult rolls concerning this environment, as well as Willpower rolls to overcome fear and intimidation."
    },
    {
     "level": 3,
     "name": "",
     "text": "The navigator has found a point in the Shadowlands that is akin to their own personal North Star. No matter where they are in the Shadowlands, so long as they can see this star, the navigator has a general understanding of where they may exit into the Skinlands when opening a new threshold."
    },
    {
     "level": 4,
     "name": "",
     "text": "The familiarity with the Shadowlands is now palpable to any traveling companions the navigator has brought along. Traveling companions of the navigator benefit from a –1 difficulty to Willpower rolls made to overcome fear and intimidation, as well as Awareness and Survival rolls made within the Shadowlands."
    },
    {
     "level": 5,
     "name": "",
     "text": "The navigator’s guiding light within the Shadowlands is visible to them even with their eyes closed. No matter how deep they travel or how turned around they may get, the navigator will always be able to find their way to a door back to the Skinlands. Furthermore, they know exactly where their exit from the Shadowlands will lead."
    }
   ],
   "rituals": [],
   "sidebars": [],
   "notes": "No Sample Rituals are printed for Starlight. The levels array holds the Path-specific Wending Aspect (dots 1-5). The extraction had the page's blocks out of order (end of description and System before the title); reading order has been restored here."
  },
  {
   "id": "summoning_binding_and_warding",
   "name": "Summoning, Binding, and Warding",
   "page": 49,
   "description": "Sorcerers in both fiction and legend are well-known for their ability to summon and control others, both living and ephemeral. With these powers, the magician can summon animals, spirits, ghosts, demons, and other strange beings. They can also defend against these beings, bind them, and compel them to obey the magician. Though overlap exists with the Path of Ephemera, this Path focuses on methods of compulsion, rather than cooperation, with the beings being called and dealt with.\n\nAll Summoning, Binding, and Warding magics are rituals, and rituals exist for reaching individual beings or classes of beings. There are separate rituals to summon, bind, and ward each target. This has led many magicians to their doom. Though summoning a being may intrigue it, attempting to bind them tends to incur hostility, and magicians who either don’t know or fail at casting the warding ritual often find themselves in a great deal of trouble.\n\nIn addition to the complications of each specific being or type of being the hedge magician intends to work with, there are several versions of this Path which are learned completely separately. Variants exist for summoning material creatures (like animals and people), angels and demons, ghosts, spirits of nature, and other sentient beings. There are even reports of variants focused on inanimate objects and virtual creations, allowing some magicians to ward their computers against viruses or summon their cars at need.",
   "system": {
    "text": "Aspects: The three distinct parts of the Path have separate Aspects. Warding has Duration and Strength, each level of which subtracts one die from all actions the summoned being takes against the magician. For three successes, Warding Strength allows the creation of a Warding Circle, which the being cannot cross without a Willpower roll (difficulty 6) where they achieve more successes than the magician.\n\nSummoning has Duration as an Aspect. Additionally, it has Number of summoned beings (or swarms) and Metaphysical Weight for the summoned being. The summoned being is compelled to appear before the magician but must still transport themself there. Only the most powerful beings can truly travel instantaneously.\n\nBinding similarly has the aspects of Duration and Metaphysical Weight, as well as Binding Intensity. A being may spend a point of Willpower to resist a binding, but the binding can be recast. Some beings, especially those with Metaphysical Weight 5, are powerful enough to require binding rituals with large thresholds in addition to the usual requirements — sometimes as high as 20 or more successes.\n\nBinding Intensity\n\n• The creature cannot directly act against the magician.\n\n•• Any single question must be answered truthfully.\n\n••• All questions for the duration must be answered truthfully, and the being may be compelled to perform one service, though they may interpret the command liberally so long as they literally satisfy it.\n\n•••• A single task is performed as directed, following the orders closely.\n\n••••• The magician may transfer limited control of the binding to another person. The being performs one task for them and answers any questions the summoner asks of it.\n\nPrice of Failure: The Path of Summoning, Binding, and Warding has no need for special failure or botch costs. Instead, the consequences of failures and botches are visited upon the magician by the being summoned. The biggest source of these problems is that, on a botch, the magician often ends up under the mistaken impression they have succeeded.",
    "aspects": [
     "Duration",
     "Strength",
     "Number",
     "Metaphysical Weight",
     "Binding Intensity"
    ],
    "modifiers": "",
    "priceOfFailure": "Price of Failure: The Path of Summoning, Binding, and Warding has no need for special failure or botch costs. Instead, the consequences of failures and botches are visited upon the magician by the being summoned. The biggest source of these problems is that, on a botch, the magician often ends up under the mistaken impression they have succeeded."
   },
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "The creature cannot directly act against the magician."
    },
    {
     "level": 2,
     "name": "",
     "text": "Any single question must be answered truthfully."
    },
    {
     "level": 3,
     "name": "",
     "text": "All questions for the duration must be answered truthfully, and the being may be compelled to perform one service, though they may interpret the command liberally so long as they literally satisfy it."
    },
    {
     "level": 4,
     "name": "",
     "text": "A single task is performed as directed, following the orders closely."
    },
    {
     "level": 5,
     "name": "",
     "text": "The magician may transfer limited control of the binding to another person. The being performs one task for them and answers any questions the summoner asks of it."
    }
   ],
   "rituals": [],
   "sidebars": [],
   "notes": "No Sample Rituals are printed for this Path. Aspects are split by sub-Path: Warding uses Duration and Strength; Summoning uses Duration, Number (of summoned beings or swarms) and Metaphysical Weight; Binding uses Duration, Metaphysical Weight and Binding Intensity. The levels array holds the Binding Intensity Aspect (dots 1-5)."
  },
  {
   "id": "weather_control",
   "name": "Weather Control",
   "page": 50,
   "description": "In societies that relied heavily on agriculture or seafaring, those who could control the weather were prized, often being the difference between life and death in their communities. Famines have been prevented or ended, and the most powerful sorcerers have been known to dispel or divert natural disasters.\n\nWeather control allows sorcerers to do what it says on the package — they can control the weather. While they can’t directly make enormous weather shifts such as El Niños, what they can affect creates ripples through larger areas. No weather pattern happens in a vacuum, and this remains true for magical tampering with the weather. Many weather workers have some dots in Science, to account for being able to discern upcoming weather patterns. Many weather workers also learn at least a small amount of Divination for this purpose, frequently scrying in pools of water and clouds as their practices for such.\n\nThough rarely consulted in the modern era, weather workers still practice in secret. The power they command is dramatic and potentially life-altering. Like healers, weather workers would be constantly pestered to perform miracles if their abilities were commonly known. At the same time, they would have to contend with those claiming out of fear and jealousy that the weather workers gained their powers through evil means.\n\nWeather workers rarely function alone. The amount of effort required to produce adequate effects often necessitates teamwork. Some form covens around the goal of group weather control.",
   "system": {
    "text": "Modifiers: Weather control uses no rituals. The large number of successes required to produce effects lends itself to extended rolls and teamwork.\n\n• 1 or more additional successes required to stop a severe thunderstorm or worse once it’s started. Calm weather is easier to stir up than nasty weather is to allay.\n\n• +1 difficulty to cause any effect indoors.\n\nAspects: Weather Control uses the Aspects Distance (treat the measurement on the chart as the radius of effect), Duration, and Intensity:\n\nIntensity\n\n• Small changes only. This includes warm or cold breezes, slight but noticeable changes in temperature, and causing fire to momentarily flicker and flare.\n\n•• The weather worker can cause minor affects that do not cause direct damage. The sorcerer might call up a dense fog that imposes perception penalties (see Mage 20 p. 435), clear a cloudy sky, or create winds in the direction they desire.\n\n••• A sorcerer may form and dispel simple rainstorms. Strong winds can impose a penalty on ranged attacks by blowing the projectile off course and causing difficulties aiming. The weather worker may also change the temperature up to 30 degrees Fahrenheit in either direction. Depending on the starting temperature, this may impose or remove penalties from heat illness or hypothermia. Flash floods can also be deadly.\n\n•••• A weather worker’s storm strength increases. They can now command gale-force winds, lightning, hail, and other damaging weather effects. They may now target individuals to take the brunt of the storm, and damaging effects do 4 + successes damage. Lightning causes lethal damage while bashing damage results from hail. Other effects may also cause damage, within reason. Weather effects can cause moderate penalties to those caught in the storms.\n\n••••• The sorcerer can cause extreme effects. Thunderstorms are well within the weather worker’s grasp. Destructive tornadoes and other powerful meteorological activity can tear through a city. The sorcerer may cause 6 + successes bashing or lethal every 15 minutes to those in the storm’s path. Anyone caught in the storm also suffers maximum environmental penalties.\n\nPrice of Failure: Even intentional weather control effects might have unintended consequences on the environment both near and far. Weather pattern disruptions are no small matter. A botch, however, unleashes terrible effects depending on the nature of the changes sought. Lightning might directly strike the sorcerer or their allies. An arid climate might be hit with a monsoon the ground can’t accommodate, leading to widespread flooding. The local climate and possibly the surrounding area suffers dramatic, perhaps long-lived, changes. This can cause a crisis for the local fauna, plant life, and people who had no time to prepare and may not know how to cope with the new climate. Death, even if not immediate, is unfortunately a common risk when sorcerers play with the weather.",
    "aspects": [
     "Distance",
     "Duration",
     "Intensity"
    ],
    "modifiers": "Modifiers: Weather control uses no rituals. The large number of successes required to produce effects lends itself to extended rolls and teamwork.\n\n• 1 or more additional successes required to stop a severe thunderstorm or worse once it’s started. Calm weather is easier to stir up than nasty weather is to allay.\n\n• +1 difficulty to cause any effect indoors.",
    "priceOfFailure": "Price of Failure: Even intentional weather control effects might have unintended consequences on the environment both near and far. Weather pattern disruptions are no small matter. A botch, however, unleashes terrible effects depending on the nature of the changes sought. Lightning might directly strike the sorcerer or their allies. An arid climate might be hit with a monsoon the ground can’t accommodate, leading to widespread flooding. The local climate and possibly the surrounding area suffers dramatic, perhaps long-lived, changes. This can cause a crisis for the local fauna, plant life, and people who had no time to prepare and may not know how to cope with the new climate. Death, even if not immediate, is unfortunately a common risk when sorcerers play with the weather."
   },
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "Small changes only. This includes warm or cold breezes, slight but noticeable changes in temperature, and causing fire to momentarily flicker and flare."
    },
    {
     "level": 2,
     "name": "",
     "text": "The weather worker can cause minor affects that do not cause direct damage. The sorcerer might call up a dense fog that imposes perception penalties (see Mage 20 p. 435), clear a cloudy sky, or create winds in the direction they desire."
    },
    {
     "level": 3,
     "name": "",
     "text": "A sorcerer may form and dispel simple rainstorms. Strong winds can impose a penalty on ranged attacks by blowing the projectile off course and causing difficulties aiming. The weather worker may also change the temperature up to 30 degrees Fahrenheit in either direction. Depending on the starting temperature, this may impose or remove penalties from heat illness or hypothermia. Flash floods can also be deadly."
    },
    {
     "level": 4,
     "name": "",
     "text": "A weather worker’s storm strength increases. They can now command gale-force winds, lightning, hail, and other damaging weather effects. They may now target individuals to take the brunt of the storm, and damaging effects do 4 + successes damage. Lightning causes lethal damage while bashing damage results from hail. Other effects may also cause damage, within reason. Weather effects can cause moderate penalties to those caught in the storms."
    },
    {
     "level": 5,
     "name": "",
     "text": "The sorcerer can cause extreme effects. Thunderstorms are well within the weather worker’s grasp. Destructive tornadoes and other powerful meteorological activity can tear through a city. The sorcerer may cause 6 + successes bashing or lethal every 15 minutes to those in the storm’s path. Anyone caught in the storm also suffers maximum environmental penalties."
    }
   ],
   "rituals": [],
   "sidebars": [],
   "notes": "Weather Control uses no rituals, so no Sample Rituals are printed. The levels array holds the Path-specific Intensity Aspect (dots 1-5). The Price of Failure paragraph continues onto p. 51, the last page of chapter one."
  },
  {
   "id": "herbalism",
   "name": "Herbalism",
   "page": null,
   "placeholder": true,
   "description": "Named as a favored Path of the Children of Osiris, but not described in M20 Sorcerer. Ask your Storyteller for the Path write-up (earlier editions of Sorcerer cover it) or treat it as a custom Path.",
   "system": {
    "text": "",
    "aspects": [],
    "modifiers": "",
    "priceOfFailure": ""
   },
   "levels": [],
   "rituals": [],
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "shadowcasting",
   "name": "Shadowcasting",
   "page": null,
   "placeholder": true,
   "description": "Named as a favored Path of Nebuu-Afef, the Order of the Golden Fly, but not described under that name in M20 Sorcerer. It is most likely the Shadows Path (p. 45); ask your Storyteller.",
   "system": {
    "text": "",
    "aspects": [],
    "modifiers": "",
    "priceOfFailure": ""
   },
   "levels": [],
   "rituals": [],
   "sidebars": [],
   "notes": ""
  }
 ],
 "PHENOMENA": [
  {
   "id": "animal_psychics",
   "name": "Animal Psychics",
   "page": 54,
   "description": "Some people are naturally good with animals, and some psychics supernaturally so. This ability allows a psychic to exert their will to communicate with and control animals. Even the lowest expression of this Phenomenon allows a psychic to put an animal at ease by bridging the communication gap, rendering it more inclined to respond positively to the psychic.\n\nA psychic may speak to and command an animal through a method of their choosing. Examples include silently locking eye contact, imitating noises animals make, dressage gestures, the psychic’s native language, or a stream of gibberish. The method matters much less than the psychic’s intent and force of will. Even at its highest levels, this phenomenon does not affect insects or any creature, such as jellyfish, which lacks a brain.",
   "levels": [
    {
     "level": 1,
     "name": "Commune",
     "text": "A psychic may communicate with one animal the psychic can perceive through mundane senses (sight, hearing, etc). They may issue simple commands but cannot command an animal to attack. The psychic can, however, command an animal to stand down from an intended attack. Issuing a command an animal was inclined to do anyway requires no additional roll, but to command an animal to do something against its nature requires a roll of Charisma + Animal Ken with a difficulty of 9 minus the psychic’s dots of Animal Psychics."
    },
    {
     "level": 2,
     "name": "Mass Communication",
     "text": "As with Commune, but the Psychic may now communicate with multiple animals of the same species at once. Commands to animals may be more complex so long as the psychic can adequately describe it; however, animals won’t typically attack for the psychic unless already inclined to do so. This level may alternatively target a single animal for expanded command capability."
    },
    {
     "level": 3,
     "name": "Mind Link",
     "text": "A psychic may link minds with a single animal for instant two-way communication and the ability to sense what the animal senses. The psychic must initially sense the animal as per Commune, but the animal may travel outside of the psychic’s perception range without breaking the link. This power ends when the psychic severs the link. The link can prove dangerous — any damage the linked animal takes results in psychic backlash, which causes an equal amount of soakable bashing damage to the psychic. If the animal dies while the link is active, the psychic must not only roll to soak the damage, but also roll current Willpower at difficulty 8. A failure renders the psychic stunned for 1 round. Botches can leave the psychic overwhelmed by the trauma of death for a scene and have lasting consequences, such as heightened startle responses, until the psychic regains one Willpower."
    },
    {
     "level": 4,
     "name": "Domination",
     "text": "A psychic may order any single animal to do anything within the animal’s natural capabilities. The animal fights and dies for the psychic on demand without question. The psychic must adequately describe a command for the animal to understand what the psychic wants. Complex commands may still confuse an animal, though the animal does its best to interpret and carry out any command the psychic gives it. Once the psychic successfully activates this power, the animal follows the psychic’s orders until either the psychic severs the connection, or the animal dies. Psychics using this power must also establish a Mind Link if they wish to continue issuing commands to the animal at range. This does not require additional rolls or Willpower expenditure, but it does open the psychic up to suffering damage when the animal is injured or killed as detailed above."
    },
    {
     "level": 5,
     "name": "Swarm",
     "text": "With mastery over this Phenomenon, a psychic may now use any lower ability on all animals the psychic can sense through mundane senses at once. The psychic’s control is no longer limited to one species at a time. Using Mind Link in this way can quickly become dangerous, as every linked animal presents a risk of backlash damage if injured. The distraction of maintaining multiple mental links is overwhelming, inflicting a -3 dice penalty to all Attribute-based rolls until the Mind Link ends unless the psychic spends a point of Willpower when making the roll to temporarily push past the distraction."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "anti_psychic",
   "name": "Anti-Psychic",
   "page": 55,
   "description": "Anti-Psychic is the rarest psychic phenomenon. That said, it is very subtle. Many Anti-Psychics go through life unaware of their ability. It often takes an attack by, or other serious misunderstanding with, another psychic before the Anti-Psychic learns of their gift.\n\nAnti-Psychic Phenomena scramble the abilities of other psychics with mental static. Those with a scientific paradigm theorize Anti-Psychic emanations use a similar basis for function as Telepathy. Instead of projecting a signal the recipient’s brain can decode as a message, image, or impression, the theory is the Anti-Psychic projects a signal that interferes with the brainwaves responsible for psychic phenomena. Due to the nature of this Phenomenon, it’s impossible for an Anti-Psychic to develop any other psychic phenomena. They are, however, capable of learning other Numina.\n\nAn Anti-Psychic disrupts all other psychic phenomena within their range of effect and enjoys a limited effect on those using the Mind Sphere. At higher levels, the Anti-Psychic may even disrupt vampiric Disciplines and Garou gifts. This Phenomenon remains perpetually active, even while the Anti Psychic sleeps, unless the psychic spends a point of Willpower to completely suppress the phenomenon for a turn or direct it to a single individual. If using Anti-Psychic against Mind Sphere effects or Night-Folk, the psychic does not automatically succeed but reflexively rolls activation at difficulty 7 or the mage’s Arete, whichever is higher. On a success, the effects of the Anti-Psychic’s ranks in the ability applies. For more information on countering Night-Folk powers, see Mage: The Ascension 20th Anniversary Edition page 546.\n\nThe rarity of this Phenomenon represents a mixed blessing. While many would not anticipate the ability, lending an element of surprise, the novelty can make the Anti-Psychic a tempting specimen for scientifically inclined supernatural entities. Whispered rumors imply that the Technocratic Union uses Anti-Psychics from their Extraordinary Citizens to bolster raids on known or suspected psychics.",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "5-yard radius. Add +1 difficulty to psychic phenomenon activation within the radius and +1 difficulty to Mind Sphere rolls."
    },
    {
     "level": 2,
     "name": "",
     "text": "10-yard radius. Add +2 difficulty to psychic phenomenon activation within the radius and +1 difficulty to Mind Sphere rolls."
    },
    {
     "level": 3,
     "name": "",
     "text": "15-yard radius. Add +3 difficulty to psychic phenomenon activation within the radius and +2 difficulty to Mind Sphere rolls. Add +1 difficulty for use of any mental-based Night Folk powers."
    },
    {
     "level": 4,
     "name": "",
     "text": "25-yard radius. Add +4 difficulty to psychic phenomenon activation within the radius and +2 difficulty to Mind Sphere rolls. Add +2 difficulty for use of any mental-based Night Folk powers."
    },
    {
     "level": 5,
     "name": "",
     "text": "40-yard radius. Add +5 difficulty to psychic phenomenon activation within the radius and +3 difficulty to Mind Sphere rolls. Add +3 difficulty for use of any mental-based Night Folk powers."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "astral_projection",
   "name": "Astral Projection",
   "page": 56,
   "description": "Astral Projection allows the psychic to split their spirit, mind, or consciousness — or a combination of those depending on belief — from their body. The astral form is intangible and can cover vast distances in a short time, as it’s not beholden to normal laws of physics. Astral travelers can peer into and even visit the Astral Umbra’s realms of ideas (see Mage 20 p. 94). The psychic using Astral Projection cannot affect the physical world through normal means, though they may do so through other psychic phenomena at +2 difficulty. Botching Astral Projection activation causes a disorienting psychic backlash, preventing the psychic from leaving their body for 24 hours.\n\nA psychic’s body remains vulnerable while they are using astral projection, and the psychic cannot sense what’s happening to it. It’s a common fear among psychics with this ability that someone might move or harm their bodies while they’re away. Many tend to limit their use of drugs and alcohol, because memory lapses can trigger the same fear.\n\nPsychics can interact with astral spirits — denizens of the Astral Umbra and other astral traveling individuals. Astral Projection does not confer the ability to see and interact with ghosts. For combat while astral traveling, substitute Wits for Dexterity, Intelligence for Strength, and Perception for Stamina. Astral travelers usually appear as slightly idealized versions of themselves, including manifestations of gender or stylistic expression, freed from physical or societal limitations on such expressions. Alternatively, those with exceedingly poor self-image sometimes appear with exaggerated perceived flaws. Despite potential differences from physical appearance, astral travelers are typically able to recognize each other should they meet again in the physical realm.\n\nMost psychics are only able to access the Astral Penumbra, but the most powerful have claimed to be able to travel further. Traveling into Otherworlds is risky business, and more than a handful of psychics have gone exploring, never to find their bodies again. Some believe leaving the body uninhabited for too long risks letting something else in.",
   "levels": [
    {
     "level": 1,
     "name": "Peek",
     "text": "The psychic may spend up to one minute per point of Stamina astral projecting and travel up to one mile away from their body. A psychic can only use sight at this level — their other senses do not function while projecting. A character may also travel into the Astral Penumbra for this amount of time."
    },
    {
     "level": 2,
     "name": "Errand",
     "text": "The psychic gains the ability to hear while astral traveling. They may travel up to 100 miles away from their body with a limit of 10 minutes per point of Stamina."
    },
    {
     "level": 3,
     "name": "Journey",
     "text": "The psychic can travel up to 1000 miles away from their body and may remain in astral form for 30 minutes per point of Stamina. A psychic may choose to manifest as a blurry, ghost-like image of their astral form for one turn by spending a point of Willpower but may not speak. They do not show up on recordings."
    },
    {
     "level": 4,
     "name": "Failsafe",
     "text": "Upon being stunned or knocked out, the psychic may roll Astral Projection activation as a reflexive action. The psychic may use this power to seek help for their prone body, or simply as a way to remain useful while otherwise out of commission. The psychic may manifest as Journey, and while manifested, the psychic can communicate at whisper volume. The psychic’s voice and translucent form do not show up on recordings. The psychic may travel anywhere on Earth and remain projected for up to an hour per dot of Stamina they possess, though they may spend a point of Willpower every hour they wish to continue traveling beyond this limit. They may use all senses as normal. Though the psychic may return to their body at any time before their normal limit is up, returning will not wake them unless the cause of unconsciousness has resolved."
    },
    {
     "level": 5,
     "name": "Odyssey",
     "text": "The psychic’s astral travel abilities are legendary. The psychic can travel anywhere on or in Earth, extending to at least the edge of the atmosphere. Attempting to go further requires a Willpower roll at difficulty 9. So long as the psychic’s body lives, including aid with life support technology, the psychic may travel indefinitely. If manifested, the psychic may speak in normal volumes and may choose to either appear in an indistinct, translucent form or deceptively opaque and may stay manifested for up to an hour per point of Willpower spent. The psychic may choose to show up on recordings."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "biocontrol",
   "name": "Biocontrol",
   "page": 57,
   "description": "Most psychic phenomena involve the perception or control of things outside the psychic’s body, but Biocontrol allows the psychic to exert will over their body itself. A psychic can ignore pain, enhance senses, and even divert circulation or regulate hormonal levels at will.\n\nWhile others can afford themselves minor degrees of control with biofeedback and meditation, psychics with Biocontrol can force their bodies to survive what appear to be hopeless situations. The mother who lifted a car off her child, the man who never seems drunk no matter how many drinks he downs, and the lone survivor of a tragedy are all examples of this phenomenon. The more miraculous the expression, however, the more likely the psychic inadvertently draws the wrong attention.\n\nBeyond potential unwanted attention, Biocontrol isn’t without risk. Botches can cause biological processes to go haywire at exactly the wrong time, proportional to the effect the psychic was trying to achieve. A psychic needing to reduce their oxygen requirement to survive drowning might increase their metabolism and expedite their demise, but a psychic seeking social advantage with pheromones might embarrass themself by causing excessive sweating.",
   "levels": [
    {
     "level": 1,
     "name": "Mindfulness",
     "text": "The psychic concentrates on altering their biological processes in minor ways. They can stop small wounds from bleeding, raise or lower their core body temperature by up to two degrees, hold their breath for an extended time, ignore pain from minor wounds, including wound penalties of up to half their Biocontrol rating (rounded up), and consciously regulate their blood pressure and pulse within normal range. The effect ends if the psychic’s concentration breaks."
    },
    {
     "level": 2,
     "name": "Healing Factor",
     "text": "The psychic forces their body to accelerate the metabolic processes responsible for healing and fighting infections far beyond the normal rate. The psychic must spend time resting and meditating, ideally while receiving medical care — the psychic’s still mortal, after all. For every activation success, the psychic reduces the time to heal the highest health level by one level, to a minimum of one hour for bashing damage and one day for lethal or aggravated damage. After the first level of damage heals, the psychic may roll activation again to repeat the process. If using Healing Factor, psychics can ignore the permanent impairment risk (see Mage 20 p. 408) so long as they have sufficient nutrition and rest."
    },
    {
     "level": 3,
     "name": "Surge",
     "text": "The psychic floods their system with hormones at will. Psychics choose Physical, Social, or Mental and split their activation successes between attributes from the chosen category to raise dots (to a maximum of 5 in any attribute) for one scene. This can represent an adrenaline surge allowing for “hysterical strength” in an emergency, a surge of dopamine to improve mental function, or modulation of serotonin and pheromones to make themselves calmer or subconsciously attractive in social situations. Deliberately causing hormone spikes strains the body: When the effect wears off, the psychic must roll Stamina at difficulty 5 to soak activation successes as bashing damage."
    },
    {
     "level": 4,
     "name": "Toggle Nerves",
     "text": "A psychic with this level of control enhances or reduces sensitivity in their nerves for up to one scene per activation success. The most common usage is temporarily deadening pain. A psychic may ignore wound penalties caused by pain by up to activation success number of health levels — it doesn’t allow the psychic to ignore penalties due to nonfunctional or missing body parts. A psychic may instead choose to deaden senses to ignore other noxious stimuli, such as powerful scents, sudden lighting changes, or temperature extremes. The psychic may ignore up to activation successes in distraction penalties and may split the successes across multiple penalty types. Alternatively, a psychic may increase nerve sensitivity, lowering the difficulty of perception-based rolls by activation successes and may split the successes across senses. However, increasing nerve sensitivity comes at a risk. Every success spent toward lowering perception difficulty with a sense adds to the difficulty of resisting distractions using that sense while the power is active. If the psychic increases touch sensitivity and sustains damage, they suffer additional wound penalties equal to their activation senses devoted to touch."
    },
    {
     "level": 5,
     "name": "Biological Mastery",
     "text": "The psychic achieves complete control over their body. They can stop and restart their heart at will, regulate digestion, temporarily suspend the need for oxygen, and put themselves in hibernation to force more extreme feats of healing — including regrowing parts. They can accelerate or suspend regeneration at a cellular level and may nullify toxins with an activation roll. Each activation success reduces the Toxin Rating of the substance by one. If the remaining Toxin Rating is lower than the psychic’s Stamina, the psychic may direct the toxin to a specific part of their body to run its course, suffering an Impediment (as the flaw, see M20 Book of Secrets p. 39) for the duration of the toxin’s effect. If the Toxin Rating is higher than the psychic’s Stamina after using Biological Mastery, the psychic suffers the toxin normally at the lowered Toxin Rating. A psychic may spend a turn concentrating and roll activation to soak lethal and aggravated damage with Stamina for a scene."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "channeling",
   "name": "Channeling",
   "page": 58,
   "description": "A medium stands before a group and calls forth a dead relative with some letter of the alphabet for a name. Some attendee says they know someone dead with that name. The medium lets them know that they crossed over peacefully, and the spirit wants the best for them. They forgive the living for some vague sin that the attendee acknowledges, and nothing further is asked. Solace has been achieved and the medium gets paid. The reality show does great, and popularity grows. That’s all crap.\n\nIn the psychic community, there are those that channel the dead. It’s rarely for the purpose of making someone feel better though. The dead are a wealth of untapped experience that would make even the most learned master blush with envy. That knowledge is at the beck and call of the channeler, and when used correctly they are never without the right skill for the task at hand.\n\nChannelers come in all shapes, sizes, and styles. Some of them are into the classic ‘eyes roll back and speak in another tongue’ Victorian-era trope. There are a few that drink home-brewed concoctions they’ve made for themselves that “open them up to the other side.” Modern channelers with a technological bent use spirit boxes and EVP devices to get their knowledge. In the end, the psychic is opening themselves up to a wraith in the Shadowlands that has the knowledge they need. The better they are, the stronger the connection to the skills and talents of the dead.\n\nIt’s a dangerous game to play, to be sure. Opening that door can lead to some nasty pieces of work sauntering into the psychic’s psyche if they aren’t careful. When things go wrong, full blown possession awaits the unfortunate channeler. But the flip side is being able to bring in the knowledge of a surgical genius in a medical emergency, an acrobat when crossing a precarious ledge, or a stone-cold killer when self-defense is required. Channelers are the first to say the risk is worth the reward.\n\nWhen Channeling, the psychic can only bring forth one spirit at a time. The psyche of the channeler could easily be overwhelmed if more than one wraith is given access to their being. Should the psychic summon another spirit while currently hosting another from a previous channeling, the first is released and replaced by the second.\n\nBy necessity, the channeler has some insight into the Shadowlands, the realm of the ghosts. As they grow more powerful in their practice, the channeler can peer across the Shroud for a number of minutes equal to successes rolled. This is a separate use of their channeling talent and costs the same as channeling a spirit for their capabilities. The difficulty of this power roll is affected by the strength of the Shroud in their area and has no restriction on frequency of use, so long as the psychic has the Willpower points to spend.",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "The channeler can tap into the other side and draw forth a ghost’s Abilities, though they may only access a single Ability per use of this power. Successes on the activation roll become bonus dice for rolls utilizing the desired Talent, Skill, or Knowledge for the remainder of the scene. When gazing across the Shroud, the psychic can gather a vague idea of the wraiths present."
    },
    {
     "level": 2,
     "name": "",
     "text": "The psychic can now access two Abilities simultaneously, splitting successes between desired traits. The channeler also can now make out more of the Shadowlands when peering across the Shroud. The channeler can discern details of the landscape and identify specific ghosts that are present."
    },
    {
     "level": 3,
     "name": "",
     "text": "Further growth now allows a third Ability to be channeled, subject to the limitations above. The channeler can now verbally communicate with ghosts beyond the Shroud."
    },
    {
     "level": 4,
     "name": "",
     "text": "The psychic can now access any Talent, Skill or Knowledge, maintaining multiple channeled traits as long as they gain sufficient successes on the activation roll to cover the desired trait levels. Communication is no longer hindered by a short window of accessibility, and gazing across the Shroud lasts a whole scene."
    },
    {
     "level": 5,
     "name": "",
     "text": "With a psyche girded by many trials and tribulations, the psychic is fortified enough to now channel two separate personalities at once. Note that each wraith channeled still requires its own cost and power roll. Should the Ability channeled be the same on each use, the bonus dice from both uses are added to dice pools using the Talent, Skill, or Knowledge.\n\nAt the pinnacle of their skill, with one spirit channeled, the medium may open themselves to a wraith and gain all the Abilities of the visiting spirit. Successes rolled during the channeling roll are now available to any Talent, Skill, or Knowledge that wraith may have possessed in life. The extra costs of channeling with such lowered defenses can be high, however. The spirit may request a favor, a task to be completed, or even the right to freely control the channeler’s body for a period of time."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": "The level entries have no bold names in the book. The closing paragraph beginning “At the pinnacle of their skill…” follows the ••••• entry and has been kept as the second paragraph of level 5."
  },
  {
   "id": "clairvoyance",
   "name": "Clairvoyance",
   "page": 59,
   "description": "Clairvoyance refers to the capability to see beyond one’s immediate surroundings and out to great distances. In many cases, the projected sense can be any of the five senses, and the actual input received is rarely something so simple as a one-to-one analogue of the distant location. In most cases, the senses are bombarded with interpretive sensations that all add up to a single unified idea of the location, person, or object being perceived.\n\nThe more information a clairsentient has about their target, the clearer the image they receive. Reams of reports sit in government testing facilities with project names like Stargate, Grillflame, and Sunstreak that tell of scouted psychics giving impressions and corollary sensations to target observations. Items they were very familiar with were held in far off locations, mountain bases, desert outposts, and even submarines. The psychics would relay things such as getting a chill, seeing a noon-day sun, or feeling as though they were floating in a swimming pool. While a good start, the practiced clairvoyant can achieve far more accuracy and clarity. The most powerful clairvoyants can see a location hundreds of miles away with crystal clarity, and rumors whisper of powerhouses with global reach.\n\nSome confusion does exist between what constitutes Clairvoyance and what is Astral Projection. There are those that insist they are the same phenomenon when mastery is achieved in either. The discerning psychic sees this conflation as laughable. The most well-informed physic scholars might offer this clarification: “Clairvoyance obviously takes advantage of the inherent connection between points in space, while the inner self leaves the body and is sent traveling via Astral Projection.”\n\nThis connection and familiarity with the subject of their viewing has a direct effect on their chances of success as well. Finding more familiar targets requires only one or two successes, while being a stranger to the subject will increase the number of successes needed to locate it. Once a connection is made, the clairsentient can observe the location or the area surrounding a person or object to whatever degree of clarity they achieved. A psychic attempting to refocus their second sight needs to make another roll (with the difficulty adjusted one lower for familiarity, if the new subject was viewed from their first focus).",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "Experiencing remote locations is new to the psychic, and most observations are interpretive. This impression can be a physical sensation of cold steel for a knife, the smell of gunpowder for firearms, or a vision of a doghouse for guard dogs. In some cases, an actual image of the subject can be achieved, but this will be hazy at best. The one exception is hearing. Sounds come across the mental bridge garbled and unintelligible, if they can be heard at all. More successes grant more literal symbolic sensations, with five successes affording actual visual perception of the target, cloudy as it may be. Senses have a limited range for novices and reach to approximately one mile around the psychic. Retraining their focus requires another Willpower roll and another expenditure of Willpower to solidify their new remote subject."
    },
    {
     "level": 2,
     "name": "",
     "text": "Remote sight becomes more reliably achievable, albeit still shrouded in mild distortion or haze. Sound comes across far more frequently, with a chance of being clear enough to be understandable. Three successes on the Willpower test affords a near clear image of the subject with distorted sounds, while five successes grant crystal clarity and intelligible sounds that could convey the general subject and mood of conversations near the subject. The psychic can now push their senses further — out to ten miles away from their current location. The difficulty of the roll increases by one past 5 miles and by two at 8 miles."
    },
    {
     "level": 3,
     "name": "",
     "text": "Clarity is no longer an issue, and remote sensing brings sight and sound across the expanse without distortion. The clairvoyant unlocks a new avenue of clarified perception in the sense of touch. “Touching” a distant subject psychically returns muffled sensations, as though their hands were encased in heavy mittens. With clarity no longer a concern, successes now define the distance a clairsentient can reach, with each success representing ten miles of range. At this point, a new Willpower roll is still required to refocus but no longer costs more effort to perform."
    },
    {
     "level": 4,
     "name": "",
     "text": "Sight, sound, and touch are all within the purview of the remote viewer. The clairvoyant also begins perceiving smells and tastes, with strong odors and flavors being detected when they are in abundance. Range now increases ten-fold, with each success equating to 100 miles of range."
    },
    {
     "level": 5,
     "name": "",
     "text": "The clairsentient master can remotely view a location as though they are standing in the room. All five senses are received with exact definition, with no secret escaping their perception. Range increases ten-fold once more, with each success extending their reach by 1,000 miles. Finally, so long as the psychic is refocusing on an element that they can see within their current clairvoyant view, no new roll is required, as they forge new correspondences to subjects on the fly."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": "The level entries have no bold names in the book. “physic scholars” is as printed."
  },
  {
   "id": "cyberkinesis",
   "name": "Cyberkinesis",
   "page": 60,
   "description": "Cyberkinesis is one of the most recently discovered Psychic Phenomena — the first instance documented less than a century ago — and represents the ability to control electronic machinery by thought. Experts in psychic phenomena theorize that Cyberkinesis is an information age variant of telekinesis. The psychic generates small electromagnetic fields that control and alter the firmware and software of electronics, ranging from fire alarms to super computers.\n\nThough the cyberkinetic may psychically control the machine, they can’t psychically read its contents without Cyberpathy. All powers above dot one require the Cyberkinetic to have either access to the device’s display or to be able to access the device via Cyberpathy.",
   "levels": [
    {
     "level": 1,
     "name": "Switch",
     "text": "The cyberkinetic may turn electronics off and on without touching them. +2 difficulty to activation if the electronic requires a physical relay rather than an electronic one. The psychic must be able to sense the electronic device to use this power. This is an exception to the usual requirement to access the device’s display and applies to devices without displays such as light fixtures."
    },
    {
     "level": 2,
     "name": "Remote",
     "text": "The psychic may control electronics with their mind without having to use an input device such as a keyboard. This does not give any login or override credentials, but if the psychic knows credentials, they may enter them. Any action more difficult than operating an office computer raises the activation difficulty. This power removes the need for haptic input devices if the psychic uses Augmented Reality (M20 Operative’s Dossier, p. 58).\n\nDifficulty Modifier — Example\n+1 — Controlling a small office’s server network or a home security system, using a 3-D printer with pre-loaded designs\n+2 — Psychically driving an electric car at highway speeds\n+3 — Using specialized equipment such as a 3-D printer with no pre-loaded designs\n+4 — Directing a computer-controlled factory\n+5 — Operating a space shuttle single-handedly"
    },
    {
     "level": 3,
     "name": "Glitch",
     "text": "The psychic directs their electromagnetic fields to scramble electronic processes by causing tiny internal shorts and power surges. They can cause computers to lock up or blue screen and recording equipment to pick up only static. The effect requires active concentration. Most electronics return to normal after the effect ends, but some older tech simply crashes. A psychic using AR may use this as an attack on Icons and other Digital Web objects, dealing bashing damage. Use activation to attack, and substitute dots in Cyberkinesis for the weapon modifier in the damage roll. If the psychic inflicts 3 or more damage in one attack, the target is stunned for a round."
    },
    {
     "level": 4,
     "name": "Spoof",
     "text": "The psychic tricks operating systems into letting them in without valid credentials. If the system would be able to perform the task, the psychic can force the system to do it. The psychic may plant fake documents, install malware, give themself admin privileges, or erase data."
    },
    {
     "level": 5,
     "name": "Overclock",
     "text": "The psychic overrides safety limiters in electronics to force them to exceed their normal capabilities. A computer processes faster or runs more intensive software than it should be able to, an electric car accelerates faster, or an office laser pointer becomes a weapon. Every activation success adds an automatic success to the psychic’s next use of the machine, but the exertion damages the machine. Rolls to operate the machine after this power is used suffer a dice penalty equal to the activation successes until the device is repaired. Acquiring 8 or more successes when activating this power completely fries the machine after the Overclock effect ends."
    }
   ],
   "system": "",
   "sidebars": [
    {
     "title": "Psychics and Technomagickal Wonders",
     "text": "Cyberkinetics and Cyberpaths will mostly interact with mundane technology, and that’s what the base rules for those Phenomena describe. In mixed chronicles with Awakened mages, or even as part of a higher-powered plot, a psychic might run across Wonders like technomagickal Devices.\n\nUnlike standard technology, technomagickal Wonders tend to be stubborn, have quirks, and sometimes a will of their own. As such, they receive active resistance rolls against any uses of Cyberkinesis and Cyberpathy. After the psychic rolls successful activation for their effect, the Storyteller rolls the Wonder’s rating times 2 at difficulty 7 to resist the psychic. If the Wonder gets more successes, the psychic’s attempt fails, but the psychic knows the device resisted their attempt. If the psychic gets more successes, the psychic may proceed as normal, treating their net successes as their activation successes. Botches rolled on a Device’s resistance may offer additional future affinity towards the psychic at the Storyteller’s discretion.\n\nA Storyteller may instead choose to allow the psychic to roll activation at an additional difficulty equal to the Wonder’s rating in cases where the psychic’s intended action matches the nature — and historical tendencies — of the Wonder. On successful activation, the Wonder does not roll resistance.\n\nIf the psychic possesses the Cyberpathy power Enigma, Wonders roll to resist the psychic at difficulty 8. The powerful decryption function allows a psychic to better reason with the Wonder in convincing it to work with the psychic.\n\nFor more information about Wonders, see Mage 20, p. 651"
    }
   ],
   "notes": "The Remote (level 2) entry is accompanied in the book by a two-column table (Difficulty Modifier / Example); it has been transcribed as line-separated rows at the end of the level 2 text. The extracted text for the •••• (Spoof) and ••••• (Overclock) entries was split across columns and has been reassembled in reading order."
  },
  {
   "id": "cyberpathy",
   "name": "Cyberpathy",
   "page": 61,
   "description": "As experts believe Cyberkinesis is an information age variant of telekinesis, they similarly believe Cyberpathy functions on the same premise as telepathy — the Cyberpath decodes electromagnetic patterns in a computer’s hard drives to access information, just as a telepath decodes electrical impulses in the brain.\n\nA Cyberpath must keep the computer in question in sight, except for Remote Access, where they must instead keep the entry point computer in sight. This ability may also target storage devices and media such as flash drives, disks, and external or unconnected hard drives. Typically, Cyberpathy takes 10 to 15 minutes, but each activation success reduces the time required by one minute. Until the psychic possesses dot 5, heavily encrypted systems increase the activation difficulty. Cyberpathy proves most versatile when combined with Cyberkinesis but can also aid mundane hacking attempts.",
   "levels": [
    {
     "level": 1,
     "name": "Map Structure",
     "text": "The Cyberpath can examine the directory of computers and storage devices. The Cyberpath can find the location and properties of all files stored but cannot access the files using this power. This can be useful for Cyberpath hackers looking for specific data. The psychic can use this level to identify a device by its Augmented Reality Object ID if it is web-capable."
    },
    {
     "level": 2,
     "name": "Read-only Mode",
     "text": "As Map Structure, but the Cyberpath may also read files. Plain text and graphics files are simple to view, and the Cyberpath may divine the functions of executable files and applications. The Cyberpath is unable to decrypt encrypted files at this stage. The psychic may view the device’s associated ARO if it is Level 1 or below and may divine the ARO’s properties if it’s a higher level."
    },
    {
     "level": 3,
     "name": "Download",
     "text": "The psychic can use their brain as storage media, copying and pasting files found using Cyberpathy. The Cyberpath may access stored text, graphics, and videos at any time from their mind, but cannot run applications. The psychic may store a maximum number of files equal to the total of their mental attributes (Example: Coleen has Perception 4, Intelligence 3, and Wits 3. She may store 10 files in her mind). Larger files and applications may use more than one storage slot, while a zipped folder may contain multiple small files in one slot, at the cost of the psychic being unable to read any of the files while stored in this manner. The Cyberpath may later write any files they saved this way to any media they can access with Cyberpathy, with the option to either copy the file to the media or transfer it from their mind. If the device has a connected display device, the psychic can combine Download with Cyberpathy to write and display a file to others in the same turn. Deleting files from the psychic’s mind is a free action, but the psychic may only delete one file at a time. Larger files that took more than one storage slot take a number of rounds equal to the number of slots the file occupies to finish deletion, but the psychic may perform other actions as normal during deletion. The character may download an ARO from a device to upload later to spoof the device’s identity."
    },
    {
     "level": 4,
     "name": "Remote Access",
     "text": "The Cyberpath may connect to any computer or device, such as external hard drives, on the same network as their local device. This power only allows the psychic to treat the remote device as if it were in front of them, and any other powers must be activated separately. The psychic may access multiple devices on the same network at a cost of 1 Willpower per device. If the device is capable of internet access, the psychic may use this ability to access the internet, including the Digital Web. The psychic may use advanced AR devices as their point of access with this power."
    },
    {
     "level": 5,
     "name": "Enigma",
     "text": "The Cyberpath becomes a living decryption algorithm, able to crack even heavily encrypted systems and files with ease. The psychic may activate this power to ignore difficulty increases for lower Cyberpathy powers and mundane access on secure and encrypted systems or files previously stored using Download. The psychic may alternatively use activation successes to increase Cyberpathy and hacking difficulty for others on a file or device, at +1 difficulty per activation success if the psychic possesses dots in Computers or Cyberkinesis."
    }
   ],
   "system": "",
   "sidebars": [
    {
     "title": "The Digital Web",
     "text": "While any Sleeper can technically access Grid Sectors of the Digital Web through their devices, psychics skilled in Cyberpathy and Cyberkinesis can experience these sectors like a mage. Cyberpathy allows the psychic to access the Digital Web without relying on Augmented Reality (AR) devices. The psychic may substitute Abilities when navigating the Digital Web as in M20 Operatives Dossier p. 60 but may also substitute Cyberkinesis for Athletics and Cyberpathy for Streetwise, Subterfuge, and Seduction.\n\nA psychic can only affect the Digital Web with Cyberpathy and Cyberkinesis; no other Phenomena function there. See the M20 Operatives Dossier Chapter 5 for detailed information about the Digital Web.\n\nAny power that would be considered vulgar in a given Sector must be rolled at +2 difficulty and still risks the consequences of breaking a sector’s rules, even if the psychic can’t personally incur Paradox. Yes, this means a careless Cyberpath can cause a Whiteout.\n\nCyberpaths may craft unique icons like mages can, and experienced Cyberpaths can be difficult to distinguish from mages (Mage 20, p. 468) until their Awakened companions want to hop out of the pen of the Grid Sectors."
    }
   ],
   "notes": "The Digital Web sidebar is printed on p. 62. The “(Mage 20, p. 468)” reference was duplicated by extraction and has been collapsed to a single citation."
  },
  {
   "id": "ectoplasmic_generation",
   "name": "Ectoplasmic Generation",
   "page": 63,
   "description": "There exist collections of séance photos from the height of the occult entertainment phase of society that display roiling masses of translucent, weightless mucus hovering about the heads of session leaders. Most write these off as simple imperfections in the film and move on to appreciate the relics of photography in their hands. True psychics know otherwise. Ectoplasm is the neutral spirit stuff of the ghost. A substance born from spiritual energy and activity, ectoplasm exists as liminal evidence of something beyond the physical. An entertaining parlor trick for the initiated, this plasm is far more useful than the layman may readily assume.\n\nThrough concentration and sheer force of will, a psychic gathers up ambient ghostly energies from around them and brings it into physical being inside their gut. This creates the unsettling sight of this coalesced spirit stuff flowing from the mouth and nose of the practitioner. Manifesting as slick, translucent, and cold gel, ectoplasm flows weightlessly when not given direction. Responding to the will of the generator, the pliable spirit matter can take many ghastly forms to disgust or impede the unwary, while dissolving into nothing mere minutes after concentration is broken. Much to the dismay of witnesses, ectoplasm leaves no physical or spiritual evidence at all once sublimated.\n\nPossibly ectoplasm’s most useful property is that no matter how wispy, slimy, or goopy the ectoplasm may seem to the average person, it will be as hard and immoveable as pure lead to the spiritual. Ghosts, wraiths, spirits and astrally projected souls all find ectoplasm very solid and nigh impassable. This has a myriad of uses ranging from creating a barrier around a room by smearing the walls to coating one’s hands in the stuff to allow the psychic to touch the immaterial Shadowlands, whether with benevolence or violence. This Phenomenon does not allow the psychic to see into the Shadowlands unfortunately. It merely allows them ability to create a substance of both spirit and matter.",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "When one first starts exploring their capabilities as a generator, it starts with rather juvenile seeming practices. Novice generators don’t find the act of creating ectoplasm difficult. The real difficulty lies in creating a substantial volume and force. This leads to the fledgling generator being unable to force the semi-liquid plasm from their orifices without assistance. Reaching into their mouth, nose, and ears to draw forth the substance by hand or by relying on peristalsis, the generator must work to bring it forth. Every success on the activation test generates a softball sized volume of the sticky substance. It only lasts a number of turns equal to the generator’s Willpower, but it can be applied as quickly as it is generated. Covering an object with a thin layer of ectoplasm takes no extra steps beyond generating it. The plasm sticks to all surfaces and does not wipe away easily. It will cling and string to anything touching it and only sublimates into nothingness when the duration expires.\n\nAnother novel approach users find early is the “smoking man” technique. When coaxed correctly, ectoplasm can also come forth as a mist like vapor. Lingering licks and tendrils of thick smoke seep from the mouth, nose, and tear ducts of the generator. Lasting for a number of turns equal to the psychic’s Willpower, this should be taken into account when dealing with social interactions. Using the technique can add a bonus die for situations such as a stage magician’s routine or intimidating an unsuspecting tough but incurs a −1 penalty to Abilities such as Expression or Leadership due to the disconcerting sight of this ectoplasmic cloud."
    },
    {
     "level": 2,
     "name": "",
     "text": "Once Ectoplasmic generators hit their stride, the degree of advance in control is astounding. With each success on the activation roll, a psychic generates a quart’s worth of the slimy fluid. With such an increased volume, assistance is not required to force the plasm out, as it simply pours from the nasal and esophageal orifices of the psychic. There is no discomfort in this, and more than a few generators take a sick glee in others’ revulsion to their practice. All plasm phenomena now last a number of minutes equal to the generator’s Willpower.\n\nA mist generated now gains a measure of responsiveness to the creators will. The psychic can now push the mist outward into a cloud that moves and shifts at the generator’s mental command. The speed of the cloud is not impressive at 10 feet per round, but it can be used to obscure prying eyes, imposing a +2 difficulty to Perception tests. This mist cloud has a radius of 1 foot per Willpower of the psychic."
    },
    {
     "level": 3,
     "name": "",
     "text": "Plasm fluid generation is a child’s trick to the seasoned generator. Each success on the activation roll now summons forth a gallon of liquid in a steady flow. The force of the stream is not enough to cause an individual to lose a step, but it is enough for the generator to strike the corner of the ceiling in a standard room.\n\nEctoplasmic mists gain a degree of solidity. No longer just smoky wisps, the mist is now solid enough to feel like cotton candy to the living. This is in concert with increased volume of 5 feet of radius per dot of Willpower. Attempting to force past the thick semi-solid mist requires a Strength + Athletics roll (difficulty 6). Thick enough now that the mist is all but opaque, it also provides visual cover and increases the difficulty of seeing and attacking through it by +3, similar to a heavy smoke grenade."
    },
    {
     "level": 4,
     "name": "",
     "text": "Fluid and mist are useful, but access to solid mass and crafted forms expand possibilities for creativity tenfold. The volume does not increase, but now the channeler’s output can result in solid matter the consistency of heavy lard. With greater structural stability, the ectoplasm can hold definite shapes that are only hindered by the generator’s creativity. These creations have a number of points equal to the Willpower of the psychic to be distributed between Strength, Dexterity, and Stamina. The creation has 3 health levels and suffers no wound penalties. While not capable of complex movements, the solid ephemeral creations can move through space at 30 feet per turn. The creations are psychically tethered to their creator and cannot leave their physical perception and retain movement. Finally, all plasmic creations are no longer hindered by a time limit and last as long as the generator concentrates."
    },
    {
     "level": 5,
     "name": "",
     "text": "Full torso-ed, free floating, vaporous apparitions are at the pinnacle of the generator’s craft. Still puppets of the creator, shaped creations may now fully animate as appropriate to their complex forms. While unable to fool someone into thinking it’s the genuine article, the shapes can now roughly mimic people and creatures, even emitting groans as pockets of air escape within the gooey form. The forms are still limited by the volume generated on the roll, with an adult-sized being of ectoplasm taking three successes to fill out. The creations follow the same rules for Attribute distribution as detailed above but have 6 health levels and suffer no wound penalties. Ectoplasmic puppets can be possessed and controlled easily by ghosts in the area. The psychic spends 1 Willpower to hand the reins to a nearby, willing ghost. The ghost then has total control of the ectoplasmic construct, using it as though it were their own body. Once the psychic hands the body over in this fashion, it lasts for a number of rounds equal to the psychic’s Willpower score, after which the puppet’s ectoplasm dissipates. Other manifestations the psychic creates are not affected and remain extant as long as the psychic concentrates."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": "Levels carry no bold labels in the book."
  },
  {
   "id": "mind_shields",
   "name": "Mind Shields",
   "page": 65,
   "description": "A mind is a terrible thing to waste. Many psychics live by this credo. There are people and things out there in the world that assault the mind directly, but some psychics are gifted with the ability to prepare against this potential threat. Building walls against mental attacks, ensuring thoughts are too chaotic to control, or just inherent mental fortitude are all possible sources for this defense.\n\nAs the name implies, Mind Shields only affect powers that affect the psychic’s mind. Powers that originate from the mind of another but affect the world around the shielded psychic are unaffected. A psychokinetic has no harder a time lifting and holding a psychic with Mind Shields in place than they would a normal person.\n\nMind Shields, being a Psychic Phenomenon, have an easier time dealing with Psychic Phenomena than other forms of mental assault. A vampire who wields Dominate taps into the mind in a different manner than a psychic with Psychic Hypnosis. Unfortunately, Mind Shields are only half as effective against mental attacks from non-psychic sources.",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "Defenses are thin, but present. The Psychic receives 2 dice to counter mental attack phenomena and 1 dice for mental attacks from other sources. At this point, Shields are always active and cannot discern friendly and hostile effects. The psychic can lower their Mind Shields to allow access to a friendly psychic, but this leaves them open to any other mental ability used before they are raised once again."
    },
    {
     "level": 2,
     "name": "",
     "text": "Layers of mental chaos or thicker walls of the mind are built. The psychic receives 4 dice to counter mental attack phenomena and 2 dice for mental attacks from other sources."
    },
    {
     "level": 3,
     "name": "",
     "text": "The psychic’s mind is a confusing mess or a sturdy bunker to any invader. The psychic receives 6 dice to counter mental attack phenomena and 3 dice for mental attacks from other sources. The ability to modulate one’s Mind Shields becomes clear at this level. Whenever presented with a mental ability that attempts to interact with the shielded psychic’s mind, the target may decide whether to let this pass their shields or not. Note that this doesn’t identify every ability used, merely that an attempt is underway to access the psychic’s mind. It is up to the deductive reasoning of the target to work out who stands before their mental gates."
    },
    {
     "level": 4,
     "name": "",
     "text": "A mental bulwark or a confounding mire of scattered thought greets intruders. The psychic receives 8 dice to counter mental attack phenomena and 4 dice for mental attacks from other sources."
    },
    {
     "level": 5,
     "name": "",
     "text": "The psychic’s mental fortress stands impenetrable or infinite maze unnavigable. The Psychic receives 10 dice to counter mental attack phenomena and 5 dice for mental attacks from other sources."
    }
   ],
   "system": "When confronted by a mental assault or invasion, the psychic’s Mind Shields provide a dice pool to counter the effect. The target rolls these dice (difficulty 6) and subtracts their successes from those of the attacker. A defender that rolls more than the attacker disrupts the assault completely, and the attack fails. For powers that normally call for a defense roll, Mind Shields dice are added directly to the defense roll instead.",
   "sidebars": [],
   "notes": "Levels carry no bold labels in the book. The dice-pool paragraph is the final paragraph of the intro, placed in system."
  },
  {
   "id": "precognition",
   "name": "Precognition",
   "page": 65,
   "description": "The psychic experiences clues about the future. The future isn’t fixed and may change depending on the choices people make. The more decisions required for an outcome, the lower the prediction accuracy. No seer has proven 100 percent accurate, except for the mythical Cassandra.\n\nPrecognition allows a psychic to judge outcome probabilities with above-human accuracy. Scientifically minded psychics rationalize precognition as conscious manifestations of subconscious perception analysis. Mystical-leaning psychics understand precognition as a sort of sixth sense with no scientific explanation.\n\nWhile a psychic may activate precognition, a Storyteller may call for activation for story purposes, in which case no Willpower is expended for that activation.",
   "levels": [
    {
     "level": 1,
     "name": "Intuition",
     "text": "The seer gains a knack for guessing correctly. For purely random events (lottery, dice rolls), the predictions can be rather accurate. The psychic can intuitively know the shortest route to a given destination and enjoys a higher likelihood for beneficial chance meetings. The psychic experiences no visions, they just “have a feeling” and guess very well. Even with five or more successes, predictions are unlikely to be entirely accurate."
    },
    {
     "level": 2,
     "name": "Insight",
     "text": "The psychic experiences dreamlike visions during sleep and waking hours alike. Like dreams, they are rarely literal. Instead, the visions are steeped in metaphor. An enemy might appear as a fierce dragon or figures in clandestine robes, where a beloved mentor might appear as a long-dead parent. The imagery depends on the seer’s paradigm, and while more successes offer detailed visions, they are always subject to interpretation."
    },
    {
     "level": 3,
     "name": "Danger Sense",
     "text": "The seer’s connection to the future becomes an early-warning system. The psychic perceives this as anything from a piercing temple headache, to cramps, to a creeping sense of dread. No matter the manifestation, it’s always the same for the seer. This power is always “on,” though may be subverted with certain Sphere effects or the Anti-Psychic Phenomenon. When something unnoticed targets the psychic, the Storyteller rolls Danger Sense activation before rolling ambush. This power does not cost the psychic Willpower to activate.\n\nSuccesses — Effect\nBotch — The seer unwittingly puts themself in worse danger and loses their roll to spot the ambush.\nFailure — The psychic gets no intuition about the situation.\n1 — The seer senses they’re in danger but gets no specifics. They get 1 bonus die to spot an ambush.\n2 — The seer senses they’re in danger and receives simple instruction on how to avoid it such as “duck,” or “run.” The psychic gets 2 bonus dice to spot the ambush and dodges normally if the attacker remains hidden.\n3 — The seer knows they’re in danger, how to avoid it, and the direction of the danger. The attacker doesn’t roll ambush and the attack resolves normally.\n4 — The seer knows the details of the attack and gets a turn of warning. The psychic gains a turn to prepare before the danger happens.\n5 — The seer gets a turn of warning and a vision of those responsible. The psychic will be able to identify the person by sight and/or with psychic intuition should the psychic see or be in the presence of the person later. The psychic imprint also functions on recordings and creations, such as paintings or letters, made by the attacker."
    },
    {
     "level": 4,
     "name": "Clarity",
     "text": "The seer enjoys a near-perfect view of the immediate future. For every activation success, players and Storyteller announce their general future plans for one turn. If the psychic interferes with time — such as moving behind cover to foil an attack, the future changes, and the psychic must reactivate this power for updates."
    },
    {
     "level": 5,
     "name": "Roads of Time",
     "text": "A psychic sees more than only the most likely outcomes and their relative probabilities. As Insight, but the psychic sees time as diverging roads branching off at decisions. The seer identifies otherwise innocuous-seeming decision points before the choices are made. This also allows a psychic to see which future events are difficult to change and which events are most malleable."
    }
   ],
   "system": "Successes — Time Range\n1 — 12 hours\n2 — 24 hours\n3 — 1 week\n4 — 1 month\n5 — 1 year\n6+ — 1 additional year per success\n\nProviding information about the far future can be difficult for the Storyteller. The Storyteller may instead grant one reroll for every precognition success for the story. This represents the psychic’s ability to juggle relative future probabilities. A psychic may use as many of these rerolls on a single action as they wish.",
   "sidebars": [],
   "notes": "Two tables appear after the level list: a Successes/Time Range table (placed in system) and a Successes/Effect table for Danger Sense (appended to the level 3 entry). Tables are rendered as 'key — value' lines."
  },
  {
   "id": "psychic_healing",
   "name": "Psychic Healing",
   "page": 67,
   "description": "Many cultures have legends of people blessed with the power to heal through little more than a touch. Some of these were likely psychic healers. By channeling their will and energy, a psychic may perform miracles. Many with this gift choose to be discrete about it — fame and pressure to perform miracles can be daunting, and the enemies a psychic healer can make within the medical establishment are detrimental. Practicing medicine without a license, even in areas with little healthcare access, remains illegal.\n\nThough not required, many with this gift have a great deal of medical knowledge, often acquired informally. Nearly all psychic healers have high empathy, which some suspect the gift stems from.\n\nBotches when performing medicine of any kind are devastating, but a psychic healer might transfer the injury or illness to themself. Other possibilities include healing a wound grotesquely or misdirecting healing energies, causing autoimmune or cancerous responses.",
   "levels": [
    {
     "level": 1,
     "name": "Diagnosis",
     "text": "The healer instantly diagnoses disease or injury through sight or skin contact. The diagnosis terminology depends on the psychic’s medical knowledge — one with little knowledge might describe lupus as “the body fighting itself.” A psychic may use Diagnosis successes in a complimentary roll (see Mage 20 p. 389) for Medicine rolls. If using teamwork, the psychic may contribute successes to the medical professional’s roll up to the psychic’s Medicine rating."
    },
    {
     "level": 2,
     "name": "Restorative Slumber",
     "text": "With a touch, the healer focuses their patient’s body’s energies on healing. Treat successful activation as skilled medical treatment for bashing and lethal damage and as magickal stabilization for aggravated damage. The touch must last at least one minute, after which the patient falls into a deep sleep. At 3+ successes, the patient also regains one point of Willpower."
    },
    {
     "level": 3,
     "name": "Urgent Care",
     "text": "The psychic’s healing ability now facilitates the rapid resolution of mild injuries and poisons. A psychic touches the patient and may heal up to their activation successes in bashing damage at a rate of one per turn. Every two successes can reduce the Toxin Rating of a poison, drug, or illness by one, up to 3 levels of reduction."
    },
    {
     "level": 4,
     "name": "Intensive Care",
     "text": "The healer may now heal the gravely wounded. The psychic heals up to 1 lethal per activation success and can reduce the Toxin Rating of poisons, drugs, and illnesses by one level per success. Each level healed takes 10 minutes, during which time the psychic must maintain physical contact with the patient. The process is clearly supernatural to any witnesses, as wounds miraculously stitch themselves shut and harmful substances sweat out of the target’s skin."
    },
    {
     "level": 5,
     "name": "Psychic Surgery",
     "text": "The psychic may now heal grievous wounds, cancers, and infections. The psychic heals up to 1 aggravated damage per success. Each level healed takes 10 minutes as the psychic closes their eyes and gestures as if reaching into flesh. Healers may also use this ability to harm, by reaching into a victim and physically removing healthy tissue — a horrific and bloody process. Outside of combat the psychic can use this power to inflict aggravated damage on a restrained target. Like healing, this application of the power takes 10 minutes per health level. Each success on the activation roll causes one health level of unsoakable aggravated damage. This use of psychic healing is sadistic and considered torture, but in combat, there’s not enough time to use this power to its fullest extent. Psychic Surgery can only be used in combat to cause pain — it inflicts wound penalties as if the psychic had wounded the target but causes no damage. The victim may spend points of Willpower equal to the psychic’s activation successes to “heal” the damage."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "psychic_hypnosis",
   "name": "Psychic Hypnosis",
   "page": 67,
   "description": "While modern hypnosis is a form of therapy anyone could learn, some psychics have a natural gift for it with effects far beyond the trained variety. With the increase in popularity and recent research on hypnotherapy, psychic hypnotists can practice their gifts in the open without much fear of attracting the wrong attention.\n\nPsychic hypnosis is neither as fast as vampiric disciplines nor as versatile as the Mind Sphere. Even so, a particularly gifted hypnotist can achieve many similar effects.",
   "levels": [
    {
     "level": 1,
     "name": "Trance State",
     "text": "The hypnotist puts a willing target in a calming trance state, though they cannot issue commands. In this state, the target can remember events and details more clearly and gains a difficulty reduction to any rolls involving memory recall equal to activation successes, to a minimum difficulty of 2. The target also regains one point of Willpower for every activation success, though they cannot benefit from this function again until they’ve rested normally. It takes five turns to place the target in the trance and the trance breaks if anyone disturbs the target. The hypnotist may also put themself in a trance."
    },
    {
     "level": 2,
     "name": "Suggestion",
     "text": "The hypnotist commands a target to perform actions after placing them in a trance. The psychic may give one command per success, and the command can neither obviously result in the target’s death nor go against the target’s Nature. The psychic may force the target to ignore pain responses and forget commands given in the trance as additional commands if the psychic spends successes to do so. Only the psychic decides when the target comes out of the trance. The target ignores incompatible commands instead of breaking the trance."
    },
    {
     "level": 3,
     "name": "Implanted Suggestion",
     "text": "A psychic implants suggestions that will activate outside of the trance. For each success, the psychic may implant a command or condition to activate an implanted command. This condition may be a time or sensory trigger. One of the commands may be to automatically enter a trance under a specified circumstance. As Suggestion, the attempt automatically fails if it would obviously result in the target’s death or conflicts with the target’s Nature. Commands aren’t recurring unless the hypnotist spends an extra success to add a recurring condition."
    },
    {
     "level": 4,
     "name": "Fast Trance",
     "text": "The psychic instantly puts willing subjects in a trance and may spend a point of Willpower to put an unwilling subject in a trance, though an unwilling subject may roll Willpower (difficulty 7) to resist, with each success negating one of the psychic’s activation successes. The number of net activation successes is the number of turns the target remains in the trance. The psychic may roll to activate additional powers starting on their next turn."
    },
    {
     "level": 5,
     "name": "Sleeper Agent",
     "text": "The psychic performs advanced levels of brainwashing and conditioning, the kind governments clamor for. The psychic implants commands for the target to do anything, even to the point of death, and the target consciously remembers nothing said during the trance. This power takes 10 minutes to put the subject in a trance, which cannot be shortened with Fast Trance. The target must clearly hear the psychic’s voice. Additional sounds and distractions make the use of this power impossible, so psychics with this ability often designate special rooms for the purpose. The psychic spends one point of Willpower to use this power on an unwilling subject. Each activation success allows one command to be implanted, and each command or condition takes one hour to implant."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "psychic_invisibility",
   "name": "Psychic Invisibility",
   "page": 68,
   "description": "Psychic Invisibility is not true invisibility. This Phenomenon is like Psychic Hypnosis on a larger scale but with limited scope. The psychic tricks others’ minds to simply overlook the psychic, as if projecting the command “don’t notice me.” The psychic shows up on recordings as normal, but those watching a live feed don’t notice the psychic. Their attention diverts to other details in the recording instead. This ability doesn’t prevent tripping electronic or mechanical alarms that require no human input to trigger, such as motion alarms.\n\nAnimals can’t be fooled with this Phenomenon unless the psychic also possesses Animal Psychics — their minds are too different from humans and humanoid creatures. If a psychic blocks a door or item someone expects to see, the affected individual won’t notice the door or item either. If a being with enhanced perception searches for the psychic or other supernaturally hidden things generally, they may attempt a contested roll to determine whether the being pierces the psychic’s illusion, pitting their appropriate dice pools against the psychic’s activation successes.",
   "levels": [
    {
     "level": 1,
     "name": "Wallflower",
     "text": "So long as the psychic remains completely still and silent, they stay unnoticed. However, the psychic needn’t hold their breath — only heavy or loud breathing breaks the effect."
    },
    {
     "level": 2,
     "name": "Slink",
     "text": "The psychic moves while invisible but can’t interact meaningfully with the world. The power breaks if the psychic does anything to draw attention to themself or interacts with the world, such as writing on a chalkboard or opening a door. A psychic may make a Wits + Stealth roll at difficulty 7 or higher to avoid accidentally breaking their power in unfavorable conditions like twig-covered forest floors or a room with a motion alarm."
    },
    {
     "level": 3,
     "name": "Invisibility",
     "text": "The psychic may now perform any action while invisible, even if those actions would normally draw attention to the psychic. Beings with mundane senses may make a Perception + Awareness roll at difficulty 9 to see the psychic if the psychic attacks them or they are specifically searching for the psychic. The being searching must exceed the psychic’s activation successes. The psychic cannot vanish while someone directly observes them."
    },
    {
     "level": 4,
     "name": "Selective Invisibility",
     "text": "The psychic controls who they project the “don’t notice me” command to. For every activation success, the psychic may declare one person exempt from the effect. Anyone declared exempt perceives and interacts with the psychic normally, but everyone else is treated as if the psychic activated Invisibility. Note that others can still perceive anyone interacting with the psychic, and this may draw negative attention."
    },
    {
     "level": 5,
     "name": "I Was Never Here",
     "text": "At the highest expression of this Phenomenon, a psychic vanishes in front of witnesses and erases their presence from witness minds. The psychic rolls activation opposed to the witness with the highest Perception + Awareness pool. The witness rolls at difficulty 8. At one net success, the psychic vanishes from view, confusing and unnerving any witnesses. At three or more net successes, the witnesses also forget the psychic’s presence for one past turn per success. It’s possible that witnesses could forget ever seeing the psychic, if the observation was short."
    }
   ],
   "system": "Activation successes determine the strength of the Phenomenon’s effect. One success leaves the psychic noticed but difficult to focus on and unable to be identified. This also adds a +1 difficulty to attack rolls targeting the psychic while active. Three or more successes keeps the psychic completely concealed unless successfully contested. Mind Shields and some Mind Sphere effects can protect against this Phenomenon.",
   "sidebars": [],
   "notes": "The activation-successes paragraph is the final paragraph of the intro, placed in system."
  },
  {
   "id": "psychic_vampirism",
   "name": "Psychic Vampirism",
   "page": 69,
   "description": "Everyone knows that one person you can’t be around long without feeling emotionally and spiritually drained. A psychic vampire could be anything from a DMV worker, a droning professor, the one too-eager coworker who won’t shut up at a meeting that could’ve been an email, or something far more sinister. For a psychic vampire, the energy and emotions they drain from their unwitting victims gives a euphoric high unlike any drug in addition to other beneficial effects. Like many drugs, the feeling can become addictive.\n\nIt’s unclear whether the power develops in those prone to using others as resources, or the effects of the power once it develops greatly changes people. In either case, this Psychic Phenomenon can bring out the worst in people. Of note to those who study the supernatural, psychic vampires often have or develop many of the same psychological idiosyncrasies Kindred are prone to.",
   "levels": [
    {
     "level": 1,
     "name": "Tap Energy",
     "text": "The vampire feeds on others’ strong emotions, both positive and negative. The vampire senses what the emotions are as they feed and may use this power to gauge an individual’s emotions over time. It only requires one success to taste the nuanced palate of a person’s emotions and give the vampire a pleasant high. At three successes, the vampire regains one lost Willpower, and regains an additional Willpower per success beyond the third. The vampire must be within 10 yards of the victim and be able to sense them. The victim is unnerved, and their emotions are muted — but not absent — until the end of the scene."
    },
    {
     "level": 2,
     "name": "Invigorate",
     "text": "The psychic drains a victim’s vital energies to empower themself. Every success drains one temporary Willpower from the victim and adds it to the vampire’s pool, up to a maximum of 10 total. Every Willpower over the vampire’s normal maximum gives a euphoric high and fades at one point per hour. The range is 15 yards, and the vampire must sense the victim to target them with this power."
    },
    {
     "level": 3,
     "name": "Leech Vitality",
     "text": "This extremely dangerous power allows a vampire to use another’s life force to heal themself and experience an indescribable high. The psychic must touch the victim for one turn per health level of damage healed, up to activation successes. Bashing heals first, then lethal, and then aggravated downgrades to lethal. Every excess success that doesn’t result in healing restores 2 Willpower points to the psychic, as Invigorate. Every success used deals one lethal damage to the victim. If contact is interrupted before finishing, the psychic does not heal and must make another attempt."
    },
    {
     "level": 4,
     "name": "Essence Feast",
     "text": "The psychic isn’t limited to one victim at a time. The psychic rolls activation to determine the maximum number of simultaneous targets, gaining one additional target per success. All targets must be within 40 yards of the vampire, but the vampire doesn’t have to be able to sense all of them. On success, the psychic may activate any lower power on the same turn, using the normal costs and activation roll associated with the lower power. The psychic is stunned for the next turn — the influx of multiple flavor profiles at once is as overwhelming as it is euphoric for the psychic. A botch can cause a “bad trip” as if the psychic ingested hallucinogens and leave them stunned for the remainder of the scene."
    },
    {
     "level": 5,
     "name": "Distant Drain",
     "text": "The vampire’s mastery over tapping vital energies allows them to re-tap a previous victim over a distance. The vampire must have used either Telepathy or another Psychic Vampirism power on the victim previously. The activation successes specify a maximum range at which the vampire may use a lower power on the victim.\n\nSuccesses — Range\nBotch — May not use Psychic Vampirism on this target for one month\nFailure — Nothing happens\n1 — 500 yards\n2 — 1 miles\n3 — 2 miles\n4 — 5 miles\n5 — 10 miles\n6+ — +10 miles for every success above 5"
    }
   ],
   "system": "",
   "sidebars": [
    {
     "title": "Vampires vs. Vampires",
     "text": "Occasionally, a psychic encounters a true vampire. The warped and bestial emotions are a taste unlike any other. Difficulties for using Psychic Vampirism on Kindred are reduced by 2, and the psychic experiences an intense, vibrant, and practically hallucinatory sensation. Unfortunately for the psychic, Kindred don’t take kindly to becoming prey and may just find out how the psychic tastes."
    }
   ],
   "notes": "The Distant Drain Successes/Range table is appended to the level 5 entry as 'key — value' lines. The 'Vampires vs. Vampires' sidebar was extracted in the middle of Psychic Invisibility's level 3 text but belongs to this Phenomenon."
  },
  {
   "id": "psychokinesis",
   "name": "Psychokinesis",
   "page": 70,
   "description": "Every once in a while, there is a YouTube video, a TV special, a variety show, or a book published about some enlightened master who has expanded their minds to the point where they can bend a spoon or shift a book 6 inches across a table. Every person that watches or reads about these feats sit in awe and wonder of the possibility of moving objects with the sheer force of their mind.\n\nPsychokinesis, or telekinesis to some, is beautiful in its simplicity. There are no subtle tricks or illusory veils. There is only the simple movement of matter through space through sheer force of will. As the psychokinetic grows in strength, they hone their accuracy and increase the maximum weight they can set in motion. The inexperienced only moves small objects, and very clumsily at that. On the other hand, a master psychokinetic can lift massive loads and move them at startling speeds, while also being capable of feats of fine motor skill that most have trouble performing with their own hands.",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "With a mental Strength and Dexterity of 0, the psychic can only lift a maximum of 5 pounds. Objects take a sluggish and clumsy path through space when moved and have a maximum speed of 5+ Wits yards per round."
    },
    {
     "level": 2,
     "name": "",
     "text": "The psychic’s mental Strength and Dexterity rise to 1, and objects have a movement of 7+ Wits yards per round."
    },
    {
     "level": 3,
     "name": "",
     "text": "Growing power and understanding have provided the psychokinetic with a mental Strength and Dexterity of 2. Manipulated targets move at 9+ Wits yards per round.\n\nFurther unlocking their understanding of kinetic force as a tool of the mind bears fresh fruit. The psychic can now make one ranged attack with their action through sheer force. The psychokinetic force hits like a punch from a distance using the psychic’s mental Strength and their Brawl or Martial Arts as a dice pool to attack, with base damage equal to their mental Strength. This attack represents concentrated use of the Phenomenon and cannot be used while performing any other psychokinetic action. This application is also instant and requires the full cost of activating the Phenomenon every time."
    },
    {
     "level": 4,
     "name": "",
     "text": "The psychic’s mental Strength and Dexterity are now 3, and they can move manipulated objects at 11+ Wits yards per round.\n\nYet another new application becomes available to the psychokinetic. The psychic has internalized their psychokinetic force and now may levitate themselves regardless of weight at a rate equivalent to their walking speed. This usage of the Phenomenon takes greater concentration than most and therefore cannot be used while lifting other targets."
    },
    {
     "level": 5,
     "name": "",
     "text": "A psychokinetic master has a mental Strength and Dexterity of 4 and can move manipulated targets at a rate of 15+ Wits yards per round.\n\nBoth refined actions of the phenomenon receive upgrades at this level. Levitation is now second nature and can be performed while lifting other targets, and Psychokinetic assaults may now cause bashing or lethal damage."
    }
   ],
   "system": "Psychokinesis grants the psychic a Strength and Dexterity score for their actions once activated. This only requires one activation per instance of the Phenomenon and remains active as long as the psychokinetic maintains concentration or until the end of the scene. Using psychokinesis requires the psychic be able to see their intended target with their own eyes. Each success on the activation roll allows for one separate target to be manipulated, but the total weight of all targets cannot exceed the lifting capacity of the psychic. Any time the psychic takes damage, they must make a new Willpower roll to maintain concentration. If they roll fewer successes than the number of targets they are currently manipulating, they must select targets to release until the number of targets matches the new success total. If more successes are rolled, the number of manipulated targets remains unchanged.\n\nA psychokinetic with the power to lift a person may do so unimpeded. The target is allowed a Strength + Athletics test to grab hold of a sturdy anchor point if one is nearby to hold on to. If a secure grip point is not available, the target is helpless to stop the power of the psychokinetic barring supernatural advantages of their own.\n\nOnce a target is being manipulated, actions taken with the target use the Strength or Dexterity of the psychic’s Psychokinesis and the appropriate Ability required for the action. For example, a gun being manipulated would call for a psychokinetic Dexterity + Firearms test to fire. “Throwing” a manipulated object requires that the item be released while propelling it with an appropriate Strength + Athletics test. The disconnect and lack of contact with a manipulated target causes all actions taken via psychokinetic manipulation to suffer a +1 difficulty. Attempting to perform a psychokinetic action with more than one manipulated item in the same turn requires the psychic to split their dice pool as normal for taking multiple actions.",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "psychometry",
   "name": "Psychometry",
   "page": 73,
   "description": "Psychometry is one of the more emotionally taxing Phenomena to the psychics gifted — or cursed — with it. By touching objects, the psychic can read the emotional resonances left behind and see visions associated with the object. It’s not always clear which objects have strong resonances: an office coffee mug could have only fleeting impressions. However, it could be a cherished gift from a child or even the mug a worker had in her hand when she learned of a loved one’s death.",
   "levels": [
    {
     "level": 1,
     "name": "Impression",
     "text": "The psychic can get dreamlike impressions of recent events involving the object or more distant events with strong associated emotions. The psychic at this stage mostly gets emotional readings and vague, figurative imagery. At 3+ successes, the psychic may also see an accurate image of the person most closely associated with the object."
    },
    {
     "level": 2,
     "name": "Reveal Scar",
     "text": "The psychic gets impressions of the event with the strongest emotional resonance associated with the object. They get dreamlike and imprecise images of the event. With 3+ successes, they also determine the owner’s approximate age, personality cues, connection to the object, and what the owner felt at the time."
    },
    {
     "level": 3,
     "name": "Replay",
     "text": "The psychic clearly experiences the event and may gather general impressions of what happened to the object’s owner the day of the incident. Alternatively, the psychic may replay the object’s last 24 hours, even if nothing emotionally significant happened."
    },
    {
     "level": 4,
     "name": "Tether",
     "text": "The psychic may use the object as a psychic tether to the object’s owner. Activating this level gives the psychic insight into the owner’s current location to track them. In addition to clearly seeing the event with the strongest emotional resonance associated with the object, they also read emotional impressions and visions of the other people at the event and their feelings."
    },
    {
     "level": 5,
     "name": "Catalog",
     "text": "The psychic may use Tether on any event the object was associated with, not only the ones with the strongest emotional impact."
    }
   ],
   "system": "It takes mere seconds to read the resonances, even if the vision seems to last much longer from the psychic’s perspective. The number of activation success dictates the level of detail the psychic receives. Many successes give clear and vivid impressions, which are prone to making the psychic feel the emotions and pain for a time, where fewer successes only give fleeting impressions. On a botch, the psychic becomes lost in the visions, temporarily merging in personality with one of the individuals from the event and possibly acting it out. When a psychic with Psychometry touches an object with immense emotional resonance, the Storyteller may call for a reflexive Psychometry roll.",
   "sidebars": [
    {
     "title": "Who’s the Owner?",
     "text": "Normally, an object’s owner is straightforward. However, for the purposes of Psychometry, especially at lower levels, the psychic usually gets impressions left by whoever possessed the object at the time of the high-emotion event. If someone stole a weapon to commit a murder, the murderer may appear more clearly than the rightful owner."
    }
   ],
   "notes": ""
  },
  {
   "id": "psychoportation",
   "name": "Psychoportation",
   "page": 73,
   "description": "Psychoportation, also sometimes called teleportation, is a powerful psychic ability to suddenly be elsewhere. This is one of the more powerful and rare psychic phenomena. The occasional narrow-minded Correspondence Sphere Mage has been put in their place by watching a simple psychic psychoport out of danger’s way without earning Reality’s ire.",
   "levels": [
    {
     "level": 1,
     "name": "Short Hop",
     "text": "Range up to 12 + Intelligence yards in a turn."
    },
    {
     "level": 2,
     "name": "Simple Jump",
     "text": "Range up to 20 + (3 x Intelligence) yards."
    },
    {
     "level": 3,
     "name": "Long Jump",
     "text": "Range up to 40 + (6 x Intelligence) yards. The psychic may spend a turn of concentration and roll activation at +1 difficulty to double this range."
    },
    {
     "level": 4,
     "name": "Leap",
     "text": "Range up to 80 + (12 x Intelligence) yards. The psychic may double, as per Long Jump."
    },
    {
     "level": 5,
     "name": "Leap of Faith",
     "text": "The psychic no longer needs to sense a stable location to psychoport to it. The psychic may spend a scene studying the location and successfully roll Perception + Alertness at difficulty 8 to commit it to memory."
    }
   ],
   "system": "No one knows for sure how psychoportation works, but some theories include dissipating into the air and reforming in another spot, a variation of astral travel, or personal wormholes. What’s known is a psychic can’t carry more than about 100lb of extra cargo without suffering severe strain, causing the psychic at minimum 6 levels of bashing damage that can be soaked normally. This increases by 1 level of bashing damage for each additional 25 lbs. the psychic attempts to move. Failing to soak the damage results in a disastrous fate for the cargo, such as psychoporting the contents to the wrong location, into a solid object, or the nearest body of water. On rare occasions the cargo seemingly ceases to exist. To travel to a place via psychoportation, the psychic must see the intended destination with mundane senses or psychic abilities — their own or someone else’s.\n\nA psychoportation botch typically means the psychic misjudged the jump and landed inside a solid object — or worse, a person. This causes 8 dice of aggravated damage to the psychic and the unsuspecting object. Occasionally, a botch might transport a psychic to a hazardous or unfamiliar location, or the psychic might leave or inadvertently bring something they weren’t supposed to.",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "pyrokinesis",
   "name": "Pyrokinesis",
   "page": 74,
   "description": "Parapsychological lore speaks of “Firestarters,” individuals able to psychically start and sometimes control flame. Some parapsychologists suspect Pyrokinesis is a variant of Psychokinesis, where the psychic causes molecules to vibrate at high speeds, generating combustion rather than moving entire objects cohesively.\n\nPyrokinesis is one of the more dangerous Psychic Phenomena to the psychics themselves; most psychics have no more defense against the flames they create than any other human. Botches can be spectacularly disastrous, and several pyrokinetics have gone out in a literal blaze of glory.",
   "levels": [
    {
     "level": 1,
     "name": "Spark",
     "text": "The pyrokinetic can generate small sparks, usually from their fingertips. These sparks are typically only able to light highly flammable substances on fire, such as paper or gasoline, but with 3 or more successes, the psychic’s sparks can light materials on fire as a match could. The sparks can light anything within the pyrokinetic’s reach, though they don’t have to touch the target. Even with many successes, the sparks aren’t hot enough to directly light a person on fire, though the effect of a flame appearing can startle someone. After activation, treat the sparks as a thrown attack with a weapon dealing no damage. This can be dodged normally. If the attack succeeds, the target rolls Willpower at difficulty 6 to avoid being stunned for one turn. On a botch, the target panics. The target may instead spend one Willpower point to suppress a startle response."
    },
    {
     "level": 2,
     "name": "Combustion",
     "text": "The psychic concentrates on an object within 10 yards, causing it to burst into flame. The psychic can reliably light flammable materials like gasoline, dry wood, charcoal, and vampires on fire. At 3 or more successes, the psychic can light anything combustible, such as people, on fire. The initial fire is as big as a torch and behaves and spreads normally. If the psychic targets a person or person’s clothing, the target may attempt to dodge as normal, treating activation successes as the targeting roll."
    },
    {
     "level": 3,
     "name": "Sun’s Fury",
     "text": "The psychic can now turn small balls of air into plasma and flame, which readily lights nearly anything it touches on fire. This power causes bonfire-sized fires up to 10 yards away dealing two aggravated damage per turn from the intense heat. Targets may attempt to dodge as normal, treating activation successes as the targeting roll. If hit, the target must spend a Willpower point or roll Willpower at difficulty 6 to be able to avoid panic. If they remain calm, the target may immediately use their action to roll Dexterity + Athletics at difficulty 5, extinguishing themselves on a success."
    },
    {
     "level": 4,
     "name": "Pyrotechnics",
     "text": "The pyrokinetic gains control over flames, including those produced by lower levels of Pyrokinesis. The psychic can grow, shrink, direct, and shape flames within their line of sight at will. With one success, the psychic may control a torch-sized portion of flames. With three successes, the psychic wrestles control of a bonfire. At five or more successes, the psychic may command even an inferno. Targeting individuals with flame is a Wits + Athletics attack at difficulty 7, with +1 difficulty to avoid harming nearby bystanders in the process. This attack can be dodged. A psychic may extinguish a flame at will. A bonfire or smaller flame is extinguished instantly, but any larger flame takes an entire turn of concentration to extinguish."
    },
    {
     "level": 5,
     "name": "Inferno",
     "text": "The pyrokinetic now commands larger and faster-growing flames, which may appear anywhere in the psychic’s line of sight. The flames consume anything inside them with 3 aggravated damage per turn, though targets on the outer edges may dodge as Sun’s Fury. At one success, the starting flame is a small fire, but at three successes the flames fill a large room, to a maximum of Willpower times 3 square yards. If the psychic maintains concentration, the flames are resistant to being extinguished by mundane means, taking rounds equal to the successes gained on the activation roll to extinguish through smothering, water, or flame retardant chemicals. If the psychic breaks concentration, such as by sustaining damage or being knocked out, the flames lose all supernatural properties and may be extinguished normally."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "shadow",
   "name": "Shadow",
   "page": 75,
   "description": "We live in a world of light and shadow. The psychic that understands this and learns to manipulate one side of that coin is taking advantage of an ever-present resource. Whether it is under an overhang, behind a stack of boxes, or simply within the cracks and crevices of one’s face, the psychic manipulating shadows can put them to use to conceal and confound.\n\nSuperstitious theories abound concerning what the psychic wielding Shadows is actually doing. The simple fact is they are manipulating light — and sound to a limited degree — to dampen the world around them. It may seem like the Shadow psychic is wielding darkness, but it all boils down to simple science. Darkness grows darker and sound becomes muffled as the psychic’s sheer will smothers active waveforms in the environment. The spooky atmosphere and reputation are just bonus.\n\nAs much as shadows can hide, proper utilization of this Phenomenon can provide significant distractions. Light and sound are intercepted before they can reach the target’s senses, giving the victim the feeling that their head is wrapped in an invisible blanket. As the psychic’s power rises, this is more and more harrowing as the brain can interpret this loss of sense as impending suffocation. While cruel by the reckoning of some, it can be an especially useful tool when getting someone off your back.",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "Scattering the edges of cast shadows and disrupting sound is only sufficient to increase the effectiveness of concealment and demoralization. Shadows become slightly longer, reach somewhat further, while sounds are all unnervingly stifled. All Intimidation and Stealth rolls have their difficulty adjusted by −1. Targets distracted by darkening shadows and muffled sounds suffer a +1 difficulty to all rolls reliant on sight and hearing."
    },
    {
     "level": 2,
     "name": "",
     "text": "The shadows now grow and bend to the will of the psychic. Sounds now baffle and distort, having the quality of being played through a blown speaker. The psychic embodies the idiom of “to darken a doorstep,” as rooms lose light when they arrive. Intimidation and Stealth rolls are made at −2 difficulty."
    },
    {
     "level": 3,
     "name": "",
     "text": "Not only do shadows grow darker, but now the psychic’s efforts causes light sources to lose their power. Sound travels through a room in erratic warbles, and the words that are intelligible have a perceptible delay with the speaker. Attempts to see the concealed psychic suffer a +3 difficulty. The harrowed begin to feel a swelling anxiety and must make a Willpower roll (difficulty 7) to avoid panic, suffering a -1 penalty to all actions that don’t involve leaving the scene if they fail."
    },
    {
     "level": 4,
     "name": "",
     "text": "Spreading their gift of dark refuge, the psychic can now cloak a small gathering of three or four people, possibly even a small coupe or sedan.\n\nVictims of shadowy harassment must make a Willpower roll (difficulty 8) to avoid panicking and immediately leaving the scene to escape the darkness. Intimidation and Stealth have a −4 difficulty in conditions that are ripe for exploitation. An already dark warehouse, a shadowy forest in the night, or a poorly lit parking garage all beg to have their deep shadows emboldened by the psychic. This amount of shadow manipulation has an inverse effect in brighter setting, like midday in an open car park or standing on a school sports field with all the lights on. The darkness around the psychic draws more attention in the brightness of noon than it diverts."
    },
    {
     "level": 5,
     "name": "",
     "text": "In settings where darkness already lives, the psychic is master. Standing in a location where conditions favor shadows gives the psychic the chance to smother all light around them out to 50 feet. The darkness is near impenetrable for those without mystic sight, as even high-powered handheld lights are swallowed by the inky black. All within are completely shrouded and invisible to the outside and others within, save the psychic. The darkness is their own after all."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "synergy",
   "name": "Synergy",
   "page": 75,
   "description": "A subtle ability, synergistic psychics often don’t know they have any psychic talent until after meeting other psychics — it’s unusual but not unheard of for them to develop other Psychic Phenomena. This phenomenon is considered rare, but the power’s subtle nature may conceal the true number of synergists in the world. Synergy allows psychics to work together to build effects more powerful than either psychic could create on their own.",
   "levels": [
    {
     "level": 1,
     "name": "Like Knows Like",
     "text": "The synergist can sense other psychics. This automatically succeeds if the psychic touches another, but the synergist can roll activation to scan for psychics in line of sight. With 3 or more successes, the synergist can sense the relative power of the other psychics."
    },
    {
     "level": 2,
     "name": "Share Will",
     "text": "The synergist forms a weak psychic link to enhance the power of the participants. Each psychic can either spend a point of Willpower for an automatic success on another’s effect or allow the psychic to “borrow” the Willpower and temporarily add the point to their pool, up to a maximum of 10. If the Willpower isn’t spent, it can be traded multiple times between the psychics in the link. Any sensory Phenomena (Telepathy, Precognition, etc.) allow all the psychics in the link to share the results."
    },
    {
     "level": 3,
     "name": "Share Powers",
     "text": "The synergist forms a stronger link, allowing all psychics to use their powers as a group. Each psychic may donate up to two powers, points of Willpower, or one of each. Only one activation roll is necessary for group powers."
    },
    {
     "level": 4,
     "name": "Power Gestalt",
     "text": "As Share Powers, but now psychics in the link may combine ability effects to form one shared power. For example, the group could combine Animal Psychics and Psychic Invisibility to be able to sneak past guard dogs unnoticed."
    },
    {
     "level": 5,
     "name": "Power Network",
     "text": "The synergist may link other psychics and remove the need for the psychics to touch, or even be in the same place. A psychic with this level of Synergy first links everyone as with lower abilities, spending 10 minutes on combined focus and meditation to cement the ties. Once the link forms, the networked psychics remain linked and able to use any of the lower abilities for a number of hours equal to activation successes. This link does not fade with distance, but if a psychic in the link takes their Stamina or more in damage from a single source, all psychics in the network must make a Willpower roll at difficulty 7 or be ejected from the network. If the psychic who formed the network is ejected, knocked unconscious, or killed, the network automatically collapses."
    }
   ],
   "system": "Psychics must be touching to form a synergistic link. The synergist may link a number of psychics equal to twice the dots they have in Synergy. Every success above one adds automatic successes that can be spent on actions the linked psychics take using Phenomena. Botches can cause backlashes for all involved, with the best-case scenario being a headache or nosebleed, where the worst case can cause the psychic phenomena of those in the link to activate uncontrollably.",
   "sidebars": [],
   "notes": ""
  },
  {
   "id": "telepathy",
   "name": "Telepathy",
   "page": 76,
   "description": "It is said that there are two kinds of people in the world: people who wish they could read minds and liars. That statement, in and of itself, is a lie. That is because there are people in the world that can actually read minds and they’re known as telepaths. Once they sense the mind of a target, these psychics can plumb their thoughts for opinions, desires, fantasies, and emotions.\n\nAs skill and power improve, the telepath can learn to broadcast their thoughts into others. Communication in this manner can be unsettling at best to the unprepared and potentially outright scarring. Compassionate telepaths take time to inform those they intend to telepathically communicate with of what is coming, to avoid possible screaming and incoherent confusion caused by unannounced mental invasion.\n\nThose who have mastered their talent go one step further and make those broadcasts seem like original thoughts, implanting ideas into the minds of their targets. This is not any kind of mental control or hypnosis as one might think. At its core, this ability is more akin to ventriloquism — a form of ventriloquism essentially akin to psychic gaslighting, and a very dangerous and immoral act, but ventriloquism nonetheless. The telepath mimics the inner dialogue of the target and makes suggestions as though the thought came from the subject’s own mind. The uses of this talent range from the relatively benign thought of “I could use a snack” to projections far more sinister. Reading the target’s thoughts, then mimicking and repeating their darkest impulses to exigence, is but one troubling example of the potential for telepathic abuse.",
   "levels": [
    {
     "level": 1,
     "name": "",
     "text": "All telepaths begin by sensing the surface thoughts and emotions of a subject. Emotions include current mood, immediate desire, and mental wellbeing. Surface thoughts are songs stuck in their head, active recollection of things like a grocery list or a keycode as it’s punched in, or what they think that smell was that they just sniffed."
    },
    {
     "level": 2,
     "name": "",
     "text": "Inner thoughts open to the telepath. With every success on the activation roll, the telepath may ask a single question about the target’s subsurface ruminations. These responses are one sentence in length and as straightforward as possible. Inner thoughts include political leanings, favorite books or movies, or recent memories.\n\nThe beginnings of telepathic communication open at this level as well. For every success on the activation roll, the telepath can send or receive one sentence of mental communication. These communications happen at the speed of thought, and as such do not take up any time within a round or require any dice pool splitting for multiple actions."
    },
    {
     "level": 3,
     "name": "",
     "text": "Deeper thoughts are laid bare to the telepath. As with previous levels, every success on the activation roll allows for a single question that is answered by the target These responses can be more detailed when the subject of the question is not a closely guarded secret. Deeper thoughts include memories from the last 5 years, passwords to social media accounts and bank cards, and the names of everyone from their immediate to extended family.\n\nTelepathic communication comes much easier at this stage. For every success on the activation roll, the telepath can send and receive several sentences (two or three) worth of communication. Again, these communications happen at the speed of thought and follow the same rules as above."
    },
    {
     "level": 4,
     "name": "",
     "text": "Subconscious thoughts and the deepest recesses of the mind are within reach of the telepath. Every success on the activation roll allows for a single question that is answered by the Storyteller. Nothing within the mind is off limits at this point. Memories back to their childhood, forgotten codes to facilities they used to work at, and even thoughts they have that they deny to themselves about their loved ones are all fair game.\n\nConversations over telepathic connections are no longer held to sentences. Full conversations between two people happen in the blink of an eye. The more impressive improvement is that telepathic links can be widened to a net. Each success on the activation roll allows another mind to be added to the conversation. When multiple minds are added to the psychic’s link, the excess telepathic bandwidth slows down as the psychic’s mind is acting as a routing hub. Conversations like this happen in real time, as though everyone involved were speaking to each other around a table."
    },
    {
     "level": 5,
     "name": "",
     "text": "Insidious as it may be, the telepath can now implant subversive thoughts into the minds of their targets. These thoughts can be of anything, but any train of thought that wasn’t already present in the mind of the target requires a Manipulation + Subterfuge roll (difficulty 7) to implant thoughts that complement the target’s personality and desires. Implanted thoughts that run contrary to the target’s personality and desires suffer a +2 difficulty to the roll. Should these thoughts take root, the target will begin to act on them at the nearest opportune time, convinced the thoughts are their own."
    }
   ],
   "system": "",
   "sidebars": [],
   "notes": ""
  }
 ],
 "AFFILIATIONS": [
  {
   "id": "ancient_order_of_the_aeon_rites",
   "name": "The Ancient Order of The Aeon Rites",
   "page": 80,
   "favoredAttributes": [
    "intelligence",
    "wits"
   ],
   "favoredPaths": [
    "Conjuration",
    "Divination",
    "Enchantment",
    "Summon, Binding, and Warding"
   ],
   "favoredNote": "",
   "description": "Within the sacred tabernacles of the Ancient Order of the Aeon Rites, sorcerers study the journals and teachings of Master Johannes Agrippa, who founded the Order in 1873. Based upon even older works, millennia old and from cultures and societies around the globe, the Secret Watchers of the Order had secreted away scraps of Truth within the framework of all occult and mysticism for when humanity would be ready for that Truth. Master Agrippa’s visions from the Secret Watchers and his study of these ancient cultures led to the formation of the Aeon Rites, written in Enochian, the language of the angels. The sorcerers of the Ancient Order work their magic through careful study and precise rituals, couched in symbolism and correspondence that may be familiar to magicians of any other Practice. With ceremonial robes, prescribed motions, and calculated placement of meticulously crafted implements, sorcerers of the AOAR take a hermetic approach to magic, requiring study and execution over more emotional practices.\n\nThe Order’s masters act as benevolent teachers, seeing other societies as potential recruits who merely need to be set on the proper path to enlightenment. It is the Order’s belief that all sorcerers should use their abilities to guide humanity into a new golden era of prosperity. This might come across as self-aggrandizing if the AOAR did not match words with deeds, aiding other magicians in their search for enlightenment, founding charitable organizations, and doing other good works. The Order dedicates the first three grades of initiation to these mundane duties. The self-centered and selfish aren’t allowed to progress into the inner circles of the Order. Within the next circle, another 3 grades of the Order oversee the broader work of the society, developing political connections, maintaining their significant coffers, and training the newly initiated, all while pursuing greater truths and mastery of Paths of magic. The final 3 grades of the Order are those who truly devote themselves to study of the Aeon Rites, delving into the most esoteric mysteries.\n\nIt is said that in death, those of the AOAR who have proven themselves worthy are accepted by the Secret Watchers into their ranks. These Secret Watchers guide and advise the Order but are rarely seen. Master Agrippa has appeared in ghostly form to provide guidance to initiates and magisters alike, though such manifestations are rare. Rumor abounds that the Order is merely a tool of Master Agrippa, who still lives and pulls the strings of the Order from afar. Most members of the Order dismiss such speculation, as there seems to be no purpose for such deception. As a new generation of magisters begins to take their place within the upper ranks of the Order, they’ve begun to question this final step. Is an afterlife of continuing their work within the spiritual realm a reality, or is it a merely a ploy to prevent fully trained magisters from creating their own factions?",
   "sidebars": [],
   "sectionIntro": "Occult societies employ a variety of names and titles for themselves. Brotherhoods, sisterhoods, salons, orders, and cults are but a few of the most common terms bandied about in arcane circles. For the purposes of this chapter, we refer to these societies as Affiliations. Affiliations offer support to their members, training in the magical arts, and the camaraderie of a community. Each of the Affiliations in this chapter has a rich and storied history, established areas of influence, and a list of practices reinforced and preserved through the momentum of ongoing tradition. Many of these Affiliations also have enemies who oppose their goals and antagonize their members. These can range from friendly rivalries to aggressive hostilities. Many now forgotten Affiliations came to a tragic end in battle with arcane rivals over the centuries.\n\nThis section presents a diverse collection of Affiliations based in cultures from around the world. These Affiliations are some of the most well-known or influential collections of hedge wizards.",
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "conjuration",
     "qualifier": ""
    },
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "enchantment",
     "qualifier": ""
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_arcanum",
   "name": "The Arcanum",
   "page": 80,
   "favoredAttributes": [
    "intelligence",
    "wits"
   ],
   "favoredPaths": [
    "Alchemy",
    "Conveyance",
    "Enchantment",
    "Summoning, Binding, and Warding"
   ],
   "favoredNote": "",
   "description": "The Arcanum was born of the occult heyday of the late 1800s, when Victorian high society paid lip service to ritual and esoterica. Frustrated with the Hermetic Order of the Rising Day, a new society was born not to walk through the motions, but to seek knowledge and truth. Regardless of culture and source, the Arcanum investigates superstition, myth, pseudoscience, and strange occurrences. The Arcanum believe there is another world that borders our own, a place where the stories told by the ancients are real. Through study of the tales and legends of these ancients, they believe they can find the kernel of truth from which these stories grow. They do not judge this knowledge; they ascribe no morality to the supernatural, serving only as librarians and observers. While the Arcanum is voracious for knowledge and will use other contacts to help gather it, they jealously guard their secrets. The Arcanum only reveals information to outsiders under direction from the Executive Committee.\n\nThe Arcanum operates on a series of tiers, starting with the academic community at large, where the Arcanum also does its recruiting. Within those circles, the Arcanum is known simply as a scholarly society, supporting investigations into fringe research. The Arcanum is active in many publications, including traditional media like books and journals. Recently, they’ve begun vetting and supporting the works of individuals and groups across the internet who investigate and report through newer media like videos or podcasts. Arcanum membership is not secret, and they are often approached directly by curious academics about joining the Fellowship. The first tier of the Arcanum are these Associates, the junior scholars, researchers, or other investigators who work with the Arcanum but are not actually held to the rules nor granted the privileges of a full member. The Associates that begin to ask questions of the Arcanum, looking into the purpose of the society and who begin to seek enlightenment beyond just their personal focus, are invited in as Neophytes. These Neophytes study under a mentor, often an Elder Sibling who allows them access to the Arcanum’s literature and resources, as necessary. Neophytes are the “children” of the Arcanum, there to learn and study, but they do not contribute to the greater conversation of the society. With examination and ritual, a Neophyte graduates to a be a full member of the Arcanum, an Arcanist, sometimes referred to as a Brother, Sister, or Sibling. While not a rank above the others, those members who have demonstrated themselves to be knowledgeable and wise are given the honorific of “Elder,” though this has no relevance to age or seniority within the Arcanum.\n\nIn terms of organization, the Arcanum society reports to the Executive Committee at the Foundation House, under direction of the Grand Chancellor. The Foundation House itself is an enormous estate and boasts the “Axis Mundi,” which they claim is the most thorough library of all things arcane and supernatural. Chapter Houses around the globe coordinate and support local Arcanists. Each Chapter House has the freedom to organize itself as necessary for the membership’s purposes, taking on roles beneath the local Chancellor such as Financial Officer, Chief Librarian, or Sergeant-at-arms. These Chapter Houses can provide lodging for Arcanists, either on the premises or nearby. They also serve as secure locations that an Arcanist can retreat to in the event of trouble that might turn up during investigations. Within the Chapter Houses, the members are also connected as a “lodge” of several Arcanists, often a graduated class of Neophytes, that work together to help pursue their varied interests, bringing experts of different fields to work on a single problem. These interests are supported by a College, helping to organize research of different fields like the College of Thaumatology, the Hermetic Studies Programme, and the School of Mythoarchaelogy.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "alchemy",
     "qualifier": ""
    },
    {
     "id": "conveyance",
     "qualifier": ""
    },
    {
     "id": "enchantment",
     "qualifier": ""
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "balamoob",
   "name": "Balamo’ob",
   "page": 81,
   "favoredAttributes": [
    "stamina",
    "wits"
   ],
   "favoredPaths": [
    "Alchemy",
    "Healing",
    "Shapeshifting",
    "Summoning, Binding, and Warding"
   ],
   "favoredNote": "",
   "description": "Within the jungles of Mesoamerica, the warrior-priests of the Mayans, the Balamo’ob still watch over their people. They pass down teachings that were ancient at the height of the Mayan empire, bonding with their wayob, a familiar animal and spirit-guide, and in turn, guiding their people to protect them from the dark spirits that come up from Xibalba, the Otherworld, or simply, the Umbra. Vision trances take the Balamo’ob into Xibalba, where the first spirit they contact becomes their wayob. The Wakah-Chan, the World Tree, separates the earth and sky but also connects our world to Xibalba, venerated in symbols of effigies made of rope and wood. The magic sap of the World Tree is found in the sap of sacred trees within the mundane world, as well as various natural liquid secretions of the human body. Bloodletting itself is a sacred act, most especially when offering one’s own blood, and while a few drops of blood are enough to enable smaller magics, the most spectacular or urgent spells require much more. This greater bloodletting is done by piercing the body with coils of rope and dancing about, streaming blood through the air in sacrifice. The dance is part and parcel of the Balamo’ob art. In some festivals, Balamo’ob take on the guise of the wayob, wearing cloaks, pelts, or costumes to emulate them in reenactments of the creation of the world. Those talented enough assume the form of the patron as the festival ends, rushing off into the night, a physical representation of their wayob but also the World Tree, uniting flesh and spirit, the celestial and mundane.\n\nThe Balamo’ob come from the local population of Mesoamerica, particularly the Mayan people now spread across the region. Few from afar — archaeologists, anthropologists, or occult seekers — have been initiated into their mysteries. The Balamo’ob have had to keep their knowledge secret from oppression across the centuries. The teachings are passed orally in Mestizo, a dialect of Spanish and Mayan. While the language itself is not sacred, some things might be lost in translation. Along with language studies, the initiate must learn Mayan cosmology and symbology in order to grasp Balamo’ob magic. After learning these things, when the elder thinks them ready, the initiate takes their first vision trance. This trance allows the aspirant to travel into Xibalba in dream-form. The great Vision Serpent guides them through the final secret rites, when the Balamo’ob meets their wayob, an animal spirit in the form of jaguar, snake, eagle, or other, even mythical, animals. From this day forward, their study is their own. The Balamo’ob gains wisdom through experience, learning from other elders, and traveling into Xibalba with their wayob.\n\nThe shamans, itzamna, of the Balamo’ob do not take on any formal organization, but settle within personal territories throughout Mesoamerica, for the spirits prefer to stay in places they know best. Relationships between the shamans are always personal, founding alliances to handle problems, rivalries where conflicts develop. There is no politicking between them. As each shaman has their own beliefs and interpretations, it is not for one to judge another, so long as they are continuing with their work. This openness allows for some Balamo’ob to bond with spirits of darker varieties, which can lead the shaman into rage-fueled raids against outsiders, profiteers, and desecrators. Others are drawn into political revolutions or seek a resurgence of the Mayan empire.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "alchemy",
     "qualifier": ""
    },
    {
     "id": "healing",
     "qualifier": ""
    },
    {
     "id": "shapeshifting",
     "qualifier": ""
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_children_of_osiris",
   "name": "The Children of Osiris",
   "page": 82,
   "favoredAttributes": [
    "intelligence",
    "wits"
   ],
   "favoredPaths": [
    "Ephemera",
    "Healing",
    "Herbalism",
    "Oneiromancy"
   ],
   "favoredNote": "",
   "description": "In ancient Egypt, long before the pyramids stood, before Pharaoh Narmer united the upper and lower kingdoms, there lived a wise and studious mortal king from western Egypt called Osiris. Osiris had a jealous younger brother named Set, who wanted to rule at any cost. After a dramatic but ultimately failed attempted murder, Osiris’ wife, Isis, saved him with her magic. Set became enraged at Isis thwarting him and searched for more cunning ways to counter her power. He found exactly the edge he sought when he was embraced as a vampire.\n\nEmboldened by his new power, Set demanded Osiris hand him the throne. When Osiris refused, Set frenzied and shredded his brother into 14 pieces. Set scattered the pieces across the land to prevent Isis from reviving him.\n\nThis wasn’t enough to stop the determined sorceress from gathering the pieces of her husband’s corpse. After gathering as many fragments as she could, all the magic Isis and Osiris’ coven wielded miraculously brought Osiris back, but imperfectly. He was weak. His skin was irreparably damaged from time spent decomposing. It took the coven’s continuous efforts merely to keep Osiris alive.\n\nDistraught, Isis couldn’t bear to see her husband dead or in constant agony. She frantically searched for a better solution and happened across a mysterious figure who promised to restore her husband. She was too desperate to discuss what the process would entail, or what the cost would be, and agreed. The mysterious figure embraced Osiris as a vampire.\n\nOsiris slaughtered his closest friend in the coven immediately after the embrace. When he realized he’d not only killed his dear friend but consumed his blood in a hunger frenzy, he was horrified. Overcome with grief, he blamed Isis and vowed to find a way to banish his monstrous impulses. The coven fractured in two: those who sympathized with Osiris and those who thought him an irredeemable monster. Those sympathetic few were the first mortal Children of Osiris.\n\nThe Affiliation grew, joined by vampires who likewise sought freedom from their Beasts and sorcerers seeking to reconcile life and death to become immortal without the flaws of vampirism. At first, the sorcerer and vampire Children were treated as equals. However, after Set finally killed Osiris, the vampires in the faction took control. The sorcerers became servants to their vampiric masters, though the undead Children supposedly followed Osiris’ command that they never embrace their sorcerer counterparts. Some time ago, the vampire Children disappeared, leaving the sorcerers to their own devices.\n\nThe Children of Osiris are small but slowly growing due to increased worldwide interest in ancient Egyptian lore and the recent uncovering of some of Osiris’ tombs. They’re mostly congregated in Egypt and surrounding areas, but those who aren’t based in Egypt make a point to visit as often as feasible. They organize into hidden temples designed after tombs. Children of Osiris are led by the most experienced member of any gender, whether or not they’re the oldest. Initiation takes years to complete and consists of solemn rituals modeled after ancient Egyptian funerary practices followed by guided study of ancient languages and magical texts.\n\nThey typically practice healthy living, with simple diets and regular exercise encouraged. All Children regardless of gender keep their heads shaved, though many wear wigs outside their temples. This is as much a ritual practice as a health-conscious one — when the Children of Osiris was in its infancy, the only way to reliably prevent lice and potentially deadly resulting skin infections was to shave one’s head.\n\nThe Children still venerate Osiris as a god, claiming he isn’t gone forever but took his rightful place as king of the underworld. Most devote their time to meticulous study of their Paths. Some find time to maintain a one-sided rivalry with the more powerful Cult of Isis, though that generally isn’t encouraged and is considered a distraction from the truth in their studies. The progeny of Set have largely left Osiris’ mortal followers alone since the vampire Children’s disappearance, but if his descendants found a sorcerer Children of Osiris temple, things would get ugly fast.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "ephemera",
     "qualifier": ""
    },
    {
     "id": "healing",
     "qualifier": ""
    },
    {
     "id": "herbalism",
     "qualifier": ""
    },
    {
     "id": "oneiromancy",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_cult_of_isis",
   "name": "The Cult of Isis",
   "page": 83,
   "favoredAttributes": [
    "charisma",
    "manipulation"
   ],
   "favoredPaths": [
    "Divination",
    "Fascination",
    "Fortune",
    "Healing"
   ],
   "favoredNote": "",
   "description": "The Cult of Isis is a fractured and disparate lot, far flung in time and space from their origins in Egypt at the feet of the goddess of healing, Isis. Branches of the Cult have ranged from peaceful magicians seeking to nurture humanity to sorcerers of nature that blessed both field and womb. After the destruction of the mother-goddess, her son, Horus, took control of the Cult to fight against the murderer, Set, and his cursed children. By the time of Cleopatra, the Cult had fallen into disgrace, a broken shell of their former glory, but as Rome conquered Egypt, the Cult joined with the worship of other goddesses, and Isis’ name was spoken alongside those of Juno, Ceres, and Vesta. Fertility cults spread across the region in her name, and more mystery cults diluted the Cult into a myriad of sects and branches, some with radically different beliefs and purposes.\n\nIn modern times, the Cult’s influence can be seen in the teachings of Traditions like the Ecstatics and Verbena, or as corrupted kindred who now follow the teachings of Set, but there is a new Cult of Isis that has blossomed in the wake of the Arab Spring of 2010. Led by a magician who calls herself Semet, this branch of the Cult is dedicated to a new era of healing and peace. This started as a small sect’s attempt to care for the relics and hidden wonders of the past, amid unrest and heartache. The priestess Semet organized the Cult as street medics, nurses, caregivers, and mediators. The Cult takes no points of leadership and no stance in politics, merely caring for the wounded or those caught in the middle, while hoping to keep any conflict from escalating beyond repair. The symbols of Isis’ horned-moondisc or her widespread wings are placed as guideposts for refuge and safety. This sect of the Cult has not forgone the mystic teachings of Isis. Amidst a social media organization of amateur medics, the Cult works their magic, tending to the worst wounds that they promise “are not as bad as they appear.” Behind closed doors, the modern priesthood of Isis performs rituals to bless the hands of the workers, and sacred amulets are enchanted for protection of their members.\n\nWhile Semet’s branch of the Cult grows and spreads across the region, other Cults have continued in more traditional fashions. Cults of fertility that are tied to sensuality and sex draw on natural drives of humanity — ecstatic experiences that bring one closer to the goddess and power their magic. Egyptian hieroglyphics, Demotic chanting, and precise geomantic architecture empower rituals that have been passed down for more than seven millennia. These Cults have grown and travelled far, first from Egypt to Rome, then across the Roman Empire, and now to every corner of the globe with dozens of faces for the goddess. Secretive sects that work social manipulation and control, caring sororities that revere all sacred goddesses, or some of the few who still support Horus, Isis’ immortal son, in his quest for vengeance, all revere the goddess’ name and count themselves as a Cult of Isis.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "fascination",
     "qualifier": ""
    },
    {
     "id": "fortune",
     "qualifier": ""
    },
    {
     "id": "healing",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_cult_of_mercury",
   "name": "The Cult of Mercury",
   "page": 83,
   "favoredAttributes": [
    "charisma",
    "stamina"
   ],
   "favoredPaths": [
    "Conjuration",
    "Conveyance",
    "Divination",
    "Fortune"
   ],
   "favoredNote": "Conjuration, Conveyance, Divination, Fortune for the Roman temple. Replace one with a Path applicable to the local temple’s interpretation of Mercury at Storyteller discretion.",
   "description": "The Cult of Mercury was founded in ancient Rome among many similar cults devoted to specific deities in the local and nearby pantheons. Their first temple was in the Circus Maximus, near a horse racing track and popular merchant site, a fitting location for a god of financial fortune and quick travel.\n\nLocal merchants, and later even senators, flocked to the cult to aide their lofty aspirations of power. Despite attracting populations that might otherwise be prone to cutthroat ambitions, the Cult of Mercury requires immense teamwork. The cult exclusively performs ritual magic, organizing up to hundreds of followers in intricate cooperative practice to create their effects. The sheer number of sorcerers performing rituals together require several layers of leadership to organize all the moving parts. During rituals, all sorcerers wear clean white robes, tunics, togas, or other more regionally appropriate white clothing in temples outside Rome. Rituals include incense, coordinated movement, burning candles, holding objects associated with the ritual’s intent, and the entire gathering chanting in Latin and ancient Greek.\n\nDevotees of a god of travel, members of the Cult of Mercury without local political aspirations traveled and formed new congregations as a way to quickly gain rank in the cult. As the Cult of Mercury spread to other regions through both Roman conquests and merchant trade, the cultists likened Mercury to the local deities, claiming these other deities to simply be different aspects and understandings of Mercury. Accordingly, temples may focus on Paths more applicable to their local interpretation of Mercury, such as Shapeshifting for the aspect Mercurius Artaios, a god of bears and hunting in south-eastern France. Practices are similarly localized with ritual elements traditional to the first congregants of the region.\n\nThe Cult of Mercury suffered a major blow to leadership and member retention when Constantine converted the Roman Empire to Christianity. Many who joined for favorable luck figured they wouldn’t be testing fate as much to join the new majority and state-sponsored religion rather than stick with what they knew. Those temples that continued to practice hid their religion by masquerading as Christian churches. The effects of this shift linger into the modern day with leadership positions in the Cult of Mercury sharing names with Catholic church ranks.\n\nThe Cult of Mercury seeks to capitalize on the recent surge in popularity of ancient religions. Without sufficient converts, entire temples fail when older members die off and the numbers no longer sustain the elaborate ritual work. The cult prefers the ambitious and adventurous, but in the end the leadership isn’t picky so long as there are enough underlings for rituals to function. Parents are encouraged to bring their children into the cult when they’re old enough to perform simple ancillary ritual tasks — and keep secrets in areas where the practice is stigmatized.\n\nThe Cult of Mercury can perform amazing feats when in full force, but they’re limited to ritual magic with no fewer than 50 participants. While a cultist can’t use spells cast on the fly, it’s customary for temples to prepare rituals ahead of time that skilled members can finish casting in an emergency. Cult of Mercury characters may learn 2 additional free rituals for every dot in a Path. Herding a large congregation isn’t an easy feat and requires leadership with strong social Attributes. Charisma is typically the favored Attribute for cultists with leadership roles or aspirations, while the average cultist in a congregation may instead favor Stamina for the patience and dedication of being a cog in massive rituals.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "conjuration",
     "qualifier": ""
    },
    {
     "id": "conveyance",
     "qualifier": ""
    },
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "fortune",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_dozen_priests_of_the_pythian_order",
   "name": "The Dozen Priests of the Pythian Order",
   "page": 84,
   "favoredAttributes": [
    "charisma",
    "intelligence"
   ],
   "favoredPaths": [
    "Divination",
    "Healing",
    "Shapeshifting",
    "Weather Control"
   ],
   "favoredNote": "",
   "description": "The Pythian Order itself once crossed the Hellenic and Greek world. Its members were experts of divination who passed on the words of the gods and found their magic within the rhythm and rhyme of poetry. Not merely a form of art, but an expression of numerology, Pythian practice tied music, astrology, and mathematics together, resonating with the music of the spheres. They strove to find just the right poetic meter to encapsulate this magic, binding it to texts to store this power. A delicate and fussy magic, it was rare to master. The number of priests of the Pythian Order diminished over time. When science and learning declined in Europe, the Pythian Order had already fallen from grace. Their numbers dwindled to those few who had extended their lifespan beyond the natural limits of humanity.\n\nBy the time of the Renaissance and renewed interest in the classics, the Dozen Priests of the Pythian Order that still lived were sought out. The few Pythian texts that had found their way to the scholars of the age were a marvel, and the Pythian Order gained a handful of new converts. In the Romantic period, further interest swelled, especially among the poets of that time. These artists found the meaning in their poetry grew to new heights when inspired by the esoteric lore of the Pythians. However, surges of popularity have never revitalized the Pythian Order beyond the few ancient scholars that remain, even as new magicians dedicate themselves to the craft.\n\nWhat remains of the Order — the Dozen Priests are now reduced to four — dwells in a temple on Milos, an island off the coast of Greece. There, the sacred verses are preserved, and the Priests have begun to question whether to fight the inevitable erosion of time and let the Pythian Order finally fall or to seek out new, worthy, and dedicated students to pass on their knowledge. It is not merely a question of their knowledge being lost, for their poetry is stored, and other Pythian works are in archives and museums. There’s more to consider, for the remaining priests have amassed immense power through centuries of study. To let it die with them seems an affront to the gods they once spoke for. They work now to that end, divining the future and their own end of days, to see if students will arrive to learn from them or if they continue clinging to their tradition out of futile stubbornness.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "healing",
     "qualifier": ""
    },
    {
     "id": "shapeshifting",
     "qualifier": ""
    },
    {
     "id": "weather_control",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_fenian",
   "name": "The Fenian",
   "page": 85,
   "favoredAttributes": [
    "manipulation",
    "appearance"
   ],
   "favoredPaths": [
    "Fascination",
    "Shapeshifting",
    "Weather Control"
   ],
   "favoredNote": "",
   "description": "Many sorcerers who share ancestry with the Celts claim to have fae blood and power in their lineage. Most of the time, it’s either patently false or too far back to matter. The Fenian are different. They’re an unbroken family of fae-blooded shapeshifters who can, if one believes them, trace their lineage all the way back to the Tuatha Dé Danann. Their mastery of shifting to animal forms is further evidence of this claim.\n\nIn the family’s early days, they were a group of half-fae adventurers who found more adventure than they bargained for. The spark of exploration hit them, and they left their human connections behind to find the truth of their lineage. On learning about their connection to the fae, some left their humanity behind entirely to join the Dreaming. The others made deals with the Tuatha Dé Danann to learn how to control the magic in their blood. They adopted animal forms according to their personalities: The warriors commonly shifted to bears or large felines while the free-spirited tricksters became foxes or corvids. All Fenian learned to influence mortal opinions, and a few gained true mastery over the weather. The family isn’t a normal family of sorcerers so much as a family of innately magical beings. The magical contracts, or geasa, were tailored to each Fenian based on tradition and personal tendencies. One Fenian who greatly enjoys the pleasures of life might be forbidden from eating certain types of food, while a Fenian who bucks authority might be obligated to always accept guidance — even if the guidance is harmful. A Fenian can enter into a geas for powers when learning a new Path or ritual that may also apply to their descendants.\n\nThese days, the Fenian are on the brink of extinction. Some speculate their fae blood is growing too thin; others suspect someone broke geasa with the Tuatha Dé Danann. There’s still hope; a young child in the family named Niamh developed the ability to speak to animals after an entire generation lacked any magical aptitude or predilection. There are only several dozen Fenian sorcerers alive and active currently.\n\nGiven their magical heritage, Fenian treat all Fenian favored paths as their Affinity Paths but learn all other hedge magic at a higher cost. They pay 10 xp to learn a new non-Fenian Path, new rating x8 to increase a non-Fenian Path, and rating x2 for non-Fenian rituals. Any Fenian under the effect of broken geasa receives an additional experience penalty for all hedge magic, increasing the rating multiplier by 1, and +1 difficulty to all hedge magic and psychic phenomena. It’s therefore more difficult for entire generations to learn and use hedge magic than the average person if they break geasa. This is the only known extant sorcerer bloodline more likely to go through a Changeling Chrysalis than Awaken as a Mage.",
   "sidebars": [
    {
     "title": "Fenian Geasa",
     "text": "Fenian players must work with the Storyteller to determine their geasa and whether they can be re-negotiated or forgiven if broken. Multiple geasa with the possibility to contradict each other is a common subject of Celtic folklore, but the certain doom that typically entails may not be suitable for a given table. Storytellers should also be sure that the opportunity to break a geasa will come up in the course of the game. Unless the game includes travel, a prohibition on eating a certain type of meat likely won’t come up if the animal is unavailable in the game’s location.\n\nPlayers and Storytellers should be clear with each other what the geasa entail before starting the game. Players may feel the Storyteller set them up for failure if expectations aren’t mutually understood or if the Storyteller backs a Fenian into a corner with conflicting geasa (if this wasn’t agreed to beforehand). A mythical redemption story or even an epic downfall can be loads of fun for all involved, but only if everyone feels the character retains agency in the matter."
    }
   ],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "fascination",
     "qualifier": ""
    },
    {
     "id": "shapeshifting",
     "qualifier": ""
    },
    {
     "id": "weather_control",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "forn_jafnadr",
   "name": "Forn Jafnaðr",
   "page": 85,
   "favoredAttributes": [
    "dexterity",
    "wits"
   ],
   "favoredPaths": [
    "Divination",
    "Enchantment",
    "Hellfire",
    "Summoning, Binding and Warding"
   ],
   "favoredNote": "",
   "description": "Since ancient times, people in Scandinavia primarily, but not always, practiced feminine witchcraft derived from forn seiðr, or “ancient customs” of the Norse. They worship deities from either or both of the Æsir and Vanir families. Of note is Freyja, the Vanir goddess of fertility, love, war, and magic who taught sorcery to the Æsir. Odin is also notable as the male head of the Æsir, associated with sorcery, war, wisdom, and the runic alphabet, among other things. Historically, practitioners were highly valued for their powers but suffered under stigma and persecution after the region’s Christianization.\n\nDespite opposition, the practice never fully died out. Many hid under the guise of the dominant religion to secretly maintain their faith. Nowadays, it’s more acceptable to openly practice heathen religions and magic, but they still experience prejudicial backlash in some locales. Practitioners are nominally drawn to the Verbena when they involve themselves in Ascension War politics, though many covens are content to keep to themselves and their communities. Forn Jafnaðr is a new and rapidly growing Affiliation that chose neither of those options.\n\nIn recent decades, neonazi groups (under whatever names lend them enough plausible deniability for their intentions) appropriated symbolism and other aspects from forn seiðr to justify their bigotry. One of those groups, Asatru Futhark, was a group of Nazi losers who couldn’t bother to fact check, lazily naming themselves after followers of the Æsir and the name of the runic alphabet. Astatru Futhark was a group of criminals who believed themselves racially superior to others, and though they were a group of wannabe-sorcerers, completely failed to understand that the practice they stole from was historically primarily a women’s craft and would’ve had nothing to do with Asatru Futhark’s patriarchal bullshit. The Asatru Futhark caused destruction and death under the pretense of religious belief until a group of Aeon Order sorcerers put an end to them. This prompted local forn seiðr sorcerers to rise up in direct opposition to those who appropriate their beliefs to promote inexcusable hate crimes and rhetoric.\n\nRemaining members of Asatru Futhark attempted to resurrect the defunct faction several times, each time definitively quashed by Forn Jafnaðr. Forn Jafnaðr has their hands full in their fight against Nordic-appropriating neonazi groups, but thankfully they’re not without allies and those ready to join them. While they make it a personal mission to destroy Nordic-appropriating neonazi groups, they also don’t turn down aid offered, especially from other sorcerers. Forn Jafnaðr is now a decentralized Affiliation consisting of multiple covens who all practice some variation of forn seiðr. They’re primarily based in Scandinavia, but they’re spreading into other areas of Europe as the sentiment gains traction. In 2019, they founded the first Forn Jafnaðr coven in the United States.\n\nMore experienced sorcerers typically mentor promising interested members of their faith one-on-one to learn their magical practice. The apprentice learns at their teacher’s side and aids their teacher and coven’s ritual work, providing an extra set of hands. Aptitude for magic is secondary to passion and devotion to the cause when choosing initiates. The philosophy is that magic can always be taught to those who wish to learn, but passion for their ideals is imperative.\n\nTo the extent Forn Jafnaðr involve themselves in Ascension War politics, they’re most likely to form temporary working relationships with the Disparate Alliance or the Verbena. Normally, they’re too busy with their main goal to bother with combating the Technocracy, but being mystics, they sometimes get dragged into the conflict anyway. Beyond directly and indirectly combating fascism, individual covens are free to act autonomously to best tailor responses to their local communities. Some covens strive to live off the grid as their ancestors did, but others welcome modern technology in their lives if not their magical practices. It’s far easier, after all, to organize with allies over the internet than with handwritten letters.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "enchantment",
     "qualifier": ""
    },
    {
     "id": "hellfire",
     "qualifier": ""
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "maison_liban",
   "name": "Maison Liban",
   "page": 87,
   "favoredAttributes": [
    "intelligence",
    "manipulation"
   ],
   "favoredPaths": [
    "Fortune",
    "Shadow",
    "Summoning, Binding, and Warding",
    "Quintessence Manipulation"
   ],
   "favoredNote": "",
   "description": "During the 11th Century Hermetic Schism that resulted in the birth of the Tremere vampire Clan, Mathieu de Calice focused his learning on protection and counter-magic, intent on staying safe as the Order began to tear itself apart. Fleeing to safer territory in Northern France, de Calice and his apprentices laid low beneath their arcane obfuscation while the Tremere were busy with local vampires. Separated from the Order of Hermes, fearing for his life from his former mentor and the newly empowered vampire-mages, Magus de Calice worked to hide the Hermetic House. He renamed the group “Liban” in the Visigoth tongue, meaning “live, leave, survive.” Starting with just de Calice’s apprentices, then French and Spanish refugees, the group worked to maintain secrecy and an appearance of normalcy. It would take 250 years for the end of the Order of Hermes’ purge of House Tremere, by which time the Maison Liban had become their own society.\n\nAfter the formative years of living in secrecy, all students of the Maison Liban are directed to maintain a double life to separate their magical practice from respectable normal lives. They are not to reveal their Art to anyone they know unless they deem the person responsible enough to learn the ways of the Maison Liban. This doesn’t prevent the Liban from using protective magics on loved ones and friends. There are no great acts, no show of power for the Maison Liban, as they continue their study beneath their mundane masque. Students learn as initiates to a master until they know enough to teach others, at which point they are also named a master, a pater or mater. The most venerated of Maison Liban, in deference to their founding, use the honorific, Pontifex.\n\nThe Maison Liban originated as a Hermetic House. They maintain the use of seals, rings, and circles in their magic. While Latin is used predominantly, it is combined with the Gothic language from the society’s time in hiding. This blending of the Hermetic origins with the need to hide among the Visigoths during the Order of Hermes’ purge has given the Maison Liban a unique style of magic that is not readily copied by other Hermetic societies.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "fortune",
     "qualifier": ""
    },
    {
     "id": "shadows",
     "qualifier": ""
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": ""
    },
    {
     "id": "quintessence_manipulation",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "mogen_halev",
   "name": "Mogen HaLev",
   "page": 87,
   "favoredAttributes": [
    "intelligence",
    "perception"
   ],
   "favoredPaths": [
    "Divination",
    "Ephemera (Ghosts)",
    "Summoning, Binding and Warding (Angels)"
   ],
   "favoredNote": "Female Auxiliary Favored Paths: Fortune, Healing, and Weather Control",
   "description": "In some forms of Jewish mysticism, there’s a belief that there exist 36 righteous people in each generation. These people are dispersed and could come from any background, but without at least 36 of them living at any given time, the world would end. It’s only through these 36’s essential goodness that the world is spared from certain doom. Complicating the matter, the 36 are so humble that they wouldn’t know they were truly one of the 36 righteous, let alone tell anyone.\n\nThe Mogen HaLev, Hebrew for “Shield of the 36,” is a loose affiliation of Orthodox Jewish mystic covens with a singular purpose of finding and protecting these 36 righteous individuals. They’re a group of male scholars ranging in age from 45 to nearly 100, though they allow initiates to start study as young as age 40. They believe to study the required magic before maturity invites disaster. Most members are in their 60’s. The oldest of the Mogen HaLev, called the Baal Shem Tov (“Master of the Good Name”), is recognized as a sort of leader throughout the Affiliation, though mostly in the sense of seeking guidance and making tie-breaking decisions. Once an initiate begins study, it’s an intensive process involving not only magic itself, but also philosophy and mundane skills of networking with useful individuals such as doctors and social workers. More frequently in recent years, Mogen HaLev work with sister covens of female Jewish mystics who use different skill sets and Paths to achieve their common goal. Though not official members of the faction, these sister covens focus on practical magics for protecting the 36, rather than the divination and spirit matters the men of Mogen HaLev specialize in.\n\nThe main coven (though they wouldn’t call themselves this) of Mogen HaLev meets in a brownstone in Brooklyn, New York City alongside a yeshiva. They maintain an occult and religious library large enough to loan texts to the Affiliation’s other covens as needed. They primarily focus on divination and protection magic, though also learn to speak with spirits for information gathering. All members strictly follow Orthodox Jewish traditions including dietary restrictions, beard and hair grooming, wearing a kippah, as well as charitable work and donations in addition to work within Mogen HaLev. Each coven cultivates connections to aid identifying and protecting the 36, ranging from homeless shelters to medical professionals.\n\nThe Mogen HaLev’s group motives begin and end at finding and protecting the 36. They have no time for any of this Ascension War nonsense except when it threatens one of the 36. They aren’t known for keeping lasting grudges and would prefer to keep to themselves and their purpose. They’re similarly unlikely to form even temporary alliances with other magical factions unless in an effort to protect the 36. If one of those they protect is in danger, they’ll go to great lengths to resolve that threat. The notable exception to avoiding magical grudges is with groups like Nebuu-Afef and other groups that explicitly attempt genocide on Jewish populations. The Mogen HaLev won’t hesitate to defend themselves and their communities if one of those groups comes to town.",
   "sidebars": [],
   "femaleAuxiliaryFavoredPaths": [
    "Fortune",
    "Healing",
    "Weather Control"
   ],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "ephemera",
     "qualifier": "Ghosts"
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": "Angels"
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "nebuu_afef",
   "name": "Nebuu-Afef, The Order of The Golden Fly",
   "page": 88,
   "favoredAttributes": [
    "strength",
    "stamina"
   ],
   "favoredPaths": [
    "Conjuration",
    "Hellfire",
    "Shadowcasting",
    "Shapeshifting"
   ],
   "favoredNote": "",
   "description": "After the Exodus of the Israelites from Egypt in the days of Ramses the Great, the Nebuu-Afef was forged in the fires of hate, rage, and sorrow. After the loss of their firstborn children and suffering from plagues visited upon them for Egypt’s enslavement of the Hebrew people, a group of decorated Egyptian soldiers began their quest for revenge upon the fleeing refugees. Awarded a medal in the shape of a golden fly as a badge of honor, these warriors were already skilled with magic, but they desired more to focus their rage into destructive force. Naming themselves after this mark of distinction, the Order of the Golden Fly spent years in research and accumulation of resources. Their devotion finally bore fruit with the discovery of the secret names of the angel of death who had wrought the plagues upon Egypt — the very angel who had taken their firstborn children from them — and the means to summon and control that angel. Through profane ritual, the mystics summoned forth this angel, Mastema, and bound it to their control, demanding further knowledge and charms to bring plague or rain fire. The Order wanted these tools to punish the Israelites.\n\nWhat the Order had not grasped in their hubris is that Mastema was never bound to them; it was neither contained, nor controlled. Mastema had fallen, corrupted by its destruction of Egypt, discovering a lust for the death and fear it had wrought across the country. As the Order demanded power from the angel, Mastema fed them only the darkest and most destructive magics. For all the Order thought it was in control, Mastema only gave them what it desired, feeding their anger and hate into destructive purpose. The original members of Nebuu-Afef never accomplished their designs against the Israelites, but the Order was founded and continued to plague Egypt for centuries to come. In the Coptic period, Pharoah Ikhnaton drove the small group from Egypt. The Order moved from region to region, kept small due to sharing power of one ‘bound’ angel to serve them all.\n\nIt was in Austria in World War II that the Order rose from obscurity to seek the carnage of their initial purpose. They reached out to members of the Nazi party, offering their assistance to the already occult-minded Hitler. This turned out to be the Order’s undoing, as shortly after this contact was made, the Order’s meeting house exploded, destroying most of their records and killing the sect’s senior members. The apprentice of the Order’s priest and a few initiates fled, escaping in the chaos.\n\nThe remnants of the Order now exist spread across the globe in small cells, connected by internet communications. Those who remain are utterly under Mastema’s control, though the captive creature still masquerades as a subservient tutor. The angel deftly guides the Order into recruiting those like the original founders — strong, fast, and tactically gifted warriors. Soldiers, police, nightclub bouncers, and sufficiently cautious serial killers are pursued and recruited to the Order’s ranks. Mastema teaches new students death, hate, and fear; the Order teaches their recruits that authority comes from power. A novice is tortured and humiliated, broken down and built back up into a killer.\n\nWhile the Order was founded by mystics who had developed rituals and practices of their own before summoning Mastema, the current Order’s magic relies on the angel’s teachings. Every student is taught binding spells intended to call and control Mastema, but these spells are useless against the angel. If the angel deigns to teach a Path to a student, it will be one focused on destruction and suffering. It teaches nothing of Binding or Command, for it will never reveal that every member of the Order is a plaything and tool for the angel.",
   "sidebars": [
    {
     "title": "Playing the Nebuu-Afef",
     "text": "The Nebuu-Afef are an antagonist Order and aren’t intended to be player characters. They are ‘sorcerers’ in name only, duped into believing they control an angel. If players are interested in playing villains such as these, have a discussion with the group as to the purpose of playing them. Is this an attempt to depict reform, rehabilitation, and reparation of those lost to their hate and anger, or just an attempt to be edgy? This should be a serious discussion for everyone at your table. If everyone is onboard, consult Book of the Fallen for further guidance on tools and cautions for incorporating pure evil into your game.\n\nTo mechanically depict the Nebuu-Afef’s reliance and the unreliable nature of Mastema’s help, the Storyteller should roll all Summoning, Binding, and Warding Path rolls in secret, and even if the roll is successful, Mastema has only been contacted but may not appear."
    }
   ],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "conjuration",
     "qualifier": ""
    },
    {
     "id": "hellfire",
     "qualifier": ""
    },
    {
     "id": "shadowcasting",
     "qualifier": ""
    },
    {
     "id": "shapeshifting",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_nephite_priesthood",
   "name": "The Nephite Priesthood",
   "page": 89,
   "favoredAttributes": [
    "stamina",
    "wits"
   ],
   "favoredPaths": [
    "Divination",
    "Enchantment",
    "Hellfire",
    "Summoning, Binding, and Warding",
    "Weather Control"
   ],
   "favoredNote": "",
   "description": "The Nephite Priesthood, also known as “The Dust Prophets,” is an exclusive Affiliation of mystics in The Church of Jesus Christ of Latter-day Saints. They believe that Joseph Smith didn’t publicly reveal the secrets of a priest named Nephi, who God taught through dreams how to perform miracles. Nephi kept a group of disciples to pass on the divine knowledge and serve his people. Nephi and his disciples were killed in the battle of Cumorah and the knowledge destroyed for over a millennia. In 1849, Nephi revealed himself as a celestial being to a pious desert settler named Uriah Spence, so Uriah could restore the Priesthood and protect the Church from an oppressive government and other hostile outsiders. They also prepare for a coming final showdown when the apocalypse comes. All Dust Prophets swear oaths of secrecy. They aren’t allowed to let members of the Church know of their miraculous abilities.\n\nTo join the Priesthood, one must be a man in good standing within the Church. Most Nephite Priests were born into the Church, but converts aren’t unheard of. If a man isn’t a Latter-Day Saint, he must first convert to the Church and study for at least several years before a Nephite priest will approach him. They believe that any that strayed from a strict code of conduct would quickly be corrupted by the power and risk damnation. The initiation rites are performed in secret temples. The initiate, known as a Deacon, first fasts for three days. At sunrise on the fourth day, he enters the temple, undresses, and is anointed by oil. He spends the morning in prayer. At noon, the Deacon clothes himself in a pure white robe. A Priest attends at the altar, separated from the Deacon by a veil, and prays with the initiate. As the ceremony concludes, the Deacon is “reborn” into the celestial kingdom, parting the veil and approaching the altar for a final prayer.\n\nAfter the ritual, the Deacon spends two years studying Nephite miracles and history, including the sacred names of the original Nephite Priests to call on to invoke the miracles. To progress to priesthood and beyond, the Dust Prophet undergoes increasingly longer and more solemn rituals. Priests may operate under their own discretion in the absence of Elders, and after ordination must spend at least two years wandering outside the desert, typically to Central and South America, to spread the faith and learn of the outside world. Elders are older and more experienced priests, typically spending at least a decade wandering and learning after ordination. The High Priest-Prophet is the highest ranking elder, selected by popular vote from the Elders. Most Nephite Priests make an annual journey, wandering for 40 days and 40 nights in the wilderness stretching from Utah to South America, traveling as far away from civilization as possible.\n\nOn January 4, 2000, the 104th anniversary of Utah’s statehood, the entire Nephite Priesthood gathered in Salt Lake City for an unknown purpose. What remains of the reports conflict wildly, but one thing is certain — an event of apocalyptic proportions occurred. Only one Nephite Elder, Porter Larsen, remained to pass on the knowledge and rebuild the faction. Some whisper that a mass ritual went horrifically wrong, others speculate the rapture occurred, taking all but one Elder and leaving the rest of the world to its doom. No one openly takes credit for whatever happened, and Elder Larsen hasn’t added to the discussion. His mission is to rebuild the Priesthood, he says, not to waste time concerning himself with what he can’t change. He’s not been seen publicly much since then, and the new Nephite Priesthood hasn’t brought attention to themselves.\n\nThe possibility of an outside attack isn’t far-fetched. The Nephite Priesthood had many enemies. US intelligence agencies accrued massive files on the organization, attributing anti-government actions (deserved and undeserved) to them; accordingly, Project Twilight kept tabs on the Priesthood. The Nephite Priesthood believes their powers are divine gifts and considered all other mystical sorcerers devil-worshipers. At best, the Dust Prophets shunned them, even when trespassing on others’ land during the priests’ journeys. They considered friendly interactions with other mystical societies potentially treasonous. Some remain hopeful that the Affiliation, if and when they reemerge, won’t be as contentious as it was under previous leadership.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "enchantment",
     "qualifier": ""
    },
    {
     "id": "hellfire",
     "qualifier": ""
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": ""
    },
    {
     "id": "weather_control",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_seven_thunders",
   "name": "The Seven Thunders",
   "page": 90,
   "favoredAttributes": [
    "charisma",
    "manipulation"
   ],
   "favoredPaths": [
    "Divination",
    "Fortune",
    "Healing",
    "Hellfire"
   ],
   "favoredNote": "",
   "description": "Armageddon was due at the turn of the millennium, but the years have continued to accumulate, and the Seven Thunders, the prophets of this apocalypse, have found that their army of believers have fallen out of faith. The True Faith of the seven prophets has not wavered in the decades that have passed. They continue their mission, albeit changed and adjusted as they realize that their mortal understanding of divine visions was flawed. The Seven Thunders have spread across the globe, supported by their few remaining faithful followers, as they work to bring judgement upon the wicked. The Seven Thunders no longer watch the clock, waiting for a specific date for Armageddon to arrive. They believe that it will come at the appointed time and not before. It may be that Armageddon will not arrive until they have fully prepared the earth for it.\n\nWith this new outlook on their mission, the Seven Thunders seek out the unholy, the false gods, and the misled. They’ll bring low the high and mighty; bring them into the light of their faith. If necessary, they will destroy them. They are Judgement on Earth, and while the prophets bring the sword of faith against the greatest of threats, their followers seek whatever foes they can find. The Thunders preach the end of the world, showing signs of their faith, healing the sick, and casting out foul spirits. Meanwhile, they command ordinary people armed with rosaries and rifles to combat vampires, werewolves, and mystics.\n\nAs time has passed, the Seven Thunders find that they are not in complete accord. While they believe they have the same mission, the path they walk has changed. Now physically separated to cover more territory and hasten the coming of Armageddon, the Seven Thunders’ methods and focuses have diversified based on what each prophet finds most important. The prophets are not dedicated to specific territories but travel across the continents as their visions lead them , reaching out to local support networks for their missions. This means that some supporters find themselves going from shepherd of their local community to suddenly hunting lycanthropes in the woods within the space of a week. This continual shift of priorities and leadership has driven some followers away, but those who remain are dedicated to the cause, at the risk of their relationships and lives.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "fortune",
     "qualifier": ""
    },
    {
     "id": "healing",
     "qualifier": ""
    },
    {
     "id": "hellfire",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_silver_portal",
   "name": "The Silver Portal",
   "page": 90,
   "favoredAttributes": [
    "charisma",
    "perception"
   ],
   "favoredPaths": [
    "Ephemera (Umbrood)",
    "Fascination",
    "Oneiromancy",
    "Shadows"
   ],
   "favoredNote": "",
   "description": "The mind is a powerful thing. When we sleep, even the uninitiated can taste potential in the untamed dream worlds. Chaos is only potential waiting to be tapped. The Silver Portal is unique in this understanding of magical ability among sorcerer Affiliations. Their sacred text is an eldritch work that’s been telephoned across centuries, languages, multiple massive revisions, and cultures into something wholly alien from the 5th century (or even older, as it claims) Persian scroll called Zolondrodere it derives from. It teaches that every possible thought and idea exists drifting in Maya, the Dream Realms, waiting for someone with the power to pluck it from this subliminal realm and bring it into reality.\n\nThe secrets of the Zolondrodere defy rational thought, even by mystic standards. The sound mind often rejects the tome’s teachings, so Silver Portal initiates must often begin their study through hypnosis, indulging in mind-altering substances, and ritual sensory and sleep-deprivation. Once the sorcerer begins to feel they understand, they enter a dream-like trance, often in front of a mirror inscribed with mystical symbols thought to promote openness. Once they cross the silver portal into Maya, they encounter strange Umbrood and disorienting, potent imagery — fantastical and horrifying in equal measure. There, they find power to bring into the waking world.\n\nAwakened scholars have likened the Silver Portal’s practices to the chaotic nature of the Marauders, which is a rather horrifying thought to most. The sorcerers allow the dream realms to bestow magic upon them that bleeds into the waking world. For a Silver Portal sorcerer, dream and reality aren’t two distinct concepts and have a lot of overlap. They’re the most flexible of all sorcerers, able to bend the rules of linear magic with their practices without getting slapped by Reality for it.\n\nThe Silver Portal sorcerer keeps track of the total number of dots spent in Paths and rituals at all times. Whenever the sorcerer enters the Dream Realm on purpose though a trance, the sorcerer’s player may redistribute these dots among Paths and rituals as they wish, even to Paths the sorcerer doesn’t yet know. For each intended Path, the sorcerer rolls their Favored Attribute plus either Meditation at difficulty 6 or Lucid Dreaming at difficulty 5. The number of successes is the number of dots the sorcerer may possess in that Path, up to the number of dots allotted. All allocated points not gained with successes are inaccessible until the effect ends. The sorcerer travels through the Dream Realm to find these powers and rituals, and the storyteller is encouraged to make use of surreal dream imagery for the journey. They may use these temporary powers in the Dream Realm and waking reality until they have restful sleep. The sorcerer must have restful sleep before they may enter a trance to redistribute Path points again. As the sorcerer doesn’t learn paths directly through normal means, they must redistribute dots into a Path or ritual first and spend the Experience to make it one of their baseline powers.\n\nThere is no formal hierarchy in the Silver Portal, given the nature of the sorcerers themselves. New members earn initiation by fascinating a Silver Portal sorcerer as much in the dull waking world as by their dreams.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "ephemera",
     "qualifier": "Umbrood"
    },
    {
     "id": "fascination",
     "qualifier": ""
    },
    {
     "id": "oneiromancy",
     "qualifier": ""
    },
    {
     "id": "shadows",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "seai",
   "name": "The Society of Enlightened Altruistic Ideologies (SEAI)",
   "page": 91,
   "favoredAttributes": [
    "intelligence",
    "manipulation"
   ],
   "favoredPaths": [
    "Alchemy",
    "Conjuration",
    "Conveyance",
    "Enchantment"
   ],
   "favoredNote": "",
   "description": "The Enlightened members of the Technocratic Union are some of the greatest opponents of sorcerers around the world, whether they acknowledge the fact that their inner Genius is an Awakened Avatar or not. However, not all members of the Technocracy are Enlightened, and the Society of Enlightened Altruistic Ideologies (SEAI, pronounced sea-ah, for short) work to address the concerns of un-Enlightened associates, ensuring that their needs are met. The SEAI has a bit of a social club feel, with gossip-filled gatherings over coffee and cake, but the topics of discussion are more esoteric and profound compared to the average coffee klatch. Because the SEAI straddles the worlds of Enlightened Science and mundane society, they acquire knowledge of so much beyond their reach. They see the power of sorcerers and mages but are forced to live dull and drab lives. They feel increasing resentment for the Reality Deviants who have tapped into the cosmic energies of the universe, only to squander them; after all, the extraordinary citizens of the SEAI are far more deserving of these powers.\n\nBetween pushing papers, fetching coffee, and reporting statistics, the SEAI have overheard things, tracked events, calculated expenditures, and taken careful notes, with a single idea in mind: capture a Tradition mage, mindwipe them, and take their Avatar for themselves. The Progenitors of the Technocracy are already working on the mindwipe technology, so by combining this tech with some spells of the SEAI’s own devising, they have begun to make strides toward their goal. The idea of Nephandic Avatars is ignored as merely propaganda or a fairy tale and has not been truly considered by SEAI. Enlightened operatives who scoff or mock the SEAI may find that they join the Reality Deviants on the list of those that should have their Avatar removed and given to the more worthy, hard-working members of the SEAI. While they have yet to capture a mage alive, the discussions of how to proceed have been made in earnest, and they are ready to strike as soon as the opportunity arises. Occasionally, word of these plans and developments reach the Enlightened members of the Technocratic Union, causing a bit of a concern as members of the SEAI group themselves in accordance with which Tradition they would join, were they Awakened. When these rumors are reported to upper management, SEAI members who have been loose-lipped or been witnessed deviating from protocol are usually taken in for reconditioning.\n\nSorcerers of all stripes might encounter the Society as the SEAI uses spells to guard their work and experiment with other uses in pursuit of the taking a Tradition mage captive. Some of the SEAI toe the line of information gathering and go ‘undercover’ within sorcerous groups to glean knowledge or discover when a mage might be vulnerable. These citizens risk being caught by the Technocratic Union or the societies they infiltrate, walking a knife’s edge to take power from the undeserving. Other SEAI lose ‘perspective’ and slip from the Technocracy when they get a taste of magic through ritual and study, often when they begin to recognize that the hyperscience they’ve studied seems so similar to Hermetic formulae.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "alchemy",
     "qualifier": ""
    },
    {
     "id": "conjuration",
     "qualifier": ""
    },
    {
     "id": "conveyance",
     "qualifier": ""
    },
    {
     "id": "enchantment",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_star_council",
   "name": "The Star Council",
   "page": 92,
   "favoredAttributes": [
    "perception",
    "intelligence"
   ],
   "favoredPaths": [
    "Enchantment",
    "Healing",
    "Shadow",
    "Quintessence Manipulation"
   ],
   "favoredNote": "Most modern Star Council are psychics, but some know Enchantment, Healing, Shadow, and Quintessence Manipulation",
   "description": "In July, 1947, news of a possible extraterrestrial crash in Roswell, New Mexico swept the nation. People from all walks of life were enamored with and inspired by the possibility of life beyond Earth. The Star Council originally formed as a handful of like-minded UFO enthusiasts and paranormal researchers. Though they came from different backgrounds, ranging from eccentric professors to delinquent teens, they found community and readily shared their theories and findings about space, extraterrestrials, and related conspiracies among the group.\n\nThe Star Council welcomed another smaller group, the Thal’hun, to their ranks in the late 1960s. The Thal’hun were more insular than the rest of the Star Council and largely remained a faction of their own, though they participated in sharing their beliefs and findings. They were the first to introduce the Star Council to proof of the supernatural and gained credibility when supposed extraterrestrial technology they stole from the US Government worked just as they predicted.\n\nAs decades passed, the Star Council did their best to remain a low priority to the government. Their efforts were often complicated by actions of the Thal’hun faction, and the Star Council had to rely on younger tech-savvy members and discredited lawyers in their ranks to stay under the radar. The Thal’hun’s diverging goals and rigorous study practices became festering points of contention.\n\nUnbeknownst to the group, the non-Thal’hun Star Council was mostly comprised of psychics by the late 1990s. These members typically believe that they’re either victims of extraterrestrial experimentation or they’re actual descendants of extraterrestrials. They believe genetic differences, natural or otherwise, caused their supernatural powers, while the Thal’hun insisted they could never reach their full potential without Thal’hun education.\n\nWhen the Thal’hun left law enforcement breathing down the group’s necks after an experiment gone terribly wrong in 2002, the Star Council finally ejected them. The associated explosive argument left soured feelings on both sides, and it took the entire Star Council’s efforts to clean up the mess of both the botched experiment and the resulting conflict. Since then, the Star Council went back to their roots as wide-eyed explorers with the entire universe to discover. The Star Council maintains their practices of individualized study and group presentation and discussion. Some use “alien science” derived from Thal’hun practices, but they also accept other adjacent paradigms of hyperscience and technomagic. The Star Council won’t officially support actions to expose government secrets on extraterrestrials, but they often search where they aren’t supposed to. They usually try to be subtle, but if something goes wrong, a fellow member is always quick to help provide cover. Recently, a couple daring young members inspired a swarm of people to storm Area 51 via a viral meme. It didn’t turn out as useful for gathering secret information as they hoped, but the Star Council initiated several new members following the event.\n\nInitiation is an important social convention in the Star Council. The initiate must meet with the members to establish social chemistry and present an informal thesis of their beliefs on the extraterrestrial and the future of the universe to the rest of the Star Council. If the Star Council feels the initiate is ready and a good fit, they throw a party celebrating the new addition to collective knowledge and creativity. The modern Star Council learned from their mistakes with the Thal’hun and want to be sure new initiates contribute without veering the Affiliation’s mission off on a wildly different path.\n\nThe Star Council of today is a generation-spanning band of oft written-off weirdos. Many of them face or have faced difficulties with exclusion from society, so they built their own. They’re quick to help each other when needed, and members who fall on hard times are typically welcome to stay at the small house the Star council owns for group social events.\n\nNot all of them started off as UFO-enthusiasts. Some only got interested in the phenomenon after they found community that accepted them in the Star Council. One of the side effects of the Star Council’s philosophy on extraterrestrials is that no matter how bad the world around them gets, they firmly believe that humanity as a whole can get better. They believe there’s something about the little blue dot of a planet called Earth that’s worth crossing galaxies to find. Their prevailing hope, though devastatingly naive at times, is often their greatest strength.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "enchantment",
     "qualifier": ""
    },
    {
     "id": "healing",
     "qualifier": ""
    },
    {
     "id": "shadows",
     "qualifier": ""
    },
    {
     "id": "quintessence_manipulation",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "thalhun",
   "name": "Thal’hun",
   "page": 92,
   "favoredAttributes": [
    "intelligence",
    "wits"
   ],
   "favoredPaths": [
    "Conjuration",
    "Fortune",
    "Hellfire",
    "Quintessence Manipulation"
   ],
   "favoredNote": "",
   "description": "The Thal’hun profess that the idea of magic as put forth by sorcerers is ridiculous, but a grain of truth hides amidst all the bluster and superstition. The Thal’hun are an order of scientists, engineers, and metaphysicians who have found the truth: All “magic” merely consists of tapping into the greatest power of the cosmos, called thal. Thal is the science of harmonics, and a Thal’hun is an engineer of these harmonics. The order claims that they were taught by an ancient race of aliens from the stars, the Hui:xa.\n\nAs the Thal’hun explain it, the Hui:xa had thousands of years of culture to develop sciences beyond human understanding, but thal is the crown jewel of their discoveries. It requires supreme intellect and will to harness this power and not harm those around the Thal’hun. While some of the Hui:xa had mastered the thal, there were other sciences they had yet to fully grasp, and a biological disaster led to the destruction of their homeworld, threatening to bring about their extinction. To prevent the total loss of their people, their most learned priest-scientists phased a portion of their great city, Zoraster, into another plane beyond time and space. 300 of the Hui:xa were selected to be Jeva, or Lightbearers, transformed into creatures of pure energy and sent to find a new home for what remains of their people.\n\nA Jeva named Khuvon came to our world when Mesopotamia was on the rise. Intrigued by humanity, he assumed a mortal form and lived among the people for a time, but there was a limit to what he could do. Occasionally, he would rise and teach the arts of thal, creating a new generation of Thal’hun. These early lessons were not of science for that idea was beyond human understanding in those days, so thal was taught couched in the stories and myths of the time. Finally in 1961, as humanity first reached beyond the Earth, Khuvon began to teach again. This time to scientists, not mystics and philosophers. No myths and legends, but pure science of Thal. He spent 5 years with his 7 students, teaching them all he could, and then sent them among humanity to teach in his stead. Satisfied that Earth would be a new home to the Hui:xa, he sent the call out into space, calling to the other Jeva, calling them to him to return Zoraster to this plane. Now Khuvon rests in the core of the Earth, the Thal’hun instruct the next generation, and they wait for the arrival of the Jeva who have been spread across the stars for thousands of years.\n\nNew initiates of the Thal’hun come from across several fringe societies, scientifically minded questioners of the status quo, those who delve into pseudoscience, New Age crystal healers, UFO watchers, or ‘genius inventor’ types. The more mystically inclined, occultists, and philosophers are simply too ingrained into their beliefs to consider the truth of thal. These new initiates spend years learning to write and pronounce Luz’at characters, proper mediation, and the history of Khuvon’s activity on Earth before their mind is ready to properly understand the language itself. After this, the new initiate begins to use diadems, metal and crystal devices like rods, staves, tripods, and other antennae to amplify their harmonics and mental attunement to manipulate thal itself by ‘setting a resonance’ with those specific sounds. They assist others in constructing diadems and in their experiments with Thal and study Hui:xa culture, lore, astronomy, and the poems and histories left behind by Khuvon for his human “children.”\n\nFinally, the recruit rests in a sensory deprivation tank for up to a week, starting with silence and then graduating to a series of frequencies generated by elder scientists to open the initiate’s mind. Within a trance state, the initiate meets Khuvon in his spirit form, who initiates and accepts the new disciple. After another hour of silence to come to grips with their experience, the initiate emerges as a new Thal’hun.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "conjuration",
     "qualifier": ""
    },
    {
     "id": "fortune",
     "qualifier": ""
    },
    {
     "id": "hellfire",
     "qualifier": ""
    },
    {
     "id": "quintessence_manipulation",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "us_government_project_twilight",
   "name": "U.S. Government (Project Twilight)",
   "page": 93,
   "favoredAttributes": [
    "dexterity",
    "wits"
   ],
   "favoredPaths": [
    "Divination",
    "Fortune",
    "Hellfire"
   ],
   "favoredNote": "Most are psychics, but hedge magicians commonly learn Divination, Fortune, and Hellfire",
   "description": "There aren’t any U.S. intelligence subdivisions, even classified ones, officially known as “Project Twilight” — that’s just the nickname that stuck. “Project Twilight” includes paraintelligence departments from multiple agencies, such as the Department of Defense, the National Security Agency (NSA), the Central Intelligence Agency (CIA), the FBI Special Affairs Department, and even secret projects within the Center for Disease Control and Department of the Interior. The nickname comes from agents darkly joking that going on a mission was like living in the “Twilight Zone,” though the nickname brings different connotations to younger agents.\n\nAll projects that fall under the moniker of Project Twilight are funded through a lump sum called “black book” expenses that Congress authorizes for classified intelligence operations. As such, most individuals, even in some of the highest levels of government, remain unaware of the project’s existence. The agencies would rather things stay that way, since rooting out meddlesome supernatural interference in the government and keeping it secret from the public are the agents’ jobs. All agents have appalling levels of discretion for their duties. Not one would ever be brought up on charges for what would normally be considered gross abuses of power, if it’s justified by stopping vampires and werewolves from running rampant, or preserving “national security” as any official documents code it. Even if an agent’s superior felt the agent crossed a line, or several, the agent would simply be terminated, never to be heard from again. This is doubly true for the hedge magicians and psychics working for the government.\n\nNot all agents in Project Twilight are sorcerers, but many field agents are. It’s much easier to fight rowdy supernaturals with a wider variety of tools at the government’s disposal. And that’s how many Project Twilight sorcerers are viewed: disposable. Agents are sent to deal with everything from Sabbat strikes to egotistical mages on a power trip (which is to say, most of them). At the very least, the pay is better than most other ways a sorcerer can make a legal, if not honest, living.\n\nMany of the higher ups answer to different masters entirely. The Camarilla, Technocracy, Pentex, and others all have their fingers in the paraintelligence divisions to suit their own goals, which often align with keeping the public unaware of the supernatural. Conversely, agents can never get too good at rooting out the supernatural in their own organizations; the supernaturals involved in the agencies won’t let them. Though many agents can be exactingly effective in the field, the inherent conflicts of interest at play in the upper levels work to keep agents focused on matters outside their agency, not their superiors.\n\nPsychics are of particular interest to the government for several reasons. They tend to have much higher-than-average Willpower, and their abilities tend to function without the need for lengthy rituals or specialized equipment. Additionally, they tend to be easier for the non-sorcerers to accept as legitimate because of the massive amounts of media that portray psychics working in the three letter agencies. Because of Technocratic influence in US government and culture, the hedge magicians in the paraintelligence projects are overwhelmingly technosorcerers.\n\nSorcerers who aren’t affiliated with the Technocracy aren’t likely to trust sorcerers involved in Project Twilight, if their employer (even just the mundane one) is known. Even other Project Twilight sorcerers don’t tend to trust each other, given the sheer frequency with which they end up spying on one another. The government has a long and bloody history oppressing groups from minority ethnicities, religions, and other identities — which make up most sorcerer covens. Historically, magic’s been an outlet for oppressed groups to right wrongs and protect themselves when systems failed them or were never designed to protect them in the first place.",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "divination",
     "qualifier": ""
    },
    {
     "id": "fortune",
     "qualifier": ""
    },
    {
     "id": "hellfire",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "uzoma",
   "name": "Uzoma",
   "page": 95,
   "favoredAttributes": [
    "charisma",
    "wits"
   ],
   "favoredPaths": [
    "Alchemy",
    "Healing",
    "Summoning, Binding, and Warding",
    "Quintessence Manipulation"
   ],
   "favoredNote": "",
   "description": "Originating in the Yoruba regions of Africa, the Uzoma are the gatekeepers of the spiritual world, interceding between the orisha, the gods of all creation, and humanity. For years they served as priests and sorcerers, called babalawos, within the holy city-state of Ife, but as other civilizations oppressed and enslaved their people, the Uzoma began to lose influence. The Uzoma gain power from the Orisha, the Orisha gain power from believers, and as their people were taken into slavery their belief faltered. Wherever their people were taken, the Uzoma were taken with them. In the New World, this faith merged with other beliefs, creating new religions: Candomblé, Vodoun, Macumba, and others. The Uzoma faith continued though, hidden alongside these new faiths, both in their homeland and in Africa. As time has passed, the burden of colonization has lessened somewhat, and the old ways have resurfaced among the African diasporas.\n\nThe Uzoma organize in “family” groups called ile, taking a hands-off approach as they watch over their people and territory. After hundreds of years of outside influence, the Uzoma allow for no interference with their people. When the Uzoma step in, there is no holding back, and they strike with no reservations. So long as their world remains at peace, the Uzoma are content to watch and remain in the background. They see their task as being gateways for the spirits, not as magicians. The true sorcerers are the Nhanga, who serve other orisha of darker origins. Uzoma dedicate themselves to others and their people while the Nhanga put themselves above others. Often foreign sorcerers and magicians are labelled as Nhanga as well, due to the Uzoma’s past experiences with them.\n\nEach orisha is unique, and there are over 400 of them, though the Uzoma do not necessarily always agree on the names and roles of each of them. Each orisha has a number, color, food, and dance that is specific to them; knowing these characteristics is necessary for properly communicating with them and winning them over. Each individual has a guiding orisha who influences their personality and behavior, villages take on a patron orisha, and Uzoma select specific orisha they serve.\n\nThe magic that the Uzoma perform takes place through religious ritual, beginning with praising and thanking Olorun, the Owner of Heaven. The priests then appeal to specific orishas, asking for their magical assistance in return for the Uzoma’s past service and to empower them for further service in the future. The rituals revolve around dancing, drumming, and singing as ways to reach out to the orisha. Different forms of drumming and dance are tied to certain rituals, and they are never performed outside of these rituals. The performance is given to call to the orisha and invite them to join with the Uzoma’s community; the whole ritual is magical rite, religious service, and celebration all together. As the rite ends, the priest is “mounted” by the orisha, who speaks through the priest as a type of possession, though sometimes the orisha chooses not to speak and merely joins with the babalawo for a time.\n\nThe start of an Uzoma’s initiation begins with a reading of the Ifa, a collection of patakis (sayings, myths and stories) that are consulted with a shell divination. The elders discern the initiate’s personal guiding orisha, which helps determine which ile they belong with. The initiate is gifted their elekes, necklaces blessed by the ile babalawo and which signify their house. This begins a year of service as a ‘child.’ They dress in white, follow a strict diet, and cannot be touched during their time of service. Days are spent learning the patakis from the priests of the house and learning to cast the Ifa. After their year of service to",
   "sidebars": [],
   "kind": "affiliation",
   "favoredPathIds": [
    {
     "id": "alchemy",
     "qualifier": ""
    },
    {
     "id": "healing",
     "qualifier": ""
    },
    {
     "id": "summoning_binding_and_warding",
     "qualifier": ""
    },
    {
     "id": "quintessence_manipulation",
     "qualifier": ""
    }
   ],
   "favoredPhenomenaIds": []
  },
  {
   "id": "unaligned",
   "name": "Unaligned",
   "kind": "unaligned",
   "page": 79,
   "description": "Covens\n\nMany hedge wizards belong to covens, though like all nomenclature in the hedge wizard’s world, several alternative names convey the same concept. A coven is a small group of practitioners who work in concert. Many covens are also part of a larger society, such as an Affiliation, though not all. Hedge wizards around the world join unaligned covens that operate independently from Affiliations for reasons ranging from rugged individualism to a simple lack of local options.\n\nLone Practitioners\n\nThough many hedge wizards learn their arts through the structure of an Affiliation, it is nearly as common for hedge wizards to come to the practice on their own, as myriad avenues of study can ultimately lead to hedge magic. Many who learn hedge magic on their own prefer to remain free of entanglements with other magicians. They might form temporary alliances, friendships, and romantic bonds with other magicians, but when it comes to gathering knowledge and power, the lone practitioner prefers self-reliance. Some lone practitioners do not join covens or Affiliations for the simple fact that they are not aware of them. Many hedge wizards throughout the centuries lived and died without ever meeting another practitioner.\n\nPsychics are even more prone to lone practice. Many psychics don’t know that there are others with similar abilities out in the world. They simply try to survive and gain control of their own power lest they prove to be a danger to everyone in their vicinity. A large portion of psychics shun the use of their powers, manifesting phenomena only when instinct or survival require it. The idea of seeking out others like themselves and joining a team of their fellow freaks has minimal appeal to such psychics.",
   "chapterIntro": "Arcane conspiracies and secret societies lurk in the shadows throughout the world. Some groups are little more than small collections of hedge wizards in remote communities, with little influence outside their immediate circle. Others are vast international organizations with significant financial and material support, clearly defined agendas, and the responsibilities that come with such resources. Most organizations of hedge wizards and psychics fall somewhere between these extremes.",
   "sidebars": [],
   "favoredAttributes": [],
   "favoredPaths": [],
   "favoredNote": "",
   "favoredPathIds": [],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_council_of_nine_mystick_traditions",
   "name": "The Council of Nine Mystick Traditions",
   "kind": "society",
   "page": 96,
   "sectionIntro": "Affiliations are not the only magical societies that welcome hedge wizards and psychics. Each faction in the Ascension War actively recruits both to further their own goals.",
   "description": "The Traditions that make up the Council of Nine have recruited hedge wizards and psychics since their inception. Though each Tradition handles the distribution of power and responsibility to these allies differently, there are a few common terms and roles seen throughout the Traditions.\n\nAcolyte\n\nMages usually refer to mortals who lack magical training but accept the paradigm of a Tradition as acolytes. Also called allies, these folks are usually employed in a mundane capacity by the mages they serve. Some act as literal servants, addressing the household chores of a Chantry, serving as seneschals and personal assistants to mages, or even taking the role of personal security or trained muscle. Others might act as assistants during large rituals. This can include collecting a list of components for the ritual, securing a location while the mages work their effects, or even acting as assistants in the ritual itself. Acolytes are typically mundane beyond their acceptance of a mystic paradigm, but there are some who command modest knowledge of hedge magic or rudimentary psychic abilities.\n\nConsor\n\nThe Awakened usually refer to hedge wizards and psychics in their sphere of influence as consors. Consor is an honorific that originated with the Order of Hermes but moved into popular lexicon among the Traditions during the Grand Convocation. The title is meant to signify exceptional skill and usefulness. As such, those hedge wizards and psychics who become consors of a Tradition mage typically enjoy greater privileges than an acolyte. This includes anything from access to a Chantry’s resources to the ability to petition the Traditions for a redress of grievances under Council Law. This can even extend to requesting Tribunals and challenging offending mages to Certámen, though in the latter case the consor must be able to appoint a willing proxy to act on their behalf.\n\nWhile many consors employ hedge magic or psychic phenomena, such abilities are far from universal. There are just as many — if not more — consors who earned their title through advanced, albeit mundane, knowledge and skill. A gifted computer programmer, remarkably accurate sniper, or exceptionally skilled librarian are as worthy of the title of consor as an accomplished hedge wizard or powerful psychic.\n\nRecruitment\n\nMany mages of the Traditions move in similar social and academic circles to hedge wizards. The common pursuits of enlightenment and arcane knowledge bring many hedge wizards into the fold of the Traditions. Many Tradition mages connect with hedge wizards while seeking Sleepers who are either on the cusp of Awakening or who might serve as acolytes or cultists.\n\nSome Traditions, such as the Order of Hermes, Society of Ether, and Virtual Adepts maintain academic fronts that seek out potential mages and acolytes. The Order of Hermes cultivates secret societies whose doctrines and practices serve as testing grounds for Hermetic thought. Members of these societies who accept the Hermetic paradigm receive initiation into deeper mysteries. Some of them Awaken, while others develop the mystical acumen to master hedge magic. Though the Order’s rigid structure all but ensures that hedge wizards rarely rise above the status of consor within the Tradition, House Ex Miscellanea has admitted several talented practitioners over the centuries. The Society of Ether keeps a close eye on fringe sciences and pseudoscience communities for signs of Enlightenment from emerging researchers. This occasionally leads to the discovery of hedge wizards whose practice complements Etherite theories. Virtual Adepts constantly monitor online communities for communication, code, programs, or technical schematics that reveal a deeper understanding of reality, or at least the acumen to grasp the basics of Adept magick. Hedge wizards who work their crafts through computing often operate in similar fashion, seeking the latest tech to upgrade their own workings.\n\nAside from academia, many Traditions draw support from within their communities, finding acolytes and consors through the common ground of culture. Akashayana and Euthanatoi acolytes are often fellow travelers on the path to enlightenment, who share beliefs and mores with the mages in their midst, even if they lack the spark of Awakening. It is only natural then that some unearth the secrets of hedge magic during their pursuits. The Celestial Chorus draws recruits from religious study groups, prayer meetings focused on esoteric topics, interfaith initiatives, or even charitable functions such as soup kitchens, clothing drives, or relief missions. The Cult of Ecstasy enjoys overlap with several subcultures and social settings frequented by hedge wizards who seek to blow open the doors of perception through ecstatic practice. Mages of the Dreamspeakers and Verbena maintain some of the tightest relations to their communities of origin among all the Traditions. Their practices are frequently reflected in the daily life of even the Sleepers in the communities from which they recruit. As such, it is no surprise that hedge wizards who fall in with these primal Traditions are as likely to receive treatment as equals as they are to be relegated to the role of an acolyte or custos.\n\nRejection and Rivalry\n\nNot all hedge wizards who encounter the Traditions are eager to join. From the perspective of a hedge wizard, the philosophies of the Traditions are no more or less attractive than those of the various Affiliations. In fact, the world-spanning goals and lofty ideals of the Traditions can be an intense repellant to hedge wizards who are more interested in private agendas and personal gain. This is not to say that hedge wizards are averse to thinking big — some have goals befitting the most hubris-ridden Hermetic Master. Just that hedge wizards with such lofty goals are more likely to shun Traditions and Affiliations altogether, or merely use them for access to information and magical secrets, only to break ties once they feel that the well of utility has dried up. Furthermore, no one likes to be treated as someone’s lesser, and it is all too common for Tradition mages, especially those wrapped up in their own hubris, to dismiss hedge wizards among their acolytes and consors as performing “lesser” arts. This alone drives off a significant selection of hedge wizards who might otherwise prove valuable allies to the Traditions.\n\nPsychics and the Council of Nine\n\nThough the Traditions do value the power of psychics, and some mages work psychic techniques into their own paradigms, actual psychics are comparatively rare within the Traditions. This may be because so few psychics embrace their own power. While some psychics do seek out a place in various occult communities, embracing common folk beliefs about their otherworldly gifts, many psychics are more concerned with stopping the voices in their heads or finding ways to avoid accidentally lighting the neighbor’s car on fire with their brain when its alarm goes off. This leads many psychics away from the circles the Traditions travel in. Those few who do make their way to the Traditions are prized as consors.",
   "sidebars": [],
   "favoredAttributes": [],
   "favoredPaths": [],
   "favoredNote": "",
   "favoredPathIds": [],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_disparate_alliance",
   "name": "The Disparate Alliance",
   "kind": "society",
   "page": 97,
   "description": "According to propaganda by the Traditions, any mystic not protected under their umbrella is doomed, and this includes sorcerers. In many Crafts, after all, there’s not always a clear distinction between the Awakened and their sorcerer counterparts.\n\nThe Tradition propaganda, like propaganda in general, isn’t strictly true, and the Disparate Alliance is proof positive of that. The Disparate Alliance, by all official accounts, doesn’t exist. And yet, it does. Behind the scenes and with the freedom of electronic communication, independent Crafts from around the world joined forces for protection from the Technocracy with representation they couldn’t get from the Traditions. In addition to the more well-known threat the Technocracy poses to all mystics, some groups in the Disparate Alliance claim they found proof the Technocracy is being puppeted by the Nephandi. Most sorcerers that know of the existence of Nephandi hate them either for the malevolent chaos these Fallen stand for or because of direct attacks on their people.\n\nThe Disparate Alliance is a loose confederation of vastly different cultures and ideals. They are largely informal and currently keep their cooperation a secret to avoid getting dragged into a battle they aren’t yet ready to fight. They primarily work on weakening the Technocracy (and to a lesser extent, the Traditions) through extended campaigns of sabotage and subterfuge, chipping away methodically. Given the make-up and goals of the Disparate Alliance, they’re a primary source of aid for many sorcerer covens and individuals, especially mystics.\n\nWhile it’s difficult to generalize anything about the Disparate Alliance, they always have a use for more allies against common threats and foes.\n\nCore Members\n\nThe Batini\n\nWith great emphasis on subtlety and unity, the Ahl-i-Batin have approached more than a handful of disciplined psychics and hedge magicians for admittance, though the sorcerers rarely know the sect at all before initiation. The Ahl-i-Batin appreciate the lack of Paradox generated by the sorcerers, though many assume the sorcerers are just particularity careful — a valued trait. Although no sorcerer has high status in Ahl-i-Batin, skilled sorcerers who respect hierarchy and dutifully fight against the Fallen are valued.\n\nBatini hedge magicians tend to learn Conjuration, Conveyance, Divination, and Fascination. Many psychic phenomena fit particularly well among the Subtle Ones, with Synergy and Astral Travel considered the most direct manifestations of the sect’s philosophy.\n\nThe Bata’a\n\nThe Bata’a explicitly don’t discriminate between hedge wizards and Awakened mages. This fact alone allows the sect to draw in enormous membership through faiths that worship the Lwa. Devotion and respect to the Lwa are the keys to success rather than whether one Awakens or not. A hedge magician may hold any of the few and largely informal titles the Bata’a have.\n\nChanneling, Divination, and Psychic Healing are favored psychic phenomena in the sect. Enchantment, Herbalism, Healing, and Summoning, Binding and Warding are favored hedge magic Paths.\n\nThe Ngoma\n\nThe Ngoma are a sect of urbane scholars secretly restructuring and regaining their lost influence and power. Their practices derive from traditional Central-African practices, though modern Ngoma seamlessly integrate technomagic into their works to keep up with the times.\n\nThe Ngoma want as many promising scholars as possible in their hidden schools and tutoring arrangements. They have a clear preference for Awakened mages but will allow a sufficiently talented and ambitious sorcerer to learn in their schools, later to act as support for the sect’s network of power. Hedge wizards and psychics don’t hold positions of influence within the sect itself, but rather add to the sect’s overall power.\n\nBoth mystical and technomagical sorcerers can find a place in the Ngoma; their collective paradigms accommodate either approach. Favored paths include Alchemy, Ephemera, Herbalism, Healing, and Quintessence Manipulation. Favored Psychic Phenomena include Cyberpathy, Fascination, and Telepathy.\n\nThe Hollow Ones\n\nThe Hollow Ones traditionally attract all sorts of alternative subcultures to their ranks. They take a great deal of inspiration from gothic art and philosophy. They aren’t chasing after enlightenment like so many other mage sects. Rather, they explore through rebellion and individualism. They sometimes come off as shallow to other sects, but their total lack of emphasis on Awakened enlightenment makes them suit cast-off hedge magicians and psychics who would often get patronized or glossed over in such discussions.\n\nThe Hollow Ones, or Darklings, organize into small, individualized cliques. They approach graceful rebels and cast-offs to see if they have chemistry with the group. They’re more bonded together by philosophy and aesthetics than any particular magical practice. However, being so individualized, there’s no universal Darkling opinion on hedge magicians. Some cliques will be more accepting than others.\n\nThe Children of Knowledge\n\nThe Solificati, as they prefer to be called, are alchemists seeking enlightenment. And what a psychedelic enlightenment it is. These days, they focus mainly on perfecting magical and mundane drug compounds and doling them out to the masses, to let even Sleepers reach enlightenment.\n\nWhile an Alchemist or Herbalist could be useful to their covens, mostly providing ancillary work, only a legendary hedge magician might be able to pass the normal limits of their path to complete initiation. The test involves transmuting common metals to gold or silver, which is beyond what a hedge magician can expect to accomplish.\n\nOther Associates\n\nThe Kopa Loei\n\nThe Kopa Loei are traditional Polynesian wizard-priests, kanakakahuna, who organize into blood-kin groups of up to about 20 members called kadugos. They organize with elders teaching children the foundations of magic and culture. They don’t recognize Sphere magic as separate from hedge magic, so there is no disparity besides recognizing some kanakakahuna as more powerful than others.\n\nAll initiates must be native islanders and recommended by their community to join. They use no techno-sorcery whatsoever.\n\nThe Taftâni\n\nThe Weavers are a Middle Eastern sect in only the loosest definition. They share beliefs and Arts but have little to no internal structure. Many are nomadic, and even those who aren’t prefer to work alone except when being trained or taking on an apprentice. They do work together otherwise if they must. The Weavers focus on the inherent beauty and rapturous experience in magick weaving fire.\n\nMasters train their apprentices vigorously, and while they have no explicit exclusions against hedge magicians, it would be unlikely for a young sorcerer to pass the tests expected of them. An incredibly powerful Pyrokinetic might be able to demonstrate sufficient aptitude but would be an extremely rare case.\n\nThe Knights Templar\n\nFor over two millennia, this male-led ancient Christian order has been fighting against Satan’s corruption. They were formerly part of the Technocratic Union, back when it was called the Order of Reason, but suffered a huge reputation hit from rumors conspirators spread after the Knights shone light on corruption within the Order. They hardly see eye to eye with most of the other Disparates but will accept help fighting the Nephandi. In modern days, they’re beginning to accept women in support roles.\n\nHedge magicians may serve in a lodge if they’re faithful and courageous enough but can’t progress beyond the lowest rank of Brother or Sister without Awakening.\n\nSisters of Hippolyta\n\nAmazons of the current day, the Sisters of Hippolyta are a women-only group of sacred warriors. They believe in the value of life, but particularly free life. They would readily choose death over slavery, but fight defensively for themselves and vulnerable women and children to ensure they’re not enslaved in the first place. The society is very cautious and secretive and do not allow men to know the location of their conclave. They require a month-long trial period of living in the conclave before teaching a potential initiate any of their ways, to be sure the initiate is trustworthy and has a suitable personality for the group.\n\nThey don’t discriminate between the Awakened and unawakened, believing all have a voice. Their practices heavily rely on High Ritual and teamwork, which make the hedge magicians of the sect more useful to the collective than they could be otherwise.\n\nWu Lung\n\nDescendants of the old gods of China, the Wu Lung are a sect of mages currently restructuring after imperialism and corruption decimated their former glory. They’re working on becoming more flexible to accommodate different problems the sect faces, and in the meantime try not to draw too much attention to themselves lest they show their hand.\n\nWu Lung are mostly male and primarily of Chinese heritage, but they do accept women and mixed-race Chinese people if they must. Wu Lung specifically search for potential initiates who are already on the verge of Awakening. They have no interest in those not expected to Awaken, though they might use them as non-member tools.",
   "sidebars": [
    {
     "title": "Future Fate: Hollow Ones",
     "text": "One of the critically important meta-plot decisions to make is whether the Hollow Ones betrayed the Traditions by leading the Technocracy into Horizon. The other is: If the Hollow Ones did betray the Traditions, were they ever found out?\n\nIf the Hollow Ones betrayed the Traditions and it’s known, the Darklings aren’t likely to openly admit membership in their sect, and any sorcerer Darklings could have a rude surprise waiting with vengeful Tradition mages after them, too. The sorcerers may or may not know what the grudge is about.\n\nIf rumors exist but haven’t taken hold, most Tradition mages won’t believe them, but it’s always possible the sorcerer could run into someone who does and is pissed about it. If it’s true, the Darklings will be using the Disparate Alliance to prepare for a possible war on two fronts.\n\nIf the betrayal isn’t true and isn’t rumored, business as usual. There’s still the Technocracy purging and inter-Disparate politicking to worry about."
    }
   ],
   "favoredAttributes": [],
   "favoredPaths": [],
   "favoredNote": "",
   "favoredPathIds": [],
   "favoredPhenomenaIds": []
  },
  {
   "id": "the_technocratic_union",
   "name": "The Technocratic Union",
   "kind": "society",
   "page": 99,
   "description": "The Technocracy maintains a special place for members of the Masses who can utilize rudimentary Enlightened Science, despite the lack of an inner Genius. These extraordinary citizens, also known as low-light operatives, form the backbone of the Technocracy’s organization on the Front Lines and receive praise and security for their contributions to the Union’s efforts. Though no mutual operative would ever accuse an extraordinary citizen of using hedge magic — or any kind of magic for that matter — the use of advanced scientific techniques is encouraged and freely taught among the Union’s lowest ranks. Furthermore, the Union aspires to be an enlightened meritocracy where each citizen and operative can rise to the level of their competence. Though politics can interfere, as in any organization, the extraordinary citizens of the Technocracy generally enjoy more social mobility than the acolytes and custos among their counterparts in the Traditions.\n\nTISFL: Life in the Union\n\nExtraordinary citizens find work in every theater of Technocratic operations. From laboratory assistants and data wranglers working in the safety of a Construct to front-line support in Black Suit teams to manufacturing positions among the Kamrads and Ciphers of Iteration X, the Union has numerous positions for low-light operatives. While most extraordinary citizens never advance beyond T1 in the union’s 6TP structure (see Technocracy Reloaded p. 30-37), those who exhibit exceptional acumen may be promoted to T2 rank, with all the benefits and responsibilities thereof. Not every Black Suit in the field is an Enlightened operative. Many are extraordinary citizens whose performance merits the opportunity to participate directly in Field Operations. Extraordinary citizens must work hard and adhere strictly to protocol to achieve and maintain assignments to field operations. Any extraordinary citizen whose loyalty rating falls below Degree 2 in the SDS (see Technocracy Reloaded p. 38) can expect to return to desk duty until they make amends for their mistakes.\n\nFor the most part, extraordinary citizens are unable to achieve the necessary status within the Union to access perks such as marriage, private living quarters, and having children. Those perks are usually available only to Enlightened operatives. A handful of extraordinary citizens throughout the Union have risen to the necessary Tier to request such perks, these are extreme exceptions, reserved for the best of the best of the best. Most extraordinary citizens who attain T2 rank can qualify for committed partnerships, provided they maintain an appropriate SDS rating.\n\nMembership Has Its Privileges\n\nOne of the most significant benefits an extraordinary citizen of the Union enjoys is access to the extensive resources of the Technocracy. Basic living costs are never a concern for extraordinary citizens, as the Union provides food and lodging for all such members. Healthcare is provided through Progenitor-run clinics, granting the extraordinary citizen access to state-of-the-art medicine and procedures. Tier 1 operatives may also access Enlightened medical upgrades such as cybernetics, clonal replacement organs, and genetic modifications. In terms of access to equipment, extraordinary citizens can requisition gear from the Technocracy just like any other agent. Because a significant percentage of the bureaucratic workload of the Union is handled by unenlightened sympathizers and citizens, those extraordinary citizens who have risen up through the ranks can often leverage their connections and camaraderie with other unenlightened personnel to slice through red tape and maximize the efficiency of their requisitions. Several field teams rely heavily on the bureaucratic acumen — and Backup and Requisitions Backgrounds — of the extraordinary citizens on the team.\n\nPsychics and the Technocracy\n\nThe Technocratic Union aggressively recruits psychics through a variety of means. Many parapsychology studies and facilities are fronts for Technocratic activity. Through Mind Adjustments operatives evaluate anyone reaching out to — or discovered by — such facilities for psychic potential. Those who display even the barest potential are earmarked for top priority recruitment. Beyond these well-funded, but relatively fringe programs, the Technocracy monitors medical facilities under Progenitor influence for signs of psychic activity. Many psychics seek medical treatment when their gifts first manifest, fearing their newfound abilities are the result of some neurological malfunction or psychotic break. Technocratic operatives are happy to explain the truth to such unfortunates as part of their recruitment pitch.\n\nIn addition to these comparatively mundane methods of recruiting psychics, the Technocracy operates a secret Cross-Convention Initiative called the Department of Metahuman Studies. Through DMS, the Union maintains a false front as a clandestine military group focused on the location and training of people with superhuman abilities. “Let us train you to protect a world that fears and hates you” is a surprisingly effective recruitment pitch, especially in an era where superhero fiction dominates popular culture.",
   "sidebars": [
    {
     "title": "Extraordinary Citizens and Technocratic Backgrounds",
     "text": "Extraordinary citizens can make full use of Gadgets and Trinkets and can often squeeze some utility out of Devices and Inventions. Many extraordinary citizens in the field carry an ES-Phone or drive a SMC vehicle even though many of the esoteric functions of these Devices are beyond their ability to activate or comprehend. An extraordinary citizen can purchase dots in the Requisitions and Secret Weapons Backgrounds just like any other member of the Technocratic Union. These Backgrounds can be pooled with other members of their amalgam, Enlightened or not. While an extraordinary Black Suit might not be able to use a Neuro-Optical Transmitter, they can certainly requisition one and assign it to an Enlightened colleague. Due to their familiarity with the Union’s bureaucracy, many extraordinary citizens have the Master of Red Tape Merit (M20(M20 Book of Secrets p. 58).\n\nExtraordinary citizens can also take full advantage of the Construct and Enhancement Backgrounds, improving the power and security of their base of operations and incorporating remarkable effects into their bodies through Enlightened Science. The vast resources of the Technocratic Union combined with the remarkable abilities of hedge magic paths or psychic phenomena can lead to great power in the hands of an extraordinary citizen. Of course, like all benefits granted by the Union, these perks are performance dependent. If the recipient displays unmutual behavior, squanders resources, makes frivolous requests, or simply fails to meet performance standards, their Supervisor is likely to reallocate resources away from the questionable asset and to the hands of productive agents who can meet performance standards."
    },
    {
     "title": "Scramblers — Anti-Psychics and the Technocracy",
     "text": "The Technocratic Union especially prizes the Anti-Psychic Phenomenon. Psychics with this ability are called Scramblers in Union parlance. When the Technocracy discovers one of these rare psychics, they spare no expense in their recruitment and training. Scramblers are showered with privileges and rewards as part of the pitch to join the Union because they are so damn useful.\n\nThe Anti-Psychic (p. 55) Phenomenon allows the psychic to not only suppress other psychic phenomena, but to interfere with the deviant abilities of Night-Folk and even impede Mind Adjustments and Procedures. This ability can often determine the outcome of tense altercations with Reality Deviants by shutting down an entire segment of a target’s potential abilities. Though Anti-Psychics also deprive operatives in their vicinity of the same resources, the Technocrats deployed with an Anti-Psychic have the advantage of knowing that Mind effects will suffer during the operation and can plan accordingly. Managers and Supervisors frequently engage in bureaucratic and political skirmishes in the hopes of getting a Scrambler on staff."
    }
   ],
   "favoredAttributes": [],
   "favoredPaths": [],
   "favoredNote": "",
   "favoredPathIds": [],
   "favoredPhenomenaIds": []
  }
 ],
 "MERITS_FLAWS": [
  {
   "id": "isolated_upbringing",
   "name": "Isolated Upbringing",
   "kind": "flaw",
   "cost": "2",
   "costOptions": [
    2
   ],
   "page": 106,
   "text": "You were raised within a reclusive environment and have had little contact with the “mundane” world. This could mean you were the child of Arcanum scholars, were born in a Uzome ile, or were extensively home-schooled away from society. This gives you a limited understanding of how the “normal” world works, and whenever you are outside of your childhood Affiliation, you have a –1 die penalty to all social skills."
  },
  {
   "id": "innocent",
   "name": "Innocent",
   "kind": "merit",
   "cost": "1",
   "costOptions": [
    1
   ],
   "page": 106,
   "text": "If you’ve done something wrong, you are the last to be blamed, unless evidence of your wrongdoing is brought forward. This does not mean you are “an innocent;” everyone simply assumes you are."
  },
  {
   "id": "psychic_awareness",
   "name": "Psychic Awareness",
   "kind": "merit",
   "cost": "3",
   "costOptions": [
    3
   ],
   "page": 106,
   "text": "Even if you have no psychic powers of your own, you can sense the presence of recent psychic energies within a nearby area (about a 10-foot radius) with a Perception + Occult (difficulty 8) roll. How much information you glean and how detailed it is depends on your successes. A single success might merely confirm that a psychic talent was at work recently, while five or more might allow you to pick up the lingering sensation of a talented psychic who had been here, her strength, mood, and plans at the moment she had passed by."
  },
  {
   "id": "the_flow_of_ki",
   "name": "The Flow of Ki",
   "kind": "merit",
   "cost": "3",
   "costOptions": [
    3
   ],
   "page": 106,
   "text": "You understand the natural flow of energy through the human body, taught through a form of martial arts. This energy is represented as Quintessence but may be called a variety of things: chi, ki, and others, depending on your martial arts style. You may spend Quintessence from your internal reserves to reduce the difficulty of any die pool for physical actions. You cannot lower the difficulty below two, nor may you reduce it by more than three. You must be able to store Quintessence in your own pattern to be eligible for this Merit."
  },
  {
   "id": "force_of_spirit",
   "name": "Force of Spirit",
   "kind": "merit",
   "cost": "2",
   "costOptions": [
    2
   ],
   "page": 107,
   "text": "The light of your soul is evident to those around you. You may physically glow, appear divinely beautiful, or perhaps your voice resonates with the music of the spheres. You may spend Quintessence points to reduce the difficulty of a social roll on a one-for-one basis. No difficulty may be lower than two, and none may be lowered by more than three. You must be able to store Quintessence in your own pattern to be eligible for this Merit."
  },
  {
   "id": "strength_of_psyche",
   "name": "Strength of Psyche",
   "kind": "merit",
   "cost": "2",
   "costOptions": [
    2
   ],
   "page": 107,
   "text": "You have developed a talent to draw on arcane energies to supercharge your mind. You can sharpen your senses, speed your thoughts, and connect the dots between disparate clues. You may spend Quintessence points to reduce the difficulty of any die pool for a mental action. The difficulty may not be reduced below two, nor be reduced by more than three. You must be able to store Quintessence in your own pattern to be eligible for this Merit."
  },
  {
   "id": "detached",
   "name": "Detached",
   "kind": "merit",
   "cost": "4",
   "costOptions": [
    4
   ],
   "page": 107,
   "text": "The power of your mind is beyond the anchor of your body — physical existence separated from psychic phenomena. You do not suffer wound penalties on uses of your psychic powers until you are Incapacitated. When you are Incapacitated, you may spend a Willpower point to attempt to manifest a psychic power at half the normal die pool (rounded down). You can only try this once per scene, after which you fall unconscious."
  },
  {
   "id": "black_and_white",
   "name": "Black and White",
   "kind": "flaw",
   "cost": "1",
   "costOptions": [
    1
   ],
   "page": 107,
   "text": "Everyone quibbles about shades of gray and nuances, but you don’t get bogged down in such wastes of time. The world is actually very simple, and everything falls into neat categories that you can judge in an instant. For you or against you, good or evil, easy or impossible, necessary or not, your judgmental nature causes misunderstandings and social friction as you oversimplify everything. In social scenarios where your closemindedness comes to bear, increase the difficulty by one. This Flaw combines well with other focusing Merits like Code of Honor."
  },
  {
   "id": "pacifist",
   "name": "Pacifist",
   "kind": "flaw",
   "cost": "5",
   "costOptions": [
    5
   ],
   "page": 107,
   "text": "You’ve chosen to cause no intentional harm to anyone, be it a religious restriction or a moral decision you made. You may defend yourself with magic, and this may be something that you have specialized in for that purpose. If you take this Flaw, you should be prepared to play with these restrictions sincerely."
  },
  {
   "id": "style_sleeper",
   "name": "Style Sleeper",
   "kind": "merit",
   "cost": "2",
   "costOptions": [
    2
   ],
   "page": 107,
   "text": "Your character knows that magic is real, they practice magic themselves, but these other pretenders are clearly fakes. Anytime you see magic that fits your Paradigm, things proceed as they should, but when you are a witness to magic outside of that style, you are treated as a Sleeper. This is not a Flaw because it more often disrupts the magic of your opponents and not your own. There may be some unintended consequences when another sorcerer of a different Paradigm tries to heal you, but your disbelief counters their magic."
  },
  {
   "id": "twin_link",
   "name": "Twin Link",
   "kind": "merit",
   "cost": "4 or 6",
   "costOptions": [
    4,
    6
   ],
   "page": 107,
   "text": "Your psychic character shares a permanent psychic connection to another person. This duplicates the benefit of the Level Two Synergy effect. The linked psychics gain +2 to their Empathy score to determine the other party’s feelings. As a 6pt Merit, the bonded characters can purchase the Synergy power, in addition to other psychic powers they may have at a lower cost — 7 freebie points per dot, 3 experience points per dot to increase. This Synergy power only works on their bonded partner."
  },
  {
   "id": "wild_talent",
   "name": "Wild Talent",
   "kind": "merit",
   "cost": "4 pt Merit to 4 pt Flaw",
   "costOptions": [
    -4,
    -3,
    -2,
    -1,
    1,
    2,
    3,
    4
   ],
   "page": 107,
   "text": "While many psychics never receive proper training to develop their gifts, you lack even basic control of your powers. However, without burdensome control over your talents comes greater power. Use the following table to determine the costs and effect of this Merit (or Flaw) which cannot exceed 4 points:\n\n+1 For every extra die you have when using the power.\n–1 You must make a Willpower roll (Difficulty 7) to use the power.\n–2 You can only consciously use the power defensively. (Your precognitive powers warn you of an attack using Danger Sense, or your telekinesis can stop an oncoming car.)\n–3 You have no conscious control of the power, but it works more often to your benefit than not. (Your clairvoyancy manifests in useful prophetic dreams.)\n–4 Your powers activate randomly (a minimum of once per session) and often when you least expect or desire it. (Telekinetically flinging books around a library while attempting to do research.)",
   "note": "Variable: positive costOptions are Merit point costs (extra dice), negative costOptions are Flaw values; the net total cannot exceed 4 points either way."
  },
  {
   "id": "path_natural",
   "name": "Path Natural",
   "kind": "merit",
   "cost": "5",
   "costOptions": [
    5
   ],
   "page": 108,
   "text": "You are naturally gifted to one Path of power. This could be tied to your mundane skills that translate easily to magic, a heritage that calls to certain power, or you have made a deal with otherworldly beings to open yourself to greater power. During character creation, chose one Path; in this Path, you only pay three-quarters experience, rounded down, to advance to higher levels or to learn rituals for that Path."
  },
  {
   "id": "psychic_feedback",
   "name": "Psychic Feedback",
   "kind": "flaw",
   "cost": "1, 2, or 6",
   "costOptions": [
    1,
    2,
    6
   ],
   "page": 108,
   "text": "Your psychic powers are a great gift, but they take their toll on you. As a 1-point Flaw, you experience headaches or disorientation. Roll Stamina + Mediation (difficulty 7). On a failure, the difficulty of all actions increases by two for one round while the pain overtakes you. As a 2-point Flaw, you experience light but long-term pain from use of your power. Roll Intelligence (difficulty 6) each time you use a power to “soak” the power’s activation successes, which are treated as bashing damage. As a 6-point Flaw, the psychic takes this as lethal damage, with the same option to “soak.”"
  },
  {
   "id": "psi_focus",
   "name": "Psi Focus",
   "kind": "flaw",
   "cost": "3-5",
   "costOptions": [
    3,
    4,
    5
   ],
   "page": 108,
   "text": "Your psychic power requires something beyond your own mental powers to manifest, whether you need your lucky feather, to ask pretty please, or just pantomime the action you need to happen. For a 3-point Flaw, you have to gesture or speak an incantation for the power to work. For a 4-point Flaw, you require a physical focus to work such as crystals, tarot cards, or candles. For a 5-point Flaw, the power only works with a specific focus, akin to a mage’s unique instrument (Mage 20 p. 588). The 5-point version of this Flaw is also available to hedge wizards."
  },
  {
   "id": "path_inept",
   "name": "Path Inept",
   "kind": "flaw",
   "cost": "5",
   "costOptions": [
    5
   ],
   "page": 108,
   "text": "You have a Path that you just do not understand. This could be due to a curse, lack of training, or a mental block. You must choose a Path from those that are available to your Affiliation. When improving the chosen Path, you must spend one quarter more experience points to increase Path levels or rituals. This must be a Path your character desires and plans to study."
  },
  {
   "id": "ritual_sleeper",
   "name": "Ritual Sleeper",
   "kind": "flaw",
   "cost": "5",
   "costOptions": [
    5
   ],
   "page": 108,
   "text": "Magic doesn’t happen at the snap of a finger. You are unable to manifest any instant magical effects, and you are limited to performing rituals. If the rules of your Affiliation already require magic through only ritual, you may not take this Flaw. You’re considered a Sleeper if you witness an instant magical effect."
  }
 ],
 "ARTIFACTS": [
  {
   "id": "eternal_light",
   "name": "Eternal Light",
   "rating": 1,
   "page": 108,
   "text": "Once a staple for sorcerers drafted into military service, this simple magic item fell out of vogue in recent years. This is a sturdy-looking metal lighter that requires no lighter fluid or other accelerant to produce a flame. Anyone may use it, whether they have magical skill or not. The user breathes on the case and then flips the lid open to start the flame. The flame is resistant to inclement weather, but only to coincidental levels. It would, for example, go out and have to be reactivated if the entire flame was drenched."
  },
  {
   "id": "reindeer_antler_rune_stones",
   "name": "Reindeer Antler Rune Stones",
   "rating": 1,
   "page": 108,
   "text": "Hand-carved rune stones are common in forn seiðr and other Divination practices. Some believe carving one’s own runes increases the sorcerer’s magical affinity to the set. For these rune stones, the affinity has tangible effect. The sorcerer who created the rune stones receives one bonus success on Divination rolls when they succeed. However, the affinity goes both ways. If the sorcerer fails their Divination roll, treat it as a botch.\n\nThese rune stones are usually made in Winter after reindeer shed their antler for the season, though a sorcerer who hunts might make the rune stones from the antlers of a kill. Similar rune stones can be made with mica stone."
  },
  {
   "id": "reflection_of_the_inner_self",
   "name": "Reflection of the Inner Self",
   "rating": 2,
   "page": 108,
   "text": "A necessity for newly initiated Silver Portal sorcerers, this mirror carries a special blessing crafted by a more experienced member to facilitate a sorcerer’s first journeys into the Dream Realms. The full-length mirror is carved or painted with eldritch symbols around the perimeter of the glass plane. The creator rolls Perception + Lucid Dreaming at difficulty 8 to pluck the required symbols from the Dream Realm. Each success lowers the difficulty of the recipient’s Meditation or Lucid Dreaming rolls while using the mirror by 1. After three attempts, the markings fade, and the mirror loses all magical properties. The mirror doesn’t confer the effect to anyone but the recipient declared when the sorcerer creates the relic."
  },
  {
   "id": "the_secret_keepers_journal",
   "name": "The Secret-Keeper’s Journal",
   "rating": 2,
   "page": 108,
   "text": "This journal, unassuming on first glance, is a crucial fail-safe for sorcerer spies, paranoid magical experimenters, and even a few embarrassed novice writers. On the final page, a skeleton flower is left pressed and affixed to the journal’s back cover. When the user wants the markings inside the journal to discreetly and immediately disappear, they spritz water on the skeleton flower’s petals. As the petals turn clear, there will be no visible or tactile trace of the writing or drawings inside. When the flower dries completely two days later, the petals return to their opaque white color, and all the writing inside returns. If the sorcerer needs to make the writing disappear permanently, they remove one of the flower’s petals while it’s still wet."
  },
  {
   "id": "witchs_bottle",
   "name": "Witch’s Bottle",
   "rating": 2,
   "page": 109,
   "text": "A witch’s bottle is a traditional counter-magic object from England and the early colonial United States. Not typically used by the sorcerer themself, this is another magic item, like a love poppet, most often made on commission. A Sorcerer might also make witch’s bottles for their loved ones, to subtly protect them from rival sorcerers.\n\nThe sorcerer fills a bottle or jar with sharp objects, often sewing needles or rusted nails, and then pours a substance containing the enemy sorcerer’s essence over those items. This is typically a bodily fluid such as blood, but can be hair, nail clippings, or a finely shredded photograph of the enemy sorcerer. Some sorcerers add other items like herbs or certain flowers according to their practice. The sorcerer seals the bottle and incants a spell or prayer over it.\n\nOnce the sorcerer seals the bottle, they hide it on the property of the person who needs protection, typically inside a wall in the house or on the edge of the yard. The sorcerer may also instruct the recipient to hide the magic object themself. So long as the witch’s bottle remains undiscovered by the enemy sorcerer, all magic they direct at the recipient while they are on their property subtracts one success (or one success per roll in the case of extended spells or rituals)."
  },
  {
   "id": "osiris_resting_place",
   "name": "Osiris’ Resting Place",
   "rating": 3,
   "page": 109,
   "text": "The Children of Osiris temple in Luxor boasts an ancient limestone sarcophagus intricately carved with hieroglyphics that tell the story of Osiris’ quest to overcome undeath itself. It’s decorated with gemstones, inlaid with gold, and kept in near-perfect condition through meticulous care by the Children. They claim Osiris himself rested within the sarcophagus while he still walked the Earth in his vampiric state. Whatever the case for this relic’s origins, it possesses powerful healing magics and saved many a Child of Osiris from the brink of death.\n\nPlacing the injured or sick within the sarcophagus increases their natural rate of healing to twice normal speed and decreases the Difficulty of all healing magics performed on them by 2."
  },
  {
   "id": "silent_feet",
   "name": "Silent Feet",
   "rating": 3,
   "page": 110,
   "text": "In a world where passing without notice is often the simplest way to ensure survival, these charms are fantastically useful. Created as anklets, toe rings, or shoes (with sneakers a common modern choice), the Silent Feet relic silences the footfalls of the wearer after it has been activated. This silence lasts until the wearer speaks even a word, then remains inactive until the following night. The silent footfalls are represented mechanically by giving the wearer a five die Stealth rating or adding five dice to their existing Stealth Skill. The relic only silences the wearer’s steps, so the user must be wary of the sound of their clothing, actions, and their voice, the last of which ends the charm’s powers."
  },
  {
   "id": "sympathetic_bindings",
   "name": "Sympathetic Bindings",
   "rating": 3,
   "page": 110,
   "text": "An ancient recipe that continues to be useful today, especially for the sorcerer on the go, these linen bandages are soaked with sulfuric acid powder and the blood of the intended patient. When this is complete, the target begins to heal from across the room without needing to be bound to the injured person. The wound appears to close on its own, healing faster than one might expect. The Sympathetic Bindings heal lethal damage at a rate of one health level per day and stave off infection. Each wound requires a different set of Bindings, and they must be used no more than one day after they have been prepared. After use, the bandages become mundane blood-soaked cloth."
  },
  {
   "id": "witchs_steed",
   "name": "Witch’s Steed",
   "rating": 3,
   "page": 110,
   "text": "The classic tool of European witches, this appears to be a normal broom with no magical effects. After the sun sets, the broom handle darkens and lengthens, and the bristles become thorny and sharp. A sorcerer atop a broom flies at 50 mph and has an Arcane rating of 5 for the duration of their ride."
  },
  {
   "id": "love_poppet",
   "name": "Love Poppet",
   "rating": 4,
   "page": 110,
   "text": "Formed into a vague humanoid figure, these relics are combined with personal materials from a subject — hair, fingernail clippings, or bodily fluids — to connect the doll’s magic to the subject. The doll then compels the subject to fall ‘in love’ with the user of the poppet. Most magicians capable of making these Love Poppets rarely use them for themselves, as once that fire has been lit in a subject, it is hard to stop. Supernatural beings like vampires are inhuman enough for this relic to be ineffective against them, but when used against a human, they are hooked for life. They will continue to love and obsess over the object of their affection, endlessly. This can lead to fits of jealousy and envy, and if the subject of the Love Poppet is pushed away, potentially destructive thoughts like “if I cannot have them, no one can.” Sorcerers and mages who recognize the Love Poppet’s affects may attempt to break the hold with an appropriate counterspell or countermagick. Breaking the Poppet’s spell requires three successes on a single Difficulty 7 roll. A mage or hedge wizard may attempt one such roll per month."
  },
  {
   "id": "vision_skull",
   "name": "Vision Skull",
   "rating": 4,
   "page": 110,
   "text": "This macabre Artifact is a skull blackened with ink or fire and decorated with white chalk symbols of vision and sight. The skull allows the sorcerer to scry far off people and places or to shift their perceptions forward and backward through time. Blood and herbs are placed into the skull, after which the sorcerer meditates with it, falling into a trance while consuming the blood. Letting go of their body, they begin to dance, while within their mind visions play out. After a few minutes, the sights fade, and their body falls into a heavy sleep. Mechanically, the skull grants the user a vision, similar to those achieved through the Divination Path. This vision is symbolic and not literal, giving hints and clues to what the user is trying to see. Each use of the skull is a separate ritual, and the sorcerer must rest at least 24 hours between uses."
  },
  {
   "id": "deshayes_fatal_cup",
   "name": "Deshayes’ Fatal Cup",
   "rating": 5,
   "page": 110,
   "text": "Named in honor of Catherine Deshayes, fortune teller and master poisoner, these cups come in a variety of shapes and styles. While they appear to be normal at a glance, there is a faint inscription across the bottom of each cup. By rubbing fresh blood across these inscriptions, the liquid contained in the vessel is turned into a magical, deadly poison. Whoever finishes the cup will die, usually within the next five minutes. A sorcerer may counterspell the poison (Difficulty 7), a mage may stop the inevitable with Life, Prime, or Matter effects, while a shapeshifter may use Stamina + Primal-Urge (Difficulty 7) or a healing Gift. Vampires suffer incapacitating pain for the remainder of the scene unless they succeed on a Stamina roll (Difficulty 7), in which case they can act normally, if uncomfortably. A mortal is simply doomed.\n\nThere are lesser versions of the Fatal Cup, known as Dionys’ Chalice, which turns the liquid into a magically inebriating or hallucinogenic drink. This drink causes intoxication or delirium for six hours, unless the drinker attains three or more successes on a Stamina roll (Difficulty 8), in which case they just have a good time."
  }
 ],
 "ALIGNMENTS": [
  {
   "id": "",
   "name": "None"
  },
  {
   "id": "traditions",
   "name": "Council of Nine Mystick Traditions"
  },
  {
   "id": "disparates",
   "name": "Disparate Alliance"
  },
  {
   "id": "technocracy",
   "name": "Technocratic Union"
  }
 ]
};

// ── helpers ─────────────────────────────────────────────────────────────────
SORCERER.pathById       = id => SORCERER.PATHS.find(p => p.id === id) || null;
SORCERER.phenomenonById = id => SORCERER.PHENOMENA.find(p => p.id === id) || null;
SORCERER.numenById      = id => SORCERER.pathById(id) || SORCERER.phenomenonById(id);
SORCERER.affiliationById= id => SORCERER.AFFILIATIONS.find(a => a.id === id) || null;
SORCERER.meritById      = id => SORCERER.MERITS_FLAWS.find(m => m.id === id) || null;
SORCERER.artifactById   = id => SORCERER.ARTIFACTS.find(a => a.id === id) || null;
SORCERER.ritualById     = (pathId, ritualId) => { const p = SORCERER.pathById(pathId); return p ? (p.rituals.find(r => r.id === ritualId) || null) : null; };
SORCERER.isPath         = id => !!SORCERER.pathById(id);
SORCERER.isPhenomenon   = id => !!SORCERER.phenomenonById(id);
/** Highest Phenomenon rating allowed by Willpower (p. 54): floor(willpower / 2). */
SORCERER.psychicCap     = willpower => Math.floor((parseInt(willpower, 10) || 0) / SORCERER.CREATION.psychicCapDivisor);
/** Backgrounds available to a sorcerer given an Ascension War alignment ('', traditions, disparates, technocracy). */
SORCERER.backgroundsFor = alignment => [...SORCERER.BACKGROUNDS.base, ...(SORCERER.BACKGROUNDS[alignment] || [])];
/** Numina styles a character may use: the primary style plus a secondary learned with XP. */
SORCERER.stylesFor      = c => [c.numina_style, c.numina_secondary].filter(Boolean);
/** Rituals a character knows for a Path, sorted by level. */
SORCERER.ritualsFor     = (c, pathId) => (Array.isArray(c.rituals) ? c.rituals : []).filter(r => r.path === pathId).sort((a, b) => a.level - b.level);
/**
 * Ritual rule check for one Path (p. 104): one ritual per Path dot at creation, each of level <= rating,
 * and a ritual of level N needs one at every lower level. Returns { ok, errors[] }.
 */
SORCERER.checkRituals   = (c, pathId, rating, { creation = false } = {}) => {
  const rs = SORCERER.ritualsFor(c, pathId); const errors = [];
  const name = (SORCERER.pathById(pathId) || {}).name || pathId;
  rs.forEach(r => { if (r.level > rating) errors.push(`${name}: ritual “${r.name}” (level ${r.level}) is above the Path rating ${rating}.`); });
  const levels = new Set(rs.map(r => r.level));
  const maxLvl = Math.max(0, ...rs.map(r => r.level));
  for (let l = 1; l < maxLvl; l++) if (!levels.has(l)) { errors.push(`${name}: a level ${maxLvl} ritual needs a ritual at every lower level (missing level ${l}).`); break; }
  if (creation && rs.length > rating) errors.push(`${name}: ${rs.length} rituals but only ${rating} free (one per Path dot); extras cost 3 freebies each.`);
  return { ok: errors.length === 0, errors, extra: Math.max(0, rs.length - rating) };
};
if (typeof module !== 'undefined' && module.exports) module.exports = SORCERER;

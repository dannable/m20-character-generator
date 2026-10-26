/* ═══════════════════════════════════════════════════════════════════════════
   PRISM OF FOCUS — character creation data
   Source: Charles Siegel, "Prism of Focus: A Guide to Focus for Mage 20th
   Anniversary Edition" (Storytellers Vault, 2018). Page numbers refer to that
   book. Loaded after data.js; exposes a global PRISM alongside M20.

   Prism replaces M20 Step Four (Focus) with Tenets + rated Practices:
     • 3 required Tenets (Metaphysical, Personal, Ascension), optional Tenets
       in four more categories, at most one per category. Tenets are free.
     • Arete may not exceed the number of Tenets until Arete 6.
     • Practices rated 0–5. One free dot per dot of Arete at creation; extra
       dots cost 1 freebie. XP: 3 for a new Practice, current rating to raise.
     • Each Practice dot needs 2 dots across that Practice's Associated Abilities.
     • Tenets mark Practices Associated (−1 diff) or Limited (+1 diff). A
       faction's Specialized Practice is always Associated for its members.
     • Rotes: 6 points at creation (cost = sphere dots), 4/freebie, 3 XP each.
     • Secondary Abilities Hypertech and Do are removed in Prism mode.
   ═══════════════════════════════════════════════════════════════════════════ */
const PRISM = {
  SOURCE: { title: 'Prism of Focus', author: 'Charles Siegel', year: 2018, publisher: 'Storytellers Vault' },

  COSTS: {
  "practice": {
    "freebie": 1,
    "xpNew": 3,
    "xpRaise": "current"
  },
  "tenet": {
    "freebie": 0,
    "xp": 0,
    "xpReplace": "tenetCount"
  },
  "rotes": {
    "creationPoints": 6,
    "perFreebie": 4,
    "xpPerPoint": 3
  },
  "freePracticeDotsPerArete": 1,
  "abilityDotsPerPracticeDot": 2,
  "minTenets": 3,
  "areteCapByTenetsUntil": 6
},

  // Secondary Ability ids (from M20.SECONDARY_SKILLS / SECONDARY_TALENTS) that
  // Prism replaces with the Hypertech and Martial Arts (Do) Practices.
  REMOVED_SECONDARY_ABILITIES: ['hypertech', 'do'],

  TENET_CATEGORIES: [
  {
    "id": "metaphysical",
    "name": "Metaphysical",
    "question": "How does the Universe work?",
    "required": true
  },
  {
    "id": "personal",
    "name": "Personal",
    "question": "Why can this mage use magick when others cannot?",
    "required": true
  },
  {
    "id": "ascension",
    "name": "Ascension",
    "question": "What is the point of it all?",
    "required": true
  },
  {
    "id": "social_role",
    "name": "Social Role",
    "question": "What is a mage’s role in society?",
    "required": false
  },
  {
    "id": "epistemology",
    "name": "Epistemology",
    "question": "How is new magickal knowledge gained?",
    "required": false
  },
  {
    "id": "openness",
    "name": "Openness",
    "question": "How valid are other mages’ Foci?",
    "required": false
  },
  {
    "id": "afterlife",
    "name": "After Life",
    "question": "What happens after death?",
    "required": false
  }
],

  // associated / limited hold PRISM.PRACTICES ids
  TENETS: [
  {
    "id": "rational_universe",
    "name": "A Rational Universe",
    "category": "metaphysical",
    "desc": "At its core, the Universe runs on logic. This may not result in modern science, and the underlying rules may be beyond the capacity of humans to comprehend, but they exist. A Rational Universe can be studied and experimented on; understanding can increase over time. This doesn’t rule out surprises or unexplained phenomena like “miracles.” It does demand they be explainable and reproducible, in theory, if not in practice.",
    "associated": [
      "alchemy",
      "craftwork",
      "cybernetics",
      "hypertech",
      "reality_hacking"
    ],
    "limited": [
      "chaos_magick",
      "crazy_wisdom",
      "gutter_magick",
      "voudoun",
      "witchcraft"
    ],
    "page": 16
  },
  {
    "id": "as_above_so_below",
    "name": "As Above, So Below",
    "category": "metaphysical",
    "desc": "The cosmos is fundamentally interlinked across scales. Whether phrased as As Above, So Below or as the Macrocosm is the Microcosm or anything similar, they all mean the same thing: a person is the same as the universe, and changing one will change the other. Therefore, anyone with sufficient self-mastery can change the world around them, though they must risk that when the world changes, so will they.",
    "associated": [
      "alchemy",
      "dominion",
      "faith",
      "high_ritual",
      "witchcraft"
    ],
    "limited": [
      "art_of_desire",
      "chaos_magick",
      "hypertech",
      "reality_hacking",
      "weird_science"
    ],
    "page": 16
  },
  {
    "id": "fall_from_grace",
    "name": "Fall From Grace",
    "category": "metaphysical",
    "desc": "Things were once better than they are now. Maybe things have always been broken, and they’re just getting worse. Perhaps someone or something triggered the Fall. However it happened, the memory of, knowledge from, or synergy with the lost, better world can be used to restore it, even just for a moment.",
    "associated": [
      "animalism",
      "faith",
      "god_bonding",
      "high_ritual"
    ],
    "limited": [
      "hypertech",
      "invigoration",
      "medicine_work",
      "reality_hacking",
      "yoga"
    ],
    "page": 16
  },
  {
    "id": "reality_is_a_lie",
    "name": "Reality is a Lie",
    "category": "metaphysical",
    "desc": "Everyone is so confident that what they think is real is real. They believe that their senses tell them the truth and that their interpretation of the world is mostly correct. Things are, at least mostly, what they seem. The trouble is that they’re wrong. The actual Reality is nothing like what our senses show us. It may be all in our head or just how we perceive something fundamentally alien to our experience, but the bottom line is that the Reality we think we’re living in doesn’t exist.",
    "associated": [
      "bardism",
      "chaos_magick",
      "crazy_wisdom",
      "martial_arts",
      "yoga"
    ],
    "limited": [
      "craftwork",
      "cybernetics",
      "elementalism",
      "high_ritual",
      "weird_science"
    ],
    "page": 16
  },
  {
    "id": "divine_is_real",
    "name": "The Divine is Real",
    "category": "metaphysical",
    "desc": "One of the most thoroughly contested questions in human history is the nature of the divine. In those debates, even the question of the existence of the Divine is up for grabs. Though raised, this question is trivial. Although the Divine may have long left the world, setting things in motion to watch or even continue its direct involvement, its presence is clear and, knowing this deep down, allows it to be channeled.",
    "associated": [
      "faith",
      "god_bonding",
      "invigoration",
      "witchcraft",
      "yoga"
    ],
    "limited": [
      "bardism",
      "reality_hacking",
      "weird_science"
    ],
    "page": 16
  },
  {
    "id": "unfathomable_forces",
    "name": "Unfathomable Forces at Work",
    "category": "metaphysical",
    "desc": "Humans are tiny. Unfathomably small and insignificant to the true powers in this world. These powers are so enormous that the human brain can comprehend them as well as an amoeba can comprehend a human. By and large, humans are irrelevant, though a few can make themselves known to things that matter. Rarely does this go well for humans, but sometimes they can understand just enough to obtain power.",
    "associated": [
      "elementalism",
      "invigoration",
      "maleficia",
      "psionics",
      "voudoun"
    ],
    "limited": [
      "art_of_desire",
      "cybernetics",
      "dominion",
      "reality_hacking",
      "weird_science"
    ],
    "page": 16
  },
  {
    "id": "i_am_chosen",
    "name": "I Am Chosen",
    "category": "personal",
    "desc": "Magick is neither inborn nor learned independently. Something, whether God, a demon, or some incomprehensible force with power far beyond humanity, chooses people to empower. Sometimes the reasons will be apparent, other times very much not, but these empowered people owe their power to whoever, or whatever, chose them, and even if they try, they can never forget it.",
    "associated": [
      "cybernetics",
      "god_bonding",
      "martial_arts",
      "mediumship",
      "shamanism",
      "witchcraft"
    ],
    "limited": [
      "alchemy",
      "art_of_desire",
      "elementalism",
      "high_ritual",
      "hypertech",
      "invigoration"
    ],
    "page": 16
  },
  {
    "id": "i_am_not_limited",
    "name": "I Am Not Limited",
    "category": "personal",
    "desc": "There is something that holds people back. They don’t achieve their true potential for internal or external reasons. The mage laughs at these limitations. Physics, morality, a malevolent demiurge, these are challenges to overcome, but a mage can and must. They allow nothing to hold them back as they push forward and refuse to be limited.",
    "associated": [
      "crazy_wisdom",
      "high_ritual",
      "invigoration",
      "psionics",
      "weird_science"
    ],
    "limited": [
      "craftwork",
      "martial_arts",
      "witchcraft"
    ],
    "page": 17
  },
  {
    "id": "i_am_special",
    "name": "I Am Special",
    "category": "personal",
    "desc": "There is something about the mage that sets them apart. It is an intrinsic thing, maybe genetics, force of will, or being bitten by a radioactive spider. Whatever it is, it makes the mage special, permanently different from Sleepers. What makes the mage special almost invariably becomes an intrinsic part of their identity if it wasn’t before their Awakening.",
    "associated": [
      "bardism",
      "dominion",
      "elementalism",
      "psionics",
      "shamanism"
    ],
    "limited": [
      "chaos_magick",
      "gutter_magick",
      "mediumship"
    ],
    "page": 17
  },
  {
    "id": "greater_understanding",
    "name": "I Have Greater Understanding",
    "category": "personal",
    "desc": "One of the most generous Tenets towards Sleepers, mages who believe their power comes from their greater knowledge and understanding often try to spread this understanding. The understanding could take the form of a religious epiphany, years and years of scientific or esoteric study, or even for some younger mages, “one weird trick” that lets them break the usual laws of physics.",
    "associated": [
      "alchemy",
      "crazy_wisdom",
      "hypertech",
      "medicine_work",
      "reality_hacking"
    ],
    "limited": [
      "bardism",
      "god_bonding",
      "gutter_magick",
      "psionics"
    ],
    "page": 17
  },
  {
    "id": "full_knowledge",
    "name": "Achieve Full Knowledge",
    "category": "ascension",
    "desc": "When David Hilbert said, “We must know. We will know.” These mages nodded along. To them, the whole point of magick is to acquire greater knowledge and to understand things that others don’t. Those who believe in an immaterial Ascension believe it will happen when all that can be known is known. Generally, though, knowledge is its own reward, and knowing things is the goal, albeit one that is useful for other things as well.",
    "associated": [
      "alchemy",
      "hypertech",
      "medicine_work",
      "reality_hacking",
      "weird_science"
    ],
    "limited": [
      "animalism",
      "bardism",
      "faith",
      "god_bonding",
      "mediumship",
      "yoga"
    ],
    "page": 17
  },
  {
    "id": "annihilation_is_freedom",
    "name": "Annihilation is Freedom",
    "category": "ascension",
    "desc": "No one confined to the world as we perceive it is truly free. The laws of nature are, at best, an illusion and, at worst, chains holding us back. It would be better to have none of these constraints. True freedom requires it, which requires annihilating the self or, for darker mages, everything else.",
    "associated": [
      "chaos_magick",
      "gutter_magick",
      "maleficia",
      "martial_arts"
    ],
    "limited": [
      "animalism",
      "art_of_desire",
      "craftwork",
      "elementalism",
      "medicine_work"
    ],
    "page": 18
  },
  {
    "id": "build_a_utopia",
    "name": "Build a Utopia",
    "category": "ascension",
    "desc": "A better world is possible, but the Sleepers don’t have what it takes. That’s what mages are for: to imagine a better world and bring it into being. Of course, mages often have strange and idiosyncratic views of what makes a world “better.” For almost all of them, the mass of humanity disagrees, or their utopias would already be achieved.",
    "associated": [
      "art_of_desire",
      "craftwork",
      "cybernetics",
      "dominion",
      "faith",
      "weird_science"
    ],
    "limited": [
      "animalism",
      "maleficia",
      "voudoun"
    ],
    "page": 18
  },
  {
    "id": "existence_is_meaningless",
    "name": "Existence is Meaningless",
    "category": "ascension",
    "desc": "It’s all pointless. There is no grand purpose to the Universe. Either we make our own meaning or recognize the absurdity of existence and know that nothing has any meaning at all. Some mages see this and are liberated: if everything is meaningless, there’s no plan or purpose; we can live and be free in ways others don’t even realize are possible. Others fall into a darker nihilism: if nothing matters, if nothing is holding us back, then we can do whatever we want, regardless of the consequences.",
    "associated": [
      "animalism",
      "bardism",
      "gutter_magick"
    ],
    "limited": [
      "alchemy",
      "faith",
      "god_bonding",
      "medicine_work"
    ],
    "page": 18
  },
  {
    "id": "merge_with_the_divine",
    "name": "Merge With The Divine",
    "category": "ascension",
    "desc": "Humans weren’t meant to be separate. We’re all part of a greater whole, a thing that many consider to be Divine. Magick lets us return to it or join with it for the first time. Whether restricted only to the worthy or, ideally, for everyone, this Tenet’s believers want to merge with this greater thing, and most believe that it’s what everyone should want and, in an ideal world, achieve.",
    "associated": [
      "elementalism",
      "faith",
      "god_bonding",
      "mediumship",
      "voudoun",
      "yoga"
    ],
    "limited": [
      "chaos_magick",
      "cybernetics",
      "hypertech",
      "weird_science"
    ],
    "page": 18
  },
  {
    "id": "power_is_its_own_reward",
    "name": "Power is its Own Reward",
    "category": "ascension",
    "desc": "Others may have high-minded quests for knowledge or plans to improve the world, but some mages want power. Power is the only thing that really matters. Magick is power, and more magick is more power. It’s a relatively simple equation and common among both oppressors who have power and abuse it and the oppressed victims of their abuse who see power as a way to prevent anyone from treating them that way again.",
    "associated": [
      "art_of_desire",
      "dominion",
      "high_ritual",
      "maleficia"
    ],
    "limited": [
      "crazy_wisdom",
      "faith",
      "shamanism",
      "voudoun",
      "yoga"
    ],
    "page": 18
  },
  {
    "id": "i_illuminate",
    "name": "I Illuminate",
    "category": "social_role",
    "desc": "Neither a ruler nor a servant, the mage’s role in society is to uncover truths and shed light on what is hidden. This rarely makes the mage popular, especially with those in power, but it’s an especially popular Tenet in the modern world among scientifically inclined mages. These mages don’t simply seek out knowledge. They publicize it and try to ensure it makes its way into the hands of the Sleepers so that they may build better lives using it.",
    "associated": [
      "alchemy",
      "charity",
      "faith",
      "high_ritual",
      "hypertech"
    ],
    "limited": [
      "animalism",
      "appropriation",
      "maleficia",
      "media_control",
      "psionics"
    ],
    "page": 18
  },
  {
    "id": "i_rule",
    "name": "I Rule",
    "category": "social_role",
    "desc": "Magick naturally puts mages at the top of the pecking order. If everything goes correctly, weak mages defer to powerful mages, Sleepers defer to all mages, and everyone knows their place. It is then up to the powerful to rule as they see fit. They may prefer to be benevolent, improving the lives of their lessers. They may instead enrich themselves with money, power, and knowledge. The key is that they choose as the world’s rightful rulers. niques to study the natural world. Mages who believe in science can push their inquiries beyond it and into the supernatural.",
    "associated": [
      "alchemy",
      "art_of_desire",
      "dominion",
      "high_ritual",
      "media_control"
    ],
    "limited": [
      "charity",
      "faith",
      "mediumship",
      "shamanism",
      "witchcraft"
    ],
    "page": 18
  },
  {
    "id": "i_serve",
    "name": "I Serve",
    "category": "social_role",
    "desc": "The role of the mage is to serve the masses. It is best not to use magick for selfish ends. Instead, it exists to be used for others. Mages with this belief may run the gamut from self-sacrificing volunteers to powerful noblesse oblige sorts who manage to look down on those they claim, and often believe, they serve. Still, others don’t serve the masses but see higher beings they are beholden to, including powerful Umbrood and even the Dark Masters of the Nephandi.",
    "associated": [
      "charity",
      "faith",
      "mediumship",
      "shamanism",
      "witchcraft"
    ],
    "limited": [
      "alchemy",
      "art_of_desire",
      "dominion",
      "high_ritual",
      "media_control"
    ],
    "page": 19
  },
  {
    "id": "mystical_insights",
    "name": "Mystical Insights",
    "category": "epistemology",
    "desc": "Gaining new magickal knowledge is a tricky thing. It lies somewhere between the rational and the irrational, the physical and the spiritual. Mystics sometimes gain knowledge through painstaking research and sometimes through bizarre leaps of insight. While knowledge and study are essential, intuition is also crucial, with logical leaps even in the most critical and venerable mystical works being strange for the uninitiated. Tutors can guide, but only to the point where the student must make the leap themself and gain their own insight.",
    "associated": [
      "alchemy",
      "chaos_magick",
      "crazy_wisdom",
      "high_ritual",
      "witchcraft"
    ],
    "limited": [
      "cybernetics",
      "faith",
      "hypertech",
      "media_control"
    ],
    "page": 19
  },
  {
    "id": "scientific_experimentation",
    "name": "Scientific Experimentation",
    "category": "epistemology",
    "desc": "Science is a challenging and meticulous process, the goal of which is to pry knowledge out of the clenched fist of the Universe itself. Everything is subject to inquiry through both theoretical speculation and direct experiment. Though it helps, performing experiments personally isn’t needed to acquire scientific knowledge. Most of the time, theories and data are transmitted by teachers and books. Scientists use these tech-",
    "associated": [
      "alchemy",
      "craftwork",
      "cybernetics",
      "high_ritual",
      "hypertech",
      "weird_science"
    ],
    "limited": [
      "chaos_magick",
      "crazy_wisdom",
      "faith",
      "maleficia",
      "shamanism",
      "witchcraft"
    ],
    "page": 19
  },
  {
    "id": "divine_revelations",
    "name": "Divine Revelations",
    "category": "epistemology",
    "desc": "For some mages, no amount of study or practice can truly grant knowledge. New knowledge can only really come from a direct revelation from the Divine. The revelations of others may help to understand the mage’s own, but only in the context of what they have experienced. Books, other than sacred texts, are less valuable to the mages, and teachers’ main role is to learn techniques for interpreting the often inscrutable visions they receive.",
    "associated": [
      "crazy_wisdom",
      "faith",
      "god_bonding",
      "maleficia",
      "shamanism"
    ],
    "limited": [
      "alchemy",
      "high_ritual",
      "hypertech",
      "martial_arts",
      "weird_science"
    ],
    "page": 19
  },
  {
    "id": "closed_paradigm",
    "name": "Closed Paradigm",
    "category": "openness",
    "desc": "There is only one right way to do things and a million wrong ways. Mages with a Closed Paradigm are supremely confident in their vision of the world and intolerant of other views. At best, they can interpret what others do as an incorrect version of their methods. At worst, they can’t tolerate these differences and cannot work with or around those who believe differently.",
    "associated": [
      "cybernetics",
      "dominion",
      "hypertech"
    ],
    "limited": [
      "art_of_desire",
      "chaos_magick",
      "crazy_wisdom",
      "gutter_magick",
      "weird_science"
    ],
    "page": 19
  },
  {
    "id": "hierarchical_paradigm",
    "name": "Hierarchical Paradigm",
    "category": "openness",
    "desc": "Many Paradigms can describe the world and teach a mage how to manipulate it. Though there isn’t an exclusive “correct” one that disproves all others, some are better than others. Mages with Hierarchical Paradigms believe their Paradigm may be the best, but others are valid…to some extent. Rarely they’ll even accept multiple Paradigms as equally valid, though generally, they don’t have trouble making judgments that one Paradigm is better than another.",
    "associated": [
      "dominion",
      "god_bonding",
      "martial_arts",
      "weird_science"
    ],
    "limited": [
      "chaos_magick",
      "cybernetics",
      "faith",
      "high_ritual",
      "hypertech"
    ],
    "page": 19
  },
  {
    "id": "open_paradigm",
    "name": "Open Paradigm",
    "category": "openness",
    "desc": "The old saying that all roads lead to Rome is true of Focus. Mages with open paradigms believe that all (or at least many) methods work to change the world and lead to Enlightenment. They are often equally comfortable among the faithful, mystics, and scientists, seeing them all as different approaches to understanding the same thing. These mages usually work well with others and often learn a diverse set of Practices.",
    "associated": [
      "art_of_desire",
      "chaos_magick",
      "crazy_wisdom",
      "gutter_magick",
      "weird_science"
    ],
    "limited": [
      "cybernetics",
      "dominion",
      "hypertech"
    ],
    "page": 20
  },
  {
    "id": "reincarnation",
    "name": "Reincarnation",
    "category": "afterlife",
    "desc": "So much of nature is cycles: the water cycle, the cycle of the harvest, even life itself. People casually refer to “life cycles” but rarely fully understand what it means. Life doesn’t just cycle in the sense that the death of one becomes the life of another, who grows and then dies and feeds some other life form. The cycle extends to the soul, which returns to do it again upon completing a life. A grand cycle of reincarnation contains everyone, and everyone lives many lives.",
    "associated": [
      "chaos_magick",
      "crazy_wisdom",
      "martial_arts",
      "shamanism",
      "witchcraft",
      "yoga"
    ],
    "limited": [
      "alchemy",
      "faith",
      "hypertech",
      "weird_science"
    ],
    "page": 20
  },
  {
    "id": "yolo",
    "name": "YOLO",
    "category": "afterlife",
    "desc": "This is it. There are no do-overs in life. Whether there’s nothingness, paradise, or even eternal punishment after it, no one returns, so we’ll never know. While there may be cycles of reincarnation for Avatars, they aren’t who we are. We only get one try. Past Lives are only the faint echoes of the lives of others through the Avatar, not signs that our “souls” (if they even exist) have been used before.",
    "associated": [
      "alchemy",
      "faith",
      "hypertech",
      "weird_science"
    ],
    "limited": [
      "chaos_magick",
      "crazy_wisdom",
      "martial_arts",
      "shamanism",
      "witchcraft",
      "yoga"
    ],
    "page": 20
  }
],

  // Book paradigms expressed as tenet triples (pp. 20–29). ids match
  // M20.PARADIGMS where the same paradigm exists there.
  PARADIGM_PRESETS: [
  {
    "id": "holographic",
    "name": "A Holographic Reality",
    "desc": "Reality as we perceive it doesn’t exist. The world is, in fact, flat. Not just the Earth but all of Reality is simply a two-dimensional space holographically simulating three-dimensional physics. Most people can’t conceive of this, but a few can work out the physics and see that it’s the simplest explanation. They can reach beyond the constraints of three-dimensional space by seeing the two-dimensional nature collapsing seemingly disparate things together to manipulate them in ways that appear “magickal.” The mages who recognize the holographic nature of reality study it, seeking to gain complete knowledge of it and make it as intuitive to them as moving through the hologram is to the Sleepers.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "greater_understanding",
      "ascension": "full_knowledge"
    },
    "page": 20
  },
  {
    "id": "mechanistic_cosmos",
    "name": "A Mechanistic Cosmos",
    "desc": "Fundamentally, the Universe is rational. Things work in specific ways, and by studying and learning those ways, amazing things are possible. Miracles don’t really happen; they’re just expressions of laws that haven’t been understood consciously yet. The critical truth in the Universe is order, and chaos is an illusion caused by that order not being simple or easy to understand. However, the connections can always be discerned with enough effort and the right tools for the job.",
    "tenets": {
      "metaphysical": "rational_universe",
      "personal": "greater_understanding",
      "ascension": "full_knowledge"
    },
    "page": 20
  },
  {
    "id": "gods_and_monsters",
    "name": "A World of Gods and Monsters",
    "desc": "The Universe has powerful forces that could be called gods or monsters. Most human beings are beneath notice, barely even pawns in the games these powers play, finding their lives uprooted for seemingly no reason. From the mundane human’s perspective, there is nothing but chaos as these maneuvers happen beyond their perception. But a mage can see these powers and, in fact, can join them. With the stolen fire of the gods, they can become cosmic beings themselves, though this entails leaving their humanity behind to join the gods and the monsters above it.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_chosen",
      "ascension": "power_is_its_own_reward"
    },
    "page": 20
  },
  {
    "id": "aliens",
    "name": "Aliens Make Us What We Are",
    "desc": "We’re not alone in the Universe. Aliens far more powerful than we can comprehend exist and have visited the Earth. They’ve made some alterations to humanity. Some believe these changes are in the genes; others believe they’re made to individuals. In either case, some people have the right confluence of factors to obtain the power to change the world. Though the aliens have not been clear about why they grant this power to some and not others, almost everyone agrees that it is to create a world ready for their arrival.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_special",
      "ascension": "build_a_utopia"
    },
    "page": 21
  },
  {
    "id": "divine_power",
    "name": "All Power Comes from God(s)",
    "desc": "Though there seem, at first glance, to be many sources of power, there is, in fact, only one. There is a God, or gods, who grant some mortals power and denies it to others. The chosen, mages, are the instruments of God’s Will and must enact it throughout the world. They are, however, given great leeway to determine what God’s Will may be, and for them, God seems to have no specific plan other than for them to gather power to make whatever they see as good into reality.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_chosen",
      "ascension": "power_is_its_own_reward"
    },
    "page": 21
  },
  {
    "id": "power_from_sin",
    "name": "All Power Comes from Sin",
    "desc": "God is real, but fuck that guy. He’s set down all sorts of rules and limits to force us into pathetic compliance, slavery to an absentee lord. Even most mages accept these rules, from morality to Paradox, restricting their actions. Some, though, refuse. They declare openly that if accepting limits is virtuous, they will be sinners and gain their power through this. Once the mage can fully break free of these limits, even the limitation of the self, separate from all else that the Divine imposed upon humanity, can be broken.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_not_limited",
      "ascension": "annihilation_is_freedom"
    },
    "page": 21
  },
  {
    "id": "worlds_stage",
    "name": "All the World’s a Stage",
    "desc": "Just because reality is a lie doesn’t mean we should feel deceived. Instead, it is more that Reality is a show; we are all simultaneously actors and audience. Most people are fundamentally unaware, Sleeping through the performance that will only ever be done once, with no encores. A few rouse themselves enough to play their roles better and appreciate the show. But the precious, special, and tiny group who Awaken are the stars. They can improvise, rewrite the script on the fly, and understand what is going on backstage like very few others can. They can even see that the show isn’t leading to anything special. It will continue as long as possible, the show must go on, of course, but there is no grand goal or dramatic Ascension except that which the actors choose to write into it.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "i_am_special",
      "ascension": "existence_is_meaningless"
    },
    "page": 21
  },
  {
    "id": "ancestor_veneration",
    "name": "Ancestor Veneration",
    "desc": "Gods, goddesses, these sorts of divinities are impersonal and unimportant. The important ones are the ancestors. They may intercede on behalf of the living, or they may themselves have power, but they listen, something that higher gods don’t do. They demand proper rituals, honor, and remembrance before they listen. A greater understanding of their needs results in them doing more for the supplicant, granting them more power. The genuinely worthy even join with the ancestors upon their death, gaining the power to grant favors to the living in their own right.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "greater_understanding",
      "ascension": "merge_with_the_divine"
    },
    "page": 21
  },
  {
    "id": "ancient_wisdom",
    "name": "Ancient Wisdom is the Key",
    "desc": "The Ancients were wiser than most suspect. They understood the world better than all of today’s mystics and scientists and used their knowledge to create great societies. Atlantis, Mu, Shangri-La, Kunlun, and any number of other names refer to the societies that the Ancients created, and all of them imply something greater than today’s world. Some mages understand this and realize that they can pry up the knowledge of the Ancients and try to recreate these utopias today.",
    "tenets": {
      "metaphysical": "fall_from_grace",
      "personal": "greater_understanding",
      "ascension": "build_a_utopia"
    },
    "page": 22
  },
  {
    "id": "barbarism",
    "name": "Barbarism is the Truest State of Man",
    "desc": "Agriculture was a mistake. Civilization has made humanity weak; the more advanced and complex it gets, the worse the situation. Scholars, politicians, and artists are all just people who have been broken by civilization, seeking to justify their weakness, even those who are mages. Mages who understand, though, are not limited by the chains of civilization and can revel in mankind’s natural state, called barbarism by the weak. Bringing civilization crashing down would benefit everyone, even the weak, who can’t conceive of it as good and will stand in the way of anyone trying to accomplish it.",
    "tenets": {
      "metaphysical": "fall_from_grace",
      "personal": "i_am_not_limited",
      "ascension": "build_a_utopia"
    },
    "page": 22
  },
  {
    "id": "golden_age",
    "name": "Bring Back the Golden Age!",
    "desc": "Once upon a time, things were better. The world was more perfect, humanity more powerful, just generally better. Whether this is the Garden of Eden, the Lost City of Atlantis, or the early days of an alien civilization colonizing Earth before devolving into humanity, it doesn’t matter. And mages have a connection to this lost, wondrous age. This connection, whether metaphysical or more direct, allows them to tap into the magicks and sciences of that era and achieve feats far beyond those of the people who lack it.",
    "tenets": {
      "metaphysical": "fall_from_grace",
      "personal": "i_am_special",
      "ascension": "build_a_utopia"
    },
    "page": 22
  },
  {
    "id": "consciousness_reality",
    "name": "Consciousness is the Only True Reality",
    "desc": "Descartes famously declared, “Cogito ergo sum,” “I think, therefore I am.” This is the foundation of knowledge, the only thing we can know. As it happens, everything else we experience is simply a simulation created by our minds. Reality is just an illusion that only a few can pierce. Piercing it, however, is a goal worthy of the Enlightenment and the power of a mage. In fact, it will grow the mage’s power: understanding how simply changing thoughts can change reality is a gateway to control over the (illusory) world around us.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "i_am_special",
      "ascension": "power_is_its_own_reward"
    },
    "page": 22
  },
  {
    "id": "cosmic_horror",
    "name": "Cosmic Horror is the Only Truth",
    "desc": "People think that they matter and that the Universe cares about us. Mages are the most delusional, believing that the whole Universe revolves around humanity and its “consensus.” Instead, humanity is nothing, and the consensus is simply a side effect of forces beyond human comprehension that do matter. Understanding this allows a few mages to rise higher, to draw the attention of these beings to alter the world. These dark and unfathomable powers have made One mistake, though. The fluid reality they create that allows Magick also gives mages the power to usurp them. We can become the “horrors” who matter in this Reality.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "greater_understanding",
      "ascension": "merge_with_the_divine"
    },
    "page": 22
  },
  {
    "id": "divine_and_alive",
    "name": "Creation is Innately Divine and Alive",
    "desc": "When some people talk about the world as alive, they mean it as a metaphor. In this view, it is literally true. The Universe lives, breathes, and often thinks, with the cycles of life and death acting similarly to the cycles within a human being. Mages are parts of this divine, infinite lifeform like everything else, but they are aware of it. This awareness lets them tap into the processes of the Universe and change them in subtle and profound ways as needed.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_special",
      "ascension": "full_knowledge"
    },
    "page": 23
  },
  {
    "id": "divine_order",
    "name": "Divine Order and Earthly Chaos",
    "desc": "Though the world may seem like a chaotic mess, an order exists. The realm of the divine, in whatever form it takes, has its own order. The Earth around us, however, is only a poor reflection of that order, resulting in the chaos we see around us. This order is touchable for those who know how and are determined. Those people can bring it down to the world around them, forcing it to conform more directly to the order that lies above.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "greater_understanding",
      "ascension": "full_knowledge"
    },
    "page": 23
  },
  {
    "id": "embrace_threshold",
    "name": "Embrace the Threshold",
    "desc": "Everyone is bound up with false beliefs. The Lie surrounding us tells us that we are limited, that the world around us constrains us, and that we will never move beyond it. The truth is that limits are false; they only exist in our minds and only bind those unwilling or unable to approach radical freedom. Those who embrace it can do anything, but it is harder than simply acknowledging this truth. A mage must hone their ability to move past the Lie through their Practices. The idea that we have limits is deeply ingrained. The truth is that the human mind cannot directly handle having no limits, but a mage must work to learn each limit and how to break it.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "i_am_not_limited",
      "ascension": "full_knowledge"
    },
    "page": 24
  },
  {
    "id": "everyones_against_me",
    "name": "Everyone’s Against Me, so Whatever I do is Justified",
    "desc": "There is only one thing that’s true in this world: everyone and everything is out to get me. I am the center of everything, but unfortunately, that just makes the things in my orbit hate me. The forces arrayed against me are too big to fathom. Everyone is part of them. Even inanimate objects are against me. But I can turn it against them. My centrality is their weakness. By changing what I am, I can change everything else, as they must remain against me, and I can and will do anything.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_special",
      "ascension": "existence_is_meaningless"
    },
    "page": 24
  },
  {
    "id": "everything_has_value",
    "name": "Everything Has Value",
    "desc": "The naive who think they understand the world equate value with price. The truth is that many things have value independent of what people will pay for them, and everything has a value that depends on it. Everything a mage does manipulates value in some way. Creation or perfection of things increases value, destruction decreases it, and even more abstract tricks shift value between things or places. Over time, a truly skilled mage will increase their value dramatically, with the most powerful mages becoming some of the highest value things in the Tellurian.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "greater_understanding",
      "ascension": "power_is_its_own_reward"
    },
    "page": 24
  },
  {
    "id": "illusion_prison",
    "name": "Everything is an Illusion, Prison or Mistake",
    "desc": "Reality is a cage. We’re all trapped inside. It may just happen to be this way, so we can pierce the illusion, or it may be the work of an evil Demiurge. In any case, the first step towards freedom is understanding that nothing around us is real. The final step is transcending it and truly understanding that not even we are real, and thus we can return to the freedom of nothingness, exiting this lie.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "greater_understanding",
      "ascension": "annihilation_is_freedom"
    },
    "page": 24
  },
  {
    "id": "everything_chaos",
    "name": "Everything is Chaos - You Only Think it Makes Sense",
    "desc": "There is no rational basis for Reality. It’s a mess of interpretation, randomness, different points of view, and fundamental indifference and meaninglessness. The things we invest in only have meaning because we’ve placed it there. This goes all the way down: the laws of nature are only suggestions that have been adhered to for a while. Understanding this allows a person to ride that chaos and pick and choose which rules they will adhere to.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_special",
      "ascension": "existence_is_meaningless"
    },
    "page": 24
  },
  {
    "id": "everything_data",
    "name": "Everything is Data",
    "desc": "The nature of reality is information. Whatever form this information takes, it’s what makes everything up. The fact that it looks like other things is just because we are information that’s processing other information. We could be a simulation on a computer in a higher reality, reality could be a linguistic construct encoded in the letters and numbers of holy books the world over, or any other method of making it all about information. Because it’s all information, changing that information is possible through programming, numerology, or whatever other methods seem appropriate to the people doing it.",
    "tenets": {
      "metaphysical": "rational_universe",
      "personal": "i_am_not_limited",
      "ascension": "full_knowledge"
    },
    "page": 25
  },
  {
    "id": "evil_is_necessary",
    "name": "Evil is Necessary, and so I am Evil",
    "desc": "A lot of people refuse to believe that absolute morality exists. And yet, despite them, it does. There is good…and there is evil. Most people at least intend to be good, though one glance at the world tells you how successful they are. Some are not so limited and see the attempt to do good as out of balance and destroying the world. If the path to hell is paved with good intentions, where does the path paved with bad intentions lead?",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_not_limited",
      "ascension": "build_a_utopia"
    },
    "page": 25
  },
  {
    "id": "unknowable_sublime",
    "name": "Existence is Unknowable, Irrational, and Sublime",
    "desc": "The appearance of rationality and comprehensibility of the Universe is a thin veneer over the truth: the human mind isn’t equipped to understand it, and rationality is not equipped to describe it. Most people would find this idea terrifying, but to some, it is beautiful. The idea that the world isn’t constrained by what some ridiculous animal can understand is sublimely beautiful, one of the most important things in the Universe to understand. The next is that if the Universe is fundamentally unknowable, it can’t have any meaning that would matter or be understood by humanity.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "greater_understanding",
      "ascension": "existence_is_meaningless"
    },
    "page": 25
  },
  {
    "id": "forbidden_wisdom",
    "name": "Forbidden Wisdom is the Truest Source of Power",
    "desc": "There are vast stores of knowledge that have been locked away, sealed by the weak and the cowardly to prevent them from being used. It wants to be free, to be released into the world and used by those who have what it takes. This knowledge can reshape the world when in the hands of those meant to wield it. Mages with this Paradigm disagree on almost everything, including what sorts of knowledge are “forbidden” and come with that power. But they know this knowledge is power, and the only way forward is to obtain as much of this forbidden knowledge as possible.",
    "tenets": {
      "metaphysical": "fall_from_grace",
      "personal": "i_am_chosen",
      "ascension": "full_knowledge"
    },
    "page": 25
  },
  {
    "id": "i_am_all",
    "name": "I am All",
    "desc": "People dismiss solipsism as childish or egotistic but can never rebut it on its merits. That’s because it’s the true nature of reality, and none of them exist. There is only one consciousness, and all the apparent differences and guises it takes are just a way to play a game and kill time while contemplating the only thing that matters: how to make it stop.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "i_am_special",
      "ascension": "annihilation_is_freedom"
    },
    "page": 25
  },
  {
    "id": "predator",
    "name": "I’m a Predator, and the World is My Prey",
    "desc": "There is only one law: eat or be eaten. It applies everywhere, sometimes literally and sometimes metaphorically. Nothing is more important than ensuring you are a predator rather than prey. This means that the power to hunt and take is the only thing that matters in this world, and weakness is unforgivable. Mages are special. They are among the few with the potential to become real predators. The Sleepers are prey, to be handled as those who matter see fit.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_special",
      "ascension": "power_is_its_own_reward"
    },
    "page": 26
  },
  {
    "id": "indulgence",
    "name": "Indulgence is Nature’s Only Law",
    "desc": "People really want to believe that the Universe is a complicated place. They dress it up by talking about the laws of god, laws of nature, and other things you just can’t do. It’s all bullshit. The only law is “do as thou wilt,” and everything else is just shackles restraining our true power. Even people who know this can’t live it fully, needing to use these laws against themselves until true Enlightenment becomes possible. But once it is, freedom and power are right behind.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "greater_understanding",
      "ascension": "power_is_its_own_reward"
    },
    "page": 26
  },
  {
    "id": "have_faith",
    "name": "It’s All Good - Have Faith!",
    "desc": "Things look bad. The world is a mess and seems to get worse and worse every year. It feels like no one is in charge. This isn’t true. In fact, the Divine is real and has a plan. Everything will, in the end, work out for the best. Some people are chosen to take a more active part in that plan. Those with that responsibility also have an opportunity: if they can perform the Divine will enough, they are rewarded with a chance to join and influence it.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_chosen",
      "ascension": "merge_with_the_divine"
    },
    "page": 26
  },
  {
    "id": "might_is_right",
    "name": "Might is Right",
    "desc": "Rationalism is a lie that the weak tell themselves to feel better in this world. It comes from a slave morality that we should all seek to overcome and replace with a true Will to Power. Only then can mages reach their true potential, a level of strength no one else can reach. The world can be changed by refusing limits and asserting their Will to Power.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_not_limited",
      "ascension": "power_is_its_own_reward"
    },
    "page": 26
  },
  {
    "id": "more_is_more",
    "name": "More is More",
    "desc": "People like to talk about whether money can buy happiness. They argue about virtue and studies and debate what amount is enough. Everyone is missing the point: even if money can’t buy happiness, it can buy anything else. It’s simple, power and strength come from having things, and more is always better than less. In fact, the sheer metaphysical weight of having many possessions bends the Universe towards the mage. Best of all, this tends to cause more things to fall towards them.",
    "tenets": {
      "metaphysical": "rational_universe",
      "personal": "i_am_not_limited",
      "ascension": "power_is_its_own_reward"
    },
    "page": 26
  },
  {
    "id": "oblivion",
    "name": "One-Way Trip to Oblivion",
    "desc": "Once upon a time, the world was a good place. Then humanity arrived. Since then, it’s been an unending slide downward. Now, the world is circling the drain, just waiting for the last push into nonexistence, a relief from the misery it is drowning in. Realizing it allows the mage to harness this, to exploit the weakness of the world and change it. It’s all going to hell anyway; what does it matter if you break a few things to make the trip down better for you?",
    "tenets": {
      "metaphysical": "fall_from_grace",
      "personal": "greater_understanding",
      "ascension": "annihilation_is_freedom"
    },
    "page": 26
  },
  {
    "id": "only_the_strongest",
    "name": "Only the Strongest Deserve to Survive",
    "desc": "The Universe is a harsh place. The weak only survive through luck and numbers, not their own abilities. They don’t deserve it, not like the strong. They’ve earned their place in the world through struggle. They prove their strength in every conflict they engage in. For the truly strong, that strength lets them do extraordinary things through whatever means they choose to leverage it.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_special",
      "ascension": "power_is_its_own_reward"
    },
    "page": 27
  },
  {
    "id": "people_are_shit",
    "name": "People are Shit",
    "desc": "Humanity is the worst. Apparently, people are born innocent, but everyone goes bad somewhere along the line. The world is falling apart due to the sheer negativity and awfulness of the people in it, and when it’s done, everything will be gone, and all that happened will be meaningless. In the meantime, the few who realize all this can take advantage. As the world gets weaker, it is possible to find places where the sheer awfulness of humanity is so great that the world itself can be changed.",
    "tenets": {
      "metaphysical": "fall_from_grace",
      "personal": "i_am_special",
      "ascension": "existence_is_meaningless"
    },
    "page": 27
  },
  {
    "id": "philanthropy",
    "name": "Philanthropy in All Things",
    "desc": "People seem to think noblesse oblige is outdated simply because they’ve done away with formal nobility. Instead, the modern nobility are the wealthy, who often ignore their obligations. Worse, many of them actively shirk their responsibilities. The vast wealth they have acquired must be used for the betterment of society, however the Philanthropist sees fit. So long as they fight society’s ills, they can do anything they desire. After all, how else can we achieve a better world?",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_special",
      "ascension": "build_a_utopia"
    },
    "page": 27
  },
  {
    "id": "power_trickles_down",
    "name": "Power Trickles Down",
    "desc": "Power is like water, flowing down a tiered mountain. It has a source at the top with virtually infinite power and flows down to lesser and lesser beings capable of holding and using it. At the bottom are Sleepers who can’t actively use the power at all. In the middle are the special people, the Awakened, who can claw their way up the hill using the power they possess. Perhaps some few manage to make it to the top, to achieve infinite power to rework the world in their own image.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_special",
      "ascension": "merge_with_the_divine"
    },
    "page": 27
  },
  {
    "id": "rebellion",
    "name": "Rebellion is the Road to Transcendence",
    "desc": "God is real and is the enemy, along with every power structure and organization around. These structures hold us down and make slaves of the people. Most just don’t have it in them to fight, only to suffer. But the strongest and the people the system pushes too far? They stand against it, rebels looking to tear it all down. Perhaps a more just world can be made on the ruins. If not, then those can be destroyed too. The rebels must seize their power by opposing conventional rules and then use it in a virtuous and transcendent cycle of destruction.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_chosen",
      "ascension": "annihilation_is_freedom"
    },
    "page": 27
  },
  {
    "id": "tech_all_answers",
    "name": "Tech Holds All Answers",
    "desc": "Even with how much of a mess the world is, we’re fortunate that we can understand it. It fundamentally makes sense. With great enough understanding, the world can be changed. Technology is how we can make these changes: anyone can do it if they know enough and have the right tools, though few are clever enough to do anything new. Knowing that technology can be used to change the world isn’t enough though, we also have a responsibility to use it to create a better world and to hammer out the flaws in the Universe to reach for perfection.",
    "tenets": {
      "metaphysical": "rational_universe",
      "personal": "greater_understanding",
      "ascension": "build_a_utopia"
    },
    "page": 28
  },
  {
    "id": "transcend_limits",
    "name": "Transcend Your Limits",
    "desc": "We believe we are limited. Everything in the world is telling us that there are boundaries that are not to be crossed. The truth is that these boundaries we think are solid are made of tissue paper, and every boundary we break through shows us a new way to change the world, revealing further boundaries for us to push. Eventually, we can break through the final barrier and become transcendent, divine beings without limits.",
    "tenets": {
      "metaphysical": "reality_is_a_lie",
      "personal": "i_am_not_limited",
      "ascension": "merge_with_the_divine"
    },
    "page": 28
  },
  {
    "id": "keys_to_reality",
    "name": "Turning the Keys to Reality",
    "desc": "Reality has hidden laws, and an elect few can learn to manipulate them. These hidden keys are consistent and predictable; they just require an Awakened Avatar to access them. Their study can reveal more and more keys, and those who can use them are obligated to explore them. Power and perhaps true transcendence comes from knowing as much as possible about these secret keys.",
    "tenets": {
      "metaphysical": "rational_universe",
      "personal": "i_am_special",
      "ascension": "full_knowledge"
    },
    "page": 28
  },
  {
    "id": "meant_wild",
    "name": "We are Meant to be Wild",
    "desc": "Agriculture was a mistake. Though they don’t recognize it consciously, most people and religions know this. From the first murderer being a farmer to the alienation most people feel from their food supply. Fortunately, we can fix this. We can bring civilization crashing down, letting our planet heal and our souls soar without limits as we embrace our wild, animalistic nature. Of course, there will be fewer people if we do this, but those who remain will be free in their proper state. Some of us can achieve this now, and the laws of man and physics can no longer hold us back.",
    "tenets": {
      "metaphysical": "fall_from_grace",
      "personal": "i_am_not_limited",
      "ascension": "existence_is_meaningless"
    },
    "page": 29
  },
  {
    "id": "not_men",
    "name": "We Are NOT Men!",
    "desc": "The unity of humanity is a lie. Not all people are truly the same sort of being. Among the full, normal people are the mages. Whatever they are, they are a higher sort of being, not mere humans. They can do things humans can’t do through their magic, faith, science, and sheer force of will. Many seek to understand what they are and hold this quest for knowledge in the highest esteem.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_special",
      "ascension": "full_knowledge"
    },
    "page": 29
  },
  {
    "id": "stormtroopers",
    "name": "We Are Stormtroopers of the Abyss",
    "desc": "The Abyss marches to liberate Reality from the pain and misery of existence, even when that liberation involves creating more pain to accomplish the eventual good of ending all of it. Some have been chosen to do the difficult work of carrying the Abyssal banner. They spread the gift of nonexistence, destroying as much and as many as they can before allowing themselves to surrender to its sacred embrace.",
    "tenets": {
      "metaphysical": "unfathomable_forces",
      "personal": "i_am_chosen",
      "ascension": "annihilation_is_freedom"
    },
    "page": 29
  },
  {
    "id": "all_gods",
    "name": "We’re All God(s) in Disguise",
    "desc": "While many believe in the existence of gods, they locate them externally. People worship all-powerful and divine beings without realizing the most important truth of the world. We are all sleeping gods. Some of the elect can Awaken, at least partially, to their power in this world. These mages tap the divine in ways that would be blasphemous, were blasphemy even possible for an embodied god. With a lot of work and more than a little luck, the best of them will fully realize their godhood and leave this world behind.",
    "tenets": {
      "metaphysical": "divine_is_real",
      "personal": "i_am_special",
      "ascension": "merge_with_the_divine"
    },
    "page": 29
  }
],

  // abilityIds reference M20 ability ids (TALENTS/SKILLS/KNOWLEDGES and the
  // SECONDARY_* lists) and drive the 2-dots-per-Practice-dot requirement.
  // abilities is the book's verbatim list for display.
  PRACTICES: [
  {
    "id": "alchemy",
    "name": "Alchemy",
    "page": 34,
    "m20Page": 573,
    "desc": "Most famous as the Practice that told the world that lead could be turned into gold, Alchemy views that almost as a parlor trick compared to its real purposes. While it’s generally the art of transformation, taking things from one state to another, most alchemists view the transformation of objects and materials as a metaphor: the thing they’re truly trying to transform is themselves. Lead to gold is an example of taking a flawed metal and creating a perfect (or more perfect) one, just as Alchemy should take the practitioner’s soul and purify and perfect it. The power of this metaphor has led alchemists the world over (and there are independent traditions recognizable as alchemy emerging in Greece, China, and Sub-Saharan Africa, with less recognizable but still related ones elsewhere) to encode their work so that only the initiated and the worthy can read it. This central metaphor is essential to mystical alchemists, who use the proto-chemistry of Alchemy to change the world around them through carefully experimenting and recording their results. More scientific versions of the Practice may eschew the idea that the soul is the true object it acts on, but will still mix various compounds to produce advanced and strange materials, potions, and treatments. Alchemy is not a quick art and benefits a lot from planning and working in advance of when it’s needed. Alchemists have become experts at creating Charms and Gadgets in the form of their mixtures and concoctions, able to do everything from the famous transmutations of Matter, to healing all forms of Life, or even granting the power to perceive the world of Spirit.",
    "abilities": "Art, Cooking, Crafts, Cryptography, Enigmas, Esoterica, Medicine, Pharmacopeia, Science (chemistry)",
    "instruments": [
      "Books",
      "brews and potions",
      "designs",
      "devices",
      "drugs",
      "formulas",
      "laboratories"
    ],
    "resonance": [
      "Changing",
      "Immortal",
      "Mad",
      "Mutable",
      "Practical",
      "Reactive",
      "Secretive",
      "Transformative"
    ],
    "benefit": "Alchemists are very efficient at creating Charms and Gadgets. When doing so with Alchemy, they only require half the usual amount of Quintessence/Tass (rounded up).",
    "penalty": "Alchemy is particularly bad at fast-casting. All rolls to improvise magick in the moment are at +1 difficulty.",
    "abilityIds": [
      "art",
      "cooking",
      "crafts",
      "cryptography",
      "enigmas",
      "esoterica",
      "medicine",
      "pharmacopoeia",
      "science"
    ]
  },
  {
    "id": "animalism",
    "name": "Animalism",
    "page": 36,
    "desc": "While all living things are connected, some are more closely connected than others. Even the earliest people recognized animals as distinct from plants and unliving minerals. They also often saw, and modern humanity is remembering, that humanity is a type of animal closely related to all the others. Often mistaken for primitivism, Animalists don’t necessarily reject human society and technology any more than a beaver would reject a dam. Instead, they focus on similarities between humans and other animals and draw on those to take on animal aspects when it is useful to them. Most are fully capable of wearing a business suit and using a computer. They can also dress themselves up in bearskins to transform themselves into one. Animalists have a “Heartbeast.” The term comes from House Bjornaer of the Order of Hermes, but the concept abounds across cultural lines. Mages recognize the concept, whether called a “spirit animal” or a fursona. The Animalist’s Heartbeast is an animal they feel a particular connection to. They draw strength and a portion of their identity from this connection and tend to specialize in ways that resonate with their interpretation of their Heartbeast. Though usually a mystical practice focused on creating a resonance with an animal through behavior, makeup, diet, etc., a modern technological view is growing. Thanks to the acceptance of genetic alteration and the science-fiction of human-animal hybrids, more and more technomages are finding their way to experiment with Animalism.",
    "abilities": "Athletics, Awareness, Brawl, Crafts, Esoterica (herbalism, weird science, yoga, etc.), Hunting, Martial Arts (animal forms), Stealth, Survival",
    "instruments": [
      "Armor",
      "artwork",
      "blood and fluids",
      "bones and remains",
      "brews and concoctions",
      "circles and designs",
      "cups and vessels",
      "dances and movement",
      "drugs and potions",
      "eye contact",
      "fashion",
      "food and drink",
      "herbs and plants",
      "languages",
      "voice and vocalizations",
      "music",
      "offerings and sacrifices",
      "prayers and invocations",
      "ordeals and exertions",
      "sex and sensuality",
      "social domination",
      "symbols",
      "thought-forms",
      "weapons",
      "devices and machines",
      "gadgets and inventions",
      "body modification",
      "cybernetics",
      "genetic manipulation",
      "medical procedures",
      "computer gear"
    ],
    "resonance": [
      "Animalistic",
      "Cold-Blooded",
      "Feathered",
      "Furry",
      "Instinctive",
      "Predatory",
      "Primal",
      "Scaly"
    ],
    "benefit": "Animalists get a -1 difficulty bonus on all rolls involving their Heartbeast.",
    "penalty": "While Animalists can use and make Wonders, it is more difficult. They prefer the more primal feeling of personal magick. They suffer a +1 difficulty using or creating Wonders or tying magick to a physical object.",
    "abilityIds": [
      "athletics",
      "awareness",
      "brawl",
      "crafts",
      "esoterica",
      "hunting",
      "martialArts",
      "stealth",
      "survival"
    ]
  },
  {
    "id": "appropriation",
    "name": "Appropriation",
    "page": 40,
    "desc": "There is a magick in taking. Having something may be powerful, but nothing quite compares with taking it away. This Practice and its effects often blend together, as the magick often involves taking one thing to allow the mage to take another. Naturally, many mages find this Practice abhorrent…and many of them use its techniques with their own justifications despite this. Despite protestations that this Practice belongs to the Syndicate, Appropriators are found in every Tradition, Craft, and Convention. It may be one of the oldest magickal Practices, dating back to when humanity first decided there was a difference between “mine” and “yours.” This is not a Practice of equitable trade. Appropriators take, leaving the other side worse off, and seldom with their permission. In its rawest form, things are taken through violence and intimidation, simply asserting that the mage will have what they want because they will kill you if you don’t give it to them. While modern mages do plenty of that, they also have more subtle tools. More difficult magicks are often performed with more subtle appropriations: taking advantage of legal codes, one-sided contracts, etc. Some Appropriators are proudest when the other side agrees to give them everything but doesn’t even realize what they’ve done. Other mages often find this sort of Appropriator worse than the more direct brute force sorts.",
    "abilities": "Brawl, Firearms, Intimidation, Law, Politics",
    "instruments": [
      "Contracts",
      "sacred ground",
      "social domination",
      "precious metals"
    ],
    "resonance": [
      "Acquisitive",
      "Claiming",
      "Con Artist",
      "Greedy",
      "Profitable",
      "Swindling",
      "Taking",
      "Thieving",
      "Wealthy"
    ],
    "benefit": "Though the act of taking is powerful in and of itself, the more valuable the thing taken, the easier it is to use it for Appropriation magick. Any time an Appropriator uses an acquisition as an Instrument and it significantly increases their wealth or power, the magick based on it gets -1 difficulty.",
    "penalty": "Appropriators are particularly bad at giving. Should one give something away without expecting anything in return, all Appropriation magick is at +1 difficulty until they take something of significantly greater value. They cannot use this taking as an Instrument. Its purpose is to make up for the giving.",
    "abilityIds": [
      "brawl",
      "firearms",
      "intimidation",
      "law",
      "politics"
    ]
  },
  {
    "id": "art_of_desire",
    "name": "Art of Desire",
    "page": 42,
    "m20Page": 573,
    "desc": "There is a power in knowing and manipulating the desires of others. The Ars Cupiditae of the Renaissance seeks the perfection of the self, but not as an abstract goal. Instead, perfection is in service of simply getting what you want and making sure others get what they want. When the Artist of Desire wants to make something happen, they can find a way. One of the subtler Practices, the Art of Desire rarely looks like magick is being done. Instead, it looks like resourcefulness, connections, wealth, and charisma. Artists tend to have lots of Contacts and Influence; if they don’t, they quickly acquire it. This becomes a virtuous cycle for them: get someone something they need and acquire a contact, that contact provides some influence, which they can use to get what they need for themself or someone else later. It’s hardly surprising that they find themselves effortlessly catapulted to the top of any organization they want to take over. Though strongly associated with Europe thanks to the Ars Cupiditae, the Art of Desire has flourished worldwide and in many magickal groups. It is popular among Sleepers, though they can’t use it in the same way mages can. In many societies, it is one of the key techniques of social and economic mobility. In its more on-the-nose instances, it can appear as a courtesan providing services, especially for high-paying customers. But drug dealers (and other black marketeers), logistics officers in the military, stock traders, and more all live every day by their skill with the methods of the Art of Desire.",
    "abilities": "Academics (culture, philosophy, psychology), Athletics, Awareness, Carousing, Diplomacy, Disguise, Etiquette, Expression, Fast-Talk, Fencing, Finance, Intimidation, Intrigue, Leadership, Martial Arts, Media, Negotiation, Politics, Seduction, Style, Subterfuge",
    "instruments": [
      "Cards and dice",
      "cosmetics",
      "(very refined) dance and gestures",
      "eye contact",
      "fashion",
      "gadgets",
      "mass media",
      "money and wealth",
      "sex",
      "social domination",
      "vehicles",
      "voice",
      "weapons"
    ],
    "resonance": [
      "Accommodating",
      "Connected",
      "Covetous",
      "Desired",
      "Productive",
      "Wanted",
      "Wealthy"
    ],
    "benefit": "Because they train themselves to be in tune with the desires of those around them, Artists of Desire have -1 difficulty on all Charisma-based rotes.",
    "penalty": "Because the Art of Desire is such a subtle Practice, whatever time or place it’s in, Vulgar magick involving it is at +1 difficulty.",
    "abilityIds": [
      "academics",
      "athletics",
      "awareness",
      "carousing",
      "diplomacy",
      "disguise",
      "etiquette",
      "expression",
      "fastTalk",
      "fencing",
      "finance",
      "intimidation",
      "intrigue",
      "leadership",
      "martialArts",
      "media",
      "negotiation",
      "politics",
      "seduction",
      "style",
      "subterfuge"
    ]
  },
  {
    "id": "bardism",
    "name": "Bardism",
    "page": 46,
    "desc": "Bards are far more than simple entertainers. They leverage the power of music and stories to change the world around them, bringing the stories to life and moving their audience with their songs. They understand just how fundamental emotions are and how closely tied they can be to music and stories. Many even view the world as entirely composed of stories, mutable so long as you can figure out how to change the ending. Even legendary and metaphysical beings respond to music and stories. Bards often harken back to the stories of Orpheus or the Sirens’ songs as symbols of their power, though they would be the last to neglect the wealth of other cultures contributing their own versions of the Practice. Most famous portrayals of Bardism focus on the ability to influence the minds of others. Bards will carefully choose the appropriate music or story for any occasion to elicit the appropriate response from their audience. Often, a bard’s power will be determined by how deep their library of music and stories is, and so most will scour the world for more stories and tunes to add to their collections, preparing them for almost anything they may run into. Similarly, they are often masters of intercultural communication and even trade. Knowing the stories a culture tells itself, particularly about itself, can give great insight, and knowing how to insert yourself into them can bring immense advantages.",
    "abilities": "Academics (history and politics), Art (several specialties), Awareness, Cosmology, Crafts (for traditional instruments), Empathy, Enigmas, Expression, Seduction, Technology (for modern instruments)",
    "instruments": [
      "Artwork",
      "dances and movement",
      "drugs and potions",
      "food and drink (typically consumed by the Bard)",
      "energy",
      "eye contact",
      "fashion",
      "group rites (performances)",
      "mass media",
      "meditation (trancing out while playing)",
      "music",
      "ordeals and exertions",
      "prayers and invocations (especially with sacred-music artists)",
      "sex and sensuality",
      "symbols (worn, or invoked in performance)",
      "tricks and illusions",
      "True Names",
      "voice and vocalizations"
    ],
    "resonance": [
      "Artistic",
      "Bardic",
      "Charming",
      "Epic",
      "Inspiring",
      "Melodic",
      "Musical",
      "Persuasive",
      "Spoony",
      "Storied"
    ],
    "benefit": "Bards practice their craft constantly, and though they have some specialty, they can generally handle every aspect of it. For them, the Art Talent isn’t fundamentally different from other Talents: they can use it generically across art forms (to a maximum of Bardism rating) and have a Specialty as normal instead of needing one for each Art.",
    "penalty": "Bards are, by their nature, not stealthy. Their magick depends on being heard, whether telling a story or singing a song. Any time a Bard tries to do magick without being noticed, they do so at +1 difficulty, and all potential observers have a -1 difficulty bonus to their Perception + Alertness rolls to notice the Bard.",
    "abilityIds": [
      "academics",
      "art",
      "awareness",
      "cosmology",
      "crafts",
      "empathy",
      "enigmas",
      "expression",
      "seduction",
      "technology"
    ]
  },
  {
    "id": "chaos_magick",
    "name": "Chaos Magick",
    "page": 49,
    "m20Page": 573,
    "desc": "Despite its reputation, Chaos Magick is less about chaos per se and more about inversion, though this often includes the inversion of favoring disorder over order. At its core, Chaos Mages are about tearing down dogma, grinding it into powder, and then snorting the result like cocaine. What they end up with tends to look offensive to the practitioners of other Practices, as they blaspheme where others would use Faith, summon and bind demons rather than angels, and fuck instead of make love. The fun part of being a Chaos Mage is that you don’t care what the normie losers think. You’re doing your thing, and if you can pull together power through the mockery of theirs, then that’s great for you and entirely their problem. Though this inversion and chaos are entirely sincere, very few Chaos Mages consider it to be serious. Many, especially those who are part of groups with other Practices (which are often the first things they deconstruct), have a playful attitude towards taking things apart and putting them back together incorrectly deliberately, especially when they can be delighted to find that they still work. Chaos Magick is deeply postmodern: it depends on the personal experiences of the user rather than any shared system, and when it comes into contact with more structured systems, its instinct is to deconstruct them, breaking them down into their most basic elements and seeing if there’s anything left once the facade has been destroyed. While many agree that this gives the Chaos Mage a certain insight, it rarely makes them popular except in deeply ironic and postmodern groups, and even then, they acknowledge that it can be taken too far.",
    "abilities": "Art, Awareness, Carousing, Computer, Esoterica, Expression, Lucid Dreaming, Intuition, Meditation, Misdirection, Pharmacopeia, Streetwise, Technology",
    "instruments": [
      "Anything that works but needs to change regularly and not be confining."
    ],
    "resonance": [
      "Adaptive",
      "Chaotic",
      "Eccentric",
      "Experimental",
      "Flexible",
      "Individualistic",
      "Innovative",
      "Spontaneous",
      "Unconventional"
    ],
    "benefit": "Chaos magick is a fundamentally improvisational discipline. Chaos magicians specialize in thinking on their feet and combining disparate elements into bespoke magickal effects based on their personal symbolism. As such, they reduce the difficulty of fast-casting an effect for the first time by 1.",
    "penalty": "Though chaos magicians are excellent at improvising based on personal symbolism and whatever is happening around them, they need their effects to be adaptive: the same thing doesn’t work the same way twice. Though they retain larger dice pools for rotes, they have a difficulty penalty of +1.",
    "abilityIds": [
      "art",
      "awareness",
      "carousing",
      "computer",
      "esoterica",
      "expression",
      "lucidDreaming",
      "intuition",
      "meditation",
      "misdirection",
      "pharmacopoeia",
      "streetwise",
      "technology"
    ]
  },
  {
    "id": "charity",
    "name": "Charity",
    "page": 51,
    "desc": "People often underestimate the transformative power of Charity. Serving as a counterpoint to Appropriation, it creates a bond between the giver and the recipient, connecting them and allowing them to influence each other in often subtle but significant ways. In addition to influencing others, Charity is a powerful tool for triggering personal growth and transformation. Alongside the specific act of giving, a significant part of the potency of Charity as a Practice comes from intent. Gifts given to gain power are, ironically, less potent for most practitioners than those given with the intent simply to do good (however they define it). This doesn’t mean they have no power, simply that more selfless acts are more potent. This can create real difficulties for the practitioner, significantly increasing the requirements for many intentional acts of magick and making magick easier as a side effect of how they live their lives. Though it may be difficult to wield intentionally for most, Charity is a viable path to power for the wealthiest mages, who can spend enough to compensate for their intentions. For poorer mages, it’s rarely something they can pursue seriously, other than perhaps as beneficiaries of others practicing it, tying them to the wealthier and more powerful mages through financial ties and the connections this Practice fosters.",
    "abilities": "Art, Cosmology, Crafts, Empathy, Expression, Politics, Technology",
    "instruments": [
      "Blessings and curses",
      "governments",
      "money and wealth",
      "physical media"
    ],
    "resonance": [
      "Altruistic",
      "Benevolent",
      "Compassionate",
      "Generous",
      "Giving",
      "Helpful",
      "Philanthropic",
      "Selfless"
    ],
    "benefit": "The nature of Charity as a Practice is giving, so whenever the mage gives in a way that their target would be left in a better position and they would be left in a worse one, their magick is at -1 difficulty.",
    "penalty": "In contrast, taking from someone in a way that leaves them worse off is anathema to a Charity mage and is always Vulgar for them.",
    "abilityIds": [
      "art",
      "cosmology",
      "crafts",
      "empathy",
      "expression",
      "politics",
      "technology"
    ]
  },
  {
    "id": "craftwork",
    "name": "Craftwork",
    "page": 54,
    "m20Page": 573,
    "desc": "There is no magick like the power to create, and that’s the specialty of Craftworkers. Echoing some of the oldest and most potent gods mankind has ever dreamed up, they create the mystical and the sacred in physical form. This is an Entropy mage mimicking the looms of the Fates to change someone’s destiny or a Matter mage crafting a hi-tech suit of armor to protect them in battle; it’s all of a kind, so long as the mage is creating things with their hands and hand tools, it’s Craftwork. Craftwork may be one of the oldest continually practiced Practices, but it’s had a bit of a PR problem with mystic mages over the last few centuries. Despite virtually every Tradition and Craft having their own Craftworkers supplying them with the equipment they need, many mystics associate the Practice too strongly with the Order of Reason and the Technocratic Union (who, ironically, have put more emphasis on Hypertech in modern times). Despite this, with the modern movement towards valuing artisanal works and crafts, the Craftworkers are regaining the respect they’d lost earlier when mass production was the most desired means of creation. Though Craftworkers can’t ignore the usual studies that mages engage in, they tend to learn through a hands-on approach. This leads to a tendency for them to be tougher than average, often a bit rougher. No Craftworker avoids having calloused hands at some point in their life. Some even believe it’s no accident that the Order of Reason was founded by Craftmasons, as though they may have an air of personal chaos, their magick puts things together, builds them up, and creates an order to the universe whether the universe likes it or not.",
    "abilities": "Academics, Arts, Computers, Cooking, Crafts, Energy Weapons, Esoterica (sacred geometry, quantum mathematics, elemental pacts, stone and metal lore), Gunsmith, Jury-Rigging, Research, Science, Technology",
    "instruments": [
      "Artwork",
      "blood",
      "books",
      "computers and IT gear",
      "devices and machines",
      "elements",
      "gadgets",
      "household and crafting tools",
      "laboratories and workshops",
      "symbols",
      "weapons (hammers, blades, sickles, guns, etc.)"
    ],
    "resonance": [
      "Constructive",
      "Crafted",
      "Creative",
      "Designed",
      "Fine",
      "Forged",
      "Masterwork",
      "Sewn",
      "Stitched-Together"
    ],
    "benefit": "Craftworkers are, unsurprisingly, adept at creating things. This is restricted to the Crafts skill (they gain no benefit to Technology), but on such rolls, including magick, they receive a -1 difficulty bonus.",
    "penalty": "Craftworkers are so used to creating their own equipment that using things made by others is more difficult. When using Instruments that they had no hand in making and are not Wonders of any sort, magickal difficulties are at +1.",
    "abilityIds": [
      "academics",
      "art",
      "computer",
      "cooking",
      "crafts",
      "energyWeapons",
      "esoterica",
      "gunsmith",
      "juryRigging",
      "research",
      "science",
      "technology"
    ]
  },
  {
    "id": "crazy_wisdom",
    "name": "Crazy Wisdom",
    "page": 56,
    "m20Page": 574,
    "desc": "There’s no lack of sanity among Practitioners of Crazy Wisdom, though they certainly don’t mind if others think there is. Rather than reflecting some strange wisdom in mental illness, it’s the wisdom of contradiction and irrationality. Sometimes the barriers that we set in our minds to make things make sense hold us back, and Crazy Wisdom teaches mages to break those barriers and find sense in nonsense, power in submission, calmness in passion, and safety in danger. While it’s called crazy by outsiders talking about how others do it, almost every faction of mages has some use for this Practice. Though it’s most associated with groups like the Cult of Ecstasy or the Ahl-i-Batin, much more supposedly rigid groups also use it. The Order of Hermes refers to it as the Antinomian Praxis, gaining insight by contradicting the mage’s own personal nature (exemplified by their True Name, giving their version its title), while the New World Order makes sure that some operatives can think like the enemy and dwell on the insights that the irrational have. When combined with other Practices, Crazy Wisdom inverts its fundamentals. A Craftworker may destroy something they labored over for weeks, or a Martial Artist may start fights they deliberately lose. It tends to be a humbling discipline because one of the few common themes of the insight mages get from it is that though they are powerful, they can also lose or fail, and power dynamics can be flipped.",
    "abilities": "Art, Athletics, Carousing, Enigmas, Esoterica, Intuition, Lucid Dreaming, Meditation, Pharmacopeia, Survival",
    "instruments": [
      "Blood and body fluids",
      "bones and remains",
      "brain/computer interface",
      "dance",
      "drugs",
      "music",
      "ordeals",
      "sex and sensuality",
      "social domination",
      "thought forms",
      "toys",
      "tricks and illusions",
      "voice"
    ],
    "resonance": [
      "Daring",
      "Eccentric",
      "Irreverent",
      "Offbeat",
      "Quirky",
      "Strange",
      "Unconventional",
      "Unorthodox",
      "Whimsical"
    ],
    "benefit": "When in the throes of some altered state, whether having lost control of a derangement or having taken mind-altering drugs, Crazy Wisdom mages truly shine. All of their magick is at -1 difficulty under these conditions.",
    "penalty": "The fluidity of identity for a Crazy Wisdom mage can become a problem. When they take on a dramatic shift of perspective, it is more difficult for them to return to themself. Rolls to break free of derangements or otherwise restore their mental state to normal are at +1 difficulty.",
    "abilityIds": [
      "art",
      "athletics",
      "carousing",
      "enigmas",
      "esoterica",
      "intuition",
      "lucidDreaming",
      "meditation",
      "pharmacopoeia",
      "survival"
    ]
  },
  {
    "id": "cybernetics",
    "name": "Cybernetics",
    "page": 60,
    "m20Page": 574,
    "desc": "Contrary to popular usage, Cybernetics doesn’t simply refer to implants and replacement limbs. Instead, it’s all fusions of human and machine to create a greater whole. Its reputation often misleads people into thinking it’s a uniquely 21st (or perhaps 20th) century technique, but the Practice goes back to the oldest civilizations on Earth in their own ways, who developed and studied the simple machines and tools. That’s not to say that the version where tools are placed inside the human body to make it work more effectively isn’t an important and influential magickal Practice, simply that it is not the only form Cybernetics takes. The Practice has always been used to improve both the mind and the body through tools. The body benefits from levers, pulleys, inclined planes, screws, spears, swords, armor, chariots, and anything that can make it stronger, faster, and tougher. Even some Cyberneticists make the mistake of thinking that the Practice has only begun to improve the mind since the advent of computers. In fact, writing has been one of the most successful developments that can be considered a cybernetic enhancement. It allows the externalization and sharing of memory and knowledge, after all. Though the tools that can be picked up and put down have done extraordinary things for humanity, many of Cybernetics’ greatest successes in the modern world are things that can’t be simply discarded. Cyberneticists have developed artificial limbs to replace those lost to disease or accident and, in fact, many artificial internal organs. The deaf can hear with cochlear implants, and for the Cyberneticists themselves, there are artificial eyes that can see, computers that can replace damaged or simply inefficient parts of the brain, and more.",
    "abilities": "Academics, Biotech, Computer, Crafts, Energy Weapons, Media, Politics, Science, Technology",
    "instruments": [
      "Books",
      "brain/computer interface",
      "computers and IT gear",
      "devices and machines",
      "gadgets",
      "inventions",
      "laboratories",
      "languages",
      "mass media",
      "nanotech",
      "numbers and numerology",
      "weapons",
      "writing and inscriptions"
    ],
    "resonance": [
      "Artificial",
      "Automated",
      "Digital",
      "Futuristic",
      "Mechanical",
      "Networked",
      "Prosthetic",
      "Robotic",
      "Synthetic",
      "Virtual"
    ],
    "benefit": "Cybernetics is the Practice of using technology to enhance the human mind and body. Cyberneticists get an additional -1 difficulty bonus when using technological help to reduce the difficulty of an Attribute + Ability roll.",
    "penalty": "Cyberneticists have a tendency to become dependent on their tools. Magick performed without Instruments is done with an additional +1 difficulty penalty.",
    "abilityIds": [
      "academics",
      "biotech",
      "computer",
      "crafts",
      "energyWeapons",
      "media",
      "politics",
      "science",
      "technology"
    ]
  },
  {
    "id": "dominion",
    "name": "Dominion",
    "page": 63,
    "m20Page": 574,
    "desc": "Often overlooked as a magickal Practice, Dominion, also called Social Domination, is as old as language and tribe. It’s the power of directing others to enact your own will. Dominion can be one of the most subtle Practices, with the user very carefully managing their appearance and mannerisms to elicit the desired responses. On the other hand, sometimes, there’s no substitute for giving someone a direct command with the voice of Authority when they aren’t expecting it. Dominion is almost certainly the Practice whose elements are most used among Sleepers. Con-men, pick-up artists, and abusers all use these elements and tend to be distressingly good with this Practice when they Awaken. On the other hand, it’s also an essential part of the toolkit for parents, teachers, and others who use these skills responsibly. When these people Awaken, they often become pillars of the community. Though it has no known Corrupted Practice, Dominion is a double-edged sword, both essential to many mages and mistrusted because of how easily it can be abused. All the techniques available to Sleepers are refined to a razor’s edge by mages. A Sleeper may minimize their social flaws, whereas a mage turns them into strength. Mages don’t need to feel restricted to commanding people this way. The very forces of nature will bow to proper commands for many mages, especially those who believe that intelligence guides everything in some way.",
    "abilities": "Academics (history, psychology), Art, Belief Systems, Chantry Politics, Diplomacy, Empathy, Expression, Instruction, Intimidation, Leadership, Media, Politics, Power-Brokering, Propaganda, Seduction, Technology",
    "instruments": [
      "Art",
      "brain/computer interface",
      "eye contact",
      "fashion",
      "group rites",
      "languages",
      "mass media",
      "music",
      "social domination",
      "symbols",
      "thought forms",
      "tricks and illusions",
      "voice"
    ],
    "resonance": [
      "Assertive",
      "Authoritative",
      "Autocratic",
      "Commanding",
      "Controlling",
      "Dominant",
      "Forceful",
      "Influential",
      "Resolute"
    ],
    "benefit": "The magick of command comes easier to Dominion mages. When persuading or forcing someone to do something, whether through direct persuasion with Mind or threats and intimidation with Forces or other Spheres, they receive a -1 difficulty bonus.",
    "penalty": "Dominion mages have an extremely difficult time giving up control. Whenever they are dealing with something, magickal or mundane, so powerful they cannot command it, they suffer a +1 difficulty modifier to interact with it.",
    "abilityIds": [
      "academics",
      "art",
      "beliefSystems",
      "chantryPolitics",
      "diplomacy",
      "empathy",
      "expression",
      "instruction",
      "intimidation",
      "leadership",
      "media",
      "politics",
      "powerBrokering",
      "propaganda",
      "seduction",
      "technology"
    ]
  },
  {
    "id": "elementalism",
    "name": "Elementalism",
    "page": 65,
    "desc": "Some Practices are deeply spiritual. Others have rich intellectual underpinnings and require specialist knowledge to do properly. Elementalism is neither. It is one of the most primal Practices, relying on intuition and practicality more than anything else. Elementalists tend to have a single element they bond with that most closely aligns with their nature. As they advance in the Practice, it seeps into every aspect of their being, from shifting their appearance to inflecting their personality: fire elementalists tend to be hot-headed, earth ones are steady, etc. Some few Elementalists bond with multiple elements, either initially or over time. This mitigates the tendencies towards their primary element, but it’s intensely difficult and unsuited to most. The tools used by Elementalists are usually simple and have deep symbolic connections to their element, leading to the majority of Elementalists being mystics who practice old ways. Despite this, there are Elementalists who cross-train with other Practices and see their fusion, the most famous being the High Ritualist Elementalists of House Flambeau of the Order of Hermes. There are even some Elementalists among the Technocratic Union, though they have difficulties fitting into the strict structures and the requirement that they comport to rational laws. On the other hand, they tend to have affinities for elements and forces that mystics just don’t conceive as such, including at least one recorded Uranium Elementalist who, perhaps fortunately, was lost when the Deep Space Construct she lived on disappeared in the Avatar Storm.",
    "abilities": "Art, Athletics, Awareness, Crafts (involving the elements in question), Empathy, Esoterica (elemental correspondences, elemental spirit lore, lore of the associated element), Meditation, Survival",
    "instruments": [
      "Armor (formed from the element in question)",
      "artwork (likewise)",
      "bones and remains",
      "blood and fluids",
      "brews and potions",
      "dance and movement",
      "drugs",
      "elements",
      "energy (for fire, air, and water)",
      "herbs and plants",
      "household tools (used to work the element)",
      "knots and ropes (traditionally used to bind up winds)",
      "meditation (with and concerning the elements)",
      "music (to conjure the elements or call up elemental spirits)",
      "prayers and invocations",
      "offerings and sacrifice (to elemental lords)",
      "ordeals (generally involving the element in question)",
      "symbols",
      "weapons (formed from the favored element)",
      "writing (runes inscribed on or with the element)"
    ],
    "resonance": [
      "Breezy",
      "Burning",
      "Electric",
      "Fluid",
      "Glowing",
      "Grounded",
      "Metallic",
      "Radioactive",
      "Wooden"
    ],
    "benefit": "At creation, an Elementalist chooses a primary element. This element can be almost anything, even most complex substances. All Instruments that incorporate that element count as personalized Instruments for the mage, granting a -1 difficulty.",
    "penalty": "Despite being able to work with other elements, if an Elementalist is denied access to their primary element (for example, a fire Elementalist in a freezing room without a match), then all Elementalist magick they attempt is at +2 difficulty. This penalty holds even if they are not trying to do anything that directly uses their element.",
    "abilityIds": [
      "art",
      "athletics",
      "awareness",
      "crafts",
      "empathy",
      "esoterica",
      "meditation",
      "survival"
    ]
  },
  {
    "id": "faith",
    "name": "Faith",
    "page": 68,
    "m20Page": 575,
    "desc": "Some mages work their magick through something greater than themselves. The Faithful have a relationship with the divine, which comes with obligations and duties they must upkeep: generally regular prayer, often sacrifices of some sort, and sacred rituals that must be upkept. This comes with privileges for the mage: the higher power grants their prayers or validates their rituals, allowing them to change the world through them. Though the Faithful may be malevolent, the higher power doesn’t need to be good and could include the Gnostic Demiurge, the Nephandic concept of the Absolute, or the Christian Satan; they at least tend not to be egotistic. They know their status below something, but the higher power can also energize and inspire them to action, encouraging them to accomplish their (and the higher power’s) goals. Faith also need not be in a divine power, and the Faithful don’t always follow any religion. Faith is a personal connection, with the fundamental aspects being the higher power and the mage’s creed. Though often that of a religion, some put their faith in “science” and may the creed of reproducible experimentation and academic integrity.",
    "abilities": "Academics (tenets of faith), Awareness, Belief Systems, Cosmology, Empathy, Enigmas, Esoterica, Expression, Medicine, Theology",
    "instruments": [
      "Blessings and curses",
      "books (scriptures)",
      "cups and vessels",
      "energy",
      "food and drink",
      "group rites",
      "music",
      "offerings and sacrifice",
      "ordeals and exertions",
      "prayers and invocations",
      "sacred iconography",
      "symbols",
      "thought forms",
      "voice",
      "writings and inscriptions"
    ],
    "resonance": [
      "Faithful",
      "Holy",
      "Infallible",
      "Profane",
      "Sacred",
      "Unerring",
      "Worshipful"
    ],
    "benefit": "The Faithful routinely draw strength from their beliefs and their code. So long as they uphold them, the Faithful may gain one temporary Willpower point to spend on a magick roll per Story.",
    "penalty": "Creeds are essential to the Faithful. Often, their ability to do their magick is tied to them, and they can’t help but see deliberate violations as disqualifying until they’ve made some sort of restitution. Because of this, one of the Faithful who violates their creed cannot use the Faith Practice until they find a way to fix their error.",
    "abilityIds": [
      "academics",
      "awareness",
      "beliefSystems",
      "cosmology",
      "empathy",
      "enigmas",
      "esoterica",
      "expression",
      "medicine",
      "theology"
    ]
  },
  {
    "id": "god_bonding",
    "name": "God-Bonding",
    "page": 72,
    "desc": "While others find divinity outside themselves, the God-Bonded find it within themselves. Whether they see themselves as the children of the gods, the gods themselves, or simply possessing a divine spark, their power comes from this innate and fundamental connection to the divine. All this said, many of their tools look superficially similar to those of the Faithful, but rather than invoking some other power, the God-Bonded is invoking themself. While many perfectly normal mages use this Practice to bring out their inner divinity and remake the world around them, it’s extremely popular among the Marauders. The Mad often believe themselves to be gods, and the power of their Quiets and their immunity to Paradox only helps them to believe it more strongly. These Marauders can be especially dangerous because they impose almost no limits on their behavior and decisions about what the world should be. While some few of the God-Bonded delve deeply into research of their godly self, it’s largely a non (or even anti) intellectual Practice. The essential tools are primal: prayer, meditation, acts that glorify themselves or the god they are tied to, and sacrifices and offerings. Even those who only see themselves as more literally “bonded” to a god take slights against that god personally, but they also often take praise for the god personally as well.",
    "abilities": "Awareness, Belief Systems, Cosmology, Empathy, Enigmas, Esoterica (appropriate theology and lore), Expression, Lucid Dreaming, Medicine, Meditation",
    "instruments": [
      "Blessings and curses",
      "blood",
      "elements",
      "group rites",
      "music",
      "offerings and sacrifice",
      "ordeals",
      "prayers and invocations",
      "sacred iconography",
      "voice (songs, speaking in tongues)",
      "weapons (often symbolic, sometimes wielded on behalf of the god)"
    ],
    "resonance": [
      "Awe-Inspiring",
      "Divine",
      "Ethereal",
      "Heavenly",
      "Ridden",
      "Sacred"
    ],
    "benefit": "At creation, choose up to three domains over which the mage’s god has influence. If the god is from a real mythology, it should be domains that the god worked with within that mythology. Assign them to Arete 1, 3, and 5. Upon reaching those Arete ratings, the mage receives -1 difficulty invoking their god within those domains (i.e., using God-Bonding as a Practice).",
    "penalty": "For each mage, something can disrupt their connection to their god, stopping them from using the Practice entirely. Choose this thing at character creation based on myths regarding their god (if any exist). When this technique is used on them, or the object is near them, the difficulty of using God-Bonding as a Practice suffers a +2 penalty.",
    "abilityIds": [
      "awareness",
      "beliefSystems",
      "cosmology",
      "empathy",
      "enigmas",
      "esoterica",
      "expression",
      "lucidDreaming",
      "medicine",
      "meditation"
    ]
  },
  {
    "id": "gutter_magick",
    "name": "Gutter Magick",
    "page": 74,
    "m20Page": 575,
    "desc": "Some mages are lucky and can put together their workings with the finest materials in prepared spaces. For others, there’s Gutter Magick. Built out of whatever the mage has on hand, Gutter Magick is one of the most improvisational Practices out there. Gutter Mages are often thought of as “mystics,” but the line between “mystic” and “technomage” is extremely thin, and they tend to straddle it. Many are just as at home cobbling a computer together from garbage and old video game consoles as they are summoning a spirit with pogs and bad poetry. None of this is to say that Gutter Magick lacks its own style. Those scraps of garbage are representative of using the cast-offs of society. Gutter Magick takes these bits and pieces that more formalized magickal systems don’t want and makes something of them. What a High Ritualist or a Hypertechnologist would use a sterile lab with precision components for, a Gutter Mage will do in a cave with a box of scraps. Gutter Mages are particular about their symbolism, despite everything. Just because they’re working with garbage and scraps doesn’t mean they don’t care about getting it right. Just for them, “right” has more to do with symbolism and resonance and not much to do with traditional notions of quality.",
    "abilities": "Animal Kinship (rats, cats, crows, etc.), Area Knowledge, Art, Crafts, Expression, Firearms, Intimidation, Jury-Rigging, Pharmacopeia, Scrounging, Streetwise, Survival (urban), Technology",
    "instruments": [
      "Artwork",
      "blood and fluids",
      "bones and remains",
      "cards and dice",
      "dance",
      "drugs and poisons",
      "eye contact",
      "fashion",
      "herbs and plants",
      "household tools",
      "music",
      "offerings and sacrifice",
      "sex",
      "social domination",
      "symbols",
      "thought forms",
      "toys",
      "tricks and illusions",
      "weapons",
      "vehicles"
    ],
    "resonance": [
      "Coarse",
      "Dangerous",
      "Improvised",
      "Lowbrow",
      "Ragged",
      "Reckless",
      "Resourceful",
      "Unrefined"
    ],
    "benefit": "Gutter Mages are great at finding cheap and easy ways to do things, even big things. They’re adept at finding substitutes for anything expensive or rare, trading rarity for work, which is free. At the expense of doubling casting time, they can leverage a Resonance trait that would normally be irrelevant to their working through some cobbled-together reasoning.",
    "penalty": "As much as Gutter Mages can do more with less, the truth is that more doesn’t help them. They are incapable of having Unique Instruments.",
    "abilityIds": [
      "animalKinship",
      "areaKnowledge",
      "art",
      "crafts",
      "expression",
      "firearms",
      "intimidation",
      "juryRigging",
      "pharmacopoeia",
      "scrounging",
      "streetwise",
      "survival",
      "technology"
    ]
  },
  {
    "id": "high_ritual",
    "name": "High Ritual Magick",
    "page": 77,
    "m20Page": 575,
    "desc": "Among the most disciplined of mages, High Ritualists need that discipline, incredible precision, and mastery of their Will to control the world around them. Though medieval Europe is the first place people think of for High Ritual Magick, it’s found in almost every society, including prominent Chinese and Subsaharan African Crafts, Mesoamerican practitioners, and more. What they have in common is that their work requires preparation and exacting measures to work. They must use the finest materials, arranged in precisely the right way, while they speak carefully chosen words in languages they must pronounce flawlessly. But for that precision, they gain the power to bend Reality to their Will. This level of specificity and effort doesn’t come from nowhere. Ritualists often need to interact with powerful beings: Umbral Lords, Bygones, and even gods, and their predecessors learned how to work with them through trial and error. Now they have a large body of knowledge to draw upon, and if some of the rituals might still work with a bit less precision, they don’t want to take that chance. Though their magick was honed through work with spirits, they are most famous for elemental powers (though they evoke the powers of spirits, calling on negotiated pacts or discovered laws governing these beings rather than speaking with them directly most of the time). If there’s one flaw that Ritualists have, it’s pride. They have worked extremely hard to develop the skills they need and look down on those they think haven’t earned the right to use magick like they have. They also tend to command rather than beg or ask when dealing with even powerful beings. And they can get away with it because they are often powerful and follow the rules to the letter that protect them.",
    "abilities": "Academics, Belief Systems, Cosmology, Crafts, Expression, Enigmas, Esoterica, Investigation, Leadership, Meditation, Occult, Research",
    "instruments": [
      "Books",
      "celestial alignments",
      "circles and designs",
      "computers (for modern wizards)",
      "cups and vessels",
      "elements",
      "eye contact",
      "fashion",
      "gems",
      "gestures",
      "languages (Latin, Sanskrit, Mandarin, Greek, etc.)",
      "meditation",
      "numbers and numerology",
      "offerings and sacrifices",
      "prayer and invocations",
      "social domination",
      "symbols",
      "thought forms",
      "True Names",
      "wands and staves",
      "weapons (swords and knives)",
      "writing and inscriptions"
    ],
    "resonance": [
      "Arrogant",
      "Detail-Oriented",
      "Elemental",
      "Knowledgeable",
      "Meticulous",
      "Precise"
    ],
    "benefit": "Ritualists know what they are doing. They specialize in the slow and precise magick they do under controlled circumstances. This yields a -1 difficulty on all magick done via ritual, as defined in M20 pgs. 538-542.",
    "penalty": "Ritualists are good at slow magick but bad at fast on-the-fly workings. Any fast-cast effect that is not a rote cast using High Ritual Magick is at +1 difficulty.",
    "abilityIds": [
      "academics",
      "beliefSystems",
      "cosmology",
      "crafts",
      "expression",
      "enigmas",
      "esoterica",
      "investigation",
      "leadership",
      "meditation",
      "occult",
      "research"
    ]
  },
  {
    "id": "hypertech",
    "name": "Hypertech",
    "page": 82,
    "m20Page": 575,
    "desc": "Mages are known for being ahead of Sleepers and leading the way in various areas. For the last few hundred years, no group of mages has taken the lead more than Hypertechnicians, pushing technology to limits that Sleepers can’t even conceive of yet. Almost everything that makes the modern world, metallurgy, combustion, electronics, and the internet, all started as Hypertech before falling into the hands of Sleepers and becoming a part of everyday life for millions worldwide. Hypertech is a slow and deliberate Practice. It involves careful experimentation and evaluation of data, a long process of design and iteration, and eventually a working prototype is developed. Concrete achievements are key; repeatable results let them pass the tech on and make it work for everyone. In some ways, it’s the High Ritual Magick of the modern age, with the rituals defined by science and engineering rather than mysticism but just as opaque to the uninitiated. The Practice is about finding potential and then realizing it, particularly the potential of human genius. It’s carefully designed to eventually turn things from magick into mundanity, giving people the tools to make the world better for everyone, not just the mage. Of course, these same tools can be used, and often are, to extract more from the vulnerable and to make the world a worse and worse place as well.",
    "abilities": "Academics, Assessment Analysis (Fortune-Telling), Computer, Crafts, Investigation, Medicine, Microgravity Operations, Research, Science, Technology",
    "instruments": [
      "Books",
      "brain/computer interface",
      "computers",
      "devices and machines",
      "household tools",
      "inventions",
      "laboratories",
      "nanotech",
      "writing",
      "and the many tools of technological achievement"
    ],
    "resonance": [
      "Augmented",
      "Digital",
      "Futuristic",
      "High-Tech",
      "Nanotech",
      "Robotic",
      "Synthetic"
    ],
    "benefit": "Hypertechnicians are adept at bringing their technologies to the level where fully mundane humans can use them. When creating Devices with their own Arete, they can create two for each Permanent point of Willpower they expend, rather than the one point for other mages.",
    "penalty": "Hypertech is a Practice that requires a lot of prep work and often strange and expensive materials. On top of that, unless being transcended at high Arete (see The Heights of Power), Hypertechnology can never be performed without Instruments. A mage with only the Practice of Hypertechnology and no equipment has no abilities that a Sleeper doesn’t.",
    "abilityIds": [
      "academics",
      "fortuneTelling",
      "computer",
      "crafts",
      "investigation",
      "medicine",
      "microgravityOps",
      "research",
      "science",
      "technology"
    ]
  },
  {
    "id": "investment",
    "name": "Investment",
    "page": 85,
    "desc": "There’s nothing quite so magical as putting resources and effort into something and reaping gains significantly greater than the effort put in. That is the Practice of Investment. Investors attempt to improve the world around them (at least, as they see it) by pouring blood, sweat, tears, and sometimes cold hard cash into it. This is one of the slowest Practices that mages can use, but it’s extremely powerful within that constraint. Investors build communities, companies, and even Chantries and Traditions from nothing into powerhouses that can shake the world. Their methods are myriad, but this Practice is flexible and more of an ethos allowing truly long-term workings when combined with other Practices. It’s important to remember that Investors always look for things that will eventually benefit them, whatever it may look like at first. This benefit may be unlikely or far off, but they see some way that improving other people, places, and things will work to their advantage. Some view this as selfish, but when confronted with the amount of effort and scarce resources (including rare forms of Quintessence and Tass) that Investors devote to their projects, it can be hard to maintain this opinion. While associated most strongly with the Syndicate, every faction of mages contains Investors: the Hermetic building up their Covenant’s prestige, the Verbena with an exotic garden, and the Batini building the Web of Faith all use Investment to create such large-scale workings.",
    "abilities": "Academics, Esoterica, Investigation, Law, Leadership, Politics, Research",
    "instruments": [
      "Blessings and curses",
      "contracts",
      "markets",
      "money and wealth"
    ],
    "resonance": [
      "Acquisitive",
      "Growing",
      "Opportunistic",
      "Profitable",
      "Prosperous",
      "Prudent",
      "Resourceful",
      "Savvy",
      "Wealthy"
    ],
    "benefit": "Investors are the masters of long-term projects. Not simply hours long but months or days long. They get -1 difficulty on any effect whose purpose is to set off a change that will take months or years to come to fruition.",
    "penalty": "It is almost impossible for Investment to function on the scale of minutes or hours, and only barely for days. Effects meant to enact changes on timescales less than a week are at +1 difficulty, those making changes within a day are at +2, and those intended to take effect immediately are at +3.",
    "abilityIds": [
      "academics",
      "esoterica",
      "investigation",
      "law",
      "leadership",
      "politics",
      "research"
    ]
  },
  {
    "id": "invigoration",
    "name": "Invigoration",
    "page": 87,
    "desc": "Mind, body, and soul are all constrained, but far, far less than most mages believe they are. Invigoration mages use intense training for all three to break through those limitations and achieve heights, pushing against the limits of human potential. These limits are surpassed through long and arduous work: extreme diets, surgical modification, gene therapy, and even alien technology and cosmic rays right out of comic books are used to unlock the true potential that is sealed within the mage. This Practice straddles the border between mysticism and technology. Meditation is an essential aspect, and martial artists often make use of it. Scientists experiment on themselves while mystics seek to transcend the self, but the common throughlines are that the mage can reach the peak of human potential and perform miraculous feats of strength, healing, reason, and endurance. Often the Practice doesn’t even appear to be magick and can accomplish incredible feats coincidentally. How many Sleepers are primed to believe that a strange diet can unlock extreme strength or amazing healing? Whether that diet is a carefully calibrated slurry of proteins and carbohydrates intended to give the mage perfect nutrition or a bare-bones diet that would cause starvation in normal people but keeps the mage mystically pure seems to barely matter to the masses. Both seem equally plausible and result in Invigoration being an extremely flexible Practice.",
    "abilities": "Athletics, Biotech, Brawl, Esoterica (bodywork, yoga, Tantra, Taoist alchemy, energy-work, etc.), Lucid Dreaming, Martial Arts, Medicine, Meditation, Science",
    "instruments": [
      "Blood and fluids",
      "bodywork",
      "brain/computer interface",
      "brews and concoctions",
      "dances and movement (katas and other exercise forms)",
      "devices and machines",
      "gadgets and inventions (employed to enhance the mage’s capabilities)",
      "drugs and poisons",
      "energy",
      "eye contact",
      "fashion (“dressing the part of a superior human being”)",
      "food and drink",
      "herbs and plants",
      "labs and gear",
      "meditation",
      "money and wealth (which buys all kinds of training)",
      "nanotech (again, as enhancement of human potential)",
      "ordeals and exertions",
      "sex and sensuality",
      "social domination",
      "thought-forms (envisioning one’s perfect self)",
      "voice and vocalizations (which channel energy toward greater potency)"
    ],
    "resonance": [
      "Dynamic",
      "Energizing",
      "Fortifying",
      "Rejuvenating",
      "Resilient",
      "Stimulating",
      "Vibrant"
    ],
    "benefit": "Mages who focus on Invigoration are hard to keep down. They are masters of keeping their energy stores up. As such, they can roll Stamina + Meditation at difficulty 6. For each success, they may convert two points of Quintessence into a point of Willpower.",
    "penalty": "Invigoration is almost impossible to use at a distance. Any Correspondence effect beyond perception is done at +1 difficulty, and is usually Vulgar.",
    "abilityIds": [
      "athletics",
      "biotech",
      "brawl",
      "esoterica",
      "lucidDreaming",
      "martialArts",
      "medicine",
      "meditation",
      "science"
    ]
  },
  {
    "id": "maleficia",
    "name": "Maleficia",
    "page": 90,
    "m20Page": 576,
    "desc": "Only not a Corrupted Practice because it doesn’t depend on any other Practice, Maleficia is essentially mixed into other Practices to create the Corrupted versions. It is the Practice of using deliberate cruelty and causing active harm to change the world, and it can seldom be used constructively for long. Even the smallest magicks using Maleficia are desecrations, and the largest are more like bloodbaths. Maleficia mages almost always hide the Practice from others, knowing that being found using it tends to be the first step into deeper investigations. While some Traditions have looser rules about it, none favor it, and mages who employ it too much are always considered suspicious. If for no other reason, it draws various authorities’ attention. If the Maleficia mage is smart enough to clean up all the physical evidence of their crimes to keep mundane attention off them, they still can’t completely scrub the metaphysical impact of what they’ve done, revealing their presence to other mages. Though commonly associated with the Nephandi, it’s unfortunate that they aren’t even close to a majority among Maleficia practitioners. Verbena have a particularly lax attitude towards it, though sects among the Euthanatoi and Society of Ether are also known to dabble. More surprising to many, both Iteration X and the Progenitors have had issues with Maleficia-focused scientists, and both have tried to make big, public examples of them to discourage others, though with only limited success.",
    "abilities": "Cosmology, Disguise, Enigmas, Esoterica, Expression, Intimidation, Intrigue, Melee, Newspeak, Occult, Pharmacopeia, Propaganda, Seduction, Torture, Vice",
    "instruments": [
      "Artwork",
      "blood and fluids",
      "bodywork",
      "bones and remains (often fresh)",
      "circles and designs",
      "cups and vessels",
      "curses",
      "elements",
      "eye contact",
      "drugs and poisons",
      "gems and valuables",
      "group rites",
      "music",
      "offerings and sacrifice",
      "prayers and invocations",
      "sex (typically non-consensual)",
      "voice",
      "weapons"
    ],
    "resonance": [
      "Deadly",
      "Jinxed",
      "Malevolent",
      "Noxious",
      "Pestilent",
      "Poisonous",
      "Vicious",
      "Wicked"
    ],
    "benefit": "Magick that either deals damage or causes direct non-physical harm to the target is at -1 difficulty. This includes psychological damage, substantial social damage, sapping Willpower, etc.",
    "penalty": "Maleficia is all about harm and destruction. As such, creation is far more difficult. All Quintessence/Tass costs are doubled for this Practice, and any direct creation, both the Pattern Sphere/Prime conjunctions for creation ex nihilo and creation of novel Patterns or Wonders, is at +1 difficulty.",
    "abilityIds": [
      "cosmology",
      "disguise",
      "enigmas",
      "esoterica",
      "expression",
      "intimidation",
      "intrigue",
      "melee",
      "newspeak",
      "occult",
      "pharmacopoeia",
      "propaganda",
      "seduction",
      "vice"
    ]
  },
  {
    "id": "martial_arts",
    "name": "Martial Arts",
    "page": 93,
    "m20Page": 576,
    "desc": "To this day, people mistakenly believe that Martial Arts is simply about fighting, often specifically about fighting unarmed. The simplest part that is wrong is that armed combat is also a part of Martial Arts: fencing/kendo is a somewhat standard reference, but gunplay styles are also martial arts. On top of that, Martial Arts goes far beyond combat, to the point where The Art of War is read by people who will never be in combat or warfare to understand the underlying philosophy therein. Though combat skills are essential, Martial Artists also study philosophy, meditation, and dozens of other disciplines as part of their work. These more esoteric elements help the Martial Artist hone their mind and spirit alongside their body. In many ways, the physical work of learning combat skills fades into the mental work of meditation and back, leading the mage to a higher state of being where they can enter a flow state for combat and achieve superhuman results. Martial Artists can be found across all sorts of mages, from the Akashayana of the Traditions, with their entire philosophy revolving around Do, to the Wu Lung of the Disparates who study Kuei Lung Ch’uan as just one aspect of their work, all the way to the New World Order using their Martial Arts as a means to an end more than anything else.",
    "abilities": "Acrobatics, Alertness, Athletics, Awareness, Esoterica, Etiquette, Fencing, Intimidation, Martial Arts, Medicine, Meditation, Melee",
    "instruments": [
      "Bodywork",
      "dance and movement",
      "energy",
      "herbs",
      "meditation",
      "ordeals and exertions",
      "symbols",
      "wands and staves",
      "weapons",
      "voice"
    ],
    "resonance": [
      "Agile",
      "Controlled",
      "Fierce",
      "Focused",
      "In Motion",
      "Kinetic",
      "Lethal",
      "Precise",
      "Skillful"
    ],
    "benefit": "With the finesse they gain from their training, Practitioners of Martial Arts are significantly deadlier than fully mundane martial artists. They may choose whether to deal Bashing or Lethal damage on each Martial Arts attack.",
    "penalty": "Once Martial Arts becomes a part of a character’s metaphysical Practice, it becomes harder and harder for them to Brawl. If their Brawl Skill is higher than their Martial Arts Skill, the difference is applied as a difficulty penalty to Martial Arts magick. Once their Martial Arts Skill equals Brawl, they can no longer use Brawl. Any rotes involving Brawl must be relearned as Martial Arts rotes.",
    "abilityIds": [
      "acrobatics",
      "alertness",
      "athletics",
      "awareness",
      "esoterica",
      "etiquette",
      "fencing",
      "intimidation",
      "martialArts",
      "medicine",
      "meditation",
      "melee"
    ]
  },
  {
    "id": "media_control",
    "name": "Media Control",
    "page": 96,
    "desc": "While Dominion trains a mage to command and Investment to think big, Media Control combines the two tendencies, resulting in mages who can simultaneously influence vast numbers of people. At times, this becomes the most important Practice in how the Ascension War is fought, not with bullets and spells, but with words and images put in front of the Sleepers, and changing how they look at the world around them. The naive think of Media Control as focusing on newspapers, television, film, and music. These are just the tip of the iceberg in a world of podcasts, blogs, art, and social networks. Even scientific and academic journals are a sort of media whose control can be valuable for working large effects in some of the Ascension War’s most active arenas. Technically savvy mages use Media Control via algorithms, manipulating the content recommended to users on social media sites, streaming sites, and generally anywhere computers are making content choices. This is one of their favorite techniques for using the Practice, as it is an incredible force multiplier: changing which ads are served on a major social media site can influence hundreds of millions, if not billions, of people every single day until the site finds the change and corrects it, and if there’s one thing mages have learned, it’s that so long as the changes are small enough to not impact metrics, they can go unnoticed for days, weeks, even months.",
    "abilities": "Art, Empathy, Expression, Intimidation, Politics, Subterfuge, Technology",
    "instruments": [
      "Artwork",
      "books",
      "scrolls",
      "and periodicals",
      "eye contact",
      "fashion",
      "mass media",
      "physical media",
      "social media",
      "writings",
      "inscriptions",
      "and runes"
    ],
    "resonance": [
      "Compelling",
      "Controlling",
      "Dominant",
      "Hypnotic",
      "Influential",
      "Manipulative",
      "Persuasive",
      "Propagandistic",
      "Subversive"
    ],
    "benefit": "By its nature, Media Control can reach much farther than other magicks. By doubling the number of successes required and a difficulty penalty of +2, a mage using Media Control can affect all people who view the media they use. Making the effect permanent in this way requires another doubling, so creating a permanent effect on all viewers of a work of art requires four times the successes and is at +2 difficulty.",
    "penalty": "By its nature, Media Control magick can never simply be Vulgar. Coincidental effects are unaffected, but anything Vulgar is always treated as Witnessed: if no one is watching, it can’t have any effect.",
    "abilityIds": [
      "art",
      "empathy",
      "expression",
      "intimidation",
      "politics",
      "subterfuge",
      "technology"
    ]
  },
  {
    "id": "medicine_work",
    "name": "Medicine-Work",
    "page": 99,
    "m20Page": 576,
    "desc": "While in the modern world, “medicine” tends to mean specifically scientific medicine to deal with illness and injury, it has historically had broader uses. Medicine-Work is, broadly speaking, the Practice of healing, but healing is not always meant as of a literal, physical body. In many cultures around the world, their mystics view themselves entirely as “medicine people” who heal what is damaged with their skills, and that native terms for their roles were translated as such is no accident, as even in the modern world, healing is one of the most important and sacred paths available to a person. The line between mysticism and technology in Medicine-Work is blurry even to the most partisan practitioners. Both extremes take an “anything that works” attitude toward healing. The largest divide between them is the question of what things should be or can be healed. Mystics believe in healing mind, body, soul, and often more abstract things like communities and spirits. At the same time, technomancers often restrict Medicine-Work to simply the body and the mind (and some neglect even the mind). All agree that it’s a huge responsibility and burden to have the power of healing, however they define it and places them in a position of immense trust by their community.",
    "abilities": "Academics (healing practices), Art (masks, dance, music, etc.), Awareness, Empathy, Esoterica (herbalism, energy work, bodywork, healing and meditative practices), Medicine, Meditation, Pharmacopeia, Science, Technology",
    "instruments": [
      "Artwork",
      "blessings and curses",
      "blood and fluids",
      "bodywork",
      "bones and remains",
      "books",
      "brews and concoctions",
      "computers",
      "cups and vessels",
      "dance and movement",
      "devices and machines",
      "drugs and poisons",
      "group rites (operations)",
      "herbs",
      "laboratories",
      "languages (Latin, jargon, and that weird script doctors use when writing prescriptions)",
      "meditation",
      "music",
      "offerings and sacrifices",
      "prayers and invocations",
      "social domination",
      "voice",
      "weapons (surgical instruments)"
    ],
    "resonance": [
      "Healing",
      "Medical",
      "Rehabilitative",
      "Restorative",
      "Soothing",
      "Therapeutic",
      "Wholesome"
    ],
    "benefit": "As Medicine-Workers are specialists in healing, to the point where their whole Practice revolves around it, they receive -1 difficulty on all healing magicks.",
    "penalty": "Though Medicine-Work does teach how to heal, in most cultures, healers are bound to not do any harm to justify the intense trust that must be placed in them. As such, even if it is Coincidental, a Medicine-Worker who uses it to directly cause damage always gains Paradox as though it were Vulgar (though difficulty does not change).",
    "abilityIds": [
      "academics",
      "art",
      "awareness",
      "empathy",
      "esoterica",
      "medicine",
      "meditation",
      "pharmacopoeia",
      "science",
      "technology"
    ]
  },
  {
    "id": "mediumship",
    "name": "Mediumship",
    "page": 101,
    "desc": "Through Mediumship, a mage becomes a bridge between the worlds of flesh and spirit. Most commonly, Mediums bridge the gap with the dead, but many are more versatile or even attuned to the spirits of nature or those of ideas that live in the Primal Wilds or the Astral Realms, respectively. While other mages, such as Shamans or Ritualists, may summon spirits to come before them, Mediums more often invite them into their bodies, volunteering to be possessed. Most commonly, they enter a trance state after calling out or even simply opening themselves to any spirit in the area who needs to express themself. Naturally, this can be extremely dangerous, and a risk most mediums take is that they don’t always know who or what they’re inviting in. While Mediums generally channel spirits, they can channel more abstract things they perceive (even if others don’t) for more general effects. Some combine their Mediumship with Past Lives or channel alien entities, ascended masters, and even demons, who sometimes turn out to be all too real for comfort. This flexibility allows the Medium to perform strange feats and is often a key to improvisational magick.",
    "abilities": "Awareness, Belief Systems, Cosmology, Empathy, Enigmas, Esoterica (channeling, Theosophy, spiritualism, etc.), Expression, Intimidation, Investigation (things no living human should know), Linguistics, Lucid Dreaming, Meditation, Occult, Research, and other Abilities (especially Knowledges) the character doesn’t usually know (see the Background: Dream)",
    "instruments": [
      "Artwork (masks, drawings, “channeled writing”)",
      "blood and fluids",
      "bodywork",
      "bones and remains",
      "brews and concoctions",
      "dance and movement",
      "drugs and poisons",
      "eye contact",
      "fashion (ritual garb, often made from the remains of dead animals or people)",
      "gems (crystal balls, geodes, focus-stones)",
      "herbs and plants",
      "languages (speaking in tongues, foreign, alien or “dead” languages)",
      "meditation",
      "ordeals and exertions",
      "sex and sensuality",
      "social domination",
      "voice and vocalizations (radically different voices than the character’s own)",
      "writing (automatic writing, alien transcriptions)"
    ],
    "resonance": [
      "Channeling",
      "Dead",
      "Ectoplasmic",
      "Ethereal",
      "Otherworldly",
      "Psychic",
      "Spectral",
      "Spiritual",
      "Transcendent"
    ],
    "benefit": "Each Medium has an affinity for one of the three Umbrae. Whenever they are working with beings from their preferred Umbra or performing magick across the Gauntlet to or from it, they receive -1 difficulty.",
    "penalty": "Mediums are bad at keeping spirits out, especially for the ones from their Umbra. Resisting possession is at +1 difficulty for them against all spirits but +2 difficulty against spirits from the Umbra they have an affinity for.",
    "abilityIds": [
      "awareness",
      "beliefSystems",
      "cosmology",
      "empathy",
      "enigmas",
      "esoterica",
      "expression",
      "intimidation",
      "investigation",
      "lucidDreaming",
      "meditation",
      "occult",
      "research"
    ]
  },
  {
    "id": "psionics",
    "name": "Psionics",
    "page": 103,
    "desc": "Often hard for even other mages to distinguish from the linear “psychics” (see M20: Sorcerer for more on them), Psionicists believe in mind over matter and that the psyche can achieve almost anything. The core of their Practice is the belief that consciousness can directly manipulate the physical world. They draw from both modern fringe science and some of the strange lore of the past to back this belief up and develop their techniques. Psionicists first cultivate greater awareness, learning to extend their perceptions to directly experience aspects of the world closed off to others. Once they can wrap other phenomena in their consciousness, they can “flex” that consciousness to manipulate them directly. The most fundamental tool in their arsenal is meditation, but contrary to naive impressions, psychics use many other tools to focus their minds and change the world. Some use physical movements like dances, others use mantras, prayers, and songs, and still more use small objects and the tools used by fringe scientists who study psychic phenomena. The flexibility that Psionics has between mysticism and science put its practitioners into an awkward place in the Ascension War. The Traditions and the Technocracy both recruit Psionicists heavily. The Technocracy finds them especially useful as Psionicists fit their view of the world and can work with essentially no Instruments under duress, so this Practice is especially valued for their field agents.",
    "abilities": "Alertness, Awareness, Empathy, Enigmas, Esoterica (psychic phenomena, Thelema, Theosophy, yoga), Intimidation, Lucid Dreaming, Martial Arts, Meditation",
    "instruments": [
      "Bodywork",
      "brain/computer interface",
      "devices and machines",
      "and nanotech (all of which can enhance psychic potential)",
      "cards and instruments of chance",
      "dances and movement",
      "drugs",
      "energy",
      "eye contact",
      "fashion (“dress how you wish to feel”)",
      "formulae and math",
      "numbers and numerology",
      "group rites",
      "music",
      "languages (especially modes of “mental rewiring” speech such as neuro-linguistic programming, non-violent communication, and glossolalia)",
      "management and HR",
      "meditation",
      "sex and sensuality",
      "social domination",
      "symbols",
      "thought-forms",
      "True Names",
      "voice and vocalizations (chants and mantras)",
      "writings",
      "inscriptions",
      "and runes"
    ],
    "resonance": [
      "Astral",
      "Intuitive",
      "Mental",
      "Psychic",
      "Telekinetic",
      "Telepathic"
    ],
    "benefit": "Psionicists can ignore the conjunctional requirement of Mind 3 to maintain active control over an effect. This allows continuous telekinesis with just Forces, for example.",
    "penalty": "The Psionics Practice is bound by Willpower in a way that other Practices aren’t. When used, the mage’s Arete dice pool is capped at their temporary Willpower rating.",
    "abilityIds": [
      "alertness",
      "awareness",
      "empathy",
      "enigmas",
      "esoterica",
      "intimidation",
      "lucidDreaming",
      "martialArts",
      "meditation"
    ]
  },
  {
    "id": "reality_hacking",
    "name": "Reality Hacking",
    "page": 106,
    "m20Page": 577,
    "desc": "Many people mistake Reality Hackers for computer hackers or even think all hacking is done on a computer, touch-tone phone, or other information technology hardware. This naivety has gotten many mages into trouble when running into Reality Hackers who aren’t what they expected. For aficionados, hacking is the art of taking disparate things and piecing them together into a new whole in a creative way that works, often only barely. They’re as likely to work with computers as with mechanics or social systems. They tend to exploit unintended behaviors: security weaknesses and strange interactions between things to accomplish their goals. To a Reality Hacker, every problem feels like a puzzle, and the pieces are scattered around them in their environment. Computer hackers assemble code snippets, bits of social engineering, known weaknesses in systems, and even bizarre tricks with hardware, like reading the computer’s electromagnetic field to deduce what it’s doing to extract data from a target. Other Reality Hackers may be able to turn scraps of metal in a cave into a suit of power armor or even a pile of coconuts into a radio in extreme circumstances. It’s best to never assume a Reality Hacker won’t be able to figure out some way to put things together to accomplish their goals unless they’re locked inside a featureless steel cube, and even then, some can be very clever.",
    "abilities": "Academics (history, philosophy, social sciences), Art, Belief Systems, Computer, Expression, Government, Jury-Rigging, Media, Politics, Science (psychology as well as physical sciences), Subterfuge, Technology",
    "instruments": [
      "Artwork",
      "books",
      "brain/computer interface",
      "computers and IT gear",
      "devices and machines",
      "drugs",
      "eye contact",
      "group rites",
      "language",
      "mass media",
      "money and wealth",
      "music",
      "nanotech",
      "sex",
      "social domination",
      "symbols",
      "thought forms",
      "tricks and illusions",
      "voice",
      "weapons"
    ],
    "resonance": [
      "Ad Libbed",
      "Elastic",
      "Fluid",
      "Fractal",
      "Improvised",
      "Malleable",
      "Plastic",
      "Transformative",
      "Viral"
    ],
    "benefit": "Reality Hackers are excellent at cobbling things together from whatever is around them. When they hack together a solution to a problem, if they can give even a vaguely plausible explanation for why the pieces they have could be combined to do what they want, the magick is Coincidental.",
    "penalty": "Hackers subvert systems and push them in their desired direction, taking advantage of weaknesses or unusual opportunities. They tend not to work directly. All Vulgar magick is at +1 difficulty with Reality Hacking.",
    "abilityIds": [
      "academics",
      "art",
      "beliefSystems",
      "computer",
      "expression",
      "juryRigging",
      "media",
      "politics",
      "science",
      "subterfuge",
      "technology"
    ]
  },
  {
    "id": "shamanism",
    "name": "Shamanism",
    "page": 109,
    "m20Page": 577,
    "desc": "Shamanism is a catch-all term for a Practice that exists outside the everyday realm and works consistently with spirits. Shamans rarely fit comfortably into boxes; when they find one that does, it tends not to fit for long. Instead, they sit at boundaries: between flesh and spirit, order and chaos, life and death, sanity and madness, human and animal, etc. They often appear farther to one end or the other than they actually are due to complex webs of obligation and debt towards the various spirits they work with regularly. Though mages of other Practices work with spirits regularly, Shamans consider spirits to simply be another sort of people. They may be different from humans, but they have their own cultures and languages, wants and needs, and the Shaman’s role is often to bridge humanity and the spirits. That places them in the role of magician, diplomat, traveler, and sometimes warrior, often more than one at a time. It leads to complex roles and identities often inscrutable to outsiders to their culture and sometimes even to non-Shamans within it. Modern Shamanism is evolving. Though the role and purpose remain the same as ever, the techniques used catch up to many of the changes that Shamans opposed in the past and tried to wish away. This new breed are often called Technoshamans for their willingness to use technology as part of their toolkit and their new and often close relationships to the spirits of technology.",
    "abilities": "Alertness, Art, Cosmology, Enigmas, Esoterica, Expression, Lucid Dreaming, Medicine, Pharmacopeia, Streetwise, Survival",
    "instruments": [
      "Blood and fluids",
      "bones and remains",
      "computers",
      "dance",
      "drugs and concoctions",
      "elements",
      "herbs",
      "household tools",
      "offerings and sacrifice",
      "ordeals",
      "sex and sensuality",
      "thought forms",
      "toys",
      "True Names",
      "voice",
      "weapons"
    ],
    "resonance": [
      "Ancestral",
      "Guided",
      "Otherworldly",
      "Soulful",
      "Spiritual",
      "Transcendent",
      "Visionary"
    ],
    "benefit": "Shamans are intermediaries between the spiritual and the physical, so they have a much easier time working between them. Each Shaman chooses one environment, such as cities, forests, etc.; in that space, the Gauntlet is treated as one lower for them.",
    "penalty": "Shamans have a somewhat tenuous connection to sanity by their nature. They are more likely than other mages to go into Quiet. Often this simply takes the form of a minor Hobgoblin or two related to a Madness Quiet, but these minor Quiets will grow more severe if not resolved.",
    "abilityIds": [
      "alertness",
      "art",
      "cosmology",
      "enigmas",
      "esoterica",
      "expression",
      "lucidDreaming",
      "medicine",
      "pharmacopoeia",
      "streetwise",
      "survival"
    ]
  },
  {
    "id": "voudoun",
    "name": "Voudoun",
    "page": 113,
    "m20Page": 577,
    "desc": "Dragged out of Central Africa and brought to the Caribbean, where it fused with Native American practices and Catholicism, Voudoun was forged in the fires of the American slave trade. It’s a Practice of survivors, people who do what they must. The world is treacherous, and Voudoun mages find and revere allies, particularly the Loa (see Gods and Monsters p. 169-180 for some basics.) Voudoun has some similarities with Faith and God-Bonding, and the related Instruments overlap quite a bit. Where they differ is in the way Practitioners interact with their divinities. Voudoun mages invite them in, being ridden by the Loa, who perform the magick. Many of their Instruments revolve around inviting the Loa in, ensuring the correct one responds, and channeling the powers of the Loa as the mage needs. The core of Voudoun is trust between the practitioner and the Loa. The ties are extremely tight, more like family than traditional spirit patrons. This familial trust is far more important than arcane rituals or displays, though both are used in Voudoun. Despite this, Voudoun doesn’t require much in the way of resources: rituals require effort more than money, as historically, the practitioners have been very poor, though some modern ones are much wealthier.",
    "abilities": "Art, Athletics, Awareness, Belief Systems, Carousing, Crafts, Empathy, Intimidation, Lucid Dreaming, Medicine, Meditation, Streetwise",
    "instruments": [
      "Artwork (vévés)",
      "blessings and curses",
      "blood",
      "bones and remains",
      "cards and dice",
      "cups and vessels",
      "crossroads",
      "dance and movement",
      "drugs and poisons",
      "elements",
      "eye contact",
      "fashion",
      "group rites",
      "herbs",
      "household tools",
      "knots and rope",
      "languages",
      "meditation",
      "music",
      "offerings and sacrifices",
      "prayers and invocations",
      "sex and sensuality",
      "symbols",
      "True Names",
      "voice",
      "wands and staves",
      "weapons",
      "writing"
    ],
    "resonance": [
      "Ancestral",
      "Intense",
      "Mesmerizing",
      "Possessed",
      "Revelatory",
      "Soulful",
      "Spirit-Guided",
      "Transcendental"
    ],
    "benefit": "Though not directly the focus of Voudoun, its most famous applications are blessings and curses. Voudoun mages get -1 difficulty on any attempt to bless or curse someone (whether via Entropy, Prime, or some other method). However, this difficulty reduction requires they have a piece of the person, usually hair clippings, as their sympathetic connection.",
    "penalty": "The Voudoun Practitioner must maintain good relationships with the Loa at any given time. If they try to call upon a Loa that they have not maintained a relationship with or whose agendas they have worked against, they do so at a +1 difficulty penalty.",
    "abilityIds": [
      "art",
      "athletics",
      "awareness",
      "beliefSystems",
      "carousing",
      "crafts",
      "empathy",
      "intimidation",
      "lucidDreaming",
      "medicine",
      "meditation",
      "streetwise"
    ]
  },
  {
    "id": "weird_science",
    "name": "Weird Science",
    "page": 115,
    "m20Page": 578,
    "desc": "Science is generally careful and predictable, building on previous knowledge and creating a coherent whole. Rarely, a significant discovery or other theory comes out, overturning prior understanding. Sometimes, though, a scientist goes off and sees things that are just weird. The Weird Scientist would prefer reproducible results, but they aren’t the be-all, end-all like for most technomages. Instead, Science, often capitalized, is a creative act. For the Weird Scientist, sometimes called an Intuitive Scientist, logic provides suggestions at best and challenges at worst. Both of them are to be overcome to bring Science into the world. Defunct theories that mainstream science has rejected are often the raw material of Weird Science. Few would balk at N-rays, spontaneous generation, phlogiston, or Freudian psychology. Many come up with far stranger theories that they build their inventions on. Weird Scientists are dissidents against mundane science, challenging it with their theories and seeking to overturn the scientific consensus, and with it, the larger Consensus limiting their work. They refuse to accept any limits, not society’s, not the so-called “laws of physics,” and not the more esoteric boundaries of what the human mind is capable of comprehending.",
    "abilities": "Academics, Crafts, Esoterica (various so-called disproven scientific theories), Jury-Rigging, Research, Science, Technology",
    "instruments": [
      "Armor",
      "books",
      "bones and remains",
      "brain/computer interface",
      "celestial alignments",
      "computers and IT gear",
      "devices and machines",
      "elements",
      "gadgets",
      "inventions",
      "laboratories",
      "languages",
      "numbers and numerology",
      "toys",
      "vehicles",
      "weapons",
      "writing and inscriptions"
    ],
    "resonance": [
      "Bizarre",
      "Clockwork",
      "Creative",
      "Electric",
      "Homeopathic",
      "Hyperspatial",
      "Insightful",
      "Radiant",
      "Studious"
    ],
    "benefit": "Weird Science is hard for more traditional scientists and technomancers to handle. Anyone trying to use Science or Technology to understand something made with Weird Science, especially to take it apart or to prevent it from working, does so at +1 difficulty unless they have the Weird Science Practice (or are unAwakened and have studied weird science in another way).",
    "penalty": "The inventions of Weird Science don’t interface easily with mundane technology. Any attempt to use Weird Science to influence ordinary technology is at +1 difficulty.",
    "abilityIds": [
      "academics",
      "crafts",
      "esoterica",
      "juryRigging",
      "research",
      "science",
      "technology"
    ]
  },
  {
    "id": "witchcraft",
    "name": "Witchcraft",
    "page": 118,
    "m20Page": 578,
    "desc": "Where some Practices are scholastic and abstract, Witchcraft focuses on the practical and the visceral. It tends to be nature-oriented, so most Witches focus on the Sphere of Life, though the elemental magicks of Matter and Forces are also common. Representing folk practices often used by the poor peasantry, Witchcraft has often been suppressed in Europe and worldwide. This historical suppression has resulted in Witchcraft gathering an outlaw mystique, an air of rebelliousness that has aided it in becoming more popular in the modern world. Though traditionally associated with herblore and cauldrons, modern Witches use more complex tools, including many that integrate technology into their Practice. To most Witches, though nature is important, and they must be concerned with it, the practicalities of life and using magick to accomplish things here and now rather than in some abstract future take primacy. As such, computers are a regular tool, allowing the more efficient sharing of spells between Witches, but also spells have been devised taking advantage of quantum theory, mass media, and chaos theory, because, in the end, Witchcraft is willing to do whatever works, especially in the context of ancient knowledge being updated to work more easily in the modern world.",
    "abilities": "Academics, Animal Kinship, Art, Awareness, Crafts, Fortune-Telling, Medicine, Meditation, Occult, Pharmacopeia",
    "instruments": [
      "Artwork",
      "blessings and curses",
      "blood and fluids",
      "bodywork",
      "bones and remains",
      "books",
      "brews",
      "cards",
      "celestial alignments",
      "circles",
      "crossroads",
      "cups and vessels",
      "dance",
      "drugs and poisons",
      "elements",
      "eye contact",
      "group rites",
      "household tools",
      "knots and ropes",
      "music",
      "offerings",
      "sex and sensuality",
      "social domination",
      "symbols",
      "True Names",
      "wands and staves",
      "weapons",
      "writing and inscriptions"
    ],
    "resonance": [
      "Ancient",
      "Bloody",
      "Eerie",
      "Eldritch",
      "Fertile",
      "Fey",
      "Natural",
      "Seasonal"
    ],
    "benefit": "The Practice of Witchcraft generally revolves around natural cycles. Each Witch chooses a cycle that their magick is tied to. Any magick they do that ties into that cycle (cold magick in Winter for a seasonal mage, causing a flood at high tide for a lunar mage, etc.) receives a -1 difficulty bonus.",
    "penalty": "Even though some Witches integrate technology into their Practice, their magickal energies are fundamentally based in nature. Witches cannot use any Tass that takes on unnatural forms like batteries or other technological objects. They must restrict themselves to natural-form Tass, such as water, leaves, moss, etc.",
    "abilityIds": [
      "academics",
      "animalKinship",
      "art",
      "awareness",
      "crafts",
      "fortuneTelling",
      "medicine",
      "meditation",
      "occult",
      "pharmacopoeia"
    ]
  },
  {
    "id": "yoga",
    "name": "Yoga",
    "page": 122,
    "m20Page": 578,
    "desc": "Originating in South Asia, Yoga has spread to all corners of the modern world. Often mistaken for stretching exercises and meditation, it’s far deeper than that, an ancient practice of conscious refinement of the mind, body, and soul. This first goal is to strip away the illusions of the world and show the practitioner raw Reality. The ultimate goal is to use these insights to attain a higher state of being, particularly in the next life, as reincarnation is one of the base assumptions of traditional Yoga (though modern practitioners vary more on this issue). Every aspect of the mundane exercise of Yoga comes from the mystical Practice and has transcendental meaning. The vocalizations, stretches, and meditation all have roots in the metaphysical, bringing the Practitioner closer to that transcendental state they seek. Along the way, this brings them first to the peak of human abilities and then takes them beyond it, into realms only explained through magick. With outsiders, Westerners in particular, divorcing Yoga from its mystic context, the way has been opened for mages to use it without believing in all of its metaphysical aspects. The exercises and stretches can push the human body to the limit. Even some Technocrats use them, which the mystical Yogi who follow the mystical aspects find terribly offensive.",
    "abilities": "Athletics, Awareness, Enigmas, Esoterica, Expression, Medicine, Meditation, Survival",
    "instruments": [
      "Bodywork",
      "circles and designs",
      "dances and movement",
      "energy",
      "languages (Sanskrit)",
      "meditation",
      "music",
      "ordeals",
      "prayers",
      "sex and sensuality",
      "symbols",
      "thought forms",
      "voice (mantras, the Om)",
      "writings and inscriptions"
    ],
    "resonance": [
      "Astral",
      "Balanced",
      "Centered",
      "Energetic",
      "Grounded",
      "Meditative",
      "Mindful",
      "Relaxed"
    ],
    "benefit": "The self-awareness that Yoga teaches makes Yogi better at preserving themselves and expelling outside forces. They receive a -1 difficulty bonus to do so. This applies to possession by spirits, mental control, and illness, among other things.",
    "penalty": "While Yoga can be vulgar, it is very centered on the self. Effects that do not focus on the mage or which visibly come from elsewhere (a fireball as opposed to breathing fire) are all at +1 difficulty.",
    "abilityIds": [
      "athletics",
      "awareness",
      "enigmas",
      "esoterica",
      "expression",
      "medicine",
      "meditation",
      "survival"
    ]
  }
],

  // Specialized (faction-gated) and Corrupted practices. faction matches
  // M20.TRADITIONS / TECHNOCRACY / DISPARATES[].name; corrupted entries have
  // faction null. A specialty is rated in place of its base practice and
  // shares the base practice's Associated Abilities and Instruments.
  SPECIALTIES: [
  {
    "id": "royal_art",
    "name": "The Royal Art",
    "base": "alchemy",
    "faction": "Children of Knowledge",
    "corrupted": false,
    "page": 36,
    "desc": "Though many groups within Mage practice Alchemy of various sorts, the Children of Knowledge are the true masters of it, whatever anyone else says. Many mock their current form and the influence that LSD has had on them, but they know the truth: that it has opened them up to new avenues of the alchemy of the mind and soul that have no real analogy in the alchemy of substances and bodies. They have integrated LSD, notably the product of alchemy itself (in the modern form of chemistry, which they simply see as the alchemy of nonliving substances), into their Royal Art and continue in their quest to achieve rubedo and produce the Philosopher’s Stone, and a truly perfected human being, rather than the dangerous failure that was Heylel so many centuries ago.",
    "benefit": "Adept at using unexpected components and finding ways to make it work, practitioners of the Royal Art can produce Charms using any Quintessence or Tass as though it had the appropriate resonance for their workings. Even Quintessence and Tass with horrific resonance can be used without penalty or drawbacks, as the albedo stage of creation will purify it into whatever the Child of Knowledge needs."
  },
  {
    "id": "feralism",
    "name": "Feralism",
    "base": "animalism",
    "faction": null,
    "corrupted": true,
    "page": 39,
    "desc": "The communion of Animalism comes with a dark reflection: Feralism. Most Animalists try to balance the uncivilized aspects of their animal nature with their humanity. Feralists abhor their humanity and embrace the abandonment of civilization and discipline. Their techniques are vicious, and they are rarely able to distinguish friends from foes, more comfortable with animals than humans. Feralist magick is violent and brutal, often dripping with blood. Many Animalists have fallen down this path upon disappointment with humanity and the modern world, using it to fight back.",
    "benefit": "Feralists get a -1 difficulty bonus on all violent magick directed at the products of civilization, including most forms of modern technology and mages who are in some sense attached to the city.",
    "price": "As an Animalist becomes a Feralist, relating to civilization gets harder. They suffer an increasing penalty, from +1 to +3 difficulty, on Drive, Etiquette, Technology, Science, and other rolls to interact with modern civilization."
  },
  {
    "id": "hypereconomics",
    "name": "Hypereconomics",
    "base": "art_of_desire",
    "faction": "Syndicate",
    "corrupted": false,
    "page": 45,
    "desc": "The Syndicate looked at the Art of Desire and saw mathematics and systems. From this, they developed the Practice of Hypereconomics. This is the Science of human wants in aggregate and at scale. This is as mathematically precise a theory as anything else in Economics and has pushed the Syndicate to several realizations. Among these are the facts that the Syndicate will likely never be able to persuade humanity to accept a utopia without work or want and that completely eliminating the desire for the mystical and the occult is just as unlikely. They keep these conclusions tightly under wraps, as they fear how the rest of the Union would react (according to their models: badly) to the realization that certain aspects of the program would never be completed. Instead, they argue for nuanced and specific goals and use Hypereconomics to bring resources to bear to make them possible.",
    "benefit": "While the Art of Desire focuses on a person’s desires, Hypereconomics is about groups. A Hypereconomist can treat a polity (usually of at most a few hundred individuals) as a single unit for determining or fulfilling their desires at no penalty."
  },
  {
    "id": "weaving",
    "name": "Weaving",
    "base": "craftwork",
    "faction": "Taftani",
    "corrupted": false,
    "page": 56,
    "desc": "While Craftwork is a catch-all for Practices involving constructing things, often intricate or elaborate, with the mage’s hands, the Taftani specialize specifically in weaving textiles. Their very name comes from this Practice. They hand-weave their clothing and their most famous Wonder, the Flying Carpet, and more figuratively, they weave traps for the spirits they pursue. More metaphorically, they weave words together into poems. Taftani poetry is sublime in ways that those only familiar with the most martial members of their Craft are regularly shocked by. They work in many forms and languages and use the poetry in their magick every bit as much as their literal weaving. The two even come together at times, with poetry woven into their textiles, a necessary component for many of their most powerful artifacts.",
    "benefit": "The Taftani consider magick an expression of their soul, and it is cowardice to withhold it, particularly out of fear of Paradox or the Technocracy. As they are well-practiced in it, they have a -1 difficulty modifier on all Vulgar magick. This has no effect on Paradox accumulation."
  },
  {
    "id": "abyssalism",
    "name": "Abyssalism",
    "base": "crazy_wisdom",
    "faction": null,
    "corrupted": true,
    "page": 59,
    "desc": "Beyond rationality lies the Void. To Abyssalists, all of the truths that Crazy Wisdom contains emanate from the Void. It’s a union of opposites, sophisticated and primal, ordered and chaotic. But where Crazy Wisdom derives meaning from contradictions and complexities, Abyssalism negates it. It finds the wrongness in things and emphasizes it. Abyssalists don’t merely have no respect for the truth, but they revel in perverting it, using lies and portraying them as true from a certain point of view.",
    "benefit": "Deceiving with magick is second nature to Abyssalists. All magickal illusions, lies, half-truths, and other manipulations are performed at -1 difficulty.",
    "price": "While Practitioners of Crazy Wisdom are usually able to find themselves, once they start working with Abyssalism, they are metaphysically Lost. By building their foundation on the negation of rationality and the very concept of truth, they cannot relate to Reality. Every Abyssalist is in Quiet, with a rating at least half their rating in Abyssalism, rounded up."
  },
  {
    "id": "occultation",
    "name": "Occultation",
    "base": "crazy_wisdom",
    "faction": "Ahl-i-Batin",
    "corrupted": false,
    "page": 59,
    "desc": "Delving into irrationality is common among mystics, but only a few learn to fully immerse themselves in it. The Batini practice of Occultation involves covering every trace of their passing, leaving nothing for the rational mind to lock onto when searching for them. However, some believe that traces for the irrational, subconscious mind to find will still exist until they truly master the Practice. The core of the Practice is the denial of the self. The Batini denies their own nature so strongly that they pass beyond inversion and start moving toward nonexistence. This Practice comes with danger because while disappearing can be extremely useful, the mage must be careful not to disappear so thoroughly that they forget who they are. The Batini study labyrinths, mazelike figures with only a single winding path through them and no dead-ends, to combat this tendency, figuratively hiding their selves at the center and tracing the path back when they feel they are lost.",
    "benefit": "Any Batini may acquire a dot of Arcane per dot of the Occultation Practice as a coincidental •• Mind effect. They can not, however, choose to only take part of this benefit. If they go above 5 dots of Arcane at any time, they start to lose their sense of self and their metaphysical connection to reality starts to fray unless they take the precaution of a ••• Mind effect to place their notion of self at the center of a labyrinth as described above. Doing so allows them to end the Occultation effect at any time and return fully to their normal existence."
  },
  {
    "id": "integrative_technology",
    "name": "Integrative Technology",
    "base": "cybernetics",
    "faction": "Iteration X",
    "corrupted": false,
    "page": 62,
    "desc": "While Cybernetics, in general, only refers to the use of machines to enhance human capabilities, Integrative Technology is more in line with popular notions of cybernetics. Integrative Technology is integrated into the human body, melding man and machine into a whole greater than either part. Though some external technology (wheelchairs, hearing aids) is considered part of Integrative Technology, the vast majority is in the form of implants. Iteration X, in particular, implants lots of advanced technology. They don’t hesitate to put implants directly into the brain. In fact, the specifics of brain implants are debated, but the implants themselves are non-controversial.",
    "benefit": "Thanks to their propensity for integrating technology into themselves, Iterators who use their Enhancements as Instruments (instead of using their built-in capabilities) do so at -1 difficulty."
  },
  {
    "id": "authority",
    "name": "Authority",
    "base": "dominion",
    "faction": "New World Order",
    "corrupted": false,
    "page": 65,
    "desc": "Some people dominate others through intimidation and power. They often wield Dominion as a cudgel, forcing people to do their bidding. The New World Order wields it like a scalpel, though they always keep the cudgel in their back pocket in case they need it. Rather than rely on sheer dominance, they instead cultivate Authority. When they need to accomplish something, it turns out that they have the right to do it, often signed off in triplicate by the relevant people. The New World Order’s Authority is absolute. This can sometimes lend them a strangely mystic air, even bordering on Hermetic, because when they show up and tell Reality to move, even if it costs them some Paradox, Reality recognizes that they have the right to make that demand.",
    "benefit": "If it is possible for someone to have the right to give a command, the New World Order can borrow that Authority. So long as it isn’t an Authority strictly opposed to the New World Order (for example, within the Order of Hermes), the mage gets -1 difficulty to assert it with an hour of preparation."
  },
  {
    "id": "wayfinding",
    "name": "Wayfinding",
    "base": "elementalism",
    "faction": "Kopa Loei",
    "corrupted": false,
    "page": 68,
    "desc": "In the hands of Polynesian peoples, represented by the Kopa Loei, Elementalism has been consistently a potent and flexible Practice. In fact, it has been one of the keys to their culture: Wayfinding. Wayfinding is the art of sailing from one island to another over long stretches of the Pacific Ocean. In many ways, this is one of the most difficult-to-navigate environments in the world. Wayfinders tend to specialize in the elements of Wind and Water, though some work with Light; the best of them can work with all three, navigating by currents, winds, and stars in equal measure. Their personalized Instrument usually takes the form of their boat, generally in the traditional Polynesian vaka style, and it includes tools for working with all three Wayfinding elements.",
    "benefit": "Wayfinders are rarely lost in familiar places. So long as they’re in a region they’ve spent a week or more in, they receive -1 difficulty to all effects involving travel within the region or figuring out their location."
  },
  {
    "id": "black_mass",
    "name": "The Black Mass",
    "base": "faith",
    "faction": null,
    "corrupted": true,
    "page": 71,
    "desc": "Originally specifically the inversion of Catholic sacraments, the modern Black Mass takes many forms. In all cases, though, the practitioner takes something sacred from their former life and inverts it, using it for blasphemy and violating the symbolism it’s meant to have. The Catholic form continues to be the most familiar, with elements such as the symbolic cannibalism of the Eucharist converted to literal cannibalism. For Practitioners, the Black Mass’s blasphemy is the primary point. They draw power not just from Faith but from deliberately violating its strictures.",
    "benefit": "Practitioners of the Black Mass have a much easier time summoning demons and other spirits antagonistic to their original Faith. All such summoning attempts are at -1 difficulty.",
    "price": "The mage’s co-religionists can sense subconsciously that they’ve been dabbling in The Black Mass. They cannot maintain any Cult they had before they started using the Corrupt Practice, and social rolls are at +1 difficulty. If their proclivities come out, they will be explicitly unwelcomed from the congregation and the difficulty penalty increases to +2."
  },
  {
    "id": "harmony",
    "name": "Harmony",
    "base": "faith",
    "faction": "Celestial Chorus",
    "corrupted": false,
    "page": 71,
    "desc": "While many of the Faithful work with congregations, their magickal Practice is mostly their own. The Chorus is instead fundamentally about community. This goes beyond working with their congregations and for their well-being but extends to one another. They are all voices in the Song of the One, so they train to Harmonize with one another. With their goal of bringing people of the world together, they have a lot of work to blend those voices together smoothly. Their first step is to harmonize with one another, a task that continues to elude them, but they work towards every day. Harmonizing with the Traditions is another of their long-term goals. Someday, they hope to even manage to Harmonize with the Technocracy, but that day remains a long way off.",
    "benefit": "By focusing on the principle of Harmony, the Chorus has built itself into a group that can work together, despite their differences. Even with Choristers who firmly believe in distinct Faiths, they can easily work together. Any group ritual involving at least two Choristers receives a -1 difficulty bonus."
  },
  {
    "id": "gladius_domini",
    "name": "Gladius Domini",
    "base": "faith",
    "faction": "Templar Knights",
    "corrupted": false,
    "page": 71,
    "desc": "The Templar Knights wear their faith as a sword and a shield. They don’t await a Jesus who comes with peace but one with a sword. And they have forged themselves into that sword, awaiting His return to fight Satan, purge the world of evil, and bring it under the dominion of Christ. Though they tolerate some heathens, at their core, they know they’ll have to come around or else. They add weapons and armor as Instruments to the usual Faith set and use them extensively for their magick. Many of their rituals and rotes revolve around weapons and armor, though other Instruments come into play, etching prayers onto blades, blessing their bullets, etc. Some Templars worry that their alliance with heathens and heretics will cause their role as the Gladius Domini to break; it is a constant source of debate among them.",
    "benefit": "When Templars use a normal Faith Instrument in addition to weapons or armor, the effect is at -1 difficulty."
  },
  {
    "id": "the_scene",
    "name": "The Scene",
    "base": "gutter_magick",
    "faction": "Hollow Ones",
    "corrupted": false,
    "page": 77,
    "desc": "Hollow Ones don’t do “Gutter Magick,” they occupy The Scene. Whatever the current youth counterculture movement is, they are there. Back in the 90s, they made waves as goth punks. In the 2000s, they were emo. Even the older Hollow Ones keep up because the zeitgeist is essential to their workings. They adapt themselves to these movements, working on makeup and fashion, ensuring they fit in, and adapting much older esoteric traditions (particularly High Ritual Magick, to the annoyance of the Order of Hermes) into those contexts, maintaining much of the symbolism but using what appears to more traditional mages as makeshift and cheap versions of the proper tools. Whatever they do, they do it with style and benefit from remixing their tools as they ride each new fad, never losing the core of their Practice.",
    "benefit": "Because the Hollow Ones are so adept at adapting the techniques of others into their Practice, they have an easier time working with others. They can use their rank in The Scene, divided by two and rounded down, to substitute for any other Practice to help with rituals. So a Hollow One with The Scene 4 and Forces 4 can contribute Forces 2 to a group ritual done with High Ritual Magick."
  },
  {
    "id": "goetia",
    "name": "Goetia",
    "base": "high_ritual",
    "faction": null,
    "corrupted": true,
    "page": 80,
    "desc": "One of the most famous grimoires in history is the Lesser Key of Solomon, which cemented Goetia in the mind of magicians across Europe. Though well known to be corrupt and sinister, it remains popular because it offers power in a predictable, if not easy, way. Goetia demands discipline, will, intelligence, focus, and most of all, guile, as the mage watches for traps against demons, often high-level ones, to bind them into their service through arcane laws and rituals. For all the power it grants, Goetia is a fragile thing, and the slightest misstep leaves the mage at the mercy of hostile, malevolent forces, often all the more so because the mage doesn’t bargain, they command and deceive. Some even believe that Goetic demons are really masks for Umbrood representing the issues of the individual mage, though this view is held by very few practitioners: they have seen enough to conclude that these things don’t come from inside them, though it may be that these things simply refuse to look within.",
    "benefit": "Goetics are as talented at summoning demons as Hermetics are with angels. Whenever they call upon a demon by name as part of their summoning or binding ritual, it is done at -1 difficulty.",
    "price": "Goetia is an extremely precarious Practice. Every attempt to use it is dangerous. If the Goetic botches a demon summoning, instead of Paradox, the demon shows up, is not bound at all, and is displeased with the mage. This is considerably more likely to be lethal than even strong backlashes."
  },
  {
    "id": "nyeredzi",
    "name": "Nyeredzi",
    "base": "high_ritual",
    "faction": "Ngoma",
    "corrupted": false,
    "page": 80,
    "desc": "While all groups of Ritualists study the stars and have developed some form of astrology, generally based on the star spirits they’ve encountered, the Ngoma truly specialize in it. Nyeredzi, the Shona word for “star” or “astrology,” is their astrological system: detailed and complex, orders of magnitude more so than anyone else’s. Ngoma Nyeredzi can not only predict personalities or read the future, but it can identify the circumstances that are auspicious for all sorts of magickal effects. The Ngoma often use this to make plans, figuring out what their enemies will most likely do in enough detail that they are rarely caught completely unaware, at least not by threats they know could be coming. Since being caught by threats they could never have foreseen, they’ve started developing techniques to make less precise predictions to discover problems directly.",
    "benefit": "Nyeredzi is a highly developed astrological system that the Ngoma can ensure good fortune on almost any task. To do so, they simply roll Intelligence + Esoterica (Astrology) to do a reading (which takes several minutes and is difficulty 6 at night and 8 during the day) to reduce the difficulty of their next roll by 1."
  },
  {
    "id": "ceremonial_magick",
    "name": "Ceremonial Magick",
    "base": "high_ritual",
    "faction": "Order of Hermes",
    "corrupted": false,
    "page": 81,
    "desc": "Many mages use rituals for their magick, and, though fewer, quite a few elevate those rituals to the level of High Ritual Magick. But even other Ritualists don’t come close to the level of elaborate precision that the Order of Hermes does. Though they accept the common terminology, by and large, Hermetics don’t do rituals. What they do is perform ceremonies. Many of their techniques involve elaborate and carefully designed clothing and jewelry, extremely complex symbolism in their ritual circles, and chants and invocations in ancient languages that they believe have enough gravitas to control the magick and command the forces of the universe. Though outsiders rarely see it, there’s a sense of performance to the magick, that it’s not just being done for its declared purpose but also to demonstrate to some sort of observers that the Hermetic is doing this, knows how to do it, and will be able to do it again in the future.",
    "benefit": "Hermetics are masterful planners and know that their ceremonies are expensive, both in time and effort. They can spend time at the beginning of a day preparing ceremonies and almost completing them, leaving only the final effort to be done in the moment. This gives them the benefit of High Ritual Magick on fast-casting effects they set up in advance. The only limit is that the ceremony must take at least a full hour to prepare and be used on the same day."
  },
  {
    "id": "bureaucracy",
    "name": "Bureaucracy",
    "base": "high_ritual",
    "faction": "Wu Lung",
    "corrupted": false,
    "page": 81,
    "desc": "While the Wu Lung are Ritualists, they are Ritualists with purpose. The Rituals aren’t simply techniques that happen to work for them. Instead, they are masters of using the Celestial Bureaucracy. Every being has a place and every spirit has a job. Incredible things can be accomplished if you perform the correct actions, similar to the effectiveness of properly filling out just the correct form in a modern country. They may not be the highest-ranking being in the Bureaucracy, but they are the highest in the physical world, and that authority, combined with their knowledge, forms the core of their Practice.",
    "benefit": "Fitting into the Celestial Bureaucracy, the Wu Lung engage in politics with spirits to get what they want. They may use Manipulation + Politics when invoking a spirit to reduce the difficulty of their Arete rolls. This adds a Spirit 2 element to their effect and causes the difficulty to be determined by the local Gauntlet."
  },
  {
    "id": "infernal_sciences",
    "name": "Infernal Sciences",
    "base": "hypertech",
    "faction": null,
    "corrupted": true,
    "page": 84,
    "desc": "Though technology as a whole can create horrors and, worse, can scale them up to put them beyond comprehension, Infernal Science is a bit more direct. This is Hypertechnology created with the explicit purpose of causing harm and misery, guided by bad intentions with no attempt to pretend to be something better. This Corrupted Practice can also stem from Cybernetics or Weird Science. Hence, the horrors it produces range the gamut from Hypertech’s cruel war machines and torture devices, to invasive Cybernetics capable of seizing control of their user, and even to Nazi war robots with the brains of gorillas trained in bigotry operating them. Others are seemingly mundane devices but powered in horrific ways through the emotional resonance of cruelty, fresh blood taken from an unwilling source, or similar.",
    "benefit": "Any Infernal Science Instrument that is “powered” by causing at least one Health Level of damage to an unwilling victim receives -1 difficulty. The bonus increases to -2 if the victim is killed.",
    "price": "As they are corrupted by it, Infernal Scientists will lose the ability to engage in non-infernal science. This goes beyond magical techniques, but instead, even mundane Science and Technology rolls are penalized by +1 difficulty when not related to causing harm to others."
  },
  {
    "id": "tecknology",
    "name": "Tecknology",
    "base": "hypertech",
    "faction": "Void Engineers",
    "corrupted": false,
    "page": 85,
    "desc": "Though they’ve become more self-conscious about the term in the 21st Century, the Void Engineers used to openly talk of Tecknology. Void Engineer Tecknology is far ahead of Sleeper technology but is also much more fragile and specialized. As sleek as it may look, it often just barely works. The Void Engineers test in production, bringing their newest devices into the field. There’s a dash of Weird Science in Tecknology, hidden beneath the sleek exterior so that even the rest of the Union doesn’t see, are bizarre circuits and machines that work on unapproved and sometimes only somewhat logical principles. After all, it’s usually more important for Tecknology to work in the most extreme conditions in the universe than in front of large numbers of Sleepers, so a little bit of Deviance is acceptable, isn’t it?",
    "benefit": "Void Engineer Tecknology is particularly hardened against outside interference so they can go up against strange things from mystics to spirits and bizarre monsters lurking in the night. All attempts to interfere with their Instruments (though not the magick itself, this doesn’t affect direct countermagick) are at +1 difficulty."
  },
  {
    "id": "lakashim",
    "name": "Lakashim",
    "base": "invigoration",
    "faction": "Cult of Ecstasy (Sahajiya)",
    "corrupted": false,
    "page": 90,
    "desc": "Cultists call the energy of life Lakashim, and the word might as well mean holiness to them. If anything is sacred in the Cult of Ecstasy, it’s the Lakashim that animates them. It’s the divine pulse of the universe that they sense to track, and lose track of, time itself. They get in tune with Lakashim through extreme experiences, including drugs, music, sex, and exercise. Triggering these extreme sensations and synchronizing with the Lakashim lets the Cultists alter their perceptions so thoroughly that reality itself changes for them. It lies at the root of everything else they do.",
    "benefit": "When in an altered state of consciousness due to extreme activities (usually determined through ingesting psychoactive substances or through some sort of Meditation roll), effects that change the Cultist’s perceptions are at -1 difficulty. This applies to the usual first dot Sphere effects but also to clairvoyance, divination, mind-reading, etc."
  },
  {
    "id": "do",
    "name": "Do",
    "base": "martial_arts",
    "faction": "Akashic Brotherhood",
    "corrupted": false,
    "page": 96,
    "desc": "There are many martial arts in the world, but when mages speak of the Martial Art, they refer to the Akashic art of Do. Do is The Way and is the core of how the Akashayana view the world. It divides the world into Eight Limbs focusing on different aspects of the world and ensuring that the Akashic can live harmoniously in it. These limbs are detailed in M20 p. 428. Akashics believe Do to be the original, perfect martial art from which all others are descended or attempts to rediscover. The fact that they may be right is part of what makes Akashayana so terrifying in battle.",
    "benefit": "The Akashayana gain many benefits from Do. These are detailed in M20 pages 426-430 and consist of several Martial Arts maneuvers (replace the Do Ability with Martial Arts in them) and having any of their unarmed attacks deal Lethal damage, among others."
  },
  {
    "id": "biotech",
    "name": "Biotech",
    "base": "medicine_work",
    "faction": "Progenitors",
    "corrupted": false,
    "page": 101,
    "desc": "Medicine-Work encompasses more than medicine. For some, it has mystic elements that can even seem more important than the direct healing aspects. For the Progenitors, it’s a stepping stone into the larger world of Biotechnology. Almost everything they make and do is in some way Biotechnological. Some things are biological themselves, lifeforms (sentient or not) that they create to purpose. Others are non-living technology whose sole purpose is to change living things. Furthermore, Progenitors don’t keep their hands off their bodies and genomes. Their use of biomodification is significant, and their Biotech has advanced so far that not only can some Progenitors be said to no longer be human, but a few were never human to begin with.",
    "benefit": "Genetic manipulation is the key to Progenitor Biotech. When making a fundamental alteration to a living thing (so increasing Attributes counts but healing damage doesn’t), the Progenitor has a -1 difficulty bonus."
  },
  {
    "id": "artemis_gift",
    "name": "Artemis’s Gift",
    "base": "medicine_work",
    "faction": "Sisters of Hippolyta",
    "corrupted": false,
    "page": 101,
    "desc": "If there’s one thing that the Sisters of Hippolyta agree on, it’s the role of Patriarchy in oppression. The next closest thing is that healing is sacred, and that Apollo gets far too much credit, having stolen it from Artemis. Male domination of the healing arts is just one aspect of Patriarchy that they must resist, but so is insisting on working as an individual Medicine-Worker. Instead, they work together, Awakened and Sleeper alike, to bring Artemis’s Gift of healing to those around them. They heal in mystical group rites that unite them as a community, healing the patient and the bonds between individual Sisters.",
    "benefit": "The Sisters of Hippolyta work their healing magicks as a group and are more effective for it. They have done so for so long that they’ve perfected the technique, and extended it beyond simple healing. Whenever 5 or more Sisters participate in a rite, even if only one is Awakened or casting, it is performed at -1 difficulty."
  },
  {
    "id": "reality_coding",
    "name": "Reality Coding",
    "base": "reality_hacking",
    "faction": "Virtual Adepts",
    "corrupted": false,
    "page": 109,
    "desc": "While Reality Hacking as a whole can look like many things, Reality Coding is all about information technology and data flows. Reality Coding is what they end up with when people think of “hacking” in popular culture and add a magickal element to it. Virtual Adepts learn to treat all systems as informational, whether they believe that truly represents Reality or not. This way, they can write a software program that will change a rock into a knife, call up a ghost from the Underworld, or far stranger things. This doesn’t even tie them too strongly to their computers, particularly in the modern world where computation devices are ubiquitous, but even an abacus can be used to program if the mage is determined enough.",
    "benefit": "Virtual Adepts are the best at breaking into secure systems. When using magick to break security (anything from locked doors to military-grade encryption), the difficulty is always determined as though the effect is Coincidental. Note that this doesn’t prevent Paradox if the effect is Vulgar."
  },
  {
    "id": "demonism",
    "name": "Demonism",
    "base": "shamanism",
    "faction": null,
    "corrupted": true,
    "page": 112,
    "desc": "Demonists have one trick: they raise demons to make pacts and command them to do their bidding. It’s one of the oldest Practices, dating back far before the advent of cities and likely before agriculture, though few Demonists know this storied lineage. Instead, what they preserve from generation to generation are lists of demons and the rituals to command and treat with them. Demonists consider themselves examples of pure, unbridled human achievement to have achieved peak performance in commanding the lords of hell. Instead, they are enslaved by them, predating on other humans in their service. Their rites are brutal and bloody, distressing to normal people, and all the more so if the demons they serve are associated with that person’s culture. Though many assume it, they do not need to be Christian demons, not when the world contains foul things from every culture and dark spirits that no religion has spoken of before.",
    "benefit": "As Demonists contact the dark spirits of things for their work, they are better at working with spirits that are “of the Wyrm.” This means that when dealing with spirits of death, violence, corruption, and destruction, Demonists get -1 difficulty on all Social rolls.",
    "price": "Demonists stink of corruption. They always register to effects like the Garou Gift “Sense Wyrm,” and people avoid them instinctively. They have a +1 difficulty on all Social rolls with people who have any dots of the Awareness trait."
  },
  {
    "id": "spirit_ties",
    "name": "Spirit Ties",
    "base": "shamanism",
    "faction": "Dreamspeakers (Kha'vadi)",
    "corrupted": false,
    "page": 113,
    "desc": "While all Shamans live with one foot in the spirit world and one in the physical, Dreamspeakers exist within that boundary. To them, spirits are people, equal to humans, just in a different form. Combine that with the fact that everything has a spirit, and they tend to form strong interpersonal relationships with objects and abstract forces and concepts alike. These ties become second nature to Dreamspeakers, and they call upon them for their magicks. While other mages might form pacts with a fire elemental to be able to summon it to burn something, Dreamspeakers call upon the goodwill they have and their ties to call forth the fire directly from the spirit, with the knowledge that their friend will need their help in the future, and they give it gladly.",
    "benefit": "By adding the “bit of Spirit” as per the Sidebar in How Do You DO That? p. 16, a Dreamspeaker changes the difficulty of their effects to be based on the Gauntlet rather than the usual rules based on Highest Sphere and Vulgarity."
  },
  {
    "id": "asagwe",
    "name": "Asagwe",
    "base": "voudoun",
    "faction": "Bata'a",
    "corrupted": false,
    "page": 115,
    "desc": "Though all Voudoun mages maintain strong ties to the Loa, the Bata’a are unquestioningly the closest and feel very proprietary towards that relationship. One of the ways that they build and maintain it is through the Asagwe dance. Among mundane practitioners, the Asagwe is “the salute of the Loa,” which calls the spirits with dramatic spins, sweeps, and spins through circular arcs, looking to catch the Loa’s attention. For the Awakened, though, the Asagwe becomes more central. Those circular arcs become a motif in everything. The Bata’a still uses the Asagwe to draw the attention of the Loa, but can be more precise, calling out to specific Loa rather than to the Loa as a whole through their advanced expertise.",
    "benefit": "When summoning one of the Loa to possess them (in a literal, not metaphorical sense, as a spirit possessing a living host), the Bata’a have a -1 difficulty bonus."
  },
  {
    "id": "ethertech",
    "name": "Ethertech",
    "base": "weird_science",
    "faction": "Society of Ether (Sons of Ether)",
    "corrupted": false,
    "page": 118,
    "desc": "The Society of Ether are the undisputed masters of Weird Science in the guise of Ethertech. This offshoot of Weird Science goes back to the discrediting of the Luminiferous Ether and the Society’s rejection of that discrediting. Ethertech tends to draw much of its aesthetic from the late 19th century in the form of Steampunk, but many also integrate extremely futuristic work. The one unifying factor across Ethertech is that every Etherite’s technology is a unique creative endeavor, fundamentally bound to who they are and where they are coming from. They acknowledge this and take joy in the contradictions as areas in which they can experiment and define new realities.",
    "benefit": "Ethertech is fundamentally improvisational in a way that other technomagic isn’t. Whenever Ethertech is used for a fast-cast effect, they ignore the +1 difficulty penalty for a non-rote effect."
  },
  {
    "id": "old_ways",
    "name": "The Old Ways",
    "base": "witchcraft",
    "faction": "Verbena",
    "corrupted": false,
    "page": 122,
    "desc": "Witchcraft, as a whole, preserves a lot of folk wisdom. The uses of herbs and other natural Instruments is generally passed from one Witch to another deep into history. The Verbena take this far, far more seriously. They don’t just keep knowledge of herbs from long ago; they maintain the traditions and rituals of the gods whose worship has faded in light of the imperial religions of the modern world. By holding on to those potent rituals, the Verbena keep the worship of these divinities alive; in return, they can draw power from them. This relationship defines the Verbena. They keep the Old Ways, bringing them into the modern world while preserving their essence.",
    "benefit": "Verbena teach one another the traditions that others have lost. Rotes and Rituals built on the Practice of The Old Ways cost half as much."
  },
  {
    "id": "vamamarga",
    "name": "Vamamarga",
    "base": "yoga",
    "faction": null,
    "corrupted": true,
    "page": 124,
    "desc": "Though Vamamarga proper is not inherently evil, the Corrupted Practice of Vamamarga is often also called the Aghori Path. Though Yoga may be largely about living outside oneself, the Aghori Path takes that with a more specific goal: to return to a state of pre-life, in a sense. They attempt to achieve an existence beyond fear of pain, death, or rules, so they can act however they want. They often want to do some of the most extreme and horrific acts that the human mind can conceive of. Some even find the search for new extremes to be a sort of game, though those tend to be caught fairly quickly as their crimes accelerate and draw attention to them. They also often have a morbid decor, and once a mage has gone far enough down this path, they tend to live near graves, use skulls for bowls and cups, etc.",
    "benefit": "Just as the Yogi can expel outside influences, a Vamamargin is adept at exerting this foreign influence. They receive a -1 difficulty bonus for all attempts to influence or control others or introduce a foreign influence into them, such as spirit possession or sickness.",
    "price": "Mages who start down this corrupt path start collecting Jhor Resonance, which attracts the attention of the Euthanatos and acts against the mage when they try to do any magick involving healing, creating, or otherwise purifying life. Any time a Vamamarga mage achieves 5 or more successes or botches a Vamamarga effect, they roll their current Jhor rating at difficulty six. If they fail, they gain a dot of Jhor. If they botch, they gain two. They acquire their first dot without rolling the first time they botch or succeed sufficiently at a Vamamarga effect."
  },
  {
    "id": "wheel_tending",
    "name": "Wheel-Tending",
    "base": "yoga",
    "faction": "Euthanatoi (Chakravanti)",
    "corrupted": false,
    "page": 124,
    "desc": "The Euthanatoi are tenders of the Great Wheel, ensuring it continues to turn and removing blockages, sometimes through extreme means. They extend Yoga beyond its usual mystic dimensions into a concern for the balance of the universe as a whole, far beyond the individual Practitioner. Wheel-Tenders watch for imbalances, things causing the Great Wheel to fail to turn smoothly, and try to remove them. On the individual level, this can mean that they provide therapy to people who’ve been harmed, but it can also mean killing people who have no intention of changing their harmful behavior. At a larger level, they repair or bring down institutions causing blockages for many individuals.",
    "benefit": "Thanatoic training focuses them on finding instabilities of the Wheel. When looking for anomalies of fate, whether through Awareness or Spheres, that need to be fixed (or exploited), Euthanatoi receive a -1 difficulty bonus."
  }
],
};

// ── helpers ──────────────────────────────────────────────────────────────────
PRISM.practiceById   = id => PRISM.PRACTICES.find(p => p.id === id) || null;
PRISM.specialtyById  = id => PRISM.SPECIALTIES.find(s => s.id === id) || null;
PRISM.tenetById      = id => PRISM.TENETS.find(t => t.id === id) || null;
PRISM.presetById     = id => PRISM.PARADIGM_PRESETS.find(p => p.id === id) || null;
PRISM.specialtiesFor = factionName => PRISM.SPECIALTIES.filter(s => s.faction === factionName);

/** Net association of a practice given chosen tenets.
 *  @param tenets  {category: tenetId}
 *  @param practiceId base practice id (pass a specialty's base id)
 *  @param isFactionSpecialty true when the character uses their own faction's specialty
 *  @returns 'associated' | 'limited' | 'neutral'
 */
PRISM.association = (tenets, practiceId, isFactionSpecialty) => {
  if (isFactionSpecialty) return 'associated';
  let assoc = false, limited = false;
  Object.values(tenets || {}).forEach(tid => {
    const t = PRISM.tenetById(tid); if (!t) return;
    if (t.associated.includes(practiceId)) assoc = true;
    if (t.limited.includes(practiceId)) limited = true;
  });
  if (assoc && !limited) return 'associated';
  if (limited && !assoc) return 'limited';
  return 'neutral';
};

/** Dots the character holds across a practice's Associated Abilities. */
PRISM.associatedAbilityDots = (char, practiceId) => {
  const p = PRISM.practiceById(practiceId); if (!p) return 0;
  const pools = [char.talents || {}, char.skills || {}, char.knowledges || {}];
  return p.abilityIds.reduce((sum, id) => sum + pools.reduce((s, pool) => s + (pool[id] || 0), 0), 0);
};

/** Max practice rating the character's abilities support (2 ability dots per practice dot). */
PRISM.maxPracticeRating = (char, practiceId) =>
  Math.min(5, Math.floor(PRISM.associatedAbilityDots(char, practiceId) / PRISM.COSTS.abilityDotsPerPracticeDot));

/** Arete cap from tenet count (no cap from Arete 6 on). */
PRISM.areteCap = tenets => {
  const n = Object.values(tenets || {}).filter(Boolean).length;
  return n >= PRISM.COSTS.areteCapByTenetsUntil ? 10 : n;
};

if (typeof module !== 'undefined' && module.exports) module.exports = PRISM;

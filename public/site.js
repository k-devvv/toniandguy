import { imageAttributes } from "./media.js";
import { renderSimpleBooking, renderPrices } from "./booking-page.js";
import { routeToPath, pathToRoute, normalizeLinks, applyPageMetadata } from "./seo.js";
import { initAnalytics, trackPageView } from "./analytics.js";
import {
  normalizePhone,
  preferredDays,
  resetDependentChoices,
  sendBooking,
} from "./booking-utils.js";
/* ---------- CONFIG: fill once the salons are live. Empty values make buttons show a prototype notice. ---------- */
const CONFIG = {
  brand: "TONI&GUY",
  branded: true,
  phone: { s: "+918123729873", p: "+918123729873" },
  whatsapp: { s: "918123729873", p: "918123729873" },
  hours: { s: "", p: "" },
  sampleVoices: false, // set to false at launch; real reviews replace the sample cards
};
const B = CONFIG.brand;

/* ---------- LOCATIONS ---------- */
const LOC = {
  s: {
    id: "s",
    slug: "sobha-arcadia",
    name: "Sobha Arcadia",
    short: "Arcadia",
    area: "Thanisandra",
    address:
      "Shop 4B, Devin Paradise Enclave, Thanisandra Main Road, Bengaluru 560064",
    pin: { lat: 13.0771852, lng: 77.6340648 },
    plus: "3JGM+PM",
    line: "A proper salon, minutes from home.",
    sub: "Between Sobha City and Hegde Nagar, off Thanisandra Main Road.",
    door: "For the neighbourhood that wants more",
    hero: "salonA",
    photos: ["salonB", "blondeback", "kid1", "fadecut"],
    facts: [
      [
        "Sobha City, a 36-acre township, sits in the same pocket",
        "Broker listing",
        "v",
      ],
      [
        "A Google reviewer calls the retail block the mall for 2,000+ flats",
        "Visitor review",
        "i",
      ],
      ["8 salons within 1 km, 19 within 2 km", "Maps sample, Oct 2026", "v"],
      ["Bhartiya Mall of Bengaluru is about 1.2 km away", "Google Maps", "v"],
      [
        "The Google listing for this address has no hours or website yet",
        "Google Maps, Oct 2026",
        "v",
      ],
    ],
    day: [
      [
        "7 to 9 am",
        "School runs and early commutes. Gentlemen's cuts before the day starts.",
      ],
      [
        "11 am to 3 pm",
        "The quiet hours. Colour and restorative sittings, unhurried.",
      ],
      [
        "6 to 9 pm",
        "After work. The busiest window, so the best chairs go first.",
      ],
      [
        "Weekends",
        "Families, back-to-back chairs, wedding and function preparation.",
      ],
    ],
    who: [
      [
        "The hybrid couple",
        "Two calendars, one free evening. Wants a stylist they trust without the mall drive.",
        "pinkwall",
      ],
      [
        "Parents",
        "Haircuts for everyone in one visit, chairs side by side.",
        "kid3",
      ],
      [
        "Monthly regulars",
        "Cut and beard every four weeks. Same chair, same person.",
        "beardprof",
      ],
      [
        "Function season",
        "A wedding in the family. A plan, not a last-minute blow-dry.",
        "bridalpearl",
      ],
    ],
    emphasis: [
      "Gentlemen's cut and beard",
      "Family appointments",
      "Colour and gloss",
      "Wedding and function preparation",
      "Restorative hair spa",
    ],
    offer:
      "Private consultation. Twenty minutes with a senior stylist before anything is decided.",
    getting: [
      ["Directions", "Plus code 3JGM+PM, Devin Paradise Enclave"],
      ["Parking", "To confirm on site"],
      ["Landmarks", "Sobha City, Hegde Nagar, Thanisandra Main Road"],
      ["Hours", "To be set. Evenings and weekends first."],
    ],
    faq: [
      [
        "Is this the Sobha City retail block?",
        "The Google pin sits in Devin Paradise Enclave, in the Sobha City and Hegde Nagar pocket. Exact unit directions are added at launch.",
      ],
      [
        "Can the whole family book together?",
        "Yes. Choose Family when you book and we line the chairs up.",
      ],
      [
        "How do I choose a stylist?",
        "Use Find your stylist. It matches what you want with who does it best.",
      ],
      [
        "Will I know the cost before I come?",
        "Yes. Your stylist confirms the plan and the cost in the consultation, before any work starts.",
      ],
    ],
    anchors: [
      { n: "Bhartiya Mall", lat: 13.0835, lng: 77.6432 },
      { n: "Hegde Nagar", lat: 13.0735, lng: 77.6335 },
      { n: "Thanisandra", lat: 13.0624, lng: 77.6332 },
    ],
  },
  p: {
    id: "p",
    slug: "prestige-tech-forest",
    name: "Prestige Tech Forest",
    short: "Tech Forest",
    area: "Varthur",
    address: "Unit 4, Lake Road, ITI Colony, Varthur, Bengaluru 560087",
    pin: { lat: 12.9495205, lng: 77.7457457 },
    plus: "WPXW+R7",
    line: "Sharp before the first meeting.",
    sub: "Unit 4, Lake Road, Varthur. At the Prestige Tech Forest campus.",
    door: "For the working day, done properly",
    hero: "salonE",
    photos: ["salonF", "exec2", "menblow", "blowdry"],
    facts: [
      [
        "Campus: 17.68 acres, about 2.5 million sq ft planned, three 14-storey towers",
        "27estates listing",
        "v",
      ],
      [
        "Status differs by source: possession June 2027, or built 2025",
        "27estates vs myhq",
        "i",
      ],
      [
        "Nearest listed salons are 0.8 to 1.2 km away; none on the campus",
        "Maps sample, Oct 2026",
        "v",
      ],
      [
        "The Varthur village salon cluster is 1.7 to 2.3 km south",
        "Google Maps",
        "v",
      ],
      ["Metro: Nallur Halli 3.7 km, Kadugodi 3.9 km", "myhq listing", "v"],
    ],
    day: [
      [
        "8:30 to 10 am",
        "Arrivals. A beard tidy or a blow-dry before the first meeting.",
      ],
      [
        "12 to 2 pm",
        "The executive cut. Thirty minutes, finished before the next call.",
      ],
      ["5:30 to 8:30 pm", "After work. Colour and styling for the evening."],
      ["Saturday", "Residents from Varthur and Whitefield. Longer sittings."],
    ],
    who: [
      [
        "The product lead",
        "A clean cut without losing a morning. Books on a phone, between calls.",
        "exec1",
      ],
      [
        "The director",
        "Client day on Thursday. Wants to be sorted by Wednesday evening.",
        "exec3",
      ],
      [
        "The colour regular",
        "Roots and gloss on a schedule, planned around meetings.",
        "redbob",
      ],
      [
        "Campus teams",
        "Off-site photos, award nights, farewells. A group booking.",
        "blondepair",
      ],
    ],
    emphasis: [
      "The executive cut",
      "Beard and grooming",
      "Blow-dry and styling",
      "Colour touch-up",
      "Event-ready, same day",
    ],
    offer:
      "The executive membership: priority slots, one stylist, early and late hours. A proposal for the campus.",
    getting: [
      ["Directions", "Plus code WPXW+R7, Lake Road, Varthur"],
      ["Parking", "To confirm with the campus"],
      ["Landmarks", "Prestige Tech Forest, Varthur Lake, Brigade Utopia"],
      ["Hours", "To be set around the campus day"],
    ],
    faq: [
      [
        "How fast is the executive cut?",
        "Built to fit a lunch hour. The exact time is confirmed when you choose the service.",
      ],
      [
        "Can my team book together?",
        "Yes. Use group booking for off-sites and event days.",
      ],
      [
        "Do you open early?",
        "Hours are set around the campus rhythm at launch. Early slots are the first thing we plan.",
      ],
      [
        "Where exactly is Unit 4?",
        "Inside Prestige Tech Forest on Lake Road. Floor and tower directions are added at launch.",
      ],
    ],
    anchors: [
      { n: "Brigade Utopia", lat: 12.9346, lng: 77.7437 },
      { n: "Prestige Lakeside Habitat", lat: 12.9329, lng: 77.7372 },
      { n: "Sorahunase", lat: 12.9431, lng: 77.7547 },
    ],
  },
};

/* ---------- SERVICES ---------- */
const SVC = [
  {
    id: "cut",
    name: "Precision cut and finish",
    tag: "Shape",
    img: "cut",
    img2: "scissors",
    what: "A cut built around how your hair falls, grows and parts, finished with a blow-dry so you see the shape at its best.",
    who: "Anyone whose cut has lost its line, or who wants something cleaner.",
    gets: "A shape that holds for weeks and styles in minutes.",
    exp: [
      "Consultation on face shape, hair type and routine",
      "Wash and detailed cut",
      "Blow-dry and a short styling lesson",
    ],
    time: 60,
    timeTxt: "45 to 75 min",
    maint: "Trim every 6 to 8 weeks",
    maintLvl: 1,
    expect: "You leave knowing how to style it yourself.",
    after:
      "Use a heat protectant. Skip tight bands on the first day if the fringe is new.",
    stylist: "precision",
    rel: ["gloss", "spa"],
    kind: "shape",
  },
  {
    id: "reset",
    name: "The reset",
    tag: "A bigger change",
    img: "redbob",
    img2: "shag",
    what: "A new cut and a colour direction planned together, so the two work with each other.",
    who: "People who know they want a change and are not sure what.",
    gets: "One clear plan, done in one or two visits.",
    exp: [
      "Long consultation, with references",
      "Cut first, colour second",
      "Finish and a plan for the next four weeks",
    ],
    time: 180,
    timeTxt: "2 to 4 hours, or split in two",
    maint: "Check-in at 4 weeks",
    maintLvl: 2,
    expect: "A frank view on what your hair can do in one visit.",
    after: "A written aftercare card for the cut and the colour.",
    stylist: "creative",
    rel: ["balayage", "gloss"],
    kind: "change",
  },
  {
    id: "root",
    name: "Colour and root touch-up",
    tag: "Colour",
    img: "colourwork",
    img2: "foils",
    what: "All-over colour or regrowth cover, matched to your shade.",
    who: "Anyone covering grey or keeping a deeper shade even.",
    gets: "Even colour from root to end.",
    exp: [
      "Shade match in daylight",
      "Colour application and development",
      "Wash, treatment and finish",
    ],
    time: 120,
    timeTxt: "1.5 to 2.5 hours",
    maint: "Roots every 4 to 6 weeks",
    maintLvl: 3,
    expect: "A patch test first if you have never coloured here.",
    after: "Colour-safe shampoo. Wait before the next wash as advised.",
    stylist: "colour",
    rel: ["gloss", "spa"],
    kind: "colour",
  },
  {
    id: "balayage",
    name: "Balayage and highlights",
    tag: "Colour",
    img: "blondepair",
    img2: "ombre",
    what: "Hand-painted lightness that grows out softly.",
    who: "People who want dimension without a hard root line.",
    gets: "Depth and movement that suit your skin tone.",
    exp: [
      "Colour consultation and hair check",
      "Painting, lightening and toning",
      "Gloss, treatment and a finish",
    ],
    time: 270,
    timeTxt: "3 to 5 hours",
    maint: "Tone refresh every 8 to 12 weeks",
    maintLvl: 1,
    expect: "Dark hair may need two sessions for a lighter result.",
    after: "Sulphate-free shampoo, a bond-care mask, less heat.",
    stylist: "colour",
    rel: ["gloss", "spa"],
    kind: "colour",
  },
  {
    id: "gloss",
    name: "Gloss and tone",
    tag: "Shine",
    img: "orangeclose",
    img2: "golden",
    what: "A quick colour refresh that adds shine and corrects tone.",
    who: "Coloured hair that has gone flat or brassy.",
    gets: "Shine and a cleaner shade, without a full sitting.",
    exp: ["Tone check", "Gloss applied at the basin", "Blow-dry"],
    time: 60,
    timeTxt: "45 to 60 min",
    maint: "Every 4 to 6 weeks",
    maintLvl: 2,
    expect: "A subtle change. It refreshes colour, it does not lighten.",
    after: "Cool water rinses. A colour-safe conditioner.",
    stylist: "colour",
    rel: ["balayage", "spa"],
    kind: "refresh",
  },
  {
    id: "smooth",
    name: "Smoothening and keratin",
    tag: "Texture",
    img: "blondebob",
    img2: "straight",
    what: "A treatment that calms frizz and makes hair easier to manage.",
    who: "Frizzy or unruly hair, and anyone short on morning time.",
    gets: "Hair that dries faster and sits smoother.",
    exp: [
      "Hair test and product choice",
      "Treatment and heat sealing",
      "Wash instructions for the first days",
    ],
    time: 210,
    timeTxt: "3 to 4 hours",
    maint: "Fades gradually over months",
    maintLvl: 1,
    expect: "Results depend on your hair and the product used.",
    after:
      "A wash-free window of a few days, then sulphate-free care. Your stylist gives the exact timing.",
    stylist: "texture",
    rel: ["spa", "cut"],
    kind: "smooth",
  },
  {
    id: "spa",
    name: "Restorative hair spa",
    tag: "Care",
    img: "salonE",
    img2: "wash",
    what: "A deep treatment for dry, coloured or heat-styled hair, with a scalp massage.",
    who: "Hair that feels rough or looks dull.",
    gets: "Softer hair and a healthier finish.",
    exp: [
      "Scalp and strand check",
      "Treatment with a head massage",
      "Blow-dry",
    ],
    time: 60,
    timeTxt: "45 to 60 min",
    maint: "Monthly while hair recovers",
    maintLvl: 2,
    expect: "Best before a big colour or after a holiday.",
    after: "Avoid heavy oils the same day. Heat protectant after.",
    stylist: "texture",
    rel: ["smooth", "gloss"],
    kind: "refresh",
  },
  {
    id: "style",
    name: "Blow-dry and occasion styling",
    tag: "Occasion",
    img: "curl",
    img2: "updo",
    what: "Blow-dry, curls, waves or an updo for an event.",
    who: "Anyone with somewhere to be.",
    gets: "A finished look that lasts the evening.",
    exp: [
      "Reference photos and outfit",
      "Wash and styling",
      "A hold plan for the night",
    ],
    time: 60,
    timeTxt: "30 to 90 min",
    maint: "One-off",
    maintLvl: 0,
    expect: "Bring a photo of the outfit.",
    after: "Sleep with the style loosely wrapped for a second day.",
    stylist: "occasion",
    rel: ["gloss", "bridal"],
    kind: "occasion",
  },
  {
    id: "men",
    name: "Gentlemen's cut and beard",
    tag: "Grooming",
    img: "beardprof",
    img2: "razor",
    what: "A haircut and beard shaped together, finished with a hot towel.",
    who: "Anyone on a regular cycle, and anyone starting one.",
    gets: "A sharp line that grows out evenly.",
    exp: ["Short consultation", "Cut and beard design", "Hot towel and finish"],
    time: 45,
    timeTxt: "30 to 60 min",
    maint: "Every 3 to 4 weeks",
    maintLvl: 3,
    expect: "The same stylist each visit, if you want.",
    after: "Beard oil and a wash routine, shown at the chair.",
    stylist: "groom",
    rel: ["express", "spa"],
    kind: "groom",
  },
  {
    id: "express",
    name: "The executive cut",
    tag: "Work day",
    img: "exec2",
    img2: "menblow",
    only: "p",
    what: "A focused cut for people with a meeting in an hour.",
    who: "Busy professionals who keep a short, clean style.",
    gets: "Sharp and finished in half an hour.",
    exp: ["A quick brief", "Cut and neckline", "Finish"],
    time: 30,
    timeTxt: "About 30 min",
    maint: "Every 3 to 4 weeks",
    maintLvl: 3,
    expect: "Best for short, clean styles. A format proposed for the campus.",
    after: "None needed.",
    stylist: "groom",
    rel: ["men", "cut"],
    kind: "groom",
  },
  {
    id: "family",
    name: "Family appointments",
    tag: "Family",
    img: "kid1",
    img2: "kid2",
    only: "s",
    what: "Haircuts for the whole family, booked as one block.",
    who: "Parents juggling two or three appointments.",
    gets: "One visit, chairs side by side.",
    exp: [
      "Slots lined up",
      "Children's cuts with patience",
      "Everyone done together",
    ],
    time: 90,
    timeTxt: "Depends on the group",
    maint: "Every 6 to 8 weeks",
    maintLvl: 1,
    expect: "Book early for weekends.",
    after: "None needed.",
    stylist: "family",
    rel: ["men", "cut"],
    kind: "shape",
  },
  {
    id: "bridal",
    name: "Wedding and event preparation",
    tag: "Occasion",
    img: "bridalpearl",
    img2: "bridalbraid",
    what: "A plan that starts weeks before the day: consultation, trial, day-of styling.",
    who: "The bride, the family, the guest who wants to be ready.",
    gets: "A look you have already seen on yourself.",
    exp: ["Consultation and references", "Trial styling", "Day-of styling"],
    time: 120,
    timeTxt: "Trial 1.5 hours, day-of 1 to 2 hours",
    maint: "Planned",
    maintLvl: 1,
    expect: "Start four to six weeks out if colour is involved.",
    after: "A written plan for the days before.",
    stylist: "occasion",
    rel: ["gloss", "spa"],
    kind: "occasion",
  },
];
const SMAP = Object.fromEntries(SVC.map((s) => [s.id, s]));

/* ---------- STYLIST ARCHETYPES (replace with the real team) ---------- */
const STY = [
  {
    id: "precision",
    t: "The precision cutter",
    lvl: "Creative Director level",
    spec: ["Cut", "Shape", "Fringes"],
    img: "scissors",
    style: "Clean lines, geometry, haircuts that grow out well.",
    start: "Starts by watching how your hair moves when it is dry.",
    svc: ["cut", "reset"],
  },
  {
    id: "colour",
    t: "The colourist",
    lvl: "Top Stylist level",
    spec: ["Balayage", "Gloss", "Colour correction"],
    img: "foils",
    style: "Shade planning around skin tone and hair history.",
    start: "Starts with your colour history, then daylight.",
    svc: ["balayage", "root", "gloss"],
  },
  {
    id: "texture",
    t: "The texture specialist",
    lvl: "Senior Stylist level",
    spec: ["Smoothening", "Curls and waves", "Repair"],
    img: "roundbrush",
    style: "Curly, wavy and frizz-prone hair, treated on its own terms.",
    start: "Starts with a strand test and a wash plan.",
    svc: ["smooth", "spa"],
  },
  {
    id: "groom",
    t: "The grooming specialist",
    lvl: "Senior Stylist level",
    spec: ["Gentlemen's cut", "Beard", "Executive"],
    img: "razor",
    style: "Sharp, repeatable cuts and beards.",
    start: "Starts with your last cut and what you want to change.",
    svc: ["men", "express"],
  },
  {
    id: "occasion",
    t: "The occasion artist",
    lvl: "Top Stylist level",
    spec: ["Updos", "Bridal", "Party styling"],
    img: "updo",
    style: "Styles built to last the evening, and to photograph well.",
    start: "Starts with the outfit and the schedule.",
    svc: ["style", "bridal"],
  },
  {
    id: "family",
    t: "The family stylist",
    lvl: "Stylist level",
    spec: ["Children", "Family blocks", "Everyday cuts"],
    img: "kidbarber",
    style: "Patient, quick, and good with first haircuts.",
    start: "Starts with the youngest in the chair.",
    svc: ["family", "cut"],
  },
  {
    id: "creative",
    t: "The change-maker",
    lvl: "Style Director level",
    spec: ["Restyles", "Colour plus cut", "Consultations"],
    img: "shag",
    style: "Big changes, planned properly, in one or two visits.",
    start: "Starts with references and a long talk.",
    svc: ["reset"],
  },
];

/* ---------- OCCASIONS ---------- */
const OCC = [
  {
    id: "meeting",
    t: "Something important tomorrow",
    q: "An interview. A pitch. A first day.",
    img: "exec1",
    need: "To walk in looking like yourself, only sharper.",
    exp: "A tidy cut and a clean finish, booked the day before.",
    svc: ["cut", "men", "express"],
    res: "You stop thinking about your hair and start thinking about the room.",
    cd: [
      ["Day before", "Cut and finish"],
      ["Morning of", "Five-minute home styling"],
      ["In the room", "Nothing to adjust"],
    ],
  },
  {
    id: "monday",
    t: "A better Monday",
    q: "The working week, a little easier.",
    img: "blowdry",
    need: "A cut that needs no effort at 7:45.",
    exp: "A shape built around your routine and your commute.",
    svc: ["cut", "express", "men"],
    res: "Mornings get shorter. The mirror stops being a negotiation.",
    cd: [
      ["Week 0", "New cut"],
      ["Week 4", "Quick tidy"],
      ["Week 8", "Re-shape"],
    ],
  },
  {
    id: "wedding",
    t: "Wedding season",
    q: "A wedding in the family.",
    img: "bridalbraid",
    need: "A plan for hair, colour and the day itself.",
    exp: "Consultation, a trial, then the day.",
    svc: ["bridal", "style", "gloss"],
    res: "On the day you have already seen the look on yourself.",
    cd: [
      ["6 weeks", "Consultation and colour plan"],
      ["3 weeks", "Colour and cut"],
      ["1 week", "Trial styling"],
      ["Day of", "Styling"],
    ],
  },
  {
    id: "date",
    t: "Dinner for two",
    q: "Friday, 8 pm, somewhere very good.",
    img: "golden",
    need: "Hair that moves, and stays.",
    exp: "A blow-dry or soft waves, finished with a hold plan.",
    svc: ["style", "gloss"],
    res: "You feel like the version of you that planned this.",
    cd: [
      ["Afternoon", "Wash and style"],
      ["Evening", "Out the door"],
    ],
  },
  {
    id: "party",
    t: "Friday night",
    q: "A party, a reunion, a night out.",
    img: "purple",
    need: "Something with a little more edge than usual.",
    exp: "Texture, curls or a bolder shade, discussed first.",
    svc: ["style", "balayage", "gloss"],
    res: "You walk in already warmed up.",
    cd: [
      ["2 weeks", "Colour, if you want it"],
      ["Day of", "Styling"],
    ],
  },
  {
    id: "celebration",
    t: "Their big day",
    q: "A birthday, an anniversary, a promotion.",
    img: "redupdo",
    need: "To mark it properly.",
    exp: "A treat: cut, gloss and a spa, in one sitting.",
    svc: ["gloss", "spa", "cut"],
    res: "A small ceremony of your own.",
    cd: [
      ["Week before", "Book"],
      ["Day before", "Cut, gloss, spa"],
    ],
  },
  {
    id: "holiday",
    t: "Before you fly",
    q: "A week somewhere sunny.",
    img: "brownwind",
    need: "Hair that survives heat, water and no hairdryer.",
    exp: "A smoothening or a restorative spa, timed before the trip.",
    svc: ["smooth", "spa"],
    res: "You pack less. Hair behaves.",
    cd: [
      ["2 weeks", "Smoothening"],
      ["3 days", "Trim"],
      ["After", "Restorative spa"],
    ],
  },
  {
    id: "weekend",
    t: "A slow Sunday",
    q: "Nothing on the list but you.",
    img: "wash",
    need: "Time, and someone who listens.",
    exp: "A spa, a gloss and a proper talk about your hair.",
    svc: ["spa", "gloss", "reset"],
    res: "You leave lighter than you came.",
    cd: [
      ["Morning", "Arrive without a plan"],
      ["Afternoon", "Leave with one"],
    ],
  },
  {
    id: "event",
    t: "Dress code: event",
    q: "A launch, a gala, an award night.",
    img: "updo",
    need: "A look that photographs well.",
    exp: "Styling built around the outfit and the lighting.",
    svc: ["style", "bridal"],
    res: "You are ready before you reach the door.",
    cd: [
      ["Day before", "Consult and trial"],
      ["Day of", "Styling"],
    ],
  },
];

/* ---------- COLOUR ---------- */
const COL = [
  {
    id: "black",
    n: "Black",
    img: "darkback",
    sample: "s_black",
    shades: [
      ["Jet", "#16110F"],
      ["Soft black", "#241A16"],
      ["Blue black", "#171A26"],
    ],
    lift: "None needed on dark hair.",
    time: "About 1 to 1.5 hours",
    longevity: "Holds rich for months. It can warm up in strong sun.",
    maint: "Roots every 5 to 6 weeks.",
    process: "Single-step colour, then gloss.",
    cond: "Going lighter later takes lightening, so this is the hardest shade to leave.",
    after: "Colour-safe shampoo, a gloss every few weeks.",
    rel: ["root", "gloss"],
  },
  {
    id: "brown",
    n: "Brown",
    img: "brownwave",
    sample: "s_wave",
    shades: [
      ["Espresso", "#2E1D15"],
      ["Walnut", "#4B3023"],
      ["Mushroom", "#6B5649"],
    ],
    lift: "Little to none.",
    time: "About 1.5 hours",
    longevity: "Soft fade over 6 to 8 weeks.",
    maint: "Touch-up every 6 to 8 weeks.",
    process: "Colour with a gloss to keep it from going flat.",
    cond: "Cool browns fade towards warm. A gloss keeps them even.",
    after: "Sulphate-free shampoo, cool rinses.",
    rel: ["root", "gloss"],
  },
  {
    id: "chocolate",
    n: "Chocolate",
    img: "braid",
    sample: "s_curl",
    shades: [
      ["Cocoa", "#4D2C1F"],
      ["Mocha", "#5F3B2C"],
      ["Milk chocolate", "#7C4F38"],
    ],
    lift: "Mild lightening on very dark hair.",
    time: "1.5 to 2 hours",
    longevity: "Rich for 6 to 8 weeks.",
    maint: "Gloss at 4 to 6 weeks.",
    process: "Colour and gloss.",
    cond: "Looks deepest on healthy, shiny hair. Dry ends read flat.",
    after: "Restorative spa monthly.",
    rel: ["gloss", "spa"],
  },
  {
    id: "caramel",
    n: "Caramel",
    img: "pinkwall",
    sample: "s_ombre",
    shades: [
      ["Toffee", "#9B6335"],
      ["Caramel", "#B87A3F"],
      ["Honey", "#CB9B56"],
    ],
    lift: "Lightening needed on dark hair.",
    time: "3 to 4.5 hours with balayage",
    longevity: "Tone softens in 8 to 10 weeks.",
    maint: "Tone refresh every 8 to 10 weeks.",
    process: "Hand-painted lightening, toning, gloss.",
    cond: "Prior colour, henna or heat damage change how far one visit can go.",
    after: "Bond-care mask, sulphate-free shampoo, less heat.",
    rel: ["balayage", "gloss"],
  },
  {
    id: "burgundy",
    n: "Burgundy",
    img: "redbraid",
    sample: "s_flick",
    shades: [
      ["Black cherry", "#4B1527"],
      ["Burgundy", "#6E1C34"],
      ["Mahogany", "#7B2B25"],
    ],
    lift: "Light lift on dark hair for the brightest tones.",
    time: "2 to 3 hours",
    longevity: "Reds fade fastest, often in 3 to 4 weeks.",
    maint: "Gloss every 4 weeks.",
    process: "Colour, then a red-depositing gloss.",
    cond: "Wash cool. Heat and hot water pull red out quickly.",
    after: "Colour-depositing conditioner between visits.",
    rel: ["root", "gloss"],
  },
  {
    id: "blonde",
    n: "Blonde",
    img: "blondeback",
    sample: "s_long",
    shades: [
      ["Dark blonde", "#A98B5E"],
      ["Golden", "#D3B06F"],
      ["Ash blonde", "#CBC09F"],
      ["Platinum", "#E8E1CF"],
    ],
    lift: "Most lightening. A strand test comes first.",
    time: "4 to 6 hours, sometimes two visits",
    longevity: "Needs toning every 6 to 8 weeks.",
    maint: "Toner every 6 to 8 weeks, bond care throughout.",
    process: "Lightening, toning, bond-care treatment, gloss.",
    cond: "Hair history decides whether it happens in one visit. Honest advice beats a damaged result.",
    after: "Purple-toned care, bond-care mask, minimal heat.",
    rel: ["balayage", "spa"],
  },
];
const CMAP = Object.fromEntries(COL.map((c) => [c.id, c]));
const TECH = [
  ["all", "All over"],
  ["root", "Root shadow"],
  ["bal", "Balayage"],
  ["face", "Face frame"],
];

/* ---------- QUIZ ---------- */
const QZ = [
  {
    k: "occ",
    q: "What are you getting ready for?",
    o: [
      ["party", "A party"],
      ["wedding", "A wedding"],
      ["date", "A date"],
      ["work", "Work"],
      ["holiday", "A holiday"],
      ["everyday", "Everyday"],
      ["change", "I want a change"],
    ],
  },
  {
    k: "len",
    q: "How long is your hair?",
    o: [
      ["short", "Short"],
      ["mid", "Shoulder length"],
      ["long", "Long"],
    ],
  },
  {
    k: "goal",
    q: "What would feel right?",
    o: [
      ["shape", "A better cut"],
      ["colour", "A new colour"],
      ["smooth", "Smoother, easier hair"],
      ["refresh", "A refresh"],
      ["groom", "Cut and beard"],
      ["occasion", "Styled for an event"],
    ],
  },
  {
    k: "col",
    q: "How do you feel about colour?",
    o: [
      ["none", "None"],
      ["subtle", "Subtle"],
      ["bold", "Bold"],
    ],
  },
  {
    k: "maint",
    q: "How much upkeep suits you?",
    o: [
      ["low", "As little as possible"],
      ["mid", "Every couple of months"],
      ["high", "Happy to come monthly"],
    ],
  },
  {
    k: "time",
    q: "How long can you sit?",
    o: [
      ["30", "About 30 minutes"],
      ["60", "An hour"],
      ["120", "Two hours"],
      ["300", "Half a day"],
    ],
  },
  {
    k: "feel",
    q: "How should you feel after?",
    o: [
      ["sharp", "Sharp"],
      ["soft", "Soft"],
      ["bold", "Bold"],
      ["easy", "Effortless"],
    ],
  },
];

/* ---------- AFTERCARE LOOP ---------- */
const LOOP = [
  [
    "2 hours",
    "Thank you and your aftercare card.",
    "Thank you for coming in. Your aftercare card is below, with wash timing. Reply here if anything feels off.",
  ],
  [
    "2 days",
    "A check-in.",
    "How is the hair settling? If anything feels different, send us a photo and we will advise.",
  ],
  [
    "7 days",
    "A review request, for everyone.",
    "If you have a minute, a Google review helps neighbours find us. Here is the link.",
  ],
  [
    "4 to 6 weeks",
    "Your rebooking window.",
    "Your colour is due for a refresh around now. Shall we hold a slot with the same stylist?",
  ],
  [
    "Birthday month",
    "A small note.",
    "Happy birthday month. A complimentary gloss add-on is yours with any booking this month. (proposed)",
  ],
  [
    "90 days quiet",
    "A win-back.",
    "It has been a while. Tell us what changed and we will plan from there.",
  ],
];

/* ---------- VOICES ---------- */
const NEARBY = [
  // Verified: Google Maps list reads, 10 Oct 2026. Existing outlets, not these salons.
  ["Bhartiya Mall of Bengaluru", "1.2 km from Sobha Arcadia", 4.8, 2447],
  ["Chokkanahalli", "0.85 km from Sobha Arcadia", 4.8, 570],
  ["Gunjur", "1.95 km from Prestige Tech Forest", 4.5, 736],
  ["Balagere", "2.0 km from Prestige Tech Forest", 4.6, 276],
];
const SAMPLE_VOICES = [
  // Layout samples only. Replace with real client words, with permission.
  [
    "Twenty minutes of questions before anyone picked up a pair of scissors. That has never happened to me.",
    "Colour consultation",
    "s",
  ],
  [
    "I booked the lunchtime slot between two calls and was back at my desk early.",
    "Executive cut",
    "p",
  ],
  [
    "My mother and I had our hair done the same afternoon, chairs next to each other.",
    "Family appointment",
    "s",
  ],
  [
    "I had been told no to blonde four times. They explained exactly why, and what we could do over two visits.",
    "Balayage",
    "s",
  ],
  [
    "The wedding trial changed my mind about the whole look. Glad we did it six weeks out.",
    "Bridal trial",
    "s",
  ],
  [
    "The check-in on day two was a real message, not a coupon.",
    "Aftercare",
    "p",
  ],
];

const IMG = {
  flow: {
    u: "/assets/faf4ffe9acc5f171.webp",
    a: "Black and white portrait, long dark hair caught mid-movement",
    w: 834,
    h: 1300,
  },
  cut: {
    u: "/assets/2f44935965d29535.webp",
    a: "Stylist sectioning and cutting long wet dark hair with scissors",
    w: 1040,
    h: 1300,
  },
  colourwork: {
    u: "/assets/a87d893aaeb64c6a.webp",
    a: "Colourist applying colour to hair with gloved hands in a salon",
    w: 1200,
    h: 799,
  },
  blowdry: {
    u: "/assets/5b5416254b3ed7ea.webp",
    a: "Stylist blow-drying a client's bob and smiling in a bright salon",
    w: 1200,
    h: 801,
  },
  finish: {
    u: "/assets/a864e437cb18d4bc.webp",
    a: "Dark hair flying upward in a studio",
    w: 866,
    h: 1300,
  },
  wash: {
    u: "/assets/a73d2bfd40b81c8c.webp",
    a: "Client having hair washed at a salon basin",
    w: 1200,
    h: 799,
  },
  salonA: {
    u: "/assets/eb13b9286ed2a0d1.webp",
    a: "Dark salon with round mirrors and black styling chairs",
    w: 800,
    h: 555,
  },
  salonB: {
    u: "/assets/9ddeca2e5ff48daa.webp",
    a: "Modern salon with brick wall, round mirrors and black chairs",
    w: 800,
    h: 533,
  },
  salonC: {
    u: "/assets/7c9364c254b6878e.webp",
    a: "Salon interior with three maroon chairs facing a mirror wall",
    w: 800,
    h: 533,
  },
  salonD: {
    u: "/assets/a91ad47e520cf917.webp",
    a: "Bright salon with black chairs and window light",
    w: 800,
    h: 534,
  },
  salonE: {
    u: "/assets/77997c402600dd79.webp",
    a: "Salon lounge with a wash station and a ring-light mirror",
    w: 800,
    h: 1200,
  },
  salonF: {
    u: "/assets/c87711e1b2967a2d.webp",
    a: "Round lit salon mirror reflecting a stylist and client",
    w: 800,
    h: 1200,
  },
  salonG: {
    u: "/assets/b3f10d6a72d695c3.webp",
    a: "Bright airy salon with a stylist working at a chair",
    w: 800,
    h: 1200,
  },
  basins: {
    u: "/assets/32c770c7485a6a68.webp",
    a: "Black and white photograph of salon wash basins",
    w: 800,
    h: 1200,
  },
  chairvintage: {
    u: "/assets/68fb5e36ff6b95e0.webp",
    a: "Classic barber chair in a warm dark shop",
    w: 800,
    h: 1000,
  },
  tools: {
    u: "/assets/de56bd9579cf1bab.webp",
    a: "Hands holding brushes, scissors and a tinting brush against a white wall",
    w: 800,
    h: 534,
  },
  blondeback: {
    u: "/assets/36b87a9194e338b5.webp",
    a: "Long blonde highlighted hair seen from behind",
    w: 800,
    h: 1200,
  },
  ombre: {
    u: "/assets/644b46d28c0f1b48.webp",
    a: "Grey-blonde ombre waves seen from behind",
    w: 800,
    h: 1200,
  },
  foils: {
    u: "/assets/afa6901018112e74.webp",
    a: "Foils being applied to hair in a salon",
    w: 800,
    h: 533,
  },
  purple: {
    u: "/assets/dcef13ffc2b11610.webp",
    a: "Long lavender waves on a woman looking down",
    w: 800,
    h: 1200,
  },
  blondebob: {
    u: "/assets/09b6da2d2da4d016.webp",
    a: "Smooth blonde bob seen from behind",
    w: 800,
    h: 1200,
  },
  greywave: {
    u: "/assets/972a055bfb47900f.webp",
    a: "Ash-toned curls seen from behind",
    w: 800,
    h: 1000,
  },
  golden: {
    u: "/assets/405c640ce5324d59.webp",
    a: "Portrait with long golden-copper hair",
    w: 800,
    h: 856,
  },
  shag: {
    u: "/assets/d9547ee2aa5a154e.webp",
    a: "Profile of a short layered cut with soft colour",
    w: 800,
    h: 565,
  },
  redbob: {
    u: "/assets/d47eb32b5bdea2fa.webp",
    a: "Copper-red bob with a sharp fringe against a dark background",
    w: 800,
    h: 533,
  },
  auburnknot: {
    u: "/assets/c676fe70aa2d61d9.webp",
    a: "Auburn hair twisted into a knot",
    w: 731,
    h: 1300,
  },
  brownwind: {
    u: "/assets/019895b11e8d3344.webp",
    a: "Brown hair blown by the wind",
    w: 800,
    h: 533,
  },
  redbraid: {
    u: "/assets/93a95f72859776f5.webp",
    a: "Copper hair in a loose side braid",
    w: 800,
    h: 1200,
  },
  redupdo: {
    u: "/assets/6f7993962fc48740.webp",
    a: "Copper-red updo from behind",
    w: 800,
    h: 533,
  },
  orangeclose: {
    u: "/assets/302d8c4456d7030c.webp",
    a: "Close-up of glossy copper hair",
    w: 800,
    h: 1200,
  },
  brownwave: {
    u: "/assets/4ff5880841d9dbe1.webp",
    a: "Soft brown curls",
    w: 800,
    h: 1200,
  },
  curls: {
    u: "/assets/57a8c1e318259d30.webp",
    a: "Dark curls seen from behind",
    w: 800,
    h: 533,
  },
  motion1: {
    u: "/assets/013386aebc687295.webp",
    a: "Copper hair in motion",
    w: 800,
    h: 1200,
  },
  motion2: {
    u: "/assets/32704e05cb5564bb.webp",
    a: "Light brown hair in motion",
    w: 800,
    h: 533,
  },
  motion3: {
    u: "/assets/6193c82cd29da824.webp",
    a: "Hair flicked mid-air",
    w: 800,
    h: 800,
  },
  braid: {
    u: "/assets/d7613c21d269fb16.webp",
    a: "Close-up of a brown braid",
    w: 800,
    h: 1085,
  },
  blondepair: {
    u: "/assets/8c6bc8da6e3f8a76.webp",
    a: "Long wavy blonde hair seen from behind",
    w: 800,
    h: 800,
  },
  darkback: {
    u: "/assets/9912c526ad809a86.webp",
    a: "Smooth brown hair from behind against black",
    w: 800,
    h: 1200,
  },
  pinkwall: {
    u: "/assets/4dbc4ca00e109118.webp",
    a: "Long caramel hair, hands raised, pink wall",
    w: 800,
    h: 534,
  },
  roundbrush: {
    u: "/assets/7f0b496ae16dbd0b.webp",
    a: "Round brush styling blonde hair",
    w: 800,
    h: 1200,
  },
  curl: {
    u: "/assets/6415d020a04b735d.webp",
    a: "Curling iron shaping soft waves",
    w: 730,
    h: 1300,
  },
  blowhand: {
    u: "/assets/0a1b30397f8fc2f9.webp",
    a: "Stylist blow-drying hair with a round brush",
    w: 800,
    h: 534,
  },
  curler2: {
    u: "/assets/183322b8cdad5209.webp",
    a: "Stylist curling hair in a bright salon",
    w: 800,
    h: 533,
  },
  straight: {
    u: "/assets/fd80b105ae6f9e7d.webp",
    a: "Stylist smoothing a bob with a flat iron",
    w: 800,
    h: 534,
  },
  scissors: {
    u: "/assets/482f030a18855526.webp",
    a: "Hand holding scissors and a lock of hair",
    w: 800,
    h: 1200,
  },
  updo: {
    u: "/assets/b4240cbf66a883d6.webp",
    a: "Stylist finishing a sculpted updo with spray",
    w: 800,
    h: 533,
  },
  bridalpearl: {
    u: "/assets/c0c4dd5b55fb92af.webp",
    a: "Bridal half-up style with pearl hair pins, from behind",
    w: 800,
    h: 1202,
  },
  crown: {
    u: "/assets/16d15a5cd1640975.webp",
    a: "Bride with flowers in her hair",
    w: 800,
    h: 533,
  },
  bridalbraid: {
    u: "/assets/9447f59612624859.webp",
    a: "Bride with a floral braid",
    w: 800,
    h: 1200,
  },
  menblow: {
    u: "/assets/929c539924e13fca.webp",
    a: "Barber blow-drying a bearded client's hair",
    w: 800,
    h: 1200,
  },
  razor: {
    u: "/assets/4555b0e8ca1590c7.webp",
    a: "Barber shaping a fade with a razor",
    w: 800,
    h: 1198,
  },
  beardprof: {
    u: "/assets/ca76ce4bdfccd6d0.webp",
    a: "Profile of a man with a styled quiff and full beard",
    w: 800,
    h: 1200,
  },
  fade: {
    u: "/assets/e2872e14f224745d.webp",
    a: "Barber working on a skin fade",
    w: 800,
    h: 1200,
  },
  beardbw: {
    u: "/assets/95d14df7ada4c360.webp",
    a: "Black and white photo of a beard being trimmed with scissors",
    w: 800,
    h: 1204,
  },
  lather: {
    u: "/assets/5a1952e2f9346f33.webp",
    a: "Black and white photo of shaving lather being applied",
    w: 800,
    h: 533,
  },
  scissbeard: {
    u: "/assets/267a8818cd929575.webp",
    a: "Barber trimming a beard with scissors",
    w: 800,
    h: 1200,
  },
  shave: {
    u: "/assets/f76ff2cd9d56757c.webp",
    a: "Beard being trimmed in a dark barber shop",
    w: 800,
    h: 533,
  },
  manscissors: {
    u: "/assets/f8ed1ec677e60959.webp",
    a: "Black and white portrait of a barber holding scissors",
    w: 800,
    h: 1000,
  },
  fadecut: {
    u: "/assets/3e82a2e73763dc4c.webp",
    a: "Barber cutting hair with comb and scissors",
    w: 800,
    h: 1000,
  },
  barberchair: {
    u: "/assets/f214ddb787f4b7a9.webp",
    a: "Man reclined in a barber chair",
    w: 800,
    h: 533,
  },
  exec1: {
    u: "/assets/1eb04a281464f931.webp",
    a: "Man in a dark suit with arms crossed",
    w: 800,
    h: 1200,
  },
  exec2: {
    u: "/assets/98ad04497bb7a18b.webp",
    a: "Man in a navy suit adjusting his jacket",
    w: 800,
    h: 1200,
  },
  exec3: {
    u: "/assets/17db9724a955f82c.webp",
    a: "Bearded man in a grey suit standing in a doorway",
    w: 800,
    h: 1200,
  },
  exec4: {
    u: "/assets/c1554366cfb403c8.webp",
    a: "Man in a navy suit buttoning his jacket",
    w: 800,
    h: 533,
  },
  kid1: {
    u: "/assets/8611fd4edc23e9bc.webp",
    a: "Black and white photo of a boy getting a haircut",
    w: 800,
    h: 533,
  },
  kid2: {
    u: "/assets/2bf291bbf2b58d3b.webp",
    a: "Black and white close-up of a boy's haircut",
    w: 800,
    h: 533,
  },
  kid3: {
    u: "/assets/a48f3edb02fd6510.webp",
    a: "Black and white photo of a boy in a barber chair",
    w: 800,
    h: 533,
  },
  kidbarber: {
    u: "/assets/8ad886e922fbacf6.webp",
    a: "Barber trimming a child's hair",
    w: 800,
    h: 1200,
  },
};
const SAMPLES = {
  s_black: {
    u: "/assets/fa3cc17a23833010.webp",
    m: "/assets/9655982a67765771.png",
    a: "Smooth brown hair, black backdrop",
    w: 480,
    h: 720,
  },
  s_ombre: {
    u: "/assets/3de8e970d2c83420.webp",
    m: "/assets/68728a9c773fd096.png",
    a: "Wavy ash ombre, lilac backdrop",
    w: 480,
    h: 720,
  },
  s_wave: {
    u: "/assets/2bbe1d8031086404.webp",
    m: "/assets/9ab7c0f651c5367f.png",
    a: "Dark waves on white paper",
    w: 719,
    h: 483,
  },
  s_curl: {
    u: "/assets/504d20f3c2325c54.webp",
    m: "/assets/4dc986f13277d195.png",
    a: "Dark curls, pale blue wall",
    w: 719,
    h: 383,
  },
  s_flick: {
    u: "/assets/a04c8a9cfdafab7d.webp",
    m: "/assets/e0fdd6cd43517b72.png",
    a: "Hair mid-flick",
    w: 719,
    h: 719,
  },
  s_long: {
    u: "/assets/99b7ddbd25dddbe4.webp",
    m: "/assets/c340295964104cc9.png",
    a: "Long blonde hair, bright salon",
    w: 480,
    h: 720,
  },
};

("use strict");
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const hex2rgb = (h) => {
  h = h.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};
function store(k, v) {
  try {
    if (v === undefined) return localStorage.getItem(k);
    localStorage.setItem(k, v);
  } catch (e) {
    return null;
  }
}
let toastT;
function toast(msg) {
  let t = $(".toast");
  if (t) t.remove();
  t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastT);
  toastT = setTimeout(() => t.remove(), 3400);
}
const TAGS = {
  v: "Verified",
  i: "Inference",
  r: "Recommendation",
  c: "Concept",
};
const tag = (k) => `<span class="tag ${k}">${TAGS[k]}</span>`;
const src = (k) => (IMG[k] || SAMPLES[k]).u;
const alt = (k) => (IMG[k] || SAMPLES[k]).a;
const im = (k, extra = "") =>
  `<img src="${src(k)}" alt="${esc(alt(k))}" ${imageAttributes(src(k), { priority: extra.includes('fetchpriority="high"') })} ${extra}>`;
const pic = (k, cls = "", cap = "") =>
  `<figure class="ph ${cls}">${im(k)}${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
const tile = (go, k, title, sub, prefill) =>
  `<a class="tile" href="#${go}" data-go="${go}" ${prefill ? `data-prefill='${JSON.stringify(prefill)}'` : ""}>${im(k)}<div><span>${sub || ""}</span><b>${title}</b></div></a>`;
const dir = (l) => {
  const p = LOC[l].pin;
  return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
};
const sisters = () => (CONFIG.branded ? B : "our");

/* ---------- colour try-on engine (real photographs) ---------- */
class Tryon {
  constructor(host, opts = {}) {
    this.host = host;
    this.edit = !!opts.edit;
    this.c = document.createElement("canvas");
    this.ctx = this.c.getContext("2d", { willReadFrequently: true });
    this.col = [75, 48, 35];
    this.tech = "all";
    this.split = 0;
    this.r = 28;
    this.erase = false;
    this.dirty = true;
    this.ready = false;
    host.appendChild(this.c);
    this.c.setAttribute("role", "img");
    if (this.edit) {
      this.drag = false;
      this.last = null;
      const pos = (e) => {
        const b = this.c.getBoundingClientRect(),
          s = b.width / this.w;
        return [(e.clientX - b.left) / s, (e.clientY - b.top) / s];
      };
      this.c.addEventListener("pointerdown", (e) => {
        if (!this.ready || !this.edit) return;
        this.drag = true;
        this.c.setPointerCapture(e.pointerId);
        const p = pos(e);
        this.stamp(p[0], p[1]);
        this.last = p;
        this.draw();
      });
      this.c.addEventListener("pointermove", (e) => {
        if (!this.drag) return;
        const p = pos(e),
          l = this.last,
          d = Math.hypot(p[0] - l[0], p[1] - l[1]),
          n = Math.max(1, Math.ceil(d / (this.r * 0.35)));
        for (let i = 1; i <= n; i++)
          this.stamp(
            l[0] + ((p[0] - l[0]) * i) / n,
            l[1] + ((p[1] - l[1]) * i) / n,
          );
        this.last = p;
        this.draw();
      });
      ["pointerup", "pointercancel"].forEach((ev) =>
        this.c.addEventListener(ev, () => {
          this.drag = false;
        }),
      );
    }
  }
  setImage(img, maskImg, label) {
    const max = 760,
      k = Math.min(
        1,
        max /
          Math.max(
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
          ),
      );
    const w = Math.round((img.naturalWidth || img.width) * k),
      h = Math.round((img.naturalHeight || img.height) * k);
    this.w = w;
    this.h = h;
    this.c.width = w;
    this.c.height = h;
    this.ctx.drawImage(img, 0, 0, w, h);
    this.orig = this.ctx.getImageData(0, 0, w, h);
    this.out = this.ctx.createImageData(w, h);
    this.mask = new Float32Array(w * h);
    if (maskImg) {
      const t = document.createElement("canvas");
      t.width = w;
      t.height = h;
      const tc = t.getContext("2d", { willReadFrequently: true });
      tc.drawImage(maskImg, 0, 0, w, h);
      const d = tc.getImageData(0, 0, w, h).data;
      for (let i = 0; i < w * h; i++) this.mask[i] = d[i * 4] / 255;
    }
    this.c.setAttribute("aria-label", label || "Photo with a colour preview");
    this.dirty = true;
    this.ready = true;
    this.draw();
  }
  loadSample(key) {
    return new Promise((res) => {
      const S = SAMPLES[key],
        a = new Image(),
        m = new Image();
      let n = 0;
      const go = () => {
        if (++n === 2) {
          this.setImage(a, m, S.a + ". Colour preview.");
          res();
        }
      };
      a.onload = go;
      m.onload = go;
      a.src = S.u;
      m.src = S.m;
    });
  }
  stamp(x, y) {
    const r = this.r,
      x0 = Math.max(0, Math.floor(x - r)),
      x1 = Math.min(this.w - 1, Math.ceil(x + r)),
      y0 = Math.max(0, Math.floor(y - r)),
      y1 = Math.min(this.h - 1, Math.ceil(y + r));
    for (let j = y0; j <= y1; j++)
      for (let i = x0; i <= x1; i++) {
        const d = Math.hypot(i - x, j - y) / r;
        if (d > 1) continue;
        const a = 1 - smooth(0.55, 1, d),
          k = j * this.w + i;
        this.mask[k] = this.erase
          ? Math.min(this.mask[k], 1 - a)
          : Math.max(this.mask[k], a);
      }
    this.dirty = true;
  }
  setColour(hex, tech) {
    this.col = hex2rgb(hex);
    this.tech = tech === "face" ? "all" : tech || "all";
    this.draw();
  }
  setSplit(v) {
    this.split = v;
    this.draw();
  }
  clear() {
    this.mask.fill(0);
    this.dirty = true;
    this.draw();
  }
  stats() {
    let n = 0,
      s = 0,
      y0 = this.h,
      y1 = 0;
    const o = this.orig.data,
      w = this.w;
    for (let j = 0; j < this.h; j++)
      for (let i = 0; i < w; i++) {
        const k = j * w + i,
          m = this.mask[k];
        if (m > 0.5) {
          const p = k * 4;
          s += (0.299 * o[p] + 0.587 * o[p + 1] + 0.114 * o[p + 2]) / 255;
          n++;
          if (j < y0) y0 = j;
          if (j > y1) y1 = j;
        }
      }
    this.hm = n ? s / n : 0.3;
    this.y0 = y0;
    this.y1 = Math.max(y1, y0 + 1);
    this.dirty = false;
  }
  draw() {
    if (!this.ready) return;
    if (this.dirty) this.stats();
    const o = this.orig.data,
      d = this.out.data,
      w = this.w,
      T = this.col,
      lt = (0.299 * T[0] + 0.587 * T[1] + 0.114 * T[2]) / 255,
      span = this.y1 - this.y0,
      hm = this.hm,
      sx = Math.round(this.split * w);
    for (let j = 0; j < this.h; j++) {
      const t = (j - this.y0) / span;
      const wt =
        this.tech === "root"
          ? 0.2 + 0.8 * smooth(0.02, 0.55, t)
          : this.tech === "bal"
            ? 0.1 + 0.9 * smooth(0.22, 0.8, t)
            : 1;
      for (let i = 0; i < w; i++) {
        const k = j * w + i,
          p = k * 4,
          m = i < sx ? 0 : this.mask[k] * wt * 0.94;
        if (m < 0.004) {
          d[p] = o[p];
          d[p + 1] = o[p + 1];
          d[p + 2] = o[p + 2];
          d[p + 3] = 255;
          continue;
        }
        const lo = (0.299 * o[p] + 0.587 * o[p + 1] + 0.114 * o[p + 2]) / 255,
          det = lo - hm;
        const Ln = clamp(lt + det * 1.2 + Math.max(0, det - 0.18) * 0.3, 0, 1),
          sc = Ln / Math.max(lt, 0.05);
        d[p] = o[p] + (clamp(T[0] * sc, 0, 255) - o[p]) * m;
        d[p + 1] = o[p + 1] + (clamp(T[1] * sc, 0, 255) - o[p + 1]) * m;
        d[p + 2] = o[p + 2] + (clamp(T[2] * sc, 0, 255) - o[p + 2]) * m;
        d[p + 3] = 255;
      }
    }
    this.ctx.putImageData(this.out, 0, 0);
    if (this.split > 0.01 && this.split < 0.995) {
      this.ctx.fillStyle = "rgba(255,255,255,.85)";
      this.ctx.fillRect(sx - 1, 0, 2, this.h);
    }
  }
}

/* ---------- map (distance rings, no decoration) ---------- */
function mapSVG(L) {
  const o = L.pin,
    W = 560,
    Hh = 420,
    cx = W / 2,
    cy = Hh / 2,
    sc = 330 / 2.2;
  const proj = (lat, lng) => {
    const x = (lng - o.lng) * 111.32 * Math.cos((o.lat * Math.PI) / 180),
      y = (lat - o.lat) * 110.57;
    return [cx + x * sc, cy - y * sc];
  };
  const rings = [0.5, 1, 2]
    .map(
      (k) =>
        `<circle cx="${cx}" cy="${cy}" r="${k * sc}" fill="none" stroke="var(--rule)" stroke-width="1.2" stroke-dasharray="${k === 1 ? "" : "4 5"}"/><text x="${cx + k * sc * 0.71 + 4}" y="${cy - k * sc * 0.71 - 3}" font-size="11" fill="var(--mute)">${k} km</text>`,
    )
    .join("");
  const an = L.anchors
    .map((a) => {
      const [x, y] = proj(a.lat, a.lng);
      if (x < 10 || x > W - 10 || y < 10 || y > Hh - 10) return "";
      const d = Math.hypot(x - cx, y - cy) / sc;
      const left = x > W - 160;
      return `<circle cx="${x}" cy="${y}" r="4" fill="var(--ink)"/><text x="${left ? x - 10 : x + 10}" y="${y + 4}" font-size="12.5" fill="var(--ink)" text-anchor="${left ? "end" : "start"}">${esc(a.n)} (${d.toFixed(1)} km)</text>`;
    })
    .join("");
  return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Distance map for ${esc(L.name)} with rings at 0.5, 1 and 2 kilometres">${rings}${an}
  <circle cx="${cx}" cy="${cy}" r="16" fill="var(--acc)" fill-opacity=".2"/><circle cx="${cx}" cy="${cy}" r="7" fill="var(--acc)"/>
  <text x="${cx}" y="${cy + 32}" font-size="13.5" font-weight="700" fill="var(--ink)" text-anchor="middle">${esc(L.name)}</text></svg>`;
}

/* ---------- router ---------- */
const S = {
  quiz: {},
  qi: 0,
  col: { fam: "caramel", shade: 1, tech: "bal", sample: null, mode: "sample" },
  book: { step: 0 },
  filt: null,
  loop: "balayage",
};
const R = {};
const NAV = [
  ["services", "Services"],
  ["colour-room", "Colour room"],
  ["stylists", "Stylists"],
  ["occasions", "Occasions"],
  ["voices", "Voices"],
  ["visit", "Visit"],
];
let curLoc = ["s", "p"].includes(store("loc")) ? store("loc") : "";
function parseRoute() {
  const h = pathToRoute(location.pathname) || "not-found";
  if (R[h]) return [h, null];
  const m = h.match(/^(service|colour|stylist|occasion)-(.+)$/);
  if (m && R[m[1]] && R[m[1]].ok(m[2])) return [m[1], m[2]];
  return ["not-found", null];
}
function migrateLegacyHash() {
  const path = routeToPath(location.hash);
  if (path) history.replaceState(null, "", path);
}
function go(id) {
  const path = routeToPath(id);
  if (!path) return;
  if (location.pathname + location.search !== path) history.pushState(null, "", path);
  render();
}
function locOf(id) {
  return id === "sobha-arcadia"
    ? "s"
    : id === "prestige-tech-forest"
      ? "p"
      : "";
}
let heroT = null;
function render() {
  clearInterval(heroT);
  const [id, arg] = parseRoute(),
    l = locOf(id);
  if (l) {
    curLoc = l;
    store("loc", l);
  }
  document.body.dataset.loc =
    l || (id === "book" || id === "aftercare" ? curLoc : "");
  const app = $("#app");
  app.innerHTML = "";
  R[id](app, arg);
  const hd = $(".hd");
  hd.classList.toggle("pg", id !== "home");
  hd.classList.remove("solid");
  onScroll();
  $$(".nav a,.sheet a").forEach((a) => a.removeAttribute("aria-current"));
  const navId =
    id === "service"
      ? "services"
      : id === "colour"
        ? "colour-room"
        : id === "stylist"
          ? "stylists"
          : id === "occasion"
            ? "occasions"
            : id;
  $$(`[data-nav="${navId}"]`).forEach((a) =>
    a.setAttribute("aria-current", "page"),
  );
  const sh = $(".sheet");
  if (sh) sh.remove();
  $(".menu-b").setAttribute("aria-expanded", "false");
  $("#fdir").href = dir(curLoc || "s");
  scrollTo(0, 0);
  const t =
    typeof R[id].title === "function" ? R[id].title(arg) : R[id].title || id;
  const metadata = applyPageMetadata(document, arg ? id + "-" + arg : id, {
    title: t,
    description: id === "service" ? SMAP[arg].what : $(".lead", app)?.textContent || "",
  });
  normalizeLinks(document);
  trackPageView(arg ? id + "-" + arg : id, metadata.title);
}
function onScroll() {
  const hd = $(".hd");
  if (!hd) return;
  if (!hd.classList.contains("pg")) hd.classList.toggle("solid", scrollY > 60);
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("hashchange", () => { migrateLegacyHash(); render(); });
addEventListener("popstate", render);
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === "_blank" || a.hasAttribute("download")) return;
  const href = a.getAttribute("href") || "";
  const clean = href.startsWith("#") ? routeToPath(href) : href;
  const target = clean ? new URL(clean, location.href) : null;
  const route = target?.origin === location.origin ? pathToRoute(target.pathname) : null;
  if (!route) return;
  e.preventDefault();
  if (a.dataset.prefill) {
    const p = JSON.parse(a.dataset.prefill);
    if (p.fam) {
      S.col.fam = p.fam;
      S.col.shade = Math.min(1, CMAP[p.fam].shades.length - 1);
      S.col.sample = CMAP[p.fam].sample;
    } else S.book = { step: 0, ...p };
  }
  go(route + target.search);
});

/* ---------- shell ---------- */
const logoHTML = `${esc(B)}<i>Bengaluru</i>`;
function shell() {
  // Static HTML is visible before JS loads; replace its shell once to bind interactions.
  document.querySelectorAll("body > header.hd,body > main#app,body > footer.ft,body > .float").forEach(el => el.remove());
  $("#app")?.remove();
  document.body.insertAdjacentHTML(
    "afterbegin",
    `
  <header class="hd"><div class="wrap"><a class="logo" href="#home" data-go="home" aria-label="${esc(B)} Bengaluru, home">${logoHTML}</a>
    <nav class="nav" aria-label="Main">${NAV.map((n) => `<a href="#${n[0]}" data-go="${n[0]}" data-nav="${n[0]}">${n[1]}</a>`).join("")}</nav>
    <a class="btn sm bk" href="#book" data-go="book">Reserve</a><button class="menu-b" aria-expanded="false" aria-controls="sheet">Menu</button></div></header>
  <main id="app"></main>
  <footer class="ft"><div class="wrap"><div class="cols">
    <div class="stack"><div class="logo" style="font-size:30px">${logoHTML}</div><p class="mute" style="max-width:34ch">Two new salons for people who take their hair seriously. Thanisandra and Varthur.</p></div>
    <div><h2 style="font-size:19px">Salons</h2><a href="#sobha-arcadia" data-go="sobha-arcadia">Sobha Arcadia</a><a href="#prestige-tech-forest" data-go="prestige-tech-forest">Prestige Tech Forest</a><a href="#visit" data-go="visit">Directions and hours</a><a href="#book" data-go="book">Reserve</a></div>
    <div><h2 style="font-size:19px">Explore</h2><a href="#services" data-go="services">Services</a><a href="#colour-room" data-go="colour-room">Colour room</a><a href="#find-your-look" data-go="find-your-look">Find your look</a><a href="#stylists" data-go="stylists">Find your stylist</a><a href="#occasions" data-go="occasions">Occasions</a></div>
    <div><h2 style="font-size:19px">The house</h2><a href="#standard" data-go="standard">The standard</a><a href="#voices" data-go="voices">Voices</a><a href="#aftercare" data-go="aftercare">Aftercare</a><a href="/privacy.html">Privacy</a><a href="/admin/">Staff login</a></div></div>
    <p class="fine">Branch contacts, hours and service prices are confirmed by the salon. Illustrative photography is shown pending the branch photo shoot. Colour previews are concepts, not predictions: a stylist confirms what suits your hair. Photos you add in the Colour room stay in your browser and are never uploaded.</p></div></footer>
  <div class="float" aria-label="Quick actions"><a class="btn" href="#book" data-go="book">Reserve</a><button class="btn sec" data-act="wa">WhatsApp</button><button class="btn sec" data-act="call">Call</button><a class="btn sec" id="fdir" target="_blank" rel="noopener">Directions</a></div>`,
  );
  $(".menu-b").addEventListener("click", () => {
    const open = $(".sheet");
    if (open) {
      open.remove();
      $(".menu-b").setAttribute("aria-expanded", "false");
      return;
    }
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="sheet" id="sheet">${[
        ["sobha-arcadia", "Sobha Arcadia"],
        ["prestige-tech-forest", "Prestige Tech Forest"],
      ]
        .concat(NAV)
        .concat([
          ["find-your-look", "Find your look"],
          ["standard", "The standard"],
          ["book", "Reserve"],
        ])
        .map((n) => `<a href="#${n[0]}" data-go="${n[0]}">${n[1]}</a>`)
        .join("")}</div>`,
    );
    $(".menu-b").setAttribute("aria-expanded", "true");
    normalizeLinks(document);
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const l = curLoc || "s",
      a = b.dataset.act;
    const v = a === "wa" ? CONFIG.whatsapp[l] : CONFIG.phone[l];
    if (!v)
      toast(
        "Contact details are being updated. Please use the booking request form.",
      );
    else if (a === "wa")
      window.open(
        "https://wa.me/" + v.replace(/\D/g, ""),
        "_blank",
        "noopener",
      );
    else location.href = "tel:" + v.replace(/[^+\d]/g, "");
  });
}

/* ---------- shared blocks ---------- */
function innerHero(
  k,
  { colour = false, crumb = "", h1 = "", lead = "", ctas = "" } = {},
) {
  return `<section class="ph-hero ${colour ? "colour" : ""}">${im(k, 'fetchpriority="high"').replace('loading="lazy"', 'loading="eager"')}<div class="wrap in"><div class="crumb">${crumb}</div><h1>${h1}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}<div class="row">${ctas}</div></div></section>`;
}
function ctaBand(
  h = "Reserve your first visit.",
  p = "Choose a salon and a preferred window. The salon contacts you to agree the exact time.",
) {
  return `<section class="cta blk">${im("salonB")}<div class="wrap stack" style="gap:26px"><h2 style="max-width:14ch">${h}</h2><p class="lead" style="color:rgba(243,237,225,.8)">${p}</p>
    <div class="row"><a class="btn" href="#book" data-go="book" data-prefill='${JSON.stringify({ loc: "s", step: 1 })}'>Sobha Arcadia</a><a class="btn on-photo" href="#book" data-go="book" data-prefill='${JSON.stringify({ loc: "p", step: 1 })}'>Prestige Tech Forest</a></div></div></section>`;
}
const sectionHead = (h, p, extra = "") =>
  `<div class="sh"><h2>${h}</h2>${p ? `<p class="lead">${p}</p>` : ""}${extra}</div>`;
const svcTiles = (list, n) =>
  `<div class="tiles">${list
    .slice(0, n || list.length)
    .map((s) => tile("service-" + s.id, s.img, s.name, s.tag))
    .join("")}</div>`;
function voiceBlock(loc) {
  const cards = CONFIG.sampleVoices
    ? SAMPLE_VOICES.filter((v) => !loc || v[2] === loc)
        .slice(0, 3)
        .concat(SAMPLE_VOICES.filter((v) => loc && v[2] !== loc))
        .slice(0, 3)
    : [];
  return `<div class="vq">${cards.map((v) => `<figure class="q" style="margin:0"><span class="stamp">Sample wording. Replace after launch.</span><p>“${v[0]}”</p><small>${v[1]} · ${LOC[v[2]].name}</small></figure>`).join("")}</div>`;
}

/* ---------- HOME ---------- */
const SCENES = [
  {
    k: "Consult",
    line: "Twenty minutes of listening before a single cut.",
    imgs: ["salonF", "wash", "scissors"],
    col: false,
  },
  {
    k: "Cut",
    line: "Precision, planned around your face and your week.",
    imgs: ["fadecut", "cut", "razor"],
    col: false,
  },
  {
    k: "Colour",
    line: "A shade chosen for you, and tested on you first.",
    imgs: ["foils", "colourwork", "ombre"],
    col: true,
  },
  {
    k: "Style",
    line: "Finished for the day you actually have.",
    imgs: ["curl", "blowdry", "updo"],
    col: false,
  },
  {
    k: "Walk out sure",
    line: "Hair that stops asking for your attention.",
    imgs: ["motion1", "finish", "redbob"],
    col: true,
  },
];
const SCENE_MS = 6400;
R.home = (app) => {
  app.innerHTML = `
  <section class="hero" id="hero" aria-label="Introduction">
    <div class="film" aria-hidden="true">${[0, 1, 2].map((c) => `<div class="reel">${SCENES.map((s, i) => `<img data-s="${i}" class="${i === 0 ? "on" : ""}" ${i === 0 ? `src="${src(s.imgs[c])}"` : `data-src="${src(s.imgs[c])}"`} alt="" ${imageAttributes(src(s.imgs[c]), { priority: i === 0 && c === 1 })} ${i === 0 && c === 1 ? 'fetchpriority="high"' : ""}>`).join("")}</div>`).join("")}</div>
    <div class="vig"></div>
    <div class="wrap hero-in">
      <div class="cap" style="color:var(--gold-text)">${esc(B)} · Thanisandra · Varthur · Bengaluru</div>
      <h1>Hair, done properly.</h1>
      <p class="sub">Precision cutting, bespoke colour, smoothening and grooming. Two new ${CONFIG.branded ? "" : "premium "}salons opening in Bengaluru.</p>
      <div class="scene" aria-live="polite"><b id="sn">01 / 05</b><span id="sk">${SCENES[0].k}.</span> <span class="small" id="sl" style="font-family:var(--sans);font-style:normal;color:rgba(243,237,225,.75);font-size:16px;margin-left:10px">${SCENES[0].line}</span></div>
      <div class="bars" id="bars" role="tablist" aria-label="Film scenes">${SCENES.map((s, i) => `<i class="${i === 0 ? "on" : ""}" style="--d:${SCENE_MS}ms"></i>`).join("")}</div>
      <div class="ctas"><a class="btn" href="#book" data-go="book">Reserve a consultation</a><a class="btn on-photo" href="#colour-room" data-go="colour-room">Try a colour on real hair</a></div>
    </div>
    <div class="heroside"><a href="#sobha-arcadia" data-go="sobha-arcadia"><span>Thanisandra</span><b>Sobha Arcadia</b></a><a href="#prestige-tech-forest" data-go="prestige-tech-forest"><span>Varthur</span><b>Prestige Tech Forest</b></a></div>
  </section>

  <div class="marq" aria-hidden="true"><div>${[1, 2].map(() => ["Precision cutting", "Bespoke colour", "Balayage", "Smoothening", "Gentlemen's grooming", "Restorative spa", "Bridal and occasion", "Family appointments"].map((t) => `<span>${t}</span>`).join("")).join("")}</div></div>

  <section class="blk"><div class="wrap grid g2" style="align-items:center;gap:clamp(28px,6vw,96px)">
    <div class="stack" style="gap:28px"><div class="cap">The first twenty minutes</div><h2 class="statement">We do not start with scissors. We start with <em>questions</em>.</h2>
      <p class="lead">Your routine, your hair history, the week ahead. Then a plan you have seen, tried and agreed to before we begin. That is the whole difference.</p><a class="link" href="#standard" data-go="standard">The standard</a></div>
    ${pic("scissors", "r-45")}</div></section>

  <section aria-label="Our two salons"><div class="doors">
    <a class="door s" href="#sobha-arcadia" data-go="sobha-arcadia">${im("salonA")}<div class="cap" style="color:var(--gold-text)">Thanisandra</div><h3>Sobha Arcadia</h3><p style="margin-top:10px;max-width:34ch;color:rgba(243,237,225,.82)">${LOC.s.door}.</p><div class="m"><span>Thanisandra Main Road</span><span>Sobha City · Hegde Nagar</span></div><span class="go">Enter this salon</span></a>
    <a class="door p" href="#prestige-tech-forest" data-go="prestige-tech-forest">${im("salonE")}<div class="cap" style="color:var(--plat-text)">Varthur</div><h3>Prestige Tech Forest</h3><p style="margin-top:10px;max-width:34ch;color:rgba(243,237,225,.82)">${LOC.p.door}.</p><div class="m"><span>Lake Road, Varthur</span><span>On the campus</span></div><span class="go">Enter this salon</span></a></div></section>

  <section class="blk"><div class="wrap">${sectionHead("Everything, under one roof.", "Explore hair, grooming and beauty services. See the full menu for service options and prices.", `<a class="link" href="#services" data-go="services">All services</a>`)}
    ${svcTiles(SVC, 8)}</div></section>

  <section class="blk alt"><div class="wrap">
    <div class="tryon">
      <div class="stack"><div class="stage" id="hstage"><span class="badge">Concept preview</span></div>
        <div class="thumbs" id="hthumbs" role="group" aria-label="Choose a photo">${["s_black", "s_ombre", "s_long", "s_flick"].map((k, i) => `<button data-k="${k}" aria-pressed="${i === 0}" aria-label="${esc(SAMPLES[k].a)}">${im(k)}</button>`).join("")}</div></div>
      <div class="stack" style="gap:24px"><div class="cap">The colour room</div><h2 style="max-width:12ch">See it on real hair before you decide.</h2>
        <p class="lead">Pick a shade. Watch it settle into the light and shadow of the photograph. Then try it on a photo of your own, which never leaves your device.</p>
        <div class="sw" id="hsw" role="group" aria-label="Shade">${[
          ["Burgundy", "#6E1C34"],
          ["Caramel", "#B87A3F"],
          ["Honey", "#CB9B56"],
          ["Ash blonde", "#CBC09F"],
          ["Mocha", "#5F3B2C"],
          ["Blue black", "#171A26"],
        ]
          .map(
            (s, i) =>
              `<button data-c="${s[1]}" aria-pressed="${i === 0}" title="${s[0]}" aria-label="${s[0]}" style="background:${s[1]}"></button>`,
          )
          .join("")}</div>
        <p class="note">${tag("c")} A concept, not a prediction. Your stylist confirms what is possible for your hair in the consultation.</p>
        <div class="row"><a class="btn" href="#colour-room" data-go="colour-room">Open the colour room</a></div></div></div></div></section>

  <section class="blk"><div class="wrap">${sectionHead("From the first question to the last day.", "A visit is the middle of the story. These are the six moments we design for.")}
    <div class="jr">${[
      ["Before", "I know I need a change, but I am not sure what.", "wash"],
      ["Consultation", "Someone actually understands what I want.", "salonF"],
      ["The service", "I can see where this is going.", "colourwork"],
      ["After", "I like what I see.", "blowhand"],
      ["Confidence", "Now I feel ready.", "bridalbraid"],
      ["Real life", "Nobody asked. I just felt it.", "motion3"],
    ]
      .map(
        (s, i) =>
          `<div class="st">${pic(s[2], "r-32")}<div class="n">${String(i + 1).padStart(2, "0")}</div><div><b class="cap">${s[0]}</b><q>${s[1]}</q></div></div>`,
      )
      .join("")}</div>
    <p class="small mute" style="margin-top:14px">Feelings clients describe. Not promises.</p></div></section>

  <section class="blk alt"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px);align-items:center">
    <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px">${pic("beardprof", "r-34")}${pic("razor", "r-34")}</div>
    <div class="stack" style="gap:24px"><div class="cap">Gentlemen</div><h2>Cut. Beard. Hot towel. Done right, every four weeks.</h2><p class="lead">A standing appointment with the same stylist, shaped around your calendar. At Prestige Tech Forest, an executive cut is built for a lunch hour.</p>
      <div class="row"><a class="btn" href="#service-men" data-go="service-men">Gentlemen's cut and beard</a><a class="btn sec" href="#service-express" data-go="service-express">The executive cut</a></div></div></div></section>

  <section class="blk"><div class="wrap">${sectionHead("Something coming up?", "Choose the moment. We show you what to book, and when.", `<a class="link" href="#occasions" data-go="occasions">All nine occasions</a>`)}
    <div class="hs">${OCC.map((o) => tile("occasion-" + o.id, o.img, o.t, o.q)).join("")}</div></div></section>

  <section class="blk alt"><div class="wrap">${sectionHead("What clients say.", "Feedback from these two salons will be added after launch, with customer permission.", `<a class="link" href="#voices" data-go="voices">Voices</a>`)}
    ${voiceBlock()}</div></section>

  <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px);align-items:center">
    <div class="stack" style="gap:24px"><div class="cap">Find your stylist</div><h2>The right hands, for what you want.</h2><p class="lead">Precision, colour, texture, grooming, occasions, family. Tell us what you are after and we match you to the specialist who does it best.</p><div class="row"><a class="btn" href="#stylists" data-go="stylists">Find your stylist</a><a class="btn sec" href="#find-your-look" data-go="find-your-look">Find your look</a></div></div>
    <div class="grid" style="grid-template-columns:1fr 1fr 1fr;gap:10px">${["foils", "roundbrush", "updo"].map((k) => pic(k, "r-34")).join("")}</div></div></section>

  ${ctaBand()}`;
  /* film */
  if (globalThis.__BUILD_SEO__) return;
  const reels = $$(".reel"),
    bars = $$("#bars i");
  let idx = 0;
  const show = (i) => {
    idx = (i + SCENES.length) % SCENES.length;
    reels.forEach((r, c) =>
      $$("img", r).forEach((m) => {
        const on = +m.dataset.s === idx;
        if (on && m.dataset.src) { m.src = m.dataset.src; delete m.dataset.src; }
        m.classList.toggle("on", on);
        m.style.filter = SCENES[+m.dataset.s].col
          ? "contrast(1.05) brightness(.8)"
          : "";
      }),
    );
    bars.forEach((b, j) => {
      b.className = j < idx ? "done" : j === idx ? "on" : "";
    });
    $("#sn").textContent =
      String(idx + 1).padStart(2, "0") + " / 0" + SCENES.length;
    $("#sk").textContent = SCENES[idx].k + ".";
    $("#sl").textContent = SCENES[idx].line;
  };
  bars.forEach((b, j) => {
    b.style.cursor = "pointer";
    b.addEventListener("click", () => {
      show(j);
      restart();
    });
  });
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const restart = () => {
    clearInterval(heroT);
    if (!still)
      heroT = setInterval(() => {
        if (!document.hidden) show(idx + 1);
      }, SCENE_MS);
  };
  show(0);
  restart();
  /* try-on teaser */
  const T = new Tryon($("#hstage"));
  let colr = "#6E1C34";
  const loadS = (k) => T.loadSample(k).then(() => T.setColour(colr, "all"));
  loadS("s_black");
  $$("#hthumbs button").forEach((b) =>
    b.addEventListener("click", () => {
      $$("#hthumbs button").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      loadS(b.dataset.k);
    }),
  );
  $$("#hsw button").forEach((b) =>
    b.addEventListener("click", () => {
      $$("#hsw button").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      colr = b.dataset.c;
      T.setColour(colr, "all");
    }),
  );
};
R.home.title = "Home";

/* ---------- LOCATION PAGES ---------- */
function salonAnswers(L) {
  return [
    ["What are the opening hours?", "Open every day, Monday to Sunday, from 10:00 AM to 9:00 PM."],
    ["Where is this salon?", L.address + ". Use Directions for the map location; call for entrance or parking guidance."],
    ["How do I book an appointment?", "Choose a service, date and preferred time on the booking page. Save the request and send the prepared WhatsApp message to +91 81237 29873. The salon team confirms availability manually."],
    ["Does saving my request confirm my appointment?", "No. Your request reference confirms that the request was saved. Wait for confirmation from the salon team before visiting."],
    ["Where can I find service prices?", "Open the Services menu for listed prices. The salon confirms the final service and price after consultation; prices marked onwards depend on the treatment."],
    ["Can I arrange a group appointment?", "Call or WhatsApp +91 81237 29873 to discuss a group visit. Availability and timings must be confirmed by the salon."]
  ];
}
function locPage(id) {
  return (app) => {
    const L = LOC[id],
      other = LOC[id === "s" ? "p" : "s"],
      svcs = SVC.filter((s) => !s.only || s.only === id);
    app.innerHTML = `
    ${innerHero(L.hero, { crumb: `<a href="#home" data-go="home">${esc(B)}</a> / ${L.area}`, h1: L.line, lead: L.sub, ctas: `<a class="btn" href="#book" data-go="book" data-prefill='${JSON.stringify({ loc: id, step: 1 })}'>Reserve at ${L.name}</a><a class="btn on-photo" href="${dir(id)}" target="_blank" rel="noopener">Directions</a>` })}
    <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px)"><div class="stack"><div class="cap">Your salon</div><h2>${B} ${L.name}, Bengaluru.</h2><p>${esc(L.address)}</p><p>Open every day, 10:00 AM–9:00 PM.</p><p><a href="tel:+918123729873">Call +91 81237 29873</a></p></div><div class="stack"><h2>How to book.</h2><p>Choose this salon, a service, date and preferred time. Save your booking request, then send the prepared WhatsApp message. Our team confirms availability manually. A saved request is not a confirmed appointment.</p><a class="btn" href="#book" data-go="book">Request an appointment</a></div></div></section>

    <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px);align-items:start"><div class="stack" style="gap:22px"><div class="cap">Signature here</div><h2 style="font-size:clamp(30px,4.2vw,56px)">What we do best at ${L.short}.</h2><div class="pill-row">${L.emphasis.map((e) => `<span class="pill">${e}</span>`).join("")}</div>
      <div class="card" style="margin-top:8px"><b class="cap">Before your visit</b><p style="font-size:18px">View the service menu for listed prices. Our team confirms the service, price and availability before your appointment.</p></div></div>
      <div class="stack"><div class="fq">${svcs
        .slice(0, 9)
        .map(
          (s) =>
            `<a href="#service-${s.id}" data-go="service-${s.id}" style="text-decoration:none;display:flex;justify-content:space-between;gap:16px;padding:20px 0;border-bottom:1px solid var(--rule)"><span style="font-family:var(--display);font-size:24px">${s.name}</span><span class="mute small" style="white-space:nowrap">${s.timeTxt}</span></a>`,
        )
        .join("")}</div></div></div></section>

    <section class="blk alt"><div class="wrap">${sectionHead("Voices.", "Words from clients of this salon appear here after launch.")}${voiceBlock(id)}</div></section>

    <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px)"><div class="stack"><div class="cap">Getting here</div><h2 style="font-size:clamp(30px,4.2vw,56px)">Find the door.</h2><div class="facts">${L.getting.map((g) => `<div><b>${g[0]}</b><span class="mute">${g[1]}</span></div>`).join("")}</div><p class="small mute">${esc(L.address)}</p>
      <div class="mapbox">${mapSVG(L)}</div></div>
      <div class="stack"><div class="cap">Questions</div><div class="fq">${salonAnswers(L).map((f) => `<details><summary>${f[0]}</summary><p>${f[1]}</p></details>`).join("")}</div>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">${pic(L.photos[0], "r-45")}${pic(L.photos[1], "r-45")}</div></div></div></section>

    <section class="blk alt"><div class="wrap row" style="justify-content:space-between;gap:30px"><h2 style="font-size:clamp(30px,4.2vw,56px)">Also in Bengaluru:<br><span class="it">${other.name}.</span></h2><a class="btn sec" href="#${other.slug}" data-go="${other.slug}">See ${other.name}</a></div></section>
    ${ctaBand()}`;
  };
}
R["sobha-arcadia"] = locPage("s");
R["sobha-arcadia"].title = "Sobha Arcadia";
R["prestige-tech-forest"] = locPage("p");
R["prestige-tech-forest"].title = "Prestige Tech Forest";

/* ---------- SERVICES ---------- */
R.services = (app) => {
  app.innerHTML = `${innerHero("blowdry", { crumb: `<a href="#home" data-go="home">${esc(B)}</a> / Services`, h1: "Twelve ways to look like you meant it.", lead: "Each service has its own page: what happens in the chair, how long it takes, how to keep it." })}
  <section class="blk"><div class="wrap">${svcTiles(SVC)}<p class="small mute" style="margin-top:16px">The executive cut is offered at Prestige Tech Forest. Family appointments are offered at Sobha Arcadia.</p></div></section>
  <section class="blk alt"><div class="wrap grid g2" style="align-items:center"><div class="stack"><h2>Not sure where to begin?</h2><p class="lead">Seven questions. You get a consultation brief to take to your stylist.</p><a class="btn" style="align-self:flex-start" href="#find-your-look" data-go="find-your-look">Find your look</a></div>${pic("tools", "r-32")}</div></section>${ctaBand()}`;
};
R.services.title = "Services";
R.service = (app, id) => {
  const s = SMAP[id],
    rel = s.rel.map((r) => SMAP[r]);
  app.innerHTML = `${innerHero(s.img, { colour: s.kind === "colour" || s.kind === "refresh", crumb: `<a href="#services" data-go="services">Services</a> / ${s.tag}`, h1: s.name, lead: s.what, ctas: `<a class="btn" href="#book" data-go="book" data-prefill='${JSON.stringify({ svc: s.id, step: 1 })}'>Reserve this</a>${s.kind === "colour" || s.kind === "refresh" ? '<a class="btn on-photo" href="#colour-room" data-go="colour-room">Try colours</a>' : `<a class="btn on-photo" href="#stylist-${s.stylist}" data-go="stylist-${s.stylist}">Meet the specialist</a>`}` })}
  <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px)"><div class="stack" style="gap:26px"><h2 class="cap">What happens in the chair</h2><div class="steps3" style="grid-template-columns:1fr">${s.exp.map((e, i) => `<div><div class="n">${i + 1}</div><h3 style="font-size:24px">${e}</h3></div>`).join("")}</div></div>
    <div class="stack" style="gap:26px">${pic(s.img2, "r-45 col")}<dl class="kv"><dt>Who it suits</dt><dd>${s.who}</dd><dt>What you get</dt><dd>${s.gets}</dd><dt>Time</dt><dd>${s.timeTxt}</dd><dt>Upkeep</dt><dd>${s.maint}</dd><dt>Expect</dt><dd>${s.expect}</dd><dt>Aftercare</dt><dd>${s.after}</dd></dl>
    <p class="note">${tag("c")} Typical times and upkeep. Your hair history changes them, and the stylist confirms in the consultation.</p></div></div></section>
  <section class="blk alt"><div class="wrap">${sectionHead("Pairs well with.", "")}<div class="grid g3">${rel.map((r) => `<a class="pcard" href="#service-${r.id}" data-go="service-${r.id}">${pic(r.img, "r-32")}<h3>${r.name}</h3><span class="small mute">${r.timeTxt}</span></a>`).join("")}</div></div></section>
  <section class="blk"><div class="wrap grid g2" style="align-items:center;gap:clamp(28px,5vw,80px)"><div class="stack"><div class="cap">Your stylist</div><h2 style="font-size:clamp(30px,4.2vw,56px)">${STY.find((t) => t.id === s.stylist).t}.</h2><p class="lead">${STY.find((t) => t.id === s.stylist).style} ${STY.find((t) => t.id === s.stylist).start}</p><a class="btn sec" style="align-self:flex-start" href="#stylist-${s.stylist}" data-go="stylist-${s.stylist}">About this specialist</a></div>${pic(STY.find((t) => t.id === s.stylist).img, "r-32")}</div></section>
  ${ctaBand("Reserve " + s.name.toLowerCase() + ".")}`;
};
R.service.ok = (id) => !!SMAP[id];
R.service.title = (id) => SMAP[id].name;

/* ---------- COLOUR ROOM + families ---------- */
R["colour-room"] = (app) => {
  const C = S.col,
    fam = CMAP[C.fam];
  if (!C.sample) C.sample = fam.sample;
  const sh = () => fam.shades[Math.min(C.shade, fam.shades.length - 1)];
  app.innerHTML = `<section class="blk" style="padding-top:clamp(110px,14vw,160px)"><div class="wrap stack" style="gap:30px"><div class="cap">The colour room</div><h1 style="font-size:clamp(40px,6.4vw,92px);max-width:14ch">See it on real hair.</h1><p class="lead">Choose a photograph, a family, a shade and a technique. The colour follows the light and shadow of the hair. Or add a photo of your own.</p>
    <div class="tryon" style="align-items:start"><div class="stack"><div class="stage" id="stage"><span class="badge">Concept preview</span><div id="empty" class="stack" style="position:absolute;inset:0;place-content:center;text-align:center;padding:24px" hidden><b style="font-family:var(--display);font-size:26px;font-weight:500">Add a photo to begin</b><span class="small mute">A clear photo in daylight works best. Back-of-head photos work well too.</span></div></div>
      <div class="cmp"><span>Before</span><input type="range" id="split" min="0" max="100" value="0" aria-label="Slide to compare with the original"><span>After</span></div>
      <div class="row"><div class="seg" id="mode"><button data-m="sample" aria-pressed="${C.mode === "sample"}">Sample photos</button><button data-m="mine" aria-pressed="${C.mode === "mine"}">My photo</button></div></div>
      <div class="thumbs" id="thumbs" ${C.mode === "sample" ? "" : "hidden"}>${["s_black", "s_wave", "s_curl", "s_ombre", "s_flick", "s_long"].map((k) => `<button data-k="${k}" aria-pressed="${C.sample === k}" aria-label="${esc(SAMPLES[k].a)}">${im(k)}</button>`).join("")}</div>
      <div id="mine" class="stack" ${C.mode === "mine" ? "" : "hidden"}><div class="field"><label for="pf">Add a photo</label><input type="file" id="pf" accept="image/*"></div>
        <div class="row"><div class="seg" id="bm"><button data-b="paint" aria-pressed="true">Paint hair</button><button data-b="erase" aria-pressed="false">Erase</button></div><label class="small mute row" style="gap:8px">Brush <input type="range" id="bs" min="6" max="70" value="28" style="width:120px"></label><button class="btn sm sec" id="clr">Clear</button></div>
        <p class="small mute">Paint over the hair only. Your photo stays in your browser. Nothing is uploaded.</p></div></div>
    <div class="stack" style="gap:20px"><div class="fam" id="fam">${COL.map((c) => `<button class="chip" data-f="${c.id}" aria-pressed="${c.id === C.fam}"><i style="background:${c.shades[Math.min(1, c.shades.length - 1)][1]}"></i>${c.n}</button>`).join("")}</div>
      <div class="sw" id="sw"></div><b id="shn" style="font-family:var(--display);font-size:26px;font-weight:500"></b>
      <div class="row"><span class="cap">Technique</span><div class="seg" id="tech">${TECH.map((t) => `<button data-t="${t[0]}" aria-pressed="${C.tech === t[0]}">${t[1]}</button>`).join("")}</div></div>
      <dl class="kv" id="info"></dl>
      <p class="note">${tag("c")} A concept preview, not a prediction. Real results depend on your hair colour, history and condition. The stylist confirms what suits you in the consultation.</p>
      <div class="row"><a class="btn" id="bk" href="#book" data-go="book">Book a colour consultation</a><a class="btn sec" id="fp" href="#colour-${C.fam}" data-go="colour-${C.fam}">About this family</a></div></div></div></div></section>
  <section class="blk alt"><div class="wrap">${sectionHead("The six families.", "")}<div class="tiles">${COL.map((c) => tile("colour-" + c.id, c.img, c.n, "Colour family")).join("")}</div></div></section>${ctaBand()}`;
  if (globalThis.__BUILD_SEO__) return;
  const T = new Tryon($("#stage"), { edit: true });
  let mineLoaded = false;
  const apply = () => {
    const f = CMAP[C.fam],
      s = f.shades[Math.min(C.shade, f.shades.length - 1)];
    T.setColour(s[1], C.tech);
    $("#shn").textContent = s[0];
  };
  const drawFam = () => {
    const f = CMAP[C.fam];
    C.shade = Math.min(C.shade, f.shades.length - 1);
    $("#sw").innerHTML = f.shades
      .map(
        (s, i) =>
          `<button data-s="${i}" aria-pressed="${i === C.shade}" title="${s[0]}" aria-label="${s[0]}" style="background:${s[1]}"></button>`,
      )
      .join("");
    $$("#sw button").forEach((b) =>
      b.addEventListener("click", () => {
        C.shade = +b.dataset.s;
        $$("#sw button").forEach((x) =>
          x.setAttribute("aria-pressed", String(x === b)),
        );
        apply();
      }),
    );
    $("#info").innerHTML =
      `<dt>Lightening</dt><dd>${f.lift}</dd><dt>Time</dt><dd>${f.time}</dd><dt>Longevity</dt><dd>${f.longevity}</dd><dt>Upkeep</dt><dd>${f.maint}</dd><dt>Process</dt><dd>${f.process}</dd><dt>Hair condition</dt><dd>${f.cond}</dd><dt>Aftercare</dt><dd>${f.after}</dd>`;
    $("#bk").dataset.prefill = JSON.stringify({ svc: f.rel[0], step: 1 });
    $("#fp").dataset.go = "colour-" + C.fam;
    $("#fp").href = "#colour-" + C.fam;
  };
  const loadSample = (k) => {
    C.sample = k;
    $$("#thumbs button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.k === k)),
    );
    T.edit = false;
    T.c.style.visibility = "";
    $("#empty").hidden = true;
    return T.loadSample(k).then(apply);
  };
  const setMode = (m) => {
    C.mode = m;
    $$("#mode button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.m === m)),
    );
    $("#thumbs").hidden = m !== "sample";
    $("#mine").hidden = m !== "mine";
    if (m === "sample") loadSample(C.sample);
    else {
      T.edit = true;
      if (!mineLoaded) {
        T.ready = false;
        T.c.style.visibility = "hidden";
        $("#empty").hidden = false;
      }
    }
  };
  drawFam();
  $$("#fam button").forEach((b) =>
    b.addEventListener("click", () => {
      C.fam = b.dataset.f;
      C.shade = Math.min(1, CMAP[C.fam].shades.length - 1);
      $$("#fam button").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      drawFam();
      if (C.mode === "sample") loadSample(CMAP[C.fam].sample);
      else apply();
    }),
  );
  $$("#tech button").forEach((b) =>
    b.addEventListener("click", () => {
      C.tech = b.dataset.t;
      $$("#tech button").forEach((x) =>
        x.setAttribute("aria-pressed", String(x === b)),
      );
      apply();
    }),
  );
  $$("#thumbs button").forEach((b) =>
    b.addEventListener("click", () => loadSample(b.dataset.k)),
  );
  $$("#mode button").forEach((b) =>
    b.addEventListener("click", () => setMode(b.dataset.m)),
  );
  $("#split").addEventListener("input", (e) =>
    T.setSplit(+e.target.value / 100),
  );
  $$("#bm button").forEach((b) =>
    b.addEventListener("click", () => {
      $$("#bm button").forEach((x) => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true");
      T.erase = b.dataset.b === "erase";
    }),
  );
  $("#bs").addEventListener("input", (e) => {
    T.r = +e.target.value;
  });
  $("#clr").addEventListener("click", () => T.ready && T.clear());
  $("#pf").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader(),
      img = new Image();
    rd.onload = () => {
      img.onload = () => {
        T.edit = true;
        T.c.style.visibility = "";
        $("#empty").hidden = true;
        T.setImage(
          img,
          null,
          "Your photo. Paint over the hair to preview a colour.",
        );
        mineLoaded = true;
        apply();
        toast("Now paint over the hair.");
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(f);
  });
  if (C.mode === "sample") loadSample(C.sample);
  else setMode("mine");
};
R["colour-room"].title = "Colour room";
R.colour = (app, id) => {
  const f = CMAP[id];
  app.innerHTML = `${innerHero(f.img, { colour: true, crumb: `<a href="#colour-room" data-go="colour-room">Colour room</a> / Family`, h1: f.n + ".", lead: f.cond, ctas: `<a class="btn" href="#colour-room" data-go="colour-room" data-prefill='${JSON.stringify({ fam: id })}'>Try ${f.n.toLowerCase()} on real hair</a><a class="btn on-photo" href="#book" data-go="book" data-prefill='${JSON.stringify({ svc: f.rel[0], step: 1 })}'>Book a consultation</a>` })}
  <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px)"><div class="stack" style="gap:24px"><div class="cap">The shades</div><div class="sw" style="gap:18px">${f.shades.map((s) => `<div class="stack" style="gap:8px;align-items:flex-start"><span style="width:84px;height:84px;border-radius:50%;background:${s[1]};outline:1px solid var(--rule);outline-offset:3px"></span><b style="font-family:var(--display);font-weight:500;font-size:19px">${s[0]}</b></div>`).join("")}</div>
    <dl class="kv"><dt>Lightening</dt><dd>${f.lift}</dd><dt>Time</dt><dd>${f.time}</dd><dt>Longevity</dt><dd>${f.longevity}</dd><dt>Upkeep</dt><dd>${f.maint}</dd><dt>Process</dt><dd>${f.process}</dd><dt>Aftercare</dt><dd>${f.after}</dd></dl></div>
    <div class="stack">${pic(f.sample, "r-45 col nz")}<p class="note">${tag("c")} Concept preview in the colour room. Your stylist confirms what suits your hair.</p></div></div></section>
  <section class="blk alt"><div class="wrap">${sectionHead("Services that deliver it.", "")}<div class="grid g3">${f.rel
    .concat(["spa"])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 3)
    .map(
      (r) =>
        `<a class="pcard" href="#service-${r}" data-go="service-${r}">${pic(SMAP[r].img, "r-32")}<h3>${SMAP[r].name}</h3><span class="small mute">${SMAP[r].timeTxt}</span></a>`,
    )
    .join("")}</div></div></section>
  <section class="blk"><div class="wrap">${sectionHead("Other families.", "")}<div class="tiles">${COL.filter(
    (c) => c.id !== id,
  )
    .map((c) => tile("colour-" + c.id, c.img, c.n, "Colour family"))
    .join("")}</div></div></section>${ctaBand()}`;
};
R.colour.ok = (id) => !!CMAP[id];
R.colour.title = (id) => CMAP[id].n + " colour";

/* ---------- FIND YOUR LOOK ---------- */
function scoreSvc(a) {
  const loc = curLoc || "s";
  const maxT = +a.time || 60;
  const res = [];
  SVC.forEach((s) => {
    if (s.only && s.only !== loc) return;
    let sc = 0;
    if (a.goal === "shape" && ["cut", "reset", "express"].includes(s.id))
      sc += 6;
    if (a.goal === "colour" && s.kind === "colour") sc += 6;
    if (a.goal === "colour" && s.id === "reset") sc += 3;
    if (a.goal === "smooth" && ["smooth", "spa"].includes(s.id)) sc += 6;
    if (a.goal === "refresh" && ["gloss", "spa", "cut"].includes(s.id)) sc += 5;
    if (a.goal === "groom" && ["men", "express"].includes(s.id)) sc += 7;
    if (a.goal === "occasion" && ["style", "bridal"].includes(s.id)) sc += 6;
    const ob =
      {
        party: ["style", "balayage", "gloss"],
        wedding: ["bridal", "style", "gloss"],
        date: ["style", "gloss"],
        work: ["cut", "express", "men"],
        holiday: ["smooth", "spa"],
        everyday: ["cut", "spa", "men"],
        change: ["reset", "balayage"],
      }[a.occ] || [];
    if (ob.includes(s.id)) sc += 3;
    if (a.col === "none" && (s.kind === "colour" || s.id === "reset")) sc -= 8;
    if (a.col === "bold" && ["balayage", "reset"].includes(s.id)) sc += 3;
    if (a.col === "subtle" && ["gloss", "balayage"].includes(s.id)) sc += 2;
    if (a.maint === "low" && s.maintLvl >= 3) sc -= 3;
    if (a.maint === "low" && s.maintLvl <= 1) sc += 1.5;
    if (a.maint === "high" && s.maintLvl >= 3) sc += 1;
    if (s.time > maxT) sc -= Math.min(8, (s.time - maxT) / 30);
    if (a.len === "short" && s.id === "balayage") sc -= 1;
    if (a.feel === "bold" && ["reset", "balayage", "style"].includes(s.id))
      sc += 1.5;
    if (a.feel === "easy" && ["smooth", "cut", "spa"].includes(s.id)) sc += 1.5;
    if (a.feel === "sharp" && ["cut", "men", "express"].includes(s.id))
      sc += 1.5;
    if (a.feel === "soft" && ["gloss", "balayage", "spa"].includes(s.id))
      sc += 1.5;
    res.push([sc, s]);
  });
  return res
    .sort((x, y) => y[0] - x[0])
    .slice(0, 3)
    .map((r) => r[1]);
}
R["find-your-look"] = (app) => {
  const q = QZ[S.qi];
  if (!q) {
    const top = scoreSvc(S.quiz),
      l = curLoc || "s";
    app.innerHTML = `<section class="blk" style="padding-top:clamp(110px,14vw,160px)"><div class="wrap qz"><div class="stack" style="gap:26px"><div class="cap">Your consultation brief</div><h1 style="font-size:clamp(40px,6vw,84px)">Three directions to discuss.</h1>
      <p class="lead">A starting point for the conversation with your stylist. Not a diagnosis.</p>
      <div class="res">${top
        .map(
          (
            s,
            i,
          ) => `<article class="rc ${i === 0 ? "top" : ""}">${pic(s.img, "r-169 col")}<div class="row" style="justify-content:space-between"><h3>${s.name}</h3>${i === 0 ? '<span class="pill">Best match</span>' : ""}</div><p>${s.what}</p>
        <dl class="kv"><dt>Who it suits</dt><dd>${s.who}</dd><dt>What you get</dt><dd>${s.gets}</dd><dt>Time</dt><dd>${s.timeTxt}</dd><dt>Upkeep</dt><dd>${s.maint}</dd><dt>Expect</dt><dd>${s.expect}</dd><dt>Aftercare</dt><dd>${s.after}</dd><dt>Stylist</dt><dd>${STY.find((t) => t.id === s.stylist).t}</dd></dl>
        <div class="row"><a class="btn sm" href="#book" data-go="book" data-prefill='${JSON.stringify({ svc: s.id, occ: S.quiz.occ || "", loc: l, step: 3 })}'>Reserve this</a><a class="btn sm sec" href="#service-${s.id}" data-go="service-${s.id}">Read more</a>${s.kind === "colour" || s.kind === "refresh" ? '<a class="btn sm sec" href="#colour-room" data-go="colour-room">Try colours</a>' : ""}</div></article>`,
        )
        .join("")}</div>
      <p class="note">${tag("c")} Typical times and upkeep. Your hair history changes them, and the stylist confirms in the consultation.</p><div class="row"><button class="btn sec" id="redo">Start again</button></div></div></div></section>`;
    $("#redo").addEventListener("click", () => {
      S.quiz = {};
      S.qi = 0;
      render();
    });
    return;
  }
  app.innerHTML = `<section class="blk" style="padding-top:clamp(110px,14vw,160px)"><div class="wrap qz"><div class="prog" aria-hidden="true">${QZ.map((_, i) => `<i class="${i <= S.qi ? "on" : ""}"></i>`).join("")}</div>
    <div class="cap">Question ${S.qi + 1} of ${QZ.length}</div><h1 style="margin-top:14px;font-size:clamp(34px,5vw,64px)">${q.q}</h1><div class="opts" role="group" aria-label="${q.q}">${q.o.map((o) => `<button class="chip" data-v="${o[0]}" aria-pressed="${S.quiz[q.k] === o[0]}">${o[1]}</button>`).join("")}</div>
    <div class="row" style="margin-top:34px">${S.qi > 0 ? '<button class="btn sec sm" id="back">Back</button>' : ""}</div></div></section>`;
  $$(".opts .chip").forEach((b) =>
    b.addEventListener("click", () => {
      S.quiz[q.k] = b.dataset.v;
      S.qi++;
      render();
    }),
  );
  const bk = $("#back");
  if (bk)
    bk.addEventListener("click", () => {
      S.qi--;
      render();
    });
};
R["find-your-look"].title = "Find your look";

/* ---------- STYLISTS ---------- */
R.stylists = (app) => {
  const f = S.filt;
  const list = STY.filter(
    (t) => !f || t.svc.some((s) => SMAP[s] && (s === f || SMAP[s].kind === f)),
  );
  app.innerHTML = `${innerHero("tools", { crumb: `<a href="#home" data-go="home">${esc(B)}</a> / Stylists`, h1: "Find your stylist.", lead: "Start with what you want. We show who does it best." })}
  <section class="blk"><div class="wrap stack" style="gap:28px"><div class="row" id="sf">${[
    ["", "Everyone"],
    ["shape", "A better cut"],
    ["colour", "Colour"],
    ["smooth", "Smooth, easy hair"],
    ["groom", "Gentlemen's grooming"],
    ["occasion", "Event styling"],
    ["change", "A big change"],
  ]
    .map(
      (o) =>
        `<button class="chip" data-f="${o[0]}" aria-pressed="${(f || "") === o[0]}">${o[1]}</button>`,
    )
    .join("")}</div>
    <p class="note">${tag("c")} Profile format. These are specialist types, not named people. Each becomes a real team member with a name, portfolio and live availability once the team is confirmed. Levels follow the brand's ladder.</p>
    <h2 class="cap">Stylist specialities</h2><div class="grid g3">${list
      .map(
        (
          t,
        ) => `<article class="stack" style="gap:14px">${pic(t.img, "r-45")}<div><h3>${t.t}</h3><p class="cap" style="margin-top:8px">${t.lvl}</p></div><div class="pill-row">${t.spec.map((s) => `<span class="pill">${s}</span>`).join("")}</div><p class="mute">${t.style}</p>
      <div class="row"><a class="btn sm" href="#book" data-go="book" data-prefill='${JSON.stringify({ sty: t.id, step: 2 })}'>Reserve</a><a class="btn sm sec" href="#stylist-${t.id}" data-go="stylist-${t.id}">About</a></div></article>`,
      )
      .join("")}</div></div></section>${ctaBand()}`;
  $$("#sf .chip").forEach((b) =>
    b.addEventListener("click", () => {
      S.filt = b.dataset.f || null;
      render();
    }),
  );
};
R.stylists.title = "Stylists";
R.stylist = (app, id) => {
  const t = STY.find((x) => x.id === id);
  app.innerHTML = `${innerHero(t.img, { crumb: `<a href="#stylists" data-go="stylists">Stylists</a> / ${t.lvl}`, h1: t.t + ".", lead: t.style, ctas: `<a class="btn" href="#book" data-go="book" data-prefill='${JSON.stringify({ sty: t.id, step: 2 })}'>Reserve with this specialist</a>` })}
  <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px)"><div class="stack" style="gap:22px"><div class="cap">How they work</div><p class="statement" style="font-size:clamp(26px,3.4vw,46px)">${t.start}</p><div class="pill-row">${t.spec.map((s) => `<span class="pill">${s}</span>`).join("")}</div>
    <p class="note">${tag("c")} Archetype page. A real portfolio, name and availability go here after the launch shoot, with each client's consent.</p></div>
    <div class="stack"><div class="cap">Services</div><div class="fq">${t.svc.map((s) => `<a href="#service-${s}" data-go="service-${s}" style="text-decoration:none;display:flex;justify-content:space-between;gap:16px;padding:20px 0;border-bottom:1px solid var(--rule)"><span style="font-family:var(--display);font-size:24px">${SMAP[s].name}</span><span class="mute small">${SMAP[s].timeTxt}</span></a>`).join("")}</div></div></div></section>
  <section class="blk alt"><div class="wrap">${sectionHead("Other specialists.", "")}<div class="tiles">${STY.filter(
    (x) => x.id !== id,
  )
    .slice(0, 4)
    .map((x) => tile("stylist-" + x.id, x.img, x.t, x.lvl))
    .join("")}</div></div></section>${ctaBand()}`;
};
R.stylist.ok = (id) => !!STY.find((x) => x.id === id);
R.stylist.title = (id) => STY.find((x) => x.id === id).t;

/* ---------- OCCASIONS ---------- */
R.occasions = (app) => {
  app.innerHTML = `${innerHero("bridalbraid", { colour: true, crumb: `<a href="#home" data-go="home">${esc(B)}</a> / Occasions`, h1: "Something coming up?", lead: "Choose the moment. We show you what to book, and when." })}
  <section class="blk"><div class="wrap"><div class="tiles">${OCC.map((o) => tile("occasion-" + o.id, o.img, o.t, o.q)).join("")}</div></div></section>${ctaBand()}`;
};
R.occasions.title = "Occasions";
R.occasion = (app, id) => {
  const o = OCC.find((x) => x.id === id),
    svcs = o.svc.map((s) => SMAP[s]);
  app.innerHTML = `${innerHero(o.img, { colour: true, crumb: `<a href="#occasions" data-go="occasions">Occasions</a>`, h1: o.t + ".", lead: o.q, ctas: `<a class="btn" href="#book" data-go="book" data-prefill='${JSON.stringify({ occ: o.id, svc: o.svc[0], step: 1 })}'>Plan this</a>` })}
  <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px)"><div class="stack" style="gap:24px"><h2 class="cap">The countdown</h2><div class="steps3" style="grid-template-columns:1fr">${o.cd.map((c) => `<div><div class="cap">${c[0]}</div><h3 style="font-size:26px">${c[1]}</h3></div>`).join("")}</div></div>
    <div class="stack" style="gap:24px"><dl class="kv"><dt>You need</dt><dd>${o.need}</dd><dt>The experience</dt><dd>${o.exp}</dd><dt>The result</dt><dd style="font-family:var(--display);font-style:italic;font-size:22px;line-height:1.3">${o.res}</dd></dl></div></div></section>
  <section class="blk alt"><div class="wrap">${sectionHead("What to book.", "")}<div class="grid g3">${svcs.map((s) => `<a class="pcard" href="#service-${s.id}" data-go="service-${s.id}">${pic(s.img, "r-32")}<h3>${s.name}</h3><span class="small mute">${s.timeTxt}</span></a>`).join("")}</div></div></section>
  <section class="blk"><div class="wrap">${sectionHead("Other occasions.", "")}<div class="hs">${OCC.filter(
    (x) => x.id !== id,
  )
    .map((x) => tile("occasion-" + x.id, x.img, x.t, x.q))
    .join("")}</div></div></section>${ctaBand()}`;
};
R.occasion.ok = (id) => !!OCC.find((x) => x.id === id);
R.occasion.title = (id) => OCC.find((x) => x.id === id).t;

/* ---------- VOICES ---------- */
R.voices = (app) => {
  app.innerHTML = `${innerHero("blondepair", { colour: true, crumb: `<a href="#home" data-go="home">${esc(B)}</a> / Voices`, h1: "What clients say.", lead: "Feedback from Sobha Arcadia and Prestige Tech Forest will be published with customer permission." })}
  <section class="blk alt"><div class="wrap">${sectionHead("In their words.", "Customer reviews will appear here when available. No sample reviews are presented as real feedback.")}
    <div class="vq">${(CONFIG.sampleVoices ? SAMPLE_VOICES : []).map((v) => `<figure class="q" style="margin:0"><span class="stamp">Sample wording. Replace after launch.</span><p>“${v[0]}”</p><small>${v[1]} · ${LOC[v[2]].name}</small></figure>`).join("")}</div></div></section>
  <section class="blk"><div class="wrap grid g2" style="gap:clamp(28px,5vw,80px);align-items:center"><div class="stack" style="gap:22px"><div class="cap">How reviews work here</div><h2 style="font-size:clamp(30px,4.2vw,56px)">Your feedback matters.</h2><p class="lead">Share honest feedback with the salon team. Automated review requests are not active; ask staff where to leave a public review.</p><a class="link" href="#aftercare" data-go="aftercare">The aftercare loop</a></div>${pic("salonC", "r-32")}</div></section>${ctaBand()}`;
};
R.voices.title = "Voices";

/* ---------- AFTERCARE ---------- */
R.aftercare = (app) => {
  const s = SMAP[S.loop];
  app.innerHTML = `${innerHero("blowhand", { crumb: `<a href="#home" data-go="home">${esc(B)}</a> / Aftercare`, h1: "After you leave.", lead: "The visit is the middle. Choose a service to see what comes next." })}
  <section class="blk"><div class="wrap stack" style="gap:28px"><div class="row" id="lf">${SVC.filter(
    (x) => x.after !== "None needed.",
  )
    .map(
      (x) =>
        `<button class="chip" data-s="${x.id}" aria-pressed="${x.id === S.loop}">${x.name}</button>`,
    )
    .join("")}</div>
    <div class="grid g2" style="gap:clamp(28px,5vw,80px)"><div class="stack"><h2 style="font-size:clamp(22px,2.4vw,32px)">${s.name}: your aftercare card</h2><dl class="kv"><dt>First days</dt><dd>${s.after}</dd><dt>Upkeep</dt><dd>${s.maint}</dd><dt>Next visit</dt><dd>${s.maintLvl ? s.maint : "When you need it"}</dd><dt>Pairs with</dt><dd>${s.rel.map((r) => SMAP[r].name).join(", ")}</dd></dl><p class="note">${tag("c")} Aftercare comes from the stylist for your hair. This card is the starting text.</p></div>
      <div class="stack"><h3>Follow-up examples</h3><div class="chat">${LOOP.slice(
        0,
        4,
      )
        .map(
          (m) => `<div class="msg"><small>After ${m[0]}</small>${m[2]}</div>`,
        )
        .join(
          "",
        )}</div><p class="small mute">Example messages only. Automated follow-ups are not active. Ask the salon about aftercare.</p></div></div></div></section>
  <section class="blk alt"><div class="wrap">${sectionHead("The loop.", "An example aftercare plan to discuss with your stylist.")}<div class="loop">${LOOP.map((m) => `<div><b>${m[0]}</b><b style="font-family:var(--display);font-weight:500;font-size:22px">${m[1]}</b></div>`).join("")}</div></div></section>${ctaBand()}`;
  $$("#lf .chip").forEach((b) =>
    b.addEventListener("click", () => {
      S.loop = b.dataset.s;
      render();
    }),
  );
};
R.aftercare.title = "Aftercare";

/* ---------- THE STANDARD ---------- */
R.standard = (app) => {
  const P = [
    [
      "Consultation before scissors.",
      "Twenty minutes on your hair, your routine and your calendar. Then a plan you agree to.",
      "salonF",
    ],
    [
      "Colour is planned, not improvised.",
      "A strand test, a history, a timeline. If it takes two visits, we say so on day one.",
      "foils",
    ],
    [
      "Honest advice.",
      "If your hair cannot do it safely, we tell you why and what we can do instead.",
      "scissors",
    ],
    [
      "Aftercare is part of the service.",
      "Ask your stylist for care instructions and an appropriate rebooking window.",
      "blowhand",
    ],
  ];
  app.innerHTML = `${innerHero("salonB", { crumb: `<a href="#home" data-go="home">${esc(B)}</a> / The standard`, h1: "Four things we will not skip.", lead: "For clients who would rather invest in the right result than save on the wrong one." })}
  <section class="blk"><div class="wrap stack" style="gap:clamp(40px,6vw,80px)">${P.map((p, i) => `<div class="grid g2" style="gap:clamp(24px,5vw,80px);align-items:center">${i % 2 ? `<div class="stack" style="gap:16px"><div class="cap">${String(i + 1).padStart(2, "0")}</div><h2 style="font-size:clamp(30px,4.2vw,56px)">${p[0]}</h2><p class="lead">${p[1]}</p></div>${pic(p[2], "r-32")}` : `${pic(p[2], "r-32")}<div class="stack" style="gap:16px"><div class="cap">${String(i + 1).padStart(2, "0")}</div><h2 style="font-size:clamp(30px,4.2vw,56px)">${p[0]}</h2><p class="lead">${p[1]}</p></div>`}</div>`).join("")}</div></section>
  <section class="blk alt"><div class="wrap">${sectionHead("The rooms.", "Placeholder photography until the launch shoot.")}<div class="grid g3">${["salonA", "salonC", "salonD"].map((k) => pic(k, "r-32")).join("")}</div></div></section>${ctaBand()}`;
};
R.standard.title = "The standard";

/* ---------- VISIT ---------- */
R.visit = (app) => {
  const card = (id) => {
    const L = LOC[id];
    return `<div class="stack" style="gap:20px">${pic(L.hero, "r-32 col")}<div><div class="cap">${L.area}</div><h2 style="font-size:clamp(30px,4vw,52px);margin-top:8px">${L.name}</h2></div>
    <dl class="kv"><dt>Address</dt><dd>${L.address}</dd><dt>Plus code</dt><dd>${L.plus}</dd><dt>Hours</dt><dd>${L.getting[3][1]}</dd><dt>Parking</dt><dd>${L.getting[1][1]}</dd></dl>
    <div class="row"><a class="btn" href="#book" data-go="book" data-prefill='${JSON.stringify({ loc: id, step: 1 })}'>Reserve</a><a class="btn sec" href="${dir(id)}" target="_blank" rel="noopener">Directions</a><a class="btn sec" href="#${L.slug}" data-go="${L.slug}">Salon page</a></div><div class="mapbox">${mapSVG(L)}</div></div>`;
  };
  app.innerHTML = `${innerHero("salonG", { crumb: `<a href="#home" data-go="home">${esc(B)}</a> / Visit`, h1: "Two doors in Bengaluru.", lead: "Choose the one closer to your day." })}
  <section class="blk"><div class="wrap grid g2" style="gap:clamp(32px,5vw,80px);align-items:start">${card("s")}${card("p")}</div></section>${ctaBand()}`;
};
R.visit.title = "Visit";

/* ---------- BOOKING: staff-confirmed requests ---------- */
const runtime = { loaded: false, bookingEnabled: false, turnstileSiteKey: "" };
let turnstileWidget = null;
async function loadRuntimeConfig() {
  try {
    const [response, settingsResponse] = await Promise.all([
      fetch("/api/config", { cache: "no-store" }),
      fetch("/site-settings.json"),
    ]);
    if (!response.ok) throw new Error("Configuration unavailable");
    const config = await response.json();
    Object.assign(runtime, config, { loaded: true });
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      for (const group of ["phone", "whatsapp", "hours"])
        for (const branch of ["s", "p"]) {
          if (typeof settings[group]?.[branch] === "string")
            CONFIG[group][branch] = settings[group][branch];
        }
      for (const branch of ["s", "p"])
        if (CONFIG.hours[branch])
          LOC[branch].getting[3][1] = CONFIG.hours[branch];
    }
    if (runtime.turnstileSiteKey) {
      const loader = document.createElement("script");
      loader.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      loader.async = true;
      loader.onload = mountChallenge;
      loader.onerror = () => {
        if ($("#err"))
          $("#err").textContent =
            "Security check could not load. Please reload or try another network.";
      };
      document.head.appendChild(loader);
    }
  } catch {
    runtime.loaded = true;
    runtime.bookingEnabled = false;
  }
  if (parseRoute()[0] === "book") render();
}
function mountChallenge() {
  if (!window.turnstile || !$("#booking-bot")) return;
  if (turnstileWidget !== null) {
    try {
      window.turnstile.remove(turnstileWidget);
    } catch {}
  }
  const draft = S.book;
  draft.botToken = "";
  turnstileWidget = window.turnstile.render("#booking-bot", {
    sitekey: runtime.turnstileSiteKey,
    action: "booking",
    callback: (token) => {
      if (S.book === draft) draft.botToken = token;
    },
    "expired-callback": () => {
      if (S.book === draft) draft.botToken = "";
    },
    "error-callback": () => {
      if (S.book === draft) draft.botToken = "";
      if ($("#err"))
        $("#err").textContent = "Security check failed. Please try again.";
    },
  });
}
R.book = (app) =>
  renderSimpleBooking(app, {
    draft: S.book,
    runtime,
    mountChallenge,
    rerender: () => R.book(app),
    locations: LOC,
    location: curLoc,
  });
R.book.title = "Reserve an appointment";
R.services = renderPrices;
R.services.title = "Services & pricing";
R["not-found"] = (app) => {
  app.innerHTML = '<section class="booking-page wrap"><h1>Page not found.</h1><p>This address is unavailable. Explore our services or return to the homepage.</p><a class="btn" href="/">Home</a><a class="btn sec" href="/services">Services</a></section>';
};
R["not-found"].title = "Page not found";
export function staticRouteIds() {
  return [...Object.keys(R).filter(id => !["service", "colour", "stylist", "occasion", "not-found"].includes(id)),
    ...SVC.map(s => "service-" + s.id), ...Object.keys(CMAP).map(id => "colour-" + id),
    ...STY.map(s => "stylist-" + s.id), ...OCC.map(o => "occasion-" + o.id)];
}
export function renderBuildRoute(settings) {
  curLoc = "";
  S.book = { step: 0 };
  for (const branch of ["s", "p"])
    if (settings.hours?.[branch]) LOC[branch].getting[3][1] = settings.hours[branch];
  shell();
  render();
}
/* ---------- boot ---------- */
if (!globalThis.__BUILD_SEO__) {
  migrateLegacyHash();
  shell();
  initAnalytics(staticRouteIds());
  render();
  new MutationObserver(() => normalizeLinks(document)).observe(document.body, { childList: true, subtree: true });
  loadRuntimeConfig();
}

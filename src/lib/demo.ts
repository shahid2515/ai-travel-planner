import type { GeneratedDay, GeneratedTrip, TripInput } from "./types";

/**
 * Fallback used when OPENAI_API_KEY is not set, so the app is always
 * demoable — clone, `npm run dev`, get a full trip. Every venue below is a
 * real Lisbon business, so the Google Places enrichment still lights up.
 */

const PLACES: GeneratedTrip["places"] = [
  {
    name: "Castelo de São Jorge",
    category: "Landmark",
    neighborhood: "Alfama",
    description:
      "A Moorish hilltop castle whose walls you can walk end to end. The terraces look straight down over the red roofs to the Tejo.",
    whyVisit: "The single best orientation point in the city — go on day one and the map clicks.",
    estimatedCost: 15,
    durationMinutes: 90,
    bestTime: "Open at 9am, before the tour groups arrive",
  },
  {
    name: "Mosteiro dos Jerónimos",
    category: "Monastery",
    neighborhood: "Belém",
    description:
      "A vast Manueline monastery built on the profits of the spice trade. The cloister is the reason to go in, not the church.",
    whyVisit: "The finest building in Portugal, and it is a five-minute walk from the custard tarts.",
    estimatedCost: 12,
    durationMinutes: 75,
    bestTime: "Book online for a timed slot — the walk-up queue runs to an hour",
  },
  {
    name: "Torre de Belém",
    category: "Landmark",
    neighborhood: "Belém",
    description:
      "A small fortified tower sitting in the river, built to guard the harbour mouth. Tight spiral stairs, big views.",
    whyVisit: "Photographs beautifully from the outside even if the queue puts you off going in.",
    estimatedCost: 8,
    durationMinutes: 45,
    bestTime: "Late afternoon, when the light comes off the water",
  },
  {
    name: "LX Factory",
    category: "Neighbourhood",
    neighborhood: "Alcântara",
    description:
      "A 19th-century industrial complex under the bridge, now full of bookshops, studios and rooftop bars.",
    whyVisit: "The most concentrated hit of modern Lisbon you can get in two hours.",
    estimatedCost: 0,
    durationMinutes: 120,
    bestTime: "Sunday morning for the market",
  },
  {
    name: "Miradouro da Senhora do Monte",
    category: "Viewpoint",
    neighborhood: "Graça",
    description:
      "The highest of the city's viewpoints, with a pine-shaded terrace and a low wall people sit on.",
    whyVisit: "Sunset here beats every paid attraction in the city and costs nothing.",
    estimatedCost: 0,
    durationMinutes: 45,
    bestTime: "45 minutes before sunset",
  },
  {
    name: "Museu Nacional do Azulejo",
    category: "Museum",
    neighborhood: "Beato",
    description:
      "Five centuries of Portuguese tile inside a former convent, ending with a 23-metre panorama of pre-earthquake Lisbon.",
    whyVisit: "Explains the thing you have been walking past on every façade all week.",
    estimatedCost: 8,
    durationMinutes: 90,
    bestTime: "Weekday mornings — it is never crowded",
  },
  {
    name: "Palácio Nacional da Pena",
    category: "Palace",
    neighborhood: "Sintra",
    description:
      "A yellow-and-red romanticist palace on a peak above Sintra, surrounded by a 200-hectare park of imported trees.",
    whyVisit: "The one day trip from Lisbon that is worth the train ride.",
    estimatedCost: 20,
    durationMinutes: 180,
    bestTime: "First entry slot — the hill fogs over by midday",
  },
  {
    name: "Praça do Comércio",
    category: "Square",
    neighborhood: "Baixa",
    description:
      "The riverfront square that replaced the royal palace lost in the 1755 earthquake, open on one side to the water.",
    whyVisit: "The hinge every walk through the lower city turns on.",
    estimatedCost: 0,
    durationMinutes: 30,
    bestTime: "Early morning, empty and gold",
  },
  {
    name: "Oceanário de Lisboa",
    category: "Aquarium",
    neighborhood: "Parque das Nações",
    description:
      "One of Europe's largest aquariums, built around a single five-million-litre central tank you circle on two levels.",
    whyVisit: "The reliable rainy-day and travelling-with-kids answer.",
    estimatedCost: 25,
    durationMinutes: 120,
    bestTime: "Right at opening or after 4pm",
  },
  {
    name: "Time Out Market Lisboa",
    category: "Food hall",
    neighborhood: "Cais do Sodré",
    description:
      "A converted market hall where two dozen of the city's chefs run counters around communal tables.",
    whyVisit: "Settles the where-do-we-eat argument when the group wants different things.",
    estimatedCost: 18,
    durationMinutes: 75,
    bestTime: "Before 12:30 or after 3pm — it is chaos in between",
  },
];

const RESTAURANTS: GeneratedTrip["restaurants"] = [
  {
    name: "Pastéis de Belém",
    cuisine: "Bakery",
    neighborhood: "Belém",
    description:
      "Baking the original custard tart to a monastery recipe since 1837. The takeaway queue moves fast; the tiled rooms at the back seat 400.",
    mustTry: "Two pastéis, still warm, with cinnamon",
    priceLevel: 1,
    averageMealCost: 6,
  },
  {
    name: "Cervejaria Ramiro",
    cuisine: "Seafood",
    neighborhood: "Intendente",
    description:
      "A loud, tiled beer hall that has served shellfish by weight since 1956. Paper tablecloths, no ceremony, superb produce.",
    mustTry: "Garlic prawns, then the prego steak sandwich as dessert",
    priceLevel: 3,
    averageMealCost: 45,
  },
  {
    name: "Manteigaria",
    cuisine: "Bakery",
    neighborhood: "Chiado",
    description:
      "A tiny counter where you watch the tarts come out of the oven and a bell rings for each fresh tray.",
    mustTry: "One pastel de nata standing at the marble counter",
    priceLevel: 1,
    averageMealCost: 3,
  },
  {
    name: "Taberna da Rua das Flores",
    cuisine: "Portuguese",
    neighborhood: "Chiado",
    description:
      "A dozen tables and a blackboard menu that changes daily around whatever came in from the market.",
    mustTry: "Whatever the blackboard says twice",
    priceLevel: 2,
    averageMealCost: 30,
  },
  {
    name: "A Cevicheria",
    cuisine: "Peruvian",
    neighborhood: "Príncipe Real",
    description:
      "Kiko Martins' small room with a giant octopus hanging from the ceiling. No reservations, so put your name down and drink pisco next door.",
    mustTry: "The signature ceviche",
    priceLevel: 3,
    averageMealCost: 38,
  },
  {
    name: "Ponto Final",
    cuisine: "Portuguese",
    neighborhood: "Almada",
    description:
      "Tables set on the quay on the far bank, with the whole city laid out across the water. Reached by ferry from Cais do Sodré.",
    mustTry: "Grilled fish of the day at sunset",
    priceLevel: 2,
    averageMealCost: 32,
  },
  {
    name: "O Prego da Peixaria",
    cuisine: "Burgers & sandwiches",
    neighborhood: "Cais do Sodré",
    description:
      "Steak and fish sandwiches done properly in a room that used to be a fishmonger.",
    mustTry: "The classic prego in bolo do caco bread",
    priceLevel: 2,
    averageMealCost: 20,
  },
  {
    name: "Café A Brasileira",
    cuisine: "Café",
    neighborhood: "Chiado",
    description:
      "A 1905 coffee house with a Pessoa statue outside and an interior worth the tourist premium on the bica.",
    mustTry: "A bica at the bar, where it costs a third of the terrace price",
    priceLevel: 1,
    averageMealCost: 5,
  },
];

const DAY_TEMPLATES: GeneratedDay[] = [
  {
    day: 1,
    title: "The hill and the old town",
    theme: "Get oriented from above, then walk down through the oldest streets in the city.",
    neighborhood: "Alfama & Baixa",
    estimatedCost: 55,
    tip: "Wear the shoes with grip. Lisbon's pavement is polished limestone and it is genuinely slippery.",
    activities: [
      {
        time: "09:00",
        title: "Open the castle",
        type: "attraction",
        placeName: "Castelo de São Jorge",
        description:
          "Walk the walls first, then the terraces. Twenty minutes here fixes the geography of the whole trip in your head.",
        durationMinutes: 90,
        estimatedCost: 15,
        travelNote: "Tram 28 or a 15-minute uphill walk from Baixa",
      },
      {
        time: "11:00",
        title: "Drop down through Alfama",
        type: "experience",
        placeName: "",
        description:
          "No route needed — aim downhill and let the stairways decide. Laundry overhead, fado leaking out of doorways.",
        durationMinutes: 75,
        estimatedCost: 0,
        travelNote: "On foot, all downhill from the castle gate",
      },
      {
        time: "12:45",
        title: "Lunch off the blackboard",
        type: "meal",
        placeName: "Taberna da Rua das Flores",
        description: "Small plates, market-driven. Go early — twelve tables and no reservations.",
        durationMinutes: 75,
        estimatedCost: 30,
        travelNote: "15 min walk west into Chiado",
      },
      {
        time: "14:30",
        title: "The riverfront square",
        type: "attraction",
        placeName: "Praça do Comércio",
        description:
          "Cross the arch from Rua Augusta and take the square from the water side, which is how it was designed to be seen.",
        durationMinutes: 40,
        estimatedCost: 0,
        travelNote: "10 min downhill walk",
      },
      {
        time: "16:00",
        title: "Coffee at the counter",
        type: "meal",
        placeName: "Café A Brasileira",
        description: "Order a bica standing at the bar. Sitting outside triples the price.",
        durationMinutes: 30,
        estimatedCost: 5,
        travelNote: "12 min walk up to Chiado",
      },
      {
        time: "19:00",
        title: "Sunset from the highest viewpoint",
        type: "attraction",
        placeName: "Miradouro da Senhora do Monte",
        description: "Buy a beer from the kiosk, sit on the wall, watch the light go orange.",
        durationMinutes: 60,
        estimatedCost: 5,
        travelNote: "Tram 28 to Graça, then 5 min uphill",
      },
    ],
  },
  {
    day: 2,
    title: "Belém, monuments and tarts",
    theme: "The age-of-discovery district, done in one westward sweep along the river.",
    neighborhood: "Belém",
    estimatedCost: 48,
    tip: "Buy the Jerónimos ticket online the night before. The walk-up queue regularly hits an hour.",
    activities: [
      {
        time: "09:30",
        title: "The cloister at Jerónimos",
        type: "attraction",
        placeName: "Mosteiro dos Jerónimos",
        description:
          "Skip straight to the cloister — that is where the carving is. The church itself takes ten minutes.",
        durationMinutes: 75,
        estimatedCost: 12,
        travelNote: "Tram 15E from Praça da Figueira, about 25 min",
      },
      {
        time: "11:15",
        title: "The original custard tarts",
        type: "meal",
        placeName: "Pastéis de Belém",
        description:
          "Ignore the takeaway queue and go through to the tiled rooms at the back — table service is usually faster.",
        durationMinutes: 45,
        estimatedCost: 6,
        travelNote: "3 min walk east",
      },
      {
        time: "12:30",
        title: "Tower in the river",
        type: "attraction",
        placeName: "Torre de Belém",
        description:
          "Worth the walk along the water even if you decide the interior queue is not worth it.",
        durationMinutes: 60,
        estimatedCost: 8,
        travelNote: "15 min walk along the riverfront path",
      },
      {
        time: "15:00",
        title: "Industrial Lisbon under the bridge",
        type: "attraction",
        placeName: "LX Factory",
        description:
          "Bookshops, print studios, and a rooftop with the bridge overhead. Good for an unhurried browse.",
        durationMinutes: 120,
        estimatedCost: 0,
        travelNote: "10 min on tram 15E back toward the city",
      },
      {
        time: "19:30",
        title: "Ferry across for dinner",
        type: "meal",
        placeName: "Ponto Final",
        description:
          "Tables on the quay on the south bank with the entire skyline opposite. Book ahead; the sunset tables go first.",
        durationMinutes: 120,
        estimatedCost: 32,
        travelNote: "Ferry from Cais do Sodré to Cacilhas, then a 15 min walk along the water",
      },
    ],
  },
  {
    day: 3,
    title: "Day trip to Sintra",
    theme: "Palaces in the hills, an hour out by train, back in time for dinner.",
    neighborhood: "Sintra",
    estimatedCost: 62,
    tip: "Take the 8:21 train from Rossio. An hour later and you are queueing behind four tour buses.",
    activities: [
      {
        time: "08:30",
        title: "Train from Rossio",
        type: "transport",
        placeName: "",
        description: "40 minutes, runs every 20 minutes, covered by a Viva Viagem card.",
        durationMinutes: 40,
        estimatedCost: 5,
        travelNote: "Rossio station, platform level up the escalators",
      },
      {
        time: "09:45",
        title: "Pena Palace on the first slot",
        type: "attraction",
        placeName: "Palácio Nacional da Pena",
        description:
          "Book the earliest timed entry. Do the terraces first, then the interior, then walk down through the park.",
        durationMinutes: 180,
        estimatedCost: 20,
        travelNote: "Bus 434 from Sintra station, 15 min up the hill",
      },
      {
        time: "13:30",
        title: "Lunch in Sintra village",
        type: "meal",
        placeName: "",
        description: "Anywhere off the main square. Try a travesseiro pastry afterwards.",
        durationMinutes: 75,
        estimatedCost: 22,
        travelNote: "Walk down through the park, about 25 min",
      },
      {
        time: "16:30",
        title: "Train back and reset",
        type: "free-time",
        placeName: "",
        description: "Back to the hotel, feet up for an hour. Sintra is more walking than it looks.",
        durationMinutes: 90,
        estimatedCost: 5,
        travelNote: "Train to Rossio, then metro",
      },
      {
        time: "20:00",
        title: "Shellfish, by weight",
        type: "meal",
        placeName: "Cervejaria Ramiro",
        description:
          "Put your name down and wait with a beer. Prawns, clams, then the steak sandwich as dessert — that is the order locals use.",
        durationMinutes: 120,
        estimatedCost: 45,
        travelNote: "Metro to Intendente, 5 min walk",
      },
    ],
  },
  {
    day: 4,
    title: "Tiles, markets and a slow finish",
    theme: "The two museums worth your time, and an evening with nothing scheduled.",
    neighborhood: "Beato & Cais do Sodré",
    estimatedCost: 44,
    tip: "The azulejo museum is a 15-minute taxi from the centre and almost never busy. Go on a weekday morning.",
    activities: [
      {
        time: "10:00",
        title: "Five centuries of tile",
        type: "attraction",
        placeName: "Museu Nacional do Azulejo",
        description:
          "End upstairs at the 23-metre panorama of Lisbon as it looked before the 1755 earthquake.",
        durationMinutes: 90,
        estimatedCost: 8,
        travelNote: "Bus 794 or a 12 min taxi east along the river",
      },
      {
        time: "12:30",
        title: "Lunch at the market",
        type: "meal",
        placeName: "Time Out Market Lisboa",
        description:
          "Two dozen counters, one set of tables. Go before 12:30 or you will be standing with a tray.",
        durationMinutes: 75,
        estimatedCost: 18,
        travelNote: "20 min by taxi or tram 25",
      },
      {
        time: "14:30",
        title: "Chiado on foot",
        type: "experience",
        placeName: "",
        description:
          "Bookshops, tinned-fish shops, and the Bertrand — the oldest operating bookshop in the world.",
        durationMinutes: 90,
        estimatedCost: 15,
        travelNote: "10 min uphill walk",
      },
      {
        time: "16:30",
        title: "One last tart",
        type: "meal",
        placeName: "Manteigaria",
        description: "Wait for the bell. The tray that just came out is the one you want.",
        durationMinutes: 20,
        estimatedCost: 3,
        travelNote: "5 min walk",
      },
      {
        time: "20:00",
        title: "Ceviche in Príncipe Real",
        type: "meal",
        placeName: "A Cevicheria",
        description: "No reservations. Put your name down, take the pisco sour, wait outside.",
        durationMinutes: 120,
        estimatedCost: 38,
        travelNote: "15 min walk uphill",
      },
    ],
  },
  {
    day: 5,
    title: "River, water and the last evening",
    theme: "The modern eastern end of the city, then a slow send-off.",
    neighborhood: "Parque das Nações",
    estimatedCost: 50,
    tip: "The metro red line runs straight there in 20 minutes — no taxi needed.",
    activities: [
      {
        time: "10:00",
        title: "The big tank",
        type: "attraction",
        placeName: "Oceanário de Lisboa",
        description: "Two laps of the central tank, one on each level. Allow two hours.",
        durationMinutes: 120,
        estimatedCost: 25,
        travelNote: "Metro red line to Oriente, 10 min walk",
      },
      {
        time: "12:30",
        title: "Lunch by the water",
        type: "meal",
        placeName: "",
        description: "Anywhere along the marina front. Nothing remarkable, all of it pleasant.",
        durationMinutes: 75,
        estimatedCost: 22,
        travelNote: "5 min walk",
      },
      {
        time: "15:00",
        title: "Prego and a beer",
        type: "meal",
        placeName: "O Prego da Peixaria",
        description: "The sandwich that ends every Lisbon trip properly.",
        durationMinutes: 60,
        estimatedCost: 20,
        travelNote: "Metro back to Cais do Sodré",
      },
      {
        time: "18:30",
        title: "Last look from the top",
        type: "attraction",
        placeName: "Miradouro da Senhora do Monte",
        description: "Same wall, same view, one week of context on top of it.",
        durationMinutes: 60,
        estimatedCost: 5,
        travelNote: "Tram 28 to Graça",
      },
    ],
  },
];

export function demoTrip(input: TripInput): GeneratedTrip {
  const days = Array.from({ length: input.days }, (_, i) => ({
    ...DAY_TEMPLATES[i % DAY_TEMPLATES.length],
    day: i + 1,
  }));

  const total = input.budget;
  const share = (pct: number) => Math.round(total * pct);

  return {
    title: `${input.days} Days in Lisbon`,
    summary:
      "A sample itinerary that ships with the app so it works before you add any API keys. Every venue is real, so the Google Places lookups still return live ratings, photos and map pins. Add an OpenAI key and this becomes a plan for whatever destination you typed.",
    city: "Lisbon",
    country: "Portugal",
    budget: {
      total,
      perPerson: Math.round(total / Math.max(1, input.travelers)),
      breakdown: [
        { category: "accommodation", amount: share(0.38), note: `${input.days - 1} nights, mid-range hotel in Baixa` },
        { category: "food", amount: share(0.27), note: "Two sit-down meals a day plus coffee and tarts" },
        { category: "activities", amount: share(0.18), note: "Castle, monastery, Sintra and two museums" },
        { category: "transport", amount: share(0.1), note: "Metro, trams, the Sintra train and two taxis" },
        { category: "misc", amount: share(0.07), note: "Tips, a bookshop, and the things you did not plan" },
      ],
      verdict:
        "This is the demo trip, so the numbers are scaled to whatever budget you entered rather than costed from scratch.",
    },
    places: PLACES,
    restaurants: RESTAURANTS,
    days,
    tips: [
      "Buy a Viva Viagem card at any metro station and load it with zapping credit — it works on the metro, trams, buses and the ferry.",
      "Tram 28 is a real tram, not an attraction. Board at Martim Moniz early in the morning or you will be standing in an armpit.",
      "Tipping is not expected. Rounding up, or 5–10% for a good sit-down meal, is generous.",
      "The couvert (bread, olives, cheese) put on your table is not free. Send it back if you do not want it.",
      "Pickpocketing is the one real risk, concentrated on tram 28 and in Baixa. Nothing in back pockets.",
      "Almost everything closes on Monday except the castle and the viewpoints. Plan Mondays outdoors.",
    ],
    packingList: [
      "Shoes with real grip — the polished limestone pavement is lethal in rain",
      "A light rain shell, even in summer",
      "Sunglasses; the light off the white buildings is harsh",
      "A refillable bottle — public fountains are drinkable",
      "A power bank for a day of maps and photos",
      "One smart-casual outfit for the better restaurants",
    ],
  };
}

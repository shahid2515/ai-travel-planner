/**
 * JSON Schema handed to OpenAI Structured Outputs (`strict: true`).
 *
 * Strict mode rules that are easy to get wrong:
 *   • every object needs "additionalProperties": false
 *   • every property must be listed in "required" (no optionals — use "" / 0 instead)
 *   • no "minimum"/"maximum"/"format" keywords — they are silently rejected
 * Keep this file in sync with the GeneratedTrip types in lib/types.ts.
 */

const str = (description: string) => ({ type: "string", description }) as const;
const num = (description: string) => ({ type: "number", description }) as const;

const obj = <T extends Record<string, unknown>>(properties: T) =>
  ({
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  }) as const;

export const TRIP_JSON_SCHEMA = {
  name: "travel_plan",
  strict: true,
  schema: obj({
    title: str("Catchy 3–7 word trip title, e.g. 'Five Slow Days in Lisbon'"),
    summary: str("Two or three sentences describing the shape of the trip and who it suits"),
    city: str("The city the trip is centred on"),
    country: str("Country of the destination"),
    budget: obj({
      total: num("Realistic total cost for the whole group, in the requested currency"),
      perPerson: num("Total divided by the number of travellers"),
      breakdown: {
        type: "array",
        description: "One entry per spending category. Amounts must add up to total.",
        items: obj({
          category: {
            type: "string",
            enum: ["accommodation", "food", "activities", "transport", "shopping", "misc"],
          },
          amount: num("Amount for the whole group in the requested currency"),
          note: str("One short line on what this covers, e.g. '4 nights, mid-range hotel'"),
        }),
      },
      verdict: str(
        "One honest sentence: is the stated budget comfortable, tight, or unrealistic for this trip?",
      ),
    }),
    places: {
      type: "array",
      description: "8–12 real, currently-open attractions in or near the destination",
      items: obj({
        name: str("Exact name as it appears on Google Maps — no invented venues"),
        category: str("Short label: Museum, Landmark, Park, Viewpoint, Market, Neighbourhood…"),
        neighborhood: str("District or area it sits in"),
        description: str("Two sentences on what it actually is"),
        whyVisit: str("One sentence on why it earns a slot on this specific trip"),
        estimatedCost: num("Entry cost per person in the requested currency, 0 if free"),
        durationMinutes: num("How long a visit realistically takes"),
        bestTime: str("Best time to go, e.g. 'Early morning, before 9am'"),
      }),
    },
    restaurants: {
      type: "array",
      description: "6–10 real restaurants, cafés or food spots across a range of prices",
      items: obj({
        name: str("Exact name as it appears on Google Maps — no invented venues"),
        cuisine: str("Cuisine or food type"),
        neighborhood: str("District or area"),
        description: str("Two sentences on the place and its atmosphere"),
        mustTry: str("The one dish or drink to order"),
        priceLevel: num("1 = cheap eats, 2 = moderate, 3 = pricey, 4 = fine dining"),
        averageMealCost: num("Typical spend per person in the requested currency"),
      }),
    },
    days: {
      type: "array",
      description:
        "Exactly one entry per day of the trip, in order. Group each day geographically so travellers are not criss-crossing the city.",
      items: obj({
        day: num("Day number starting at 1"),
        title: str("Short title for the day, e.g. 'Old town on foot'"),
        theme: str("One line on the idea behind the day"),
        neighborhood: str("Main area the day takes place in"),
        activities: {
          type: "array",
          description:
            "5–8 timed entries covering morning to evening, including every meal. Times must run in order.",
          items: obj({
            time: str("24-hour start time, e.g. '09:30'"),
            title: str("Short label for the activity"),
            type: {
              type: "string",
              enum: ["attraction", "meal", "experience", "transport", "free-time"],
            },
            placeName: str(
              "Exact name from the places or restaurants list if this activity happens there, otherwise an empty string",
            ),
            description: str("One or two sentences on what to do here"),
            durationMinutes: num("How long this activity takes"),
            estimatedCost: num("Cost per person in the requested currency, 0 if free"),
            travelNote: str(
              "How to get here from the previous activity and roughly how long, e.g. '10 min tram 28'",
            ),
          }),
        },
        estimatedCost: num("Total cost of this day per person"),
        tip: str("One practical, specific tip for this day"),
      }),
    },
    tips: {
      type: "array",
      description: "5–7 practical local tips: transport passes, tipping, safety, scams, timing",
      items: { type: "string" },
    },
    packingList: {
      type: "array",
      description: "6–10 items worth packing for this destination, season and set of activities",
      items: { type: "string" },
    },
  }),
} as const;

import { z } from "zod";

/* ────────────────────────────────────────────────────────────
   What the user fills in on the planner form
   ──────────────────────────────────────────────────────────── */

export const INTERESTS = [
  "Food & drink",
  "History & culture",
  "Art & museums",
  "Nature & outdoors",
  "Nightlife",
  "Shopping",
  "Architecture",
  "Beaches",
  "Adventure sports",
  "Family friendly",
  "Photography",
  "Local markets",
] as const;

export const PACES = ["relaxed", "balanced", "packed"] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "AED", "INR", "PKR", "JPY", "AUD", "CAD"] as const;

export const tripInputSchema = z.object({
  destination: z.string().min(2, "Where are you going?").max(120),
  placeId: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-mm-dd")
    .optional()
    .or(z.literal("")),
  days: z.coerce.number().int().min(1).max(10), // 10 keeps generation inside a 60s serverless request
  travelers: z.coerce.number().int().min(1).max(12),
  budget: z.coerce.number().int().min(50).max(1_000_000),
  currency: z.enum(CURRENCIES),
  pace: z.enum(PACES),
  interests: z.array(z.string()).max(12).default([]),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type TripInput = z.infer<typeof tripInputSchema>;

/* ────────────────────────────────────────────────────────────
   What the model gives back (mirrors lib/openai-schema.ts)
   ──────────────────────────────────────────────────────────── */

export type BudgetCategory =
  | "accommodation"
  | "food"
  | "activities"
  | "transport"
  | "shopping"
  | "misc";

export type ActivityType = "attraction" | "meal" | "experience" | "transport" | "free-time";

export interface GeneratedPlace {
  name: string;
  category: string;
  neighborhood: string;
  description: string;
  whyVisit: string;
  estimatedCost: number;
  durationMinutes: number;
  bestTime: string;
}

export interface GeneratedRestaurant {
  name: string;
  cuisine: string;
  neighborhood: string;
  description: string;
  mustTry: string;
  priceLevel: number; // 1–4
  averageMealCost: number;
}

export interface GeneratedActivity {
  time: string; // "09:30"
  title: string;
  type: ActivityType;
  placeName: string; // "" when the activity isn't tied to a listed place
  description: string;
  durationMinutes: number;
  estimatedCost: number;
  travelNote: string;
}

export interface GeneratedDay {
  day: number;
  title: string;
  theme: string;
  neighborhood: string;
  activities: GeneratedActivity[];
  estimatedCost: number;
  tip: string;
}

export interface GeneratedTrip {
  title: string;
  summary: string;
  city: string;
  country: string;
  budget: {
    total: number;
    perPerson: number;
    breakdown: { category: BudgetCategory; amount: number; note: string }[];
    verdict: string;
  };
  places: GeneratedPlace[];
  restaurants: GeneratedRestaurant[];
  days: GeneratedDay[];
  tips: string[];
  packingList: string[];
}

/* ────────────────────────────────────────────────────────────
   Google Places enrichment attached to each name the model invented
   ──────────────────────────────────────────────────────────── */

export interface PlaceMatch {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: number | null;
  photo: string | null; // Places photo resource name — served via /api/photo
  mapsUrl: string | null;
  website: string | null;
  openNow: boolean | null;
  types: string[];
}

export type EnrichedPlace = GeneratedPlace & { google: PlaceMatch | null };
export type EnrichedRestaurant = GeneratedRestaurant & { google: PlaceMatch | null };

export interface TripPayload {
  input: TripInput;
  trip: GeneratedTrip;
  places: EnrichedPlace[];
  restaurants: EnrichedRestaurant[];
  destination: {
    name: string;
    country: string;
    lat: number | null;
    lng: number | null;
    photo: string | null;
    placeId: string | null;
  };
  dates: string[]; // ISO date per day, [] when no start date was given
  demo: boolean; // true when generated without an OpenAI key
  generatedAt: string;
}

export interface TripRecord extends TripPayload {
  id: string;
  createdAt: string;
}

export interface TripSummaryRecord {
  id: string;
  title: string;
  summary: string;
  city: string;
  country: string;
  days: number;
  travelers: number;
  budget: number;
  currency: string;
  startDate: string | null;
  heroPhoto: string | null;
  createdAt: string;
}

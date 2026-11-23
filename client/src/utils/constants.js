import { Compass, Leaf, ShieldCheck } from "lucide-react";

// Small bits of static content that don't need the database
export const experiences = [
  { title: "Out in the wild", category: "Wildlife", image: "/images/serengeti.jpg", detail: "Tanzania · 8 days" },
  { title: "The long way round", category: "Adventure", image: "/images/swiss-alps.jpg", detail: "Switzerland · 6 days" },
  { title: "Room to exhale", category: "Relaxation", image: "/images/bali-coast.jpg", detail: "Bali · 8 days" },
  { title: "A taste of elsewhere", category: "Cultural", image: "/images/kyoto.jpg", detail: "Kyoto · 5 days" },
];

// Clicking an experience card jumps to the journeys filtered by this category
export const experienceToCategory = {
  "Slow living": "Relaxation",
  "Out in the wild": "Wildlife",
  "The long way round": "Adventure",
  "Room to exhale": "Relaxation",
  "A taste of elsewhere": "Cultural",
};

export const packageCategories = [
  "All journeys",
  "Adventure",
  "Relaxation",
  "Family",
  "Romantic",
  "Cultural",
  "Wildlife",
  "Luxury",
  "Budget travel",
  "Coast",
  "Island",
];

export const travelerOptions = [1, 2, 3, 4, 5, 6];

export const features = [
  { icon: Compass, title: "Made around you", copy: "Thoughtful itineraries shaped around the way you want to feel." },
  { icon: Leaf, title: "People make the place", copy: "Local hosts who open doors to a more personal kind of travel." },
  { icon: ShieldCheck, title: "Here, all the way", copy: "The right person, at the right time, whenever you need us." },
];

// Images the admin can pick from when adding a destination or package
export const imageOptions = [
  "/images/amalfi-coast.jpg",
  "/images/bali-coast.jpg",
  "/images/swiss-alps.jpg",
  "/images/thailand.jpg",
  "/images/canada-rockies.jpg",
  "/images/serengeti.jpg",
  "/images/kyoto.jpg",
];

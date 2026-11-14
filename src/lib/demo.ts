import switzerland from "@/assets/switzerland.jpg";
import japan from "@/assets/japan.jpg";
import maldives from "@/assets/maldives.jpg";
import hero from "@/assets/hero.jpg";

export type Dream = { id: string; title: string; category: string; image: string; target: number; raised: number; description: string; suggested: number[] };
export type Gift = { id: string; name: string; category: string; target: number; raised: number; contributors: number; organizer: string };

export const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
export const pct = (r: number, t: number) => Math.min(100, Math.round((r / t) * 100));

export const dreams: Dream[] = [
  { id: "swiss", title: "Switzerland Honeymoon", category: "Honeymoon", image: switzerland, target: 450000, raised: 312000, description: "Ten slow days between Zermatt and Lake Geneva.", suggested: [2500, 5000, 11000] },
  { id: "japan", title: "Japan Adventure", category: "Travel", image: japan, target: 380000, raised: 141000, description: "Cherry blossoms in Kyoto and ramen in Tokyo.", suggested: [2100, 5100, 10000] },
  { id: "maldives", title: "Maldives Anniversary", category: "Anniversary", image: maldives, target: 300000, raised: 96000, description: "Our first anniversary over a quiet lagoon.", suggested: [3000, 7500, 15000] },
  { id: "home", title: "Our First Home", category: "Home", image: hero, target: 1500000, raised: 420000, description: "A down payment on a place to call ours.", suggested: [5000, 11000, 21000] },
];

export const gifts: Gift[] = [
  { id: "macbook", name: "MacBook Pro 14\"", category: "Electronics", target: 120000, raised: 84000, contributors: 9, organizer: "Rohan (college friends)" },
  { id: "espresso", name: "Breville Espresso Machine", category: "Home Appliances", target: 65000, raised: 65000, contributors: 12, organizer: "Priya (cousins)" },
  { id: "camera", name: "Fujifilm X100VI Camera", category: "Photography", target: 150000, raised: 47000, contributors: 5, organizer: "Office team" },
];

export const couple = { slug: "aarav-and-meera", names: "Aarav & Meera", date: "14 February 2027", place: "Udaipur, India", image: hero, story: "We met over a missed train in Jaipur and have been travelling together ever since. Your love is the greatest gift — these are a few dreams we'd love to share with you." };

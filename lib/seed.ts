import type { DB } from "./db";
import { ME } from "./types";

// [name, age, city/college, bio, interests, likedMe]
type Seed = [string, number, string, string, string[], boolean];

const PROFILES: Seed[] = [
  ["Aanya", 21, "IIT Delhi", "chai > coffee. will judge your playlist.", ["chai", "indie music", "sketching"], true],
  ["Kabir", 23, "Mumbai", "weekend trekker, weekday overthinker.", ["trekking", "photography", "stand-up"], false],
  ["Meera", 22, "Christ University, Bengaluru", "ask me about my plant collection 🌱", ["plants", "pottery", "podcasts"], true],
  ["Rohan", 24, "Pune", "bad at texting, great at biryani.", ["cooking", "cricket", "gaming"], false],
  ["Ishita", 20, "St. Stephen's College", "poetry open-mics and overpriced lattes.", ["poetry", "coffee", "theatre"], false],
  ["Arjun", 25, "Hyderabad", "building things at a startup by day.", ["startups", "football", "chess"], true],
  ["Naina", 22, "BITS Pilani", "dance first, think later.", ["dancing", "k-drama", "baking"], false],
  ["Vihaan", 23, "Chennai", "surfer in training. mostly fell off so far.", ["surfing", "road trips", "guitar"], false],
  ["Sara", 21, "Delhi University", "bookstore regular. recs welcome.", ["books", "thrifting", "journaling"], true],
  ["Dev", 26, "Bengaluru", "ex-engineer, current barista.", ["coffee", "cycling", "board games"], false],
  ["Tara", 22, "Ashoka University", "debate club survivor.", ["debate", "film", "running"], false],
  ["Aditya", 24, "Jaipur", "photographer. i'll take your good side.", ["photography", "travel", "vintage cars"], true],
  ["Zoya", 23, "Lucknow", "mehndi artist & midnight maggi enthusiast.", ["art", "street food", "bollywood"], false],
  ["Kian", 21, "NIT Trichy", "gym, gaming, repeat.", ["gym", "gaming", "anime"], false],
  ["Riya", 22, "Kolkata", "adda, rosogolla, repeat.", ["adda", "sweets", "photography"], true],
  ["Neil", 25, "Goa", "sunsets and shack playlists.", ["beaches", "djing", "diving"], false],
  ["Myra", 20, "Symbiosis, Pune", "overpacks for every trip.", ["travel", "fashion", "yoga"], false],
  ["Yash", 23, "Ahmedabad", "garba pro. dhokla evangelist.", ["dancing", "food", "cricket"], true],
  ["Anika", 24, "Chandigarh", "marathon runner, snack hoarder.", ["running", "baking", "podcasts"], false],
  ["Samar", 22, "IIM Indore", "finance by day, open-mic by night.", ["stand-up", "markets", "tennis"], false],
  ["Diya", 21, "Mumbai", "film school kid. will frame you in 4:3.", ["film", "editing", "indie music"], true],
  ["Ayaan", 26, "Delhi", "sourdough nerd. starter's named Gary.", ["baking", "cycling", "history"], false],
  ["Pari", 22, "Manipal", "sunrise hikes, sunset chai.", ["hiking", "chai", "sketching"], false],
  ["Ritvik", 24, "Kochi", "bassist. yes, i own a band tee.", ["bass", "live gigs", "coffee"], false],
  ["Mehak", 23, "Amritsar", "will out-eat you at any dhaba.", ["street food", "road trips", "singing"], true],
  ["Veer", 21, "VIT Vellore", "hackathon regular, sleep optional.", ["coding", "esports", "memes"], false],
  ["Kiara", 22, "Mumbai", "art history + bad puns.", ["museums", "puns", "pottery"], false],
  ["Harsh", 25, "Indore", "poha, poha, poha.", ["food", "cricket", "stand-up"], false],
  ["Alisha", 20, "Miranda House", "thrift flips and thesis panic.", ["thrifting", "fashion", "books"], false],
  ["Dhruv", 24, "Bhopal", "amateur astronomer, professional napper.", ["stargazing", "sci-fi", "chess"], false],
  ["Navneet", 23, "Hyderabad", "pickleball convert. ask me why.", ["pickleball", "baking", "k-drama"], false],
  ["Ishaan", 22, "Shiv Nadar University", "overthinks playlists, underthinks outfits.", ["indie music", "football", "film"], false],
];

// Small deterministic PRNG so the "shuffled" order is stable between resets.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Wipe and re-seed everything (profiles, swipes, likes, matches). */
export async function seed(db: DB) {
  const rand = mulberry32(42);
  const order = PROFILES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  await db.transaction(async (tx) => {
    await tx.query("TRUNCATE matches, swipes, likes, profiles");
    for (const [i, [name, age, city, bio, interests, likedMe]] of PROFILES.entries()) {
      const id = `p${String(i + 1).padStart(2, "0")}`;
      const photo = `/avatars/${id}.jpg`; // AI-generated placeholder portraits (see public/avatars)
      await tx.query(
        "INSERT INTO profiles (id, name, age, photo, bio, city, interests, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [id, name, age, photo, bio, city, JSON.stringify(interests), order.indexOf(i)]
      );
      if (likedMe) await tx.query("INSERT INTO likes (liker_id, liked_id) VALUES ($1, $2)", [id, ME]);
    }
  });
}

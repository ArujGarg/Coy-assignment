export type Profile = {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  city: string;
  interests: string[];
};

export type SwipeDirection = "like" | "pass";

export type SwipeResult = { matched: boolean; match?: Profile };

import type { Song, Setlist } from "../types/setlists"

//? Copy this file to config.setlist.ts and fill in the setlist information.

//? Note that every time you create a new setlist, you'll need to edit this file.

//? Short name is a way to look up the base song minus any part-specific suffixes.
//? For example, if the song is "Song 1 - Trumpet 1", the short name is "Song 1".

//? Full name is the name of the song, including any part-specific suffixes.

//? Custom name is an optional field that allows you to override the full name.

//? Part is the name of the part, such as "trumpet".
//? ...while partNumber is the number of the part, such as "1".

//! Note: change this per-setlist to suit your needs.
const part = [
  "alto 1",
  "alto 2",
  "tenor",
  "bari",
  "trumpet 1",
  "trumpet 2",
  "trombone",
  "voice",
  "piano",
  "guitar",
  "bass",
  "drums",
  "aux",
] as const

export const parts = part.reduce((obj: Record<string, Song[]>, part) => {
  obj[part] = []
  return obj
}, {})

//! Note: change this per-setlist to suit your needs.
export const setlist: Setlist = {
  setlistName: "YYYY-MM-DD - Setlist Name",
  sourceName: "",
  sets: [
    {
      setName: "Set 1",
      songs: ["Song 1"],
    },
  ],
}

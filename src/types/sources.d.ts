import type { Song } from "./setlists"

export type SongSource = Omit<Song, "customName">

export interface SongSources {
  songs: SongSource[]
}

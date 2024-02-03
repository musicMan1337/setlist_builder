import { SOURCE_DIRECTORIES } from "../configs/config.sources"

import type { Song } from "./setlists"

export type SourceDirectoryName = keyof typeof SOURCE_DIRECTORIES

export type SongSource = Omit<Song, "customName">

export interface SongSources {
  songs: SongSource[]
}

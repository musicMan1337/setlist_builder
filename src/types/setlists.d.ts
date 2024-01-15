import { SongSource } from "./sources"

export type Song = {
  shortName: string
  fullName: string
  customName?: string
  part: string
  partNumber: number
  key?: string
  numHorns?: number
  filePath: string
}

export type Setlist = {
  setlistName: string
  sourceName: string
  sets: {
    setName: string
    songs: string[]
  }[]
}

export type CbVersion = "Cover" | "M" | "S"

export type CbPartType = "sax" | "trumpet" | "trombone" | "rhythm"

export type FoundSongs = Record<string, SongSource[]>

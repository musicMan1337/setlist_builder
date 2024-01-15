import fs from "fs"
import path from "path"

import {
  SETLISTS_DIR,
  SOURCES_DIR,
  SOURCE_DIRECTORIES,
} from "./configs/config.sources"

import { buildSongSource } from "./helpers/allSongs.helpers"

import type { SongSources } from "./types/sources"

//? Instrument naming (apply these to song naming conventions as well):
//* <instrument name>.pdf
//* <instrument name> (<custom name>).pdf
//* <instrument name> <part number>.pdf
//* <instrument name> <part number> (<custom name>).pdf

const setlistDir = path.join(__dirname, "..", SETLISTS_DIR)
const sourcesDir = path.join(setlistDir, SOURCES_DIR)

if (!fs.existsSync(setlistDir)) {
  fs.mkdirSync(setlistDir)
}

if (!fs.existsSync(sourcesDir)) {
  fs.mkdirSync(sourcesDir)
}

const songSourceGroups: Record<string, SongSources> = {}

function searchDirRecursively(group: string, dir: string) {
  const filesOrDirs = fs.readdirSync(dir)

  if (filesOrDirs.length === 0) {
    return
  }

  for (const fileOrDir of filesOrDirs) {
    const filePath = path.join(dir, fileOrDir)

    //! adhoc filtering - remove/alter as needed
    if (
      filePath.includes("---") ||
      filePath.includes("__") ||
      filePath.includes("node")
    )
      continue

    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      //? If it's a directory, recurse
      searchDirRecursively(group, filePath)
    } else if (fileOrDir.endsWith(".pdf")) {
      const songSource = buildSongSource(fileOrDir, filePath)

      songSourceGroups[group].songs.push(songSource)
    }
  }
}

Object.entries(SOURCE_DIRECTORIES).forEach(([group, dirs]) => {
  songSourceGroups[group] = { songs: [] }
  dirs.forEach((dir) => searchDirRecursively(group, dir))
})

Object.entries(songSourceGroups).forEach(([group, songSourceGroup]) => {
  const songSources: SongSources = {
    songs: songSourceGroup.songs.sort((a, b) => {
      const aName = a.shortName.toLowerCase()
      const bName = b.shortName.toLowerCase()

      if (aName < bName) return -1
      if (aName > bName) return 1
      return 0
    }),
  }

  const json = JSON.stringify(songSources, null, 2)

  const fileName = path.join(sourcesDir, `${group}.json`)
  fs.writeFileSync(fileName, json)

  console.log(`Wrote ${songSources.songs.length} songs to ${fileName}.`)
})

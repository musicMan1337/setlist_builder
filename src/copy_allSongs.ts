import fs from "fs"
import path from "path"

import {
  SETLISTS_DIR,
  ALL_DIR,
  SOURCES_DIR,
  SOURCE_DIRECTORIES,
} from "./configs/config.sources"

import type { SongSources } from "./types/sources"

// add script args
const args = process.argv.slice(2)
const sourceKey: string = args[0]

const allDir = path.join(__dirname, "..", SETLISTS_DIR, ALL_DIR)

if (fs.existsSync(allDir)) {
  fs.rmdirSync(allDir, { recursive: true })
}

fs.mkdirSync(allDir)

const sourceDir = path.join(__dirname, "..", SETLISTS_DIR, SOURCES_DIR)

const songSourceFiles: { [part: string]: string[] } = (
  sourceKey ? [sourceKey] : Object.keys(SOURCE_DIRECTORIES)
).reduce((obj, sourceKey) => {
  const sourceFile = path.join(sourceDir, `${sourceKey}.json`)
  let songSources: SongSources

  try {
    const jsonData = fs.readFileSync(sourceFile, {
      encoding: "utf8",
    })
    songSources = JSON.parse(jsonData)
  } catch (e) {
    console.error(e)
    console.error("No source exists for: " + sourceKey)
    process.exit(1)
  }

  songSources.songs.forEach(({ part, filePath }) => {
    const _part = part?.split(" ")[0] || "unknown"

    if (_part === "parts") return

    if (!obj[_part]) {
      obj[_part] = []
    }

    obj[_part].push(filePath)
  })

  return obj
}, {} as { [part: string]: string[] })

//? save songSourceFiles to json file in allDir
const json = JSON.stringify(songSourceFiles, null, 2)
const fileName = path.join(allDir, "allSongs.json")
fs.writeFileSync(fileName, json)

let filesCopied = 0

//? loop through and copy all the files to allDir/part folders
Object.entries(songSourceFiles).forEach(([part, files]) => {
  const partDir = path.join(allDir, part)

  if (!fs.existsSync(partDir)) {
    fs.mkdirSync(partDir)
  }

  files.forEach((file) => {
    const dest = path.join(partDir, path.basename(file))
    fs.copyFileSync(file, dest)
    filesCopied++
  })
})

console.log(`Copied ${filesCopied} files to ${allDir}.\n`)

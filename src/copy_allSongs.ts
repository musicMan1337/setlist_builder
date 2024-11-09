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

const songSourceFiles: { [source: string]: { [part: string]: string[] } } = (
  sourceKey ? [sourceKey] : Object.keys(SOURCE_DIRECTORIES)
)
  .filter((s) => s !== "mammoth")
  .reduce((obj, source) => {
    const sourceFile = path.join(sourceDir, `${source}.json`)
    let songSources: SongSources

    try {
      const jsonData = fs.readFileSync(sourceFile, {
        encoding: "utf8",
      })
      songSources = JSON.parse(jsonData)
    } catch (e) {
      console.error(e)
      console.error("No source exists for: " + source)
      process.exit(1)
    }

    // console.log(songSources.songs.filter(Boolean))

    songSources.songs.forEach(({ part, filePath }) => {
      let _part = part?.split(" ")[0]
      if (!_part && filePath.toLowerCase().includes("amber")) {
        _part = filePath?.split(" - ")[1].split(".")[0]
      }
      _part = _part || "unknown"

      if (_part.toLowerCase() === "parts") return

      if (!obj[source]) {
        obj[source] = {}
      }

      if (!obj[source][_part]) {
        obj[source][_part] = []
      }

      obj[source][_part].push(filePath)
    })

    return obj
  }, {} as { [source: string]: { [part: string]: string[] } })

//? save songSourceFiles to json file in allDir
const json = JSON.stringify(songSourceFiles, null, 2)
const fileName = path.join(allDir, "allSongs.json")
fs.writeFileSync(fileName, json)

let filesCopied = 0

//? loop through and copy all the files to allDir/part folders
Object.entries(songSourceFiles).forEach(([source, parts]) => {
  console.log(source)

  const sourceDir = path.join(allDir, source)
  if (!fs.existsSync(sourceDir)) {
    fs.mkdirSync(sourceDir)
  }

  Object.entries(parts).forEach(([part, files]) => {
    const partDir = path.join(sourceDir, part)
    if (fs.existsSync(partDir)) {
      fs.rmdirSync(partDir, { recursive: true })
    }
    fs.mkdirSync(partDir)

    files.forEach((file) => {
      const dest = path.join(partDir, path.basename(file))
      fs.copyFileSync(file, dest)
      filesCopied++
    })
  })
})

console.log(`Copied ${filesCopied} files to ${allDir}.\n`)

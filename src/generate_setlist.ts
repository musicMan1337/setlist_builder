import fs from "fs"
// import { readFile } from "fs/promises"
import path from "path"
import { spawn } from "child_process"
import cliProgress from "cli-progress"
import colors from "ansi-colors"

import { PARTS, SETLIST } from "./configs/config.setlist"
import {
  bootstrapSetlistDir,
  findAllSongs,
  createSetlistFile,
  getPartSourcesRaw,
  getPartSources,
  conditionallySwapTptParts,
  closingLogs,
} from "./helpers/setlist.helpers"

import { SETLISTS_DIR, SOURCES_DIR } from "./configs/config.sources"

import type { Song } from "./types/setlists"
import { SongSource, SongSources } from "./types/sources"

/*
args format:
-s{number} : number saxes
-t{number} : number trumpets
-b{number} : number bones
-m         : only merge existing parts
-ns        : no-swap trumpets (default is to swap 2 trumpets)

CB Song Format:
CB-[song name]

NOTE: [song name] must be exact, not uncluding the size
*/

// extract -args
const args = process.argv.slice(2)

const onlyMerge = args.includes("-m")

// create and bootstrap setlist directory
const setlistDir = path.join(__dirname, "..", SETLISTS_DIR)
const sourcesDir = path.join(setlistDir, SOURCES_DIR)

const thisSetlistDir = path.join(setlistDir, SETLIST.setlistName)

if (!onlyMerge) {
  bootstrapSetlistDir(thisSetlistDir)
}

// configure progress bar
const progress = new cliProgress.SingleBar({
  format: "Progress |" + colors.cyan("{bar}") + "| {percentage}% || {part}",
  barCompleteChar: "\u2588",
  barIncompleteChar: "\u2591",
  hideCursor: true,
})

const progressTotal = Object.keys(PARTS).length
progress.start(progressTotal, 0)

// extract sources from json
const sourceFile = path.join(sourcesDir, SETLIST.sourceName + ".json")

let songSources: SongSources

try {
  const jsonData = fs.readFileSync(sourceFile, {
    encoding: "utf8",
  })
  songSources = JSON.parse(jsonData)
} catch (e) {
  console.error(e)
  console.error("No source exists for: " + SETLIST.sourceName)
  process.exit(1)
}

const notFoundParts: Record<string, string[]> = {}
const foundSongs: Record<string, SongSource[]> = {}
const foundParts: Record<string, Song[]> = {}

// search for all parts for all setlist songs
SETLIST.sets.forEach(({ setName, songs }, idx) => {
  if (onlyMerge) {
    return
  }

  // find all sources for this set's songs
  songs.forEach((shortName) => {
    foundSongs[shortName] = findAllSongs(shortName, songSources)

    if (!foundSongs[shortName].length) {
      console.error(`Song not found: ${shortName}`)
      process.exit(1)
    }
  })

  const setNumber = idx + 1

  // match sources to parts
  Object.keys(PARTS).forEach((part) => {
    createSetlistFile(thisSetlistDir, part, setNumber, setName)

    if (!notFoundParts[part]) {
      notFoundParts[part] = []
      foundParts[part] = []
    }

    const [partName, partNumber = "0"] = part.split(" ")

    // find all sources for this part
    songs.forEach((shortName, idx) => {
      const songNumber = idx + 1 < 10 ? "0" + (idx + 1) : idx + 1 + ""
      const fullSongNumber = `${setNumber}.${songNumber}`

      const partSourcesRaw = getPartSourcesRaw(foundSongs, shortName, partName)

      const partSources = getPartSources(partSourcesRaw, partNumber)

      // not found - unhappy path
      if (partSources.length === 0) {
        notFoundParts[part].push(shortName)
        return
      }

      // found!
      partSources.forEach((source) => {
        if (partName.includes("aux") && partSources.length > 1) {
          // if there's an aux part, don't include drums
          if (source.part === "drums") {
            return
          }
        }

        const foundSource: Song = source
        foundSource.customName = `${fullSongNumber}. ${source.fullName}`
        foundParts[part].push(source)
      })
    })
  })
})

// swap trumpet parts if necessary
conditionallySwapTptParts(foundParts, onlyMerge)

//copy parts into respective folders
Object.entries(foundParts).forEach(([part, partSources]) => {
  partSources.forEach((source) => {
    const partDir = path.join(thisSetlistDir, part)
    const sourcePath = source.filePath
    const destPath = path.join(
      partDir,
      (source.customName ?? source.fullName) + ".pdf",
    )

    fs.copyFileSync(sourcePath, destPath)
  })
})

// export json files for debugging
fs.writeFileSync(
  path.join(__dirname, "foundSongs.json"),
  JSON.stringify(foundSongs, null, 2),
)

fs.writeFileSync(
  path.join(__dirname, "foundParts.json"),
  JSON.stringify(foundParts, null, 2),
)

fs.writeFileSync(
  path.join(__dirname, "notFoundParts.json"),
  JSON.stringify(notFoundParts, null, 2),
)

// merge parts via python script
progress.increment({ part: "Merging parts . . ." })

const mergedParts: string[] = []
const failedMerges: string[] = []

Object.entries(PARTS).forEach(([part, songs]) => {
  const out = thisSetlistDir
  const source = path.join(thisSetlistDir, part)
  const merge = path.join(
    thisSetlistDir,
    `${SETLIST.setlistName} - ${part}.pdf`,
  )

  executePythonScript({ out, source, merge, part })
})

type PyScriptArgs = {
  out: string
  source: string
  merge: string
  part: string
}

function executePythonScript({ out, source, merge, part }: PyScriptArgs) {
  progress.increment()

  const scriptPath = "merge.py"
  const args = [`-out=${out}`, `-source=${source}`, `-merge=${merge}`]

  // Spawn the Python process
  const pythonProcess = spawn("python", [scriptPath, ...args])

  // Handle the standard output and error
  pythonProcess.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`)
  })

  pythonProcess.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`)
  })

  // Handle the close event
  pythonProcess.on("close", (code) => {
    progress.increment()

    mergedParts.push(part)

    if (code !== 0) {
      failedMerges.push(part)
    }

    fs.rmSync(`${merge}_temp-toc.pdf`)

    if (mergedParts.length === Object.keys(PARTS).length) {
      progress.update(progressTotal, { part: "Done!" })
      progress.stop()

      closingLogs(foundParts, notFoundParts, failedMerges)
    }
  })
}

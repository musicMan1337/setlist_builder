import fs from "fs"
import path from "path"
import PDFDocument from "pdfkit"
import colors from "ansi-colors"

import { PARTS, SETLIST } from "../configs/config.setlist"

import type { SongSource, SongSources } from "../types/sources"
import type { CbPartType, CbVersion, FoundSongs, Song } from "../types/setlists"

// adhoc logic for CB files
const numSaxes = Object.keys(PARTS).filter((part) =>
  ["alto", "tenor", "bari"].some((sax) => part.includes(sax)),
).length

const numTrumpets = Object.keys(PARTS).filter((part) =>
  part.includes("trumpet"),
).length

const numBones = Object.keys(PARTS).filter((part) =>
  part.includes("bone"),
).length

const saxVersion: CbVersion =
  numSaxes === 3 ? "M" : numSaxes === 4 ? "Cover" : "S"

const trumpetVersion: CbVersion =
  numTrumpets === 2 ? "M" : numTrumpets === 3 ? "Cover" : "S"

const tromboneVersion: CbVersion = numBones > 1 ? "Cover" : trumpetVersion

const rhythmVersion: CbVersion = tromboneVersion === "S" ? "S" : "Cover"

const cbVersions: Record<CbPartType, CbVersion> = {
  sax: saxVersion,
  trumpet: trumpetVersion,
  trombone: tromboneVersion,
  rhythm: rhythmVersion,
}

const isCbTune = (song: string) => {
  const cbIndicators = ["(Cover", "(M", "(S"]
  return cbIndicators.some((indicator) => song.includes(indicator))
}

const getPartCbValue = (partName: string): CbVersion => {
  let cbKey: CbPartType = "rhythm"

  switch (true) {
    case partName.includes("trumpet"):
      cbKey = "trumpet"
    case partName.includes("bone"):
      cbKey = "trombone"
    case ["alto", "tenor", "bari"].includes(partName):
      cbKey = "sax"
  }

  return cbVersions[cbKey]
}

/*
? EXPORTS:
*/

export const bootstrapSetlistDir = (setlistDir: string) => {
  if (fs.existsSync(setlistDir)) {
    fs.rmSync(setlistDir, { recursive: true })
  }
  fs.mkdirSync(setlistDir, { recursive: true })

  // copy setlist into json file
  fs.writeFileSync(
    path.join(setlistDir, "setlist.json"),
    JSON.stringify(SETLIST, null, 2),
  )

  Object.keys(PARTS).forEach((part) => {
    fs.mkdirSync(path.join(setlistDir, part))
  })
}

export const findAllSongs = (shortName: string, songSources: SongSources) => {
  // find by shortName
  let sourceParts = songSources.songs.filter(
    (sourceSong) =>
      sourceSong.shortName.toLowerCase() === shortName.toLowerCase(),
  )

  if (!sourceParts.length) {
    // "fuzzy" find by shortName
    sourceParts = songSources.songs.filter((sourceSong) =>
      sourceSong.shortName.toLowerCase().includes(shortName.toLowerCase()),
    )
  }

  // lastly, filter CB tunes by part/type
  sourceParts = sourceParts.filter((sourceSong) => {
    if (!isCbTune(sourceSong.fullName)) {
      return true
    }

    const cbValue = getPartCbValue(sourceSong.part)

    return sourceSong.fullName.includes(cbValue)
  })

  if (!sourceParts.length) {
    console.error(`Song not found: ${shortName}`)
    process.exit(1)
  }

  return sourceParts
}

export const createSetlistFile = (
  setlistDir: string,
  part: string,
  setNumber: number,
  setName: string,
) => {
  const partDir = path.join(setlistDir, part)
  const setFilePath = path.join(partDir, `${setNumber}.00. ${setName}.pdf`)

  const pdfDoc = new PDFDocument()
  pdfDoc.pipe(fs.createWriteStream(setFilePath))
  pdfDoc.fontSize(26).text(setName)
  pdfDoc.end()
}

export const getPartSourcesRaw = (
  foundSongs: FoundSongs,
  shortName: string,
  partName: string,
) => {
  return foundSongs[shortName].filter((sourceSong) => {
    if (partName.includes("bass")) {
      return sourceSong.part === partName
    }

    if (partName.includes("aux")) {
      return ["drums", "aux"].some((part) => sourceSong.part.includes(part))
    }

    return sourceSong.part.includes(partName)
  })
}

export const getPartSources = (
  partSourcesRaw: SongSource[],
  partNumber: string,
) => {
  let partSources: SongSource[] = []

  if (partNumber === "0") {
    partSources = partSourcesRaw.filter(
      (sourceSong) => sourceSong.partNumber <= 1,
    )
  } else {
    partSources = partSourcesRaw.filter(
      (sourceSong) => sourceSong.partNumber === Number(partNumber),
    )
  }

  if (partSources.length === 0) {
    partSources = partSourcesRaw.filter(
      (sourceSong) => sourceSong.partNumber <= 1,
    )
  }

  return partSources
}

// special handling for 2 trumpets for non-CB tunes:
// case 3 trumpets: tpt1 == "trumpet", tpt2 == "trumpet 2", tpt3 == "trumpet"
//                  - no change needed, if tpt1 wants to play on non-cb tunes,
//                    they can just play the lead part with me (tpt3)
// case 2 trumpets: tpt1 == "trumpet", tpt2 == "trumpet 2"
//                  - I'm always the lowest trumpet, so swap with tpt 1 so I
//                    can play the lead part
export const conditionallySwapTptParts = (
  foundParts: Record<string, Song[]>,
  onlyMerge: boolean,
) => {
  if (!onlyMerge && cbVersions.trumpet === "M") {
    foundParts["trumpet 1"] = foundParts["trumpet 1"].map((tpt1Song) => {
      if (isCbTune(tpt1Song.fullName)) {
        return tpt1Song
      }

      let tpt2FoundSong: SongSource | undefined = undefined

      foundParts["trumpet 2"] = foundParts["trumpet 2"].map((tpt2Song) => {
        if (tpt2Song.shortName !== tpt1Song.shortName) {
          return tpt2Song
        }

        tpt2FoundSong = tpt2Song
        return tpt1Song
      })

      return tpt2FoundSong ?? tpt1Song
    })
  }
}

export const closingLogs = (
  foundParts: Record<string, Song[]>,
  notFoundParts: Record<string, string[]>,
  failedMerges: string[],
) => {
  const totalPartsFound = Object.values(foundParts).reduce(
    (total, parts) => total + parts.length,
    0,
  )

  const totalNotFound = Object.values(notFoundParts).reduce(
    (total, parts) => total + parts.length,
    0,
  )

  console.log(
    "\n",
    colors.green("==============================\n"),
    "  Total Parts Found: ",
    totalPartsFound,
    "!\n",
    colors.green("==============================\n"),
  )

  console.log(
    colors.green(" ==============================\n"),
    "  Parts Not Found: ",
    totalNotFound,
    "!",
  )

  Object.entries(notFoundParts).forEach(([part, songs]) => {
    if (songs.length === 0) return

    console.log("    ", colors.red(part))

    songs.forEach((song) => {
      console.log("      ", colors.red(song))
    })
  })

  console.log(colors.green(" ==============================\n"))

  if (failedMerges.length === 0) {
    console.log(`Successfully merged all parts!`)
  } else {
    console.log(`Failed to merge all parts:`)
    console.log(failedMerges)
  }
}
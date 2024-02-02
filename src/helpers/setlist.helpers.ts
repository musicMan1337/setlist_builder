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

function isCbTune(song: string) {
  const cbIndicators = ["(Cover", "(M", "(S"]
  return cbIndicators.some((indicator) => song.includes(indicator))
}

function getPartCbValue(partName: string): CbVersion {
  let cbKey: CbPartType = "rhythm"

  switch (true) {
    case partName.includes("trumpet"):
      cbKey = "trumpet"
      break
    case partName.includes("bone"):
      cbKey = "trombone"
      break
    case ["alto", "tenor", "bari"].includes(partName):
      cbKey = "sax"
      break
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

export const findAllSongs = (
  shortName: string,
  key: string,
  songSources: SongSources,
  exactName: boolean,
) => {
  // find by shortName
  let sourceParts = songSources.songs.filter(
    (sourceSong) =>
      sourceSong.shortName.toLowerCase() === shortName.toLowerCase() &&
      (!SETLIST.options.allKeys ||
        (SETLIST.options.allKeys && (sourceSong.key || "") === key)),
  )

  if (!sourceParts.length && !exactName) {
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

export const writeBlankPdfFile = (
  setlistDir: string,
  part: string,
  fileName: string,
  content: string,
) => {
  const partDir = path.join(setlistDir, part)

  const pdfDoc = new PDFDocument()
  pdfDoc.pipe(fs.createWriteStream(`${partDir}/${fileName}.pdf`))
  pdfDoc.fontSize(26).text(content || fileName)
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
  numHorns: number,
) => {
  let partSources: SongSource[] = []

  if (partNumber !== "0") {
    partSources = partSourcesRaw.filter(
      (sourceSong) => sourceSong.partNumber === Number(partNumber),
    )
  }

  if (partNumber === "0" || partSources.length === 0) {
    partSources = partSourcesRaw.filter(
      (sourceSong) => sourceSong.partNumber <= 1,
    )
  }

  if (numHorns) {
    // if the hornNum matches, include ONLY the singular sourceSong (sourceSong.fullName)
    // if there are no matches, include source for closest hornNum for given sourceSong.shortName
    const shortNameHornNums = partSources.reduce<Record<string, number[]>>(
      (obj, sourceSong) => {
        if (!obj[sourceSong.shortName]) {
          obj[sourceSong.shortName] = []
        }

        if (sourceSong.numHorns) {
          obj[sourceSong.shortName].push(sourceSong.numHorns)
        }

        return obj
      },
      {},
    )

    const shortNameMatches = partSources.reduce<Record<string, string>>(
      (obj, sourceSong) => {
        const hornNums = shortNameHornNums[sourceSong.shortName]
        // find number closest to numHorns
        const closestNum = hornNums.reduce(
          (num, curr) =>
            curr !== numHorns && curr % numHorns < num ? curr : num,
          999,
        )

        const equalName =
          (sourceSong.numHorns || 0) === numHorns ? sourceSong.fullName : ""

        const closestName =
          (sourceSong.numHorns || 0) === closestNum ? sourceSong.fullName : ""

        obj[sourceSong.shortName] =
          equalName || closestName || obj[sourceSong.shortName]

        return obj
      },
      {},
    )

    partSources = partSources.filter(
      (sourceSong) =>
        !shortNameMatches[sourceSong.shortName] ||
        shortNameMatches[sourceSong.shortName] === sourceSong.fullName,
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

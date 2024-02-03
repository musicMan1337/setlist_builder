import path from "path"

import { SongSource } from "../types/sources"

import type { SourceDirectoryName } from "../types/sources"

//? Song naming:
//* Mammoth : <song name> - <instrument name>.pdf
//* LDB     : <song name> - <number>H - <key> - <instrument name>.pdf

export const buildSongSource = (
  group: SourceDirectoryName,
  file: string,
  filePath: string,
) => {
  const songSource: SongSource = {
    fullName: file.replace(".pdf", ""),
    filePath: path.resolve(filePath),
    shortName: "",
    part: "",
    partNumber: 0,
    key: undefined,
    numHorns: undefined,
  }

  // remove extension and normalize
  const formattedFile = file.split(".pdf")[0].trim().toLowerCase()

  if (formattedFile.split(" - ").length < 2) {
    return songSource
  }

  // mammoth naming convention
  if (group === "mammoth") {
    const fullPart = formattedFile.split(" - ").slice(-1)[0]
    const nameNoPart = formattedFile.replace(` - ${fullPart}`, "")

    const { part, partNumber } = parseMammothPart(fullPart)
    const shortName = nameNoPart.split(" (")[0]

    songSource.shortName = shortName
    songSource.part = part
    songSource.partNumber = partNumber
  }

  // LDB naming convention
  if (group === "ldb") {
    const fileParts = formattedFile.split(" - ").map((s) => s.trim())

    let [songName, key, numHorns, part] = fileParts

    // special case for "amber" songs
    if (formattedFile.includes("(amber)")) {
      let [_part, _numHorns] = fileParts[fileParts.length - 1]
        .trim()
        .split(" (")

      key = ""
      songName = fileParts.slice(0, -1).join(" ").replace(" (amber)", "")
      part = _part
      numHorns = !_numHorns
        ? "2h"
        : _numHorns.toLowerCase().replace(")", "").replace("horns", "h")
    }

    if (key) {
      key?.replace("maj", "")
      key = key.charAt(0).toUpperCase() + key.slice(1)
    }

    songSource.shortName = songName
    songSource.numHorns = Number(numHorns?.replace("h", ""))
    songSource.key = key || undefined
    songSource.part = part
  }

  return songSource
}

function parseMammothPart(rawPart: string) {
  const fullPart = rawPart.split("(")[0] // remove custom name if it exists
  let partSegments = fullPart.split(" ")

  let partNumber = partSegments.pop()
  let part = partSegments.join(" ")
  if (isNaN(Number(partNumber))) {
    partNumber = undefined
    part = fullPart
  }

  part = part.trim()

  return { part, partNumber: partNumber ? Number(partNumber) : 0 }
}

import path from "path"

import { SongSource } from "../types/sources"

//? Song naming:
//* Mammoth : <song name> - <instrument name>.pdf
//* LDB     : <song name> - <number>H - <key> - <instrument name>.pdf

export const buildSongSource = (file: string, filePath: string) => {
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

  // mammoth naming convention
  if (formattedFile.includes("(") || formattedFile.split(" - ").length === 2) {
    const fullPart = formattedFile.split(" - ").slice(-1)[0]
    const nameNoPart = formattedFile.replace(` - ${fullPart}`, "")

    const { part, partNumber } = parseMammothPart(fullPart)
    const shortName = nameNoPart.split(" (")[0]

    songSource.shortName = shortName
    songSource.part = part
    songSource.partNumber = partNumber
  }

  // LDB naming convention
  else if (formattedFile.split(" - ").length === 4) {
    const [songName, numHorns, key, part] = formattedFile
      .split(" - ")
      .map((s) => s.trim())

    songSource.shortName = songName
    songSource.numHorns = Number(numHorns.replace("h", ""))
    songSource.key = key
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

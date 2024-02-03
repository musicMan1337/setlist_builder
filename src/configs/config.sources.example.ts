import path from "path"

//? This is an example of what the config file should look like.
//? Copy this file to config.sources.ts and fill in the paths to your scores.

export const SETLISTS_DIR = "setlists"

export const SOURCES_DIR = "_sources"

export const SOURCE_DIRECTORIES = {
  ldb: [path.join("C:", "Path", "To", "LDB", "Scores")],
  mammoth: [path.join("C:", "Path", "To", "Mammoth", "Scores")],
} as const

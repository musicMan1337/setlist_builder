import path from "path"

//? This is an example of what the config file should look like.
//? Copy this file to config.sources.ts and fill in the paths to your scores.

export const sourceDirectories: SourceDirectories = {
  band1: [path.join("C:", "Path", "To", "band1", "Scores")],
  band2: [path.join("C:", "Path", "To", "band2", "Scores")],
}

export const SETLISTS_DIR = "setlists"

export const SOURCES_DIR = "_sources"

type SourceDirectories = Record<string, string[]>

export const SOURCE_DIRECTORIES: SourceDirectories = {
  band1: [path.join("C:", "Path", "To", "band1", "Scores")],
  band2: [path.join("C:", "Path", "To", "band2", "Scores")],
}

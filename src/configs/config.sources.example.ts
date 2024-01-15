import path from "path"

//? This is an example of what the config file should look like.
//? Copy this file to config.sources.ts and fill in the paths to your scores.

type SourceDirectories = Record<string, string[]>

export const sourceDirectories: SourceDirectories = {
  band1: [path.join("C:", "Path", "To", "band1", "Scores")],
  band2: [path.join("C:", "Path", "To", "band2", "Scores")],
}

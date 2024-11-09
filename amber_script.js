const fs = require("fs")
const path = require("path")

// Function to copy files based on criteria
function copyFiles() {
  // Read the JSON file
  const jsonFilePath = "./setlists/_sources/amber.json"
  const destinationFolder = "./.temp"

  // Ensure the destination folder exists
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder)
    console.log(`Created folder: ${destinationFolder}`)
  }

  // Read and parse the JSON file
  fs.readFile(jsonFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err)
      return
    }

    const songs = JSON.parse(data).songs

    // Filter songs based on criteria
    const filteredSongs = songs.filter(
      (song) =>
        song.fullName.endsWith("Trumpet Tenor") ||
        song.fullName.endsWith("Parts"),
    )

    // Copy each matching file to the temp folder
    filteredSongs.forEach((song) => {
      const sourcePath = song.filePath
      const fileName = path.basename(sourcePath)
      const destinationPath = path.join(destinationFolder, fileName)

      fs.copyFile(sourcePath, destinationPath, (err) => {
        if (err) {
          console.error(`Error copying file ${fileName}:`, err)
        } else {
          console.log(`Copied file ${fileName} to ${destinationFolder}`)
        }
      })
    })
  })
}

// Run the function to copy files
copyFiles()

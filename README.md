# Setlist Builder

Quickly gather and combine music for shows

# Table of Contents

- [Setlist Builder](#setlist-builder)
- [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Configuration](#configuration)
  - [Scripts](#scripts)
    - [Build](#build)
    - [Generate All Songs List](#generate-all-songs-list)
    - [Generate Setlist](#generate-setlist)
  - [How It Works](#how-it-works)
    - [Song Naming Conventions](#song-naming-conventions)
    - [Directory Structure](#directory-structure)
  - [Python Script Integration for Merging PDFs](#python-script-integration-for-merging-pdfs)
    - [Key Features of the Python Script](#key-features-of-the-python-script)
    - [How It Works](#how-it-works-1)
    - [Setup and Requirements](#setup-and-requirements)
    - [Example Usage in TypeScript](#example-usage-in-typescript)
  - [Contributing](#contributing)

## Overview

This project automatically generates lists of all songs and setlists from specified directories. It leverages Node.js scripts to search through directories for PDF files representing songs, categorizes them based on predefined naming conventions, and outputs the results in JSON format.

## Getting Started

### Prerequisites

- Node.js installed on your machine.
- Typescript installed on your machine.
- Python installed on your machine (optional, but recommended)
- PDF files of songs organized in directories according to the band or group they belong to.

### Installation

1. Clone the repository to your local machine.
2. Navigate to the project directory and run `npm install` to install dependencies.

### Configuration

- Rename `config.sources.example.ts` to `config.sources.ts`.
- Update the `SOURCE_DIRECTORIES` in `config.sources.ts` with the paths to your score directories.
- Rename `config.setlist.example.ts` to `config.setlist.ts`.
- Update `config.setlist.ts` as needed

## Scripts

### Build

Builds the project and prepares it for running the scripts.

```bash
npm run build
```

### Generate All Songs List

Generates a JSON file for each source directory listing all songs contained within.

```bash
npm run all
```

This script scans the specified directories for PDF files representing songs, applying naming conventions to extract metadata such as the song name, instrument, and key. The output is a set of JSON files, each corresponding to a source directory, listing all songs found.

### Generate Setlist

Generates a setlist based on predefined criteria.

```bash
npm run setlist
```

This script allows for the creation of custom setlists, useful for organizing performances or rehearsals. The criteria for setlist generation can be customized within the `generate_setlist.ts` and `setlist.helpers.ts` scripts.

## How It Works

### Song Naming Conventions

The scripts expect PDF files to follow specific naming conventions for proper metadata extraction:

- **Basic Format**: `<song name> - <instrument name>.pdf`
  - "Some Song - Guitar.pdf"
- **Extra Meta Format**: `<song name> - <key> - <number horns>H - <instrument name>.pdf`
  - "Some Song - F#m - 2H - Guitar.pdf"
  - **Note**: You can follow this convention but omit parts with blank space:
    - "Some Song - F#m - - Guitar.pdf"
    - "Some Song - - 2H - Guitar.pdf"

Here are conventions/variations for specific parts of a file name:

- **"song name"**: `<song name> (<custom name>)` - "Cool Song (Special)"
- **"instrument name"**: `<instrument name> <part number>` - "Alto Sax 1"

### Directory Structure

Ensure your song PDFs are organized within the specified source directories. Each band or group should have its own directory within the paths defined in `config.sources.ts`.

## Python Script Integration for Merging PDFs

The TypeScript project integrates a Python script to automate the merging of PDF files into setlists. This script, `merge.py`, is called from the `generate_setlist.ts` file using Node.js's `child_process` module. The Python script performs two main tasks: merging individual PDF files into one and creating a table of contents (TOC) for the merged PDF.

_Note that this can be turned of by simply commenting out the `executePythonScript` call, but be sure to comment in the lines that terminate the progress bar right below!_

### Key Features of the Python Script

- **Merges PDF files**: The script takes a list of PDF files from a specified source directory and merges them into a single PDF file. This is particularly useful for creating consolidated setlists from individual song parts.

- **Generates a TOC**: Alongside merging, it generates a TOC page at the beginning of the merged PDF. The TOC includes clickable links for each song, allowing easy navigation through the setlist.
  - **TODO**:
    1. Check how many pages the TOC spans and adjust links/page numbers ac cordingly
    2. Links currently only work in a browser, not in apps (like ForScore)

### How It Works

1. **Argument Parsing**: The script accepts command-line arguments for the source directory (`-source`), the output directory (`-out`), and the merged file name (`-merge`). These parameters are passed from the TypeScript code.

2. **PDF Merging**: Using `PyPDF2`, the script iterates over the PDF files in the source directory, merging them into a single output file.

3. **TOC Creation**: It then creates a TOC based on the file names, assuming each file represents a song. The TOC page is generated with clickable links that jump to the corresponding page in the PDF, improving the user's ability to navigate the setlist.

4. **Execution from TypeScript**: The script is invoked from `generate_setlist.ts` through the `spawn` function from Node.js's `child_process` module. This allows the TypeScript application to seamlessly integrate PDF merging functionality within its workflow.

### Setup and Requirements

- **Python Installation**: Ensure Python is installed and accessible from your environment's PATH to allow Node.js to call the Python script.
- **Dependencies**: The script uses `PyPDF2` for PDF manipulation and `reportlab` for generating the TOC page. Install these packages using `pip`:

  ```bash
  pip install PyPDF2 reportlab
  ```

### Example Usage in TypeScript

The following snippet from `generate_setlist.ts` demonstrates how the Python script is invoked:

```typescript
const scriptPath = "path/to/merge.py"
const args = [`-out=${out}`, `-source=${source}`, `-merge=${merge}`]
const pythonProcess = spawn("python", [scriptPath, ...args])

pythonProcess.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`)
})
```

This integration enables the automated generation of setlists, complete with a TOC, enhancing the usability and accessibility of the generated PDFs for performers and conductors.

## Contributing

Feel free to fork the project and submit pull requests with improvements or bug fixes. Note that this project is not as generic as it could be, **which is by design**. It can be restructured to fit your own set of custom rules for songs/bands

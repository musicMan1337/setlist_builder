import PyPDF2
import re
import os
import math
import argparse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def sort_files(file):
    """ Custom sorting function to sort the files numerically and then alphabetically. """
    numbers = re.findall(r'\d+', file)
    if numbers:
        # Use the first found number for sorting, and convert it to integer
        return (int(numbers[0]), file)
    return (0, file)  # For files without numbers, default to 0

def merge_pdfs(files, output):
    """Merges a list of PDF files into a single PDF file.

    Args:
        files: A list of PDF file paths.
        output: The path to the output PDF file.
    """

    merger = PyPDF2.PdfMerger()
    for file in files:
        merger.append(file)

    with open(output, "wb") as f:
        merger.write(f)

def create_toc_page(toc, output_path):
    """Creates a TOC page with clickable links, justified text with filler characters, using a monospace font."""
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    left_margin = 72
    right_margin = 72
    y_position = height - 30
    font_name = 'Courier'  # Monospace font
    font_size = 12
    fill_char = '_'  # Character used to fill space between title and page number
    buffer_space = 0.5  # Small buffer to ensure enough space for filler

    for page_num, title in toc:
        page_num_str = str(page_num)
        c.setFont(font_name, font_size)

        # Calculate the width of title and page number in monospace font
        title_width = c.stringWidth(title, font_name, font_size)
        page_num_width = c.stringWidth(page_num_str, font_name, font_size)

        # Calculate the space available for space filler, with a small buffer
        space_for_filler = width - left_margin - right_margin - title_width - page_num_width - buffer_space
        num_filler = math.ceil(space_for_filler / c.stringWidth(fill_char, font_name, font_size))
        filler = fill_char * num_filler

        # Concatenate title, filler, and page number
        full_text = title + filler + page_num_str
        c.drawString(left_margin, y_position, full_text)

        # Add clickable link
        full_text_width = c.stringWidth(full_text, font_name, font_size)
        x1, y1 = left_margin, y_position - 10
        x2, y2 = left_margin + full_text_width, y_position + 10
        c.linkURL(f'#page={page_num}', (x1, y1, x2, y2), thickness=0, color=colors.transparent)

        y_position -= 20

        # Check if we need a new page
        if y_position < 40:
            c.showPage()
            y_position = height - 30

    c.save()

def merge_pdfs_with_toc(files, toc, output):
    """Merges PDF files and adds a TOC at the beginning."""
    merger = PyPDF2.PdfMerger()

    # Create TOC page and append
    toc_path = f'{output}_temp-toc.pdf'
    create_toc_page(toc, toc_path)
    merger.append(toc_path)

    # Append other PDF files
    for file in files:
        merger.append(file)

    with open(output, "wb") as f:
        merger.write(f)

def create_toc(files):
    """Creates a TOC based on filenames."""
    toc = []
    page_counter = 2  # Start counting from the second page due to TOC

    for file in files:
        title = os.path.basename(file).replace('.pdf', '')
        toc.append((page_counter, title))
        reader = PyPDF2.PdfReader(file)
        page_counter += len(reader.pages)

    return toc

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '-out',
        help='Output folder',
        default="__setlists\\2024-01-12__8-Bit__Valley-Bar"
    )
    parser.add_argument(
        '-merge',
        help='Merged filename',
        default="__setlists\\2024-01-12__8-Bit__Valley-Bar/2024-01-12__8-Bit__Valley-Bar - tenor.pdf"
    )
    parser.add_argument(
        '-source',
        help='Files source',
        default="__setlists\\2024-01-12__8-Bit__Valley-Bar\\alto 1"
    )
    return parser.parse_args()

def main():
    """Merges a list of PDF files and creates a table of contents for the merged file."""

    args = parse_arguments()

    source_folder = args.source
    out_folder = args.out
    output = args.merge

    # print("Source folder: " + source_folder)
    # print("Output folder: " + out_folder)
    # print("Output file: " + output)

    # Loop through folder and add pdfs in order to files list
    files = []

    all_source_pdfs = os.listdir(source_folder)
    sorted_pdfs = sorted(all_source_pdfs, key=sort_files)
    for pdf in sorted_pdfs:
        # print(pdf)
        files.append(os.path.join(source_folder, pdf))

    # Merge the PDF files.
    merge_pdfs(files, output)

    # Create the table of contents.
    toc = create_toc(files)

    merge_pdfs_with_toc(files, toc, output)

if __name__ == "__main__":
    main()
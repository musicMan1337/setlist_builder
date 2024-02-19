import pikepdf
from pikepdf import Name, Array, Dictionary
from reportlab.pdfgen import canvas


def make_test_pdf(pdf_path):
    # Create a 2-page PDF
    c = canvas.Canvas(pdf_path)
    c.drawString(100, 750, "Page 1")
    c.showPage()
    c.drawString(100, 750, "Page 2")
    c.save()


def add_clickable_links(pdf_path):
    pdf = pikepdf.open(pdf_path)

    # Define the link annotation dictionary
    link_annotation = Dictionary({
        '/Type': '/Annot',
        '/Subtype': '/Link',
        '/Rect': Array([100, 100, 200, 200]),
        '/Border': Array([0, 0, 0]),
        '/A': Dictionary({
            '/S': '/GoTo',
            '/D': Array([pdf.pages[1].obj, '/XYZ', 0, 0, 0])
        })
    })

    pdf.pages[0].Annots = Array([link_annotation])

    pdf.save(pdf_path)


def main():
    """
    This is a test file.
    Create a 2-page PDF, then create a single link on the first page to the second page.
    """

    # Create a 2-page PDF
    pdf_path = 'output__TEST.pdf'
    make_test_pdf(pdf_path)

    # Add clickable links to the table of contents
    add_clickable_links(pdf_path)


if __name__ == "__main__":
    main()

import PyPDF2

pdf_path = r"S:\Dev\AlienFrontiers\assets-archive\rules-and-docs\AlienFrontiersRules-2ndPrint.pdf"

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        
        print(f"Number of pages: {len(reader.pages)}\n")
        print("=" * 80)
        
        for page_num, page in enumerate(reader.pages, 1):
            print(f"\n--- Page {page_num} ---\n")
            text = page.extract_text()
            # Replace problematic characters
            text = text.encode('ascii', 'replace').decode('ascii')
            print(text)
            print("\n" + "=" * 80)
            
except FileNotFoundError:
    print(f"Error: Could not find PDF at {pdf_path}")
except Exception as e:
    print(f"Error: {e}")

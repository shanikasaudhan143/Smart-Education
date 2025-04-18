import logging
import os
import re
import requests
import google.generativeai as genai
from dotenv import load_dotenv
import tempfile
from io import BytesIO
import fitz  # PyMuPDF
from PIL import Image
import pytesseract  # OCR tool for text extraction

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Load your API key from .env
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

class ExamEvaluationTool:
    def evaluation_tool(self, pdf_url: str) -> dict:
        try:
            logger.info(f"Starting evaluation for PDF URL: {pdf_url}")

            # Download the PDF
            response = requests.get(pdf_url)
            response.raise_for_status()  # Ensure no HTTP errors
            logger.info(f"Downloaded PDF from {pdf_url}, Status Code: {response.status_code}")
            
            # Check the content length to ensure it is valid
            logger.info(f"PDF Content Size: {len(response.content)} bytes")

            # Save the PDF to a temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_pdf:
                temp_pdf.write(response.content)
                temp_pdf_path = temp_pdf.name
                logger.info(f"Temporary PDF saved at: {temp_pdf_path}")

            # Open the PDF with PyMuPDF (fitz)
            try:
                doc = fitz.open(temp_pdf_path)
                logger.info(f"Successfully opened PDF with {doc.page_count} pages.")
            except Exception as e:
                logger.error(f"Error opening PDF from path: {temp_pdf_path}. Error: {e}")
                return {"error": f"Error opening the PDF: {e}"}

            # Extract text from the PDF (using PyMuPDF for text-based PDFs)
            extracted_text = self.extract_text_from_pdf(temp_pdf_path)

            if not extracted_text:
                logger.warning("No text extracted from the PDF. The document might be an image-based PDF.")
                return {"error": "The PDF could not be processed. No text was extracted."}

            # Prepare the prompt for the Gemini model (or your evaluation tool)
            model = genai.GenerativeModel("models/gemini-1.5-flash")
            prompt_template = self.create_prompt_template()

            contents = [extracted_text, prompt_template]
            logger.info("Sending prompt to Gemini model")
            response = model.generate_content(contents)
            logger.info("Model response received")

            # Parse the response from the model
            extracted_info, evaluation_response = self.parse_pdf_response(response.text)

            if not evaluation_response:
                logger.warning("Model returned an empty response. The PDF might be too large or improperly formatted.")
                return {"error": "The PDF could not be processed. It might be too large or improperly formatted."}

            logger.info("Evaluation completed successfully.")
            return {
                "extracted_info": extracted_info,
                "evaluation_response": evaluation_response
            }

        except Exception as e:
            logger.exception("Error during evaluation")
            return {"error": f"An error occurred: {str(e)}"}

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extracts text from a PDF. If the PDF is an image-based document, OCR is used.
        """
        try:
            # Try to extract text using PyMuPDF (for text-based PDFs)
            doc = fitz.open(pdf_path)
            text = ""
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                text += page.get_text("text")  # Extract text

            if text.strip():  # If text was found, return it
                logger.info(f"Extracted text from {doc.page_count} pages.")
                logger.debug(f"Extracted Text: {text}")
                return text

            # If no text was extracted, use OCR for image-based PDFs
            logger.warning("No text extracted from the PDF. Using OCR for image-based PDF.")
            images = self.pdf_to_images(pdf_path)
            ocr_text = self.ocr_from_images(images)
            return ocr_text

        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            return ""

    def pdf_to_images(self, pdf_path: str):
        """Convert PDF pages to images if necessary (using PyMuPDF for example)"""
        try:
            doc = fitz.open(pdf_path)
            images = []
            for page_num in range(doc.page_count):
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                img_bytes = pix.tobytes()
                images.append(img_bytes)
            logger.info(f"Converted {doc.page_count} pages to images.")
            return images
        except Exception as e:
            logger.error(f"Error converting PDF to images: {e}")
            return []

    def ocr_from_images(self, images: list) -> str:
        """Use OCR to extract text from images"""
        text = ""
        try:
            for img_data in images:
                # Convert image byte data to PIL Image
                img = Image.open(BytesIO(img_data))
                # Use Tesseract OCR to extract text
                img_text = pytesseract.image_to_string(img)
                text += img_text
            logger.info(f"Extracted text from {len(images)} images using OCR.")
            return text
        except Exception as e:
            logger.error(f"Error during OCR: {e}")
            return ""

    def create_prompt_template(self):
        """Creates a template for the evaluation model"""
        return (
            "You are an intelligent exam evaluation assistant. Your task is to evaluate student answers from the "
            "provided answer document based on the questions and their allocated marks from the question document.\n"
            "1. Extract the question, the marks allocated to it, and the student's answer. For multi-part questions (e.g., choices labeled (a), (b), etc.):\n"
            "   - Extract each sub-question (e.g., part (a), part (b)) along with its allocated marks.\n"
            "   - Extract the student's answer for each sub-question.\n"
            "   - Identify if the question requires a diagram and note its presence or absence in the student's answer.\n"
            "2. Compare the student's answer against the ideal answer (assume you know the ideal answer).\n"
            "   - For textual answers, evaluate correctness, completeness, and clarity.\n"
            "   - For diagrams, evaluate accuracy, labeling, and relevance to the question.\n"
            "3. Provide the following for each question:\n"
            "   - For single-part questions:\n"
            "     - A score out of the allocated marks for the question.\n"
            "     - Suggestions for improvement if the answer isn't perfect.\n"
            "   - For multi-part questions:\n"
            "     - *Mark Allocation:* Divide the total allocated marks among the subparts proportionally based on the number of subparts. For example, if a question is worth 3 marks and has 4 subparts, each subpart should be allocated 0.75 marks.\n"
            "     - For each sub-question:\n"
            "       - A score out of the allocated marks for that sub-question.\n"
            "       - Suggestions for improvement if the answer isn't perfect.\n"
            "       - *Diagram Evaluation (if applicable):*\n"
            "         - If the sub-question requires a diagram, check for its presence.\n"
            "           - If the diagram is present, evaluate its accuracy and completeness, and assign marks accordingly within the allocated subpart marks.\n"
            "           - If the diagram is missing, assign a score of 0 for the diagram component of that subpart and provide a suggestion to include diagrams in future answers.\n"
            "     - *Handling Unattempted Sub-questions:*\n"
            "       - If a sub-question is not attempted, assign a score of 0 for that sub-question.\n"
            "       - Provide a suggestion encouraging the student to attempt all parts of the question.\n"
            "4. At the end, calculate the overall score out of Total Marks mentioned on the Question Paper and provide summary feedback.\n\n"
            "The response must follow this strict format:\n\n"
            "===START===\n"
            "Question {number} (Marks: {allocated_marks})::\n[Extracted question]\n\n"
            "Student Answer:\n[Extracted student answer]\n\n"
            "Evaluation:\n"
            "- Score: [Numeric score out of {allocated_marks}]\n"
            "- Suggestions: [Suggestions for improvement or 'None']\n\n"
            "If the question has multiple parts, structure the evaluation accordingly:\n"
            "   - Sub-question (a) [Sub-question text]:\n"
            "     Student Answer:\n[Student's answer for sub-question (a)]\n\n"
            "     Evaluation:\n"
            "     - Score: [Numeric score out of allocated marks for part (a)]\n"
            "     - Suggestions: [Suggestions for improvement or 'None']\n\n"
            "     {#if diagram required}\n"
            "       - Diagram Present: [Yes/No]\n"
            "       - Diagram Evaluation:\n"
            "         - Score: [Numeric score out of allocated marks for the diagram]\n"
            "         - Suggestions: [Suggestions for improvement or 'None']\n\n"
            "     {#endif}\n"
            "   - Sub-question (b) [Sub-question text]:\n"
            "     Student Answer:\n[Student's answer for sub-question (b)]\n\n"
            "     Evaluation:\n"
            "     - Score: [Numeric score out of allocated marks for part (b)]\n"
            "     - Suggestions: [Suggestions for improvement or 'None']\n\n"
            "     {#if diagram required}\n"
            "       - Diagram Present: [Yes/No]\n"
            "       - Diagram Evaluation:\n"
            "         - Score: [Numeric score out of allocated marks for the diagram]\n"
            "         - Suggestions: [Suggestions for improvement or 'None']\n\n"
            "     {#endif}\n"
            "   - ...\n\n"
            "   - *Note:* [If any sub-question was not attempted, e.g., 'Sub-question (c) was not attempted. Please ensure to answer all parts of the question.']\n\n"
            "Repeat for all questions.\n\n"
            "Overall Score: [Total score out of Total Marks mentioned on the question paper.]\n"
            "Summary Feedback: [General feedback about the student's performance]\n"
            "===END===\n"
        )

    def parse_pdf_response(self, response_content: str) -> tuple:
        """
        Parses the model's response to extract student information and evaluation.
        """
        try:
            extracted_info_match = re.search(r"===START===\n(.*?)\nOverall Score:", response_content, re.DOTALL)
            evaluation_match = re.search(r"Overall Score: (.*?)\nSummary Feedback:", response_content, re.DOTALL)

            extracted_info = extracted_info_match.group(1).strip() if extracted_info_match else ""
            evaluation_response = evaluation_match.group(1).strip() if evaluation_match else ""

            if not extracted_info or not evaluation_response:
                return extracted_info, "The document could not be processed correctly."

            return extracted_info, evaluation_response

        except Exception as e:
            logger.error(f"Error parsing response: {e}")
            return "", "Failed to process the document."

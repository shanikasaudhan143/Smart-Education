import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from exam_evaluation_tool import ExamEvaluationTool
from fastapi.middleware.cors import CORSMiddleware
# Logging setup
logging.basicConfig(
    level=logging.INFO,  # You can change this to DEBUG if you need more verbose output
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://smart-education-taupe.vercel.app"],  # Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EvaluateRequest(BaseModel):
    pdf_url: str

# Initialize your evaluation tool instance
teacher_service = ExamEvaluationTool()

@app.post("/evaluate-exam")
async def evaluate_exam(request: EvaluateRequest):
    """
    Evaluate the provided PDF using the TeacherService.
    """
    try:
        result = teacher_service.evaluation_tool(request.pdf_url)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return {"status": "success", "data": result}
    except Exception as e:
        logger.error(f"Error in /evaluate-exam: {e}")  # Use the initialized logger here
        raise HTTPException(status_code=500, detail="An error occurred while evaluating the exam.")

# Evaluation Tool for Teachers

**Tagline**: A full-stack evaluation tool for teachers to assess student performance in real-time.

## Problem Statement
Teachers often struggle with efficiently grading assessments, especially in online settings. The goal of this project is to provide teachers with an evaluation tool that allows them to assess and evaluate students’ answers to a set of questions in real-time. The tool will automatically grade the student’s response and provide feedback.

## Solution Overview
This project is a **full-stack web application** that consists of a **FastAPI backend** and a **React frontend**. The backend handles the evaluation logic and API requests, while the frontend provides an intuitive user interface to interact with the evaluation tool.

### Key Features:
- Teachers can submit questions and evaluate student responses.
- Students can answer multiple-choice questions, and the evaluation is done automatically.
- Real-time grading and feedback for students.
- A RESTful API to handle evaluation and provide feedback.
- Clean and responsive user interface built with React.

## Tech Stack Used
- **Backend**: FastAPI, Uvicorn
- **Frontend**: React, JavaScript, CSS (Optional: Framer Motion for animations)
- **Database**: PostgreSQL (optional, depending on your setup)
- **Testing**: Jest, React Testing Library, PyTest
- **Deployment**: Render, Vercel, Netlify

## Setup and Run Instructions

### Backend (FastAPI)
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo-name.git
   cd backend
2. **Create a virtual environment**:
   ```bash
   python -m venv .venv

3. **Activate the virtual environment:**:
   ```bash
   .venv\Scripts\activate

4. **Install dependencies:**:
   ```bash
   pip install -r requirements.txt
5. **Run the backend server**:
   ```bash
   uvicorn main:app --reload
6. **Create a .env file :**:
   ```bash
   DATABASE_URL=your_database_url
   GEMINI_API_KEY=your_secret_key   
   
### frontend (React)
1. **Navigate to the frontend directory:**:
   ```bash
   cd frontend

2. **Install dependencies:**:
   ```bash
   npm install

3. **Run the frontend:**:
   ```bash
   npm run dev

### Folder Structure
project-root/
├── src/
│   ├── backend/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── api/
│   │   ├── ...
│   ├── frontend/
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── ...
├── tests/
│   ├── backend/
│   ├── frontend/
│   ├── api-test.js
│   ├── app.test.js
├── docs/
│   ├── api-docs.postman_collection.json
├── README.md
├── .env.example
├── package.json
└── requirements.txt

## Testing the Website

1. **Test the Question Paper and Answer Sheet:**
   - Go to the `/tests` directory on the website to download the question paper and answer sheet.
   - Follow the instructions to upload the answer sheet and evaluate your answers.

2. **API Testing:**
   - Use the provided API endpoints to interact with the backend.
   - API documentation can be found in the `/docs/api.md` file, or you can directly test it on the website.

## API Documentation

The API allows interaction with various endpoints to manage and evaluate the question paper and answers.

   
  

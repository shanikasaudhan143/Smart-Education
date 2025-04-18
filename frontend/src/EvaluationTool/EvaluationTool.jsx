// src/components/EvaluationTool/EvaluationTool.jsx

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import ReactMarkdown from 'react-markdown';
// import { useAuth } from '../../../components/AuthContext'; // Adjust the path as necessary
import './EvaluationTool.css';
import { jsPDF } from 'jspdf';
// const API_BASE = process.env.REACT_APP_API_URL; 
// import config from '../../../config';
import LoadingEvaluation from './LoadingEvaluation';  

const CLOUD_NAME = "doqn7ijwo";
const PDF_UPLOAD_PRESET = "pdfupload";
const MAX_PDF_SIZE = 10485760;  

const EvaluationTool = () => {
    const userData  =  {
        name:"shani",
        teacherId:2,
        subject:"science"
    }  
    const [questionPaper, setQuestionPaper] = useState(null);
    const [answerSheet, setAnswerSheet] = useState(null);
    const [reportCard, setReportCard] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [totalMarks, setTotalMarks] = useState(0);
    const questionPaperRef = useRef(null);
    const answerSheetRef = useRef(null);
    const scoringRef = useRef(null);
    const suggestionsRef = useRef(null);

    const [parsedQuestions, setParsedQuestions] = useState([]);

    // Handle file input for question paper
    const handleQuestionPaperUpload = (e) => {
        setQuestionPaper(e.target.files[0]);
    };

    // Handle file input for answer sheet
    const handleAnswerSheetUpload = (e) => {
        setAnswerSheet(e.target.files[0]);
    };

    // Function to merge two PDFs using pdf-lib
    const mergePDFs = async (pdf1, pdf2) => {
        const mergedPdf = await PDFDocument.create();

        const pdf1Bytes = await pdf1.arrayBuffer();
        const pdf2Bytes = await pdf2.arrayBuffer();

        const pdf1Doc = await PDFDocument.load(pdf1Bytes);
        const pdf2Doc = await PDFDocument.load(pdf2Bytes);

        const copiedPagesA = await mergedPdf.copyPages(pdf1Doc, pdf1Doc.getPageIndices());
        copiedPagesA.forEach((page) => mergedPdf.addPage(page));

        const copiedPagesB = await mergedPdf.copyPages(pdf2Doc, pdf2Doc.getPageIndices());
        copiedPagesB.forEach((page) => mergedPdf.addPage(page));

        const mergedPdfBytes = await mergedPdf.save();
        return new Blob([mergedPdfBytes], { type: 'application/pdf' });
    };

    // Function to optimize the merged PDF
    const optimizePdf = async (pdfBlob) => {
        const pdfBytes = await pdfBlob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

        // Remove metadata
        pdfDoc.setTitle('');
        pdfDoc.setAuthor('');
        pdfDoc.setSubject('');
        pdfDoc.setKeywords([]);
        pdfDoc.setProducer('');
        pdfDoc.setCreator('');

        // Optionally, you can implement further optimizations here,
        // such as compressing images or removing unused objects.

        const optimizedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
        return new Blob([optimizedPdfBytes], { type: 'application/pdf' });
    };

    // Function to upload PDF to Cloudinary
    const uploadToCloudinary = async (mergedPdfBlob) => {
        const formData = new FormData();
        formData.append("file", mergedPdfBlob);
        formData.append("upload_preset", PDF_UPLOAD_PRESET);
        formData.append("folder", "documents"); // Optional: specify folder

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload?resource_type=raw`,
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();
            console.log("Cloudinary Response:", data);

            if (response.ok && data.secure_url) {
                return data.secure_url;
            } else {
                const errorMessage = data.error?.message || 'Unknown error.';
                throw new Error(`Failed to upload PDF to Cloudinary: ${errorMessage}`);
            }
        } catch (error) {
            console.error("Upload Error:", error);
            throw error;
        }
    };

    // Function to send PDF URL to backend for evaluation
    const sendToBackend = async (pdfUrl) => {
        const payload = {
            pdf_url: pdfUrl
        };

        try {
            
            // to test with loacalhost replace the url with http://localhost:8000/evaluate-exam
            const response = await fetch(`https://smart-education-a2la.onrender.com/evaluate-exam`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
                          
            if (response.ok) {
                const data = await response.json();
                console.log("data: ", data);
                return data.data; // Assuming 'data' contains the evaluation details
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || "Backend evaluation failed.";
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Backend Evaluation Error:", error);
            throw error;
        }
    };

    // Submit files for evaluation
    const handleEvaluate = async (e) => {
        e.preventDefault();

        if (!questionPaper || !answerSheet) {
            alert("Please upload both the Question Paper and Answer Sheet.");
            return;
        }

        try {
            setIsLoading(true);

            // Merge PDFs
            const mergedPdfBlob = await mergePDFs(questionPaper, answerSheet);
            console.log("Merged PDF Size:", mergedPdfBlob.size); // e.g., ~22.47MB

            // Optimize the merged PDF
            const optimizedPdfBlob = await optimizePdf(mergedPdfBlob);
            console.log("Optimized PDF Size:", optimizedPdfBlob.size); // Aim for <=10MB

            // Check if optimized PDF is within Cloudinary's size limit
            if (optimizedPdfBlob.size > MAX_PDF_SIZE) {
                alert(`Optimized PDF is still too large (${(optimizedPdfBlob.size / (1024 * 1024)).toFixed(2)} MB). Please ensure the combined size is under 10 MB.`);
                return;
            }

            // Upload optimized PDF to Cloudinary
            const mergedPdfUrl = await uploadToCloudinary(optimizedPdfBlob);
            console.log("Merged PDF URL:", mergedPdfUrl);

            // Send URL to backend for evaluation
            const evaluationData = await sendToBackend(mergedPdfUrl);
            setReportCard(evaluationData);
        } catch (error) {
            console.error("Evaluation error:", error);
            alert(error.message);
        } finally {
            setIsLoading(false);
            // Reset file inputs
            if (questionPaperRef.current) {
                questionPaperRef.current.value = "";
            }
            if (answerSheetRef.current) {
                answerSheetRef.current.value = "";
            }
            setQuestionPaper(null);
            setAnswerSheet(null);
        }
    };

    // Updated parseExtractedInfo function
    const parseExtractedInfo = (extractedInfo) => {
        const questions = [];

        // Split into main question blocks
        const mainQuestionBlocks = extractedInfo.split(/\n\n(?=Question\s+\d+\s+\(Marks:)/);

        mainQuestionBlocks.forEach(block => {
            // Extract main question number and marks total
            const mainQMatch = block.match(/Question\s+(\d+)\s+\(Marks:\s*(\d+)\)::/i);
            const mainQNumber = mainQMatch ? parseInt(mainQMatch[1], 10) : null;
            const mainQMarksTotal = mainQMatch ? parseInt(mainQMatch[2], 10) : null;

            if (mainQNumber === null || mainQMarksTotal === null) {
                // Skip if question number or marks not found
                return;
            }

            // Initialize marksObtained to 0
            let marksObtained = 0;
            let suggestions = [];

            // Check if there is a sub-question mark allocation
            const markAllocMatch = block.match(/- Mark Allocation:\s*(.*)/i);
            let hasSubQuestions = false;
            if (markAllocMatch && markAllocMatch[1].toLowerCase().includes('sub-question')) {
                hasSubQuestions = true;
            }

            if (hasSubQuestions) {
                // Parse sub-questions
                const subQRegex = /Sub-question\s*\(\w+\).*?\n.*?Evaluation:\n- Score:\s*(\d+)\n- Suggestions:\s*(.*?)(?=\n\n|$)/gi;
                let subQMatch;
                while ((subQMatch = subQRegex.exec(block)) !== null) {
                    const subQScore = parseInt(subQMatch[1], 10);
                    const subQSugg = subQMatch[2].trim();
                    marksObtained += subQScore;
                    if (!subQSugg.toLowerCase().startsWith('none')) {
                        suggestions.push(subQSugg);
                    }
                }
            } else {
                // No sub-questions, parse main question's score and suggestions
                const scoreMatch = block.match(/- Score:\s*(\d+)/i);
                marksObtained = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

                const suggMatch = block.match(/- Suggestions:\s*(.*)/i);
                if (suggMatch) {
                    const sugg = suggMatch[1].trim();
                    if (!sugg.toLowerCase().startsWith('none')) {
                        suggestions.push(sugg);
                    }
                }
            }

            // Determine if the question was attempted
            let attempted = false;
            if (hasSubQuestions) {
                attempted = marksObtained > 0;
            } else {
                const studentAnswerMatch = block.match(/Student Answer:\n([\s\S]*?)\n\nEvaluation:/i);
                const studentAnswer = studentAnswerMatch ? studentAnswerMatch[1].trim() : '';
                attempted = studentAnswer !== "" && studentAnswer.toLowerCase() !== "none";
            }

            questions.push({
                questionNumber: mainQNumber,
                marksTotal: mainQMarksTotal,
                marksObtained: marksObtained,
                suggestions: suggestions.length > 0 ? suggestions.join('\n') : null,
                attempted: attempted
            });
        });

        console.log("Parsed Questions:", questions); // Debugging: Log parsed questions
        return questions;
    };

    // Parse extracted_info when reportCard is updated
    useEffect(() => {
        if (reportCard && reportCard.extracted_info) {
            const parsed = parseExtractedInfo(reportCard.extracted_info);
            setParsedQuestions(parsed);
        }
    }, [reportCard]);

    // Calculate totalMarks when parsedQuestions changes
    useEffect(() => {
        const sum = parsedQuestions.reduce((acc, q) => acc + q.marksObtained, 0);
        setTotalMarks(sum);
    }, [parsedQuestions]);

    // Function to handle PDF download
    const handleDownload = () => {
        const doc = new jsPDF();

        // Scoring Page
        doc.setFontSize(18);
        doc.text("Report Card - Scoring", 105, 20, null, null, 'center');

        doc.setFontSize(12);
        doc.text(`Name: ${userData.name || 'N/A'}`, 20, 30);
        doc.text(`Teacher ID: ${userData.teacherId || 'N/A'}`, 20, 36);
        doc.text(`Subject: ${userData.subject || 'N/A'}`, 20, 42);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 48);

        // Table Headers
        doc.text("Question No.", 20, 60);
        doc.text("Marks Obtained", 80, 60);
        doc.text("Marks Total", 140, 60);
        doc.text("Status", 180, 60);

        // Draw table rows
        let startY = 66;
        parsedQuestions.forEach((q) => {
            doc.text(q.questionNumber.toString(), 20, startY);
            doc.text(q.marksObtained.toString(), 80, startY);
            doc.text(q.marksTotal.toString(), 140, startY);
            doc.text(q.attempted ? "Attempted" : "Non-Attempted", 180, startY);
            startY += 6;
            if (startY > 280) {
                doc.addPage();
                startY = 20;
            }
        });

        // Overall Score
        doc.setFontSize(14);
        doc.text(`Overall Score: ${totalMarks}`, 20, startY + 10);

        // Add new page for Suggestions
        doc.addPage();

        // Suggestions Page
        doc.setFontSize(18);
        doc.text("Report Card - Suggestions", 105, 20, null, null, 'center');

        doc.setFontSize(12);
        doc.text(`Name: ${userData.name || 'N/A'}`, 20, 30);
        doc.text(`Teacher ID: ${userData.teacherId || 'N/A'}`, 20, 36);
        doc.text(`Subject: ${userData.subject || 'N/A'}`, 20, 42);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 48);

        // Suggestions Content
        let currentY = 60;
        parsedQuestions.forEach((q) => {
            if (q.suggestions) {
                doc.setFontSize(12);
                doc.text(`Question ${q.questionNumber}:`, 20, currentY);
                currentY += 6;
                const splitSuggestions = doc.splitTextToSize(q.suggestions, 170);
                splitSuggestions.forEach(line => {
                    doc.text(`- ${line}`, 25, currentY);
                    currentY += 6;
                });
                currentY += 4;
                // Add a new page if nearing the bottom
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }
            }
        });

        doc.save(`Report_Card_${userData.name || 'Teacher'}.pdf`);
    };

    return (
        <div className="evaluation-tool-container">
            <h1>Evaluation Tool</h1>
            <form className="evaluation-form" onSubmit={handleEvaluate}>
                {/* Upload Question Paper */}
                <label className="file-upload-label-eva">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleQuestionPaperUpload}
                        className="file-upload-input"
                        ref={questionPaperRef}
                        required
                        disabled={isLoading} // Disable during loading
                    />
                    <span>{questionPaper ? questionPaper.name : "Upload Question Paper (PDF)"}</span>
                </label>

                {/* Upload Answer Sheet */}
                <label className="file-upload-label-eva">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleAnswerSheetUpload}
                        className="file-upload-input"
                        ref={answerSheetRef}
                        required
                        disabled={isLoading} // Disable during loading
                    />
                    <span>{answerSheet ? answerSheet.name : "Upload Answer Sheet (PDF)"}</span>
                </label>

                {/* Evaluate Button */}
                <button type="submit" className="evaluate-btn" disabled={isLoading}>
                    {isLoading ? "Evaluating..." : "Evaluate"}
                </button>
            </form>

            {/* Loading Animation */}
            {isLoading && <LoadingEvaluation />}

            {/* Report Card Output */}
            {reportCard && (
                <div className="report-card">
                    {/* Hidden Report Pages for PDF Generation */}
                    <div style={{ display: 'none' }}>
                        {/* Scoring Page */}
                        <div ref={scoringRef} className="report-page">
                            <h2>Report Card - Scoring</h2>
                            <div className="user-details-eva">
                                <p><strong>Name:</strong> {userData.name || 'N/A'}</p>
                                <p><strong>Teacher ID:</strong> {userData.teacherId || 'N/A'}</p>
                                <p><strong>Subject:</strong> {userData.subject || 'N/A'}</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>

                            <table className="scoring-table">
                                <thead>
                                    <tr>
                                        <th>Question No.</th>
                                        <th>Marks Obtained</th>
                                        <th>Marks Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedQuestions.map((q) => (
                                        <tr key={q.questionNumber}>
                                            <td>{q.questionNumber}</td>
                                            <td>{q.marksObtained}</td>
                                            <td>{q.marksTotal}</td>
                                            <td>{q.attempted ? "Attempted" : "Non-Attempted"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="overall-score">
                                <h3>Overall Score: {totalMarks}</h3>
                            </div>
                        </div>

                        {/* Suggestions Page */}
                        <div ref={suggestionsRef} className="report-page">
                            <h2>Report Card - Suggestions</h2>
                            <div className="user-details-eva">
                                <p><strong>Name:</strong> {userData.name || 'N/A'}</p>
                                <p><strong>Teacher ID:</strong> {userData.teacherId || 'N/A'}</p>
                                <p><strong>Subject:</strong> {userData.subject || 'N/A'}</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>

                            <div className="suggestions-section">
                                {parsedQuestions.map((q) => (
                                    q.suggestions && (
                                        <div key={q.questionNumber} className="suggestion-item">
                                            <h4>Question {q.questionNumber}:</h4>
                                            <ReactMarkdown>
                                                {q.suggestions}
                                            </ReactMarkdown>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Visible Report Card */}
                    <div className="visible-report">
                        {/* Scoring Section */}
                        <div className="report-section">
                            <h2>Report Card - Scoring</h2>
                            <div className="user-details-eva">
                                <p><strong>Name:</strong> {userData.name || 'N/A'}</p>
                                <p><strong>Teacher ID:</strong> {userData.teacherId || 'N/A'}</p>
                                <p><strong>Subject:</strong> {userData.subject || 'N/A'}</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>

                            <table className="scoring-table">
                                <thead>
                                    <tr>
                                        <th>Question No.</th>
                                        <th>Marks Obtained</th>
                                        <th>Marks Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedQuestions.map((q) => (
                                        <tr key={q.questionNumber}>
                                            <td>{q.questionNumber}</td>
                                            <td>{q.marksObtained}</td>
                                            <td>{q.marksTotal}</td>
                                            <td>{q.attempted ? "Attempted" : "Non-Attempted"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="overall-score">
                                <h3>Overall Score: {totalMarks}</h3>
                            </div>
                        </div>

                        {/* Suggestions Section */}
                        <div className="report-section">
                            <h2>Report Card - Suggestions</h2>
                            <div className="user-details-eva">
                                <p><strong>Name:</strong> {userData.name || 'N/A'}</p>
                                <p><strong>Teacher ID:</strong> {userData.teacherId || 'N/A'}</p>
                                <p><strong>Subject:</strong> {userData.subject || 'N/A'}</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>

                            <div className="suggestions-section">
                                {parsedQuestions.map((q) => (
                                    q.suggestions && (
                                        <div key={q.questionNumber} className="suggestion-item">
                                            <h4>Question {q.questionNumber}:</h4>
                                            <ReactMarkdown>
                                                {q.suggestions}
                                            </ReactMarkdown>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Download Button */}
                    <button className="download-btn" onClick={handleDownload}>
                        Download Report Card (PDF)
                    </button>
                </div>
            )}
        </div>
    );
};

export default EvaluationTool;

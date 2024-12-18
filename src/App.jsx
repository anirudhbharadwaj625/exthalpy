import React, { useState } from "react";
import OpenAI from "openai";
import { jsPDF } from "jspdf"; // Import jsPDF library
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";

// Initialize OpenAI API with GPT-4 Vision
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Access environment variable
  dangerouslyAllowBrowser: true,
});

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle file upload
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type.startsWith("image/")) {
      setFile(uploadedFile);
      setError("");
    } else {
      setFile(null);
      setError("Please upload a valid image file.");
    }
  };

  // Analyze image function
  const analyzeImage = async () => {
    if (!file) {
      setError("Please upload an image before submitting.");
      return;
    }
  
    setError("");         // Clear previous errors
    setResponse("");      // Clear previous responses
    setLoading(true);     // Set loading to true immediately
  
    try {
      const reader = new FileReader();
  
      // Event handler for FileReader success
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1]; // Extract base64 content
  
        try {
          const result = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              {
                role: "system",
                content: `
                  Analyze the uploaded embryo image and provide a detailed explanation.
                  Format the response in Markdown as follows:
                  - Use headings (e.g., **## Key Structures**) for each main point.
                  - Use bullet points for sub-points.
                  - Ensure the response is concise, clear, and easy to read.
                `,
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Here is the embryo image I uploaded." },
                  {
                    type: "image_url",
                    image_url: { url: `data:image/png;base64,${base64Image}` },
                  },
                ],
              },
            ],
            temperature: 0.7,
          });
  
          // Update the response
          setResponse(result.choices[0]?.message?.content || "No response received.");
        } catch (apiError) {
          console.error("Error analyzing image:", apiError);
          setError("Failed to analyze image. Please try again.");
        } finally {
          setLoading(false); // Stop loading
        }
      };
  
      reader.readAsDataURL(file); // Start reading the file
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Something went wrong. Please try again later.");
      setLoading(false); // Stop loading in case of failure
    }
  };
  

  // Handle PDF download
  const downloadPDF = () => {
    const content = document.getElementById("pdf-content");
  
    html2canvas(content, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png"); // Convert content to image
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
  
      // Add content as an image, ensuring it fits within the PDF
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  
      if (imgHeight > pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);
      }
  
      // Add uploaded image on the next page if available
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const userImage = reader.result; // User-uploaded image data
          pdf.addPage();
          pdf.text("Uploaded Image", 20, 20);
          pdf.addImage(userImage, "PNG", 20, 30, 100, 100); // Adjust size to fit page
          pdf.save("embryo_analysis_report.pdf");
        };
        reader.readAsDataURL(file);
      } else {
        pdf.save("embryo_analysis_report.pdf");
      }
    });
  };
  
    

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Embryo Analysis Chatbot
        </h1>

        {/* File Upload */}
        <label className="block mb-4">
          <span className="block font-medium text-gray-700 mb-2">Upload Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-600
            hover:file:bg-blue-100"
          />
        </label>

        {/* Image Preview */}
        {file && (
          <div className="mb-4 flex justify-center">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="max-w-xs rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Error Message */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Analyze Button */}
        <button
          onClick={analyzeImage}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition duration-300"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>

        {/* Loading Message */}
        {loading && (
  <div className="mt-4 text-center">
    <p className="text-blue-600 font-medium text-lg animate-pulse">
      Analyzing Image, Please Wait...
    </p>
    <div className="flex justify-center mt-2">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
    </div>
  </div>
)}

{response && !loading && (
  <div id="pdf-content" className="mt-6 p-4 border rounded-lg bg-gray-100">
    <h2 className="font-semibold mb-2 text-xl text-gray-800">
      Analysis Result:
    </h2>
    {file && (
      <div className="flex justify-center mb-4">
        <img
          src={URL.createObjectURL(file)}
          alt="Uploaded Preview"
          className="max-w-xs rounded-lg shadow-md"
        />
      </div>
    )}
    <div className="prose prose-sm md:prose-lg max-w-none text-gray-700">
      <ReactMarkdown>{response}</ReactMarkdown>
    </div>

    {/* Download PDF Button */}
    <button
      onClick={downloadPDF}
      className="mt-4 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300"
    >
      Download as PDF
    </button>
  </div>
)}


      </div>
    </div>
  );
}

export default App;

import React, { useState, useCallback } from "react";
import OpenAI from "openai";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";
import { useDropzone } from "react-dropzone"; // Import useDropzone

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // Drag-and-Drop handler
  const onDrop = useCallback((acceptedFiles) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile && uploadedFile.type.startsWith("image/")) {
      setFile(uploadedFile);
      setError("");
    } else {
      setFile(null);
      setError("Please upload a valid image file.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: false,
  });

  // Handle file input change
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
  
    setLoading(true);
    setError("");
    setResponse("");
  
    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const result = reader.result.split(",")[1];
            resolve(result);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file."));
        };
        reader.readAsDataURL(file);
      });
  
      const result = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: `
              Analyze the uploaded embryo image and provide a detailed explanation.
              ### Format the response in Markdown as follows:
              - Use headings (e.g., **## Key Structures**) for each main point.
              - Use bullet points for sub-points.
              - Ensure the response is concise, clear, and easy to read.
              
              ### Key Points to Cover:
              1. **Key Structures**  
                 - Identify key embryo structures such as zona pellucida, inner cell mass (ICM), and trophectoderm (TE).
              2. **Developmental Stage**  
                 - Assess the developmental stage (cleavage, morula, blastocyst) with visual and structural evidence.
              3. **Embryo Grading**  
                 - Provide a qualitative grading (e.g., high, medium, low) based on visible characteristics:
                   - Cell uniformity
                   - Fragmentation level
                   - Presence of abnormalities
                 - Clearly justify the grading.
              4. **Observations of Abnormalities**  
                 - Highlight any irregularities, such as fragmentation, asymmetrical cell division, or irregular shape.
              5. **Success Probability Estimate**  
                 - Based on the embryo grade and visible traits, provide an **estimated probability of implantation success**.
                 - Use general ranges, such as:
                   - **High chance:** >70%
                   - **Moderate chance:** 40-70%
                   - **Low chance:** <40%
                 - Include a note that the estimate is for **informational purposes only** and not a substitute for clinical judgment.
              6. **Conclusion**  
                 - Summarize the overall quality of the embryo and its potential for successful implantation.
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
      });
  
      setResponse(result.choices[0]?.message?.content || "No response received.");
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  

  // Download PDF Function
  const downloadPDF = () => {
    const content = document.getElementById("pdf-content");
  
    html2canvas(content, { scale: 1.5 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
  
      // Scale image proportionally to fit PDF
      const imgWidth = pdfWidth - 20; // Leave margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      let positionY = 10; // Start position for content
  
      if (imgHeight > pdfHeight - 20) {
        // If content exceeds a page, scale it further to fit one page
        pdf.addImage(imgData, "PNG", 10, positionY, imgWidth, pdfHeight - 20);
      } else {
        pdf.addImage(imgData, "PNG", 10, positionY, imgWidth, imgHeight);
      }
  
      pdf.save("embryo_analysis_report.pdf");
    });
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Embryo Analysis Chatbot
        </h1>

        {/* Drag and Drop Area */}
        <div
          {...getRootProps()}
          className="border-2 border-dashed border-blue-500 rounded-lg p-8 text-center cursor-pointer hover:bg-blue-50"
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-blue-500 font-medium">Drop the image here...</p>
          ) : (
            <p className="text-gray-600">Drag & drop an image here, or click to select a file</p>
          )}
        </div>

        {/* File Upload */}
        <div className="mt-4 text-center">
          <span className="block text-gray-600 mb-2">Or upload via file input:</span>
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
        </div>

        {/* Image Preview */}
        {file && (
          <div className="mt-4 flex justify-center">
            <img
              src={URL.createObjectURL(file)}
              alt="Uploaded Preview"
              className="max-w-xs rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Error Message */}
        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Analyze Button */}
        <button
          onClick={analyzeImage}
          className="w-full mt-4 bg-slate-700 text-white py-3 rounded-lg font-semibold shadow-md hover:bg-slate-600 transition duration-300"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
        
        {/* Loading State */}
        {loading && (
          <div className="mt-4 text-center">
            <p className="text-blue-600font-medium animate-pulse">Analyzing Image, Please Wait...</p>
            <div className="flex justify-center mt-4">
              

                <video 
                  src = "/embryo.mp4"
                  autoPlay
                  loop
                  muted
                  className = "h-40 w-40 rounded-lg shadow-lg"
                  />
            </div>
          </div>
        )}

        {/* Response */}
        {response && (
          <div id="pdf-content" className="mt-6 p-4 border rounded-lg bg-gray-100">
            <h2 className="font-semibold mb-2 text-xl text-gray-800">Analysis Result:</h2>
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

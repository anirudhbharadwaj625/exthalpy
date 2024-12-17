import React, { useState } from "react";
import OpenAI from "openai";

// Initialize OpenAI API with GPT-4 Vision
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Access environment variable
  dangerouslyAllowBrowser: true,
});


function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");

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
  
    setError("");
    setResponse("Analyzing your embryo image...");
  
    try {
      // Convert file to base64 using FileReader
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(",")[1]; // Extract base64 data
  
        console.log("Base64 Image Data:", base64Image); // Debugging log
  
        // Call OpenAI API with the updated model
        console.log("Sending API Request...");
        const result = await openai.chat.completions.create({
          model: "gpt-4-turbo", // Updated model
          messages: [
            {
//               role: "system",
// content: `
//   Analyze the uploaded embryo image and provide a detailed explanation.
//   The response should include:
//   - Identification of key structures: zona pellucida, inner cell mass (ICM), and trophectoderm (TE).
//   - The developmental stage (cleavage, morula, blastocyst) with visual and structural evidence.
//   - General embryo grading based on visible traits or qualitative description (e.g., high, medium, low quality).
//   - Observations of abnormalities, such as fragmentation or irregular cell division.
//   - A general overview of success probabilities based on implantation factors, explicitly noting that this is for informational purposes only.
  
//   **Format the output clearly and point-wise:**
//   - Each key point must appear on a new line.
//   - Use bullet points or numbering for clarity.
  
//   - Keep the response concise, informative, and easy to read.
// `,
role: "system",
content: `
Analyze the uploaded embryo image and provide a detailed explanation.
The response should include:
- **Identification of key structures**: zona pellucida, inner cell mass (ICM), and trophectoderm (TE).
- **The developmental stage** (cleavage, morula, blastocyst) with visual and structural evidence.
- **General embryo grading** based on visible traits or qualitative description (e.g., high, medium, low quality).
- **Observations of abnormalities**, such as fragmentation or irregular cell division.
- **Success probabilities** based on implantation factors.

**Format the response in Markdown as follows:**
- Use headings (e.g., **## Key Structures**) for each main point.
- Use bullet points for sub-points.
- Ensure the response is concise, clear, and easy to read.
`,


            },
            {
              role: "user",
              content: [
                { type: "text", text: "Here is the embryo image I uploaded." },
                { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } },
              ],
            },
          ],
          temperature: 0.7,
        });
        
  
        // Log the API response and display it
        console.log("API Response:", result);
        setResponse(result.choices[0]?.message?.content || "No response received.");
      };
  
      // Start reading file as base64
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error analyzing image:", err);
      setError("Something went wrong. Please try again later.");
    }
  };
  

  return (
    
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
  <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl">
    <h1 className="text-2xl font-bold mb-4 text-center">Embryo Analysis Chatbot</h1>

    {/* File Upload */}
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="mb-4 w-full border p-2 rounded"
    />

    {/* Error */}
    {error && <p className="text-red-500 mb-4">{error}</p>}

    {/* Analyze Button */}
    <button
      onClick={analyzeImage}
      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
    >
      Analyze Image
    </button>

    {/* Response */}
    {/* Response */}
{/* Response */}
{response && (
  <div className="mt-6 p-4 border rounded bg-gray-50">
    <h2 className="font-semibold mb-4 text-lg">Analysis Result:</h2>
    <ul className="list-disc list-inside space-y-2">
      {response.split("\n").map((line, index) => {
        if (line.trim() === "") return null; // Skip empty lines
        return <li key={index} className="text-gray-700">{line}</li>;
      })}
    </ul>
  </div>
)}


  </div>
</div>

  );
}

export default App;

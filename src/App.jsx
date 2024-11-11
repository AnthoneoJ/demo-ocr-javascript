import { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";
import "./App.css";

function App() {
  const [ocrText, setOcrText] = useState("");
  const [isOcrActive, setIsOcrActive] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ocrDelay, setOcrDelay] = useState(1000); // Default delay in ms
  const webcamRef = useRef(null);
  const tesseractWorkerRef = useRef(null);

  // Initialize Tesseract worker on mount
  useEffect(() => {
    const initTesseractWorker = async () => {
      tesseractWorkerRef.current = await createWorker();
      await tesseractWorkerRef.current.loadLanguage("eng");
      await tesseractWorkerRef.current.initialize("eng");
    };
    initTesseractWorker();

    // Clean up worker on unmount
    return () => {
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate();
      }
    };
  }, []);

  // Toggle OCR on button click
  const toggleOcr = () => {
    setIsOcrActive((prev) => !prev);
  };

  // Toggle horizontal flip
  const toggleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  // Recursive OCR function
  useEffect(() => {
    let ocrTimeout;

    const performOcr = async () => {
      if (webcamRef.current && tesseractWorkerRef.current && isOcrActive) {
        setOcrText("Processing..."); // Show "Processing..." if OCR is active

        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          try {
            const result = await tesseractWorkerRef.current.recognize(imageSrc);
            // Check if OCR is still active before updating the text
            if (isOcrActive) {
              setOcrText(result.data.text);
            }
          } catch (error) {
            console.error("OCR Error:", error);
            if (isOcrActive) {
              setOcrText("Error performing OCR.");
            }
          }
        }
      }

      // Schedule the next OCR operation after ocrDelay ms, if OCR is still active
      if (isOcrActive) {
        ocrTimeout = setTimeout(performOcr, ocrDelay);
      }
    };

    // Start the OCR loop if OCR is active
    if (isOcrActive) {
      performOcr();
    }

    // Clear the timeout when OCR is stopped or component is unmounted
    return () => clearTimeout(ocrTimeout);
  }, [isOcrActive, ocrDelay]); // Depend on ocrDelay to update interval dynamically

  // Handle delay input change
  const handleDelayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setOcrDelay(isNaN(value) ? 1000 : value); // Default to 1000ms if input is invalid
  };

  return (
    <div className="App">
      <h1>Live OCR with Webcam</h1>
      <div className="container">
        {/* Webcam Viewer on the Left */}
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={320}
          height={240}
          mirrored={isFlipped}
          className={`webcam ${isFlipped ? "flipped" : ""}`}
        />

        {/* Controls and OCR Output on the Right */}
        <div className="controls">
          <button onClick={toggleOcr}>
            {isOcrActive ? "Pause OCR" : "Start OCR"}
          </button>
          <button onClick={toggleFlip}>
            {isFlipped ? "Unflip Camera" : "Flip Camera"}
          </button>

          {/* OCR Delay Input */}
          <div className="ocr-delay">
            <label>
              OCR Delay (ms):
              <input
                type="number"
                value={ocrDelay}
                onChange={handleDelayChange}
                min="100" // Minimum delay of 100ms to avoid excessive requests
              />
            </label>
          </div>

          {/* OCR Output */}
          <div className="ocr-output">
            <h2>OCR Output:</h2>
            <p>{ocrText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

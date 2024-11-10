import { useState, useEffect, useRef } from 'react'
import Webcam from 'react-webcam'
import { pipeline } from '@huggingface/transformers'
import './App.css'

function App() {
  const [ocrText, setOcrText] = useState('')
  const [isOcrActive, setIsOcrActive] = useState(false)
  const [ocrInterval, setOcrInterval] = useState(null)
  const webcamRef = useRef(null)
  const ocrPipelineRef = useRef(null)

  // Initialize OCR pipeline on mount
  useEffect(() => {
    const initOcr = async () => {
      ocrPipelineRef.current = await pipeline('image-to-text', 'Xenova/trocr-base-handwritten')
    }
    initOcr()
  }, [])

  // Toggle OCR on button click
  const toggleOcr = () => {
    setIsOcrActive((prev) => !prev)
  }

  // Capture and perform OCR at intervals
  useEffect(() => {
    if (isOcrActive) {
      const interval = setInterval(async () => {
        if (webcamRef.current && ocrPipelineRef.current) {
          // Capture image from webcam
          const imageSrc = webcamRef.current.getScreenshot()
          if (imageSrc) {
            try {
              // Perform OCR
              const result = await ocrPipelineRef.current(imageSrc)
              setOcrText(result[0].generated_text)
            } catch (error) {
              console.error("OCR Error:", error)
              setOcrText("Error performing OCR.")
            }
          }
        }
      }, 250) // Capture every 0.25 seconds
      setOcrInterval(interval)

      // Clear interval when OCR is deactivated
      return () => clearInterval(interval)
    } else {
      if (ocrInterval) {
        clearInterval(ocrInterval)
        setOcrInterval(null)
      }
    }
  }, [isOcrActive])

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
          mirrored
          className="webcam"
        />

        {/* Controls and OCR Output on the Right */}
        <div className="controls">
          <button onClick={toggleOcr}>
            {isOcrActive ? 'Pause OCR' : 'Start OCR'}
          </button>
          <div className="ocr-output">
            <h2>OCR Output:</h2>
            <p>{ocrText}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

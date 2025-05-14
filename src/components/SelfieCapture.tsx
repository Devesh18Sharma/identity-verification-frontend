// src/components/SelfieCapture.tsx
import { useRef, useCallback, useState, useEffect } from 'react'; // Removed unused 'React' import
import { useCamera } from '../hooks/useCamera';
import './SelfieCapture.css';

interface SelfieCaptureProps {
  onSubmit: (selfieBlob: Blob) => void;
}

function SelfieCapture({ onSubmit }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Pass the ref correctly to the hook
  const { startCamera, stopCamera, error: cameraError, isCameraActive } = useCamera({ videoRef });
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  // Attempt to start camera automatically when component mounts
  useEffect(() => {
    console.log("SelfieCapture mounted, attempting to start camera.");
    // Delay slightly to ensure elements are rendered? Sometimes helps.
    const timer = setTimeout(() => {
        startCamera();
    }, 100); // 100ms delay

    // Cleanup function ensures camera stops if component unmounts before capture
    return () => {
        clearTimeout(timer);
        console.log("SelfieCapture unmounting, stopping camera.");
        stopCamera();
    }
  }, [startCamera, stopCamera]); // Depend on start/stop camera functions


  const capture = useCallback(() => {
    setCaptureError(null); // Clear previous capture errors
    if (videoRef.current && canvasRef.current && isCameraActive) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Match canvas size to video stream size for best quality
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);


      const context = canvas.getContext('2d', { alpha: false }); // Improve performance if transparency not needed
      if (context) {
        // Optional: Mirror the captured image to match the preview
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        // Draw the current video frame onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Reset transform to avoid issues if context is reused
        context.setTransform(1, 0, 0, 1, 0, 0);

        // Convert canvas to Blob
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    console.log(`Captured selfie blob. Size: ${(blob.size / 1024).toFixed(2)} KB, Type: ${blob.type}`);
                    if (blob.size === 0) {
                        setCaptureError("Captured image is empty. Please try again.");
                        setIsCapturing(false);
                        return;
                    }
                    onSubmit(blob); // Pass the blob up
                    // No need to call stopCamera here, useEffect cleanup will handle it or parent component change will unmount
                } else {
                    setCaptureError("Failed to create image blob from canvas. Please try again.");
                }
                setIsCapturing(false);
            },
            'image/jpeg', // Preferred format for photos
            0.90 // Quality setting (0.0 to 1.0)
        );
      } else {
        setCaptureError("Could not get canvas 2D context.");
        setIsCapturing(false);
      }
    } else {
      if (!isCameraActive) setCaptureError("Camera is not active. Please start the camera first.");
      else setCaptureError("Camera not ready or elements missing.");
      setIsCapturing(false);
    }
  }, [videoRef, canvasRef, isCameraActive, onSubmit]); // Dependencies for useCallback


  const handleRetryCamera = () => {
      setCaptureError(null); // Clear capture error
      // Camera hook handles its own errors, retry starting it
      startCamera();
  }

  return (
    <div className="component-section selfie-capture-container">
      <h2>2. Capture Selfie</h2>
      <p className="instructions">Center your face in the frame. Ensure good lighting and remove glasses/hats.</p>

      {/* Display camera errors prominently */}
      {cameraError && (
          <div className="error-message camera-error">
            <p>{cameraError}</p>
            {/* Optionally add a retry button if appropriate */}
            {/* <button onClick={handleRetryCamera}>Retry Camera</button> */}
          </div>
      )}
       {/* Display capture errors */}
      {captureError && <p className="error-message">{captureError}</p>}


      <div className="camera-area">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted // Important for preventing audio feedback
          className={`camera-feed ${isCameraActive ? 'active' : ''}`}
          // Add aria-hidden if decorative or provide label if interactive
        ></video>
        {/* Canvas is hidden but used for capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {/* Show placeholder/instructions when camera isn't active */}
        {!isCameraActive && !cameraError && (
          <div className="camera-placeholder">
            <p>Loading Camera...</p>
            {/* You could add a spinner here */}
          </div>
        )}
         {/* Overlay example (optional) */}
         {isCameraActive && <div className="camera-overlay"></div>}
      </div>


      <div className="controls">
        {/* Show capture button only if camera is active and no errors occurred */}
        {isCameraActive && !cameraError && (
          <button onClick={capture} disabled={isCapturing || !!captureError}>
            {isCapturing ? 'Capturing...' : 'Take Photo'}
          </button>
        )}

        {/* Always show cancel/stop button if camera was ever active or attempted */}
         {(isCameraActive || cameraError) && (
             <button onClick={stopCamera} disabled={isCapturing} className="cancel-button">
                 {isCameraActive ? "Stop Camera" : "Close"}
             </button>
         )}

        {/* If there was a camera error, maybe show a specific retry button */}
         {cameraError && !isCameraActive && (
             <button onClick={handleRetryCamera}>Retry Camera</button>
         )}
      </div>

    </div>
  );
}

export default SelfieCapture;
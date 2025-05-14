// src/hooks/useCamera.ts
import { useState, useCallback, useEffect } from 'react'; // Removed unused 'useRef'

interface CameraOptions {
  // Allow the ref to be null initially, matching how useRef is typically used
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export function useCamera({ videoRef }: CameraOptions) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const startCamera = useCallback(async () => {
    setError(null);
    if (stream || !videoRef.current) { // Prevent starting if already active or ref not ready
        console.log("Camera already active or video ref not available.");
        return;
    }

    try {
      console.log("Requesting camera stream...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      console.log("Camera stream obtained.");
      setStream(mediaStream);
      if (videoRef.current) { // Check ref again inside async function
        videoRef.current.srcObject = mediaStream;
        // Try playing the video. User interaction might be needed on some browsers.
        await videoRef.current.play().catch(playErr => {
            console.warn("Video play() failed:", playErr);
            setError("Could not automatically play video. User interaction might be required.");
        });
      }
      setIsCameraActive(true);
    } catch (err) { // Catch block with better typing
      console.error("Error accessing camera:", err);
      let message = "Could not access camera.";
      // Check specific error types
      if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              message = "Camera permission denied. Please grant permission in your browser settings and refresh the page.";
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              message = "No camera found on this device.";
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
              message = "Camera might be already in use by another application.";
          }
      } else if (err instanceof Error) {
          message = `An unexpected error occurred: ${err.message}`;
      }
      setError(message);
      setIsCameraActive(false);
       // Clean up stream if acquired but failed later
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  }, [videoRef, stream]); // Dependency array

  const stopCamera = useCallback(() => {
    if (stream) {
      console.log("Stopping camera stream.");
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Clear the video source
        videoRef.current.load(); // Reset video element state
      }
      setIsCameraActive(false);
    }
  }, [stream, videoRef]);

  // Cleanup camera on hook unmount
  useEffect(() => {
    // This is the cleanup function that runs when the component unmounts
    return () => {
      console.log("Cleaning up camera hook.");
      stopCamera();
    };
  }, [stopCamera]); // Ensure cleanup runs if stopCamera changes

  return { stream, startCamera, stopCamera, error, isCameraActive };
}
import cv from "@techstark/opencv-js"
import { InferenceSession, Tensor } from "onnxruntime-web"
import React, { useRef, useState } from "react"
import Loader from "./components/loader"
import "./style/App.css"
import { detectImage, startCam } from "./utils/detect"
import { download } from "./utils/download"

const App = () => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState({
    text: "Loading OpenCV.js",
    progress: null,
  })
  const [image, setImage] = useState(null)
  const inputImage = useRef(null)
  const imageRef = useRef(null)
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const [processing, setProcessing] = useState(false)

  // Configs
  const modelName = "drumhead_300ep_last.onnx"
  const modelInputShape = [1, 3, 1024, 1024]
  const topk = 100
  const iouThreshold = 0.45
  const scoreThreshold = 0.25

  // wait until opencv.js initialized
  cv["onRuntimeInitialized"] = async () => {
    const baseModelURL = `${process.env.PUBLIC_URL}/model`

    // create session
    const arrBufNet = await download(
      `${baseModelURL}/${modelName}`, // url
      ["Loading YOLOv8 model", setLoading] // logger
    )
    const yolov8 = await InferenceSession.create(arrBufNet)
    const arrBufNMS = await download(
      `${baseModelURL}/nms-yolov8.onnx`, // url
      ["Loading NMS model", setLoading] // logger
    )
    const nms = await InferenceSession.create(arrBufNMS)

    // warmup main model
    setLoading({ text: "Warming up model...", progress: null })
    const tensor = new Tensor(
      "float32",
      new Float32Array(modelInputShape.reduce((a, b) => a * b)),
      modelInputShape
    )
    await yolov8.run({ images: tensor })

    setSession({ net: yolov8, nms: nms })
    setLoading(null)
  }

  return (
    <div className="App">
      {loading && (
        <Loader>
          {loading.progress
            ? `${loading.text} - ${loading.progress}%`
            : loading.text}
        </Loader>
      )}

      <div className="header">
        <h1>Cable drum head YOLOv8 detect</h1>
        <p>Detect cable drum head (side) from image.</p>
        <p>Authors: Seb Petrik, Brano and Rado Zaborsky</p>

        <p>
          <code className="code">{modelName}</code>
        </p>
      </div>

      <div className="content">
        <img
          ref={imageRef}
          src="#"
          alt=""
          style={{ display: image ? "block" : "none" }}
          onLoad={() => {
            console.log("Detecting")
            setProcessing(true)
            ;(async () => {
              const out = await detectImage(
                imageRef.current,
                canvasRef.current,
                session,
                topk,
                iouThreshold,
                scoreThreshold,
                modelInputShape
              )
              setProcessing(false)
              console.log("Done")
              console.log(out)
            })()
          }}
        />
        <canvas
          id="canvas"
          width={modelInputShape[2]}
          height={modelInputShape[3]}
          ref={canvasRef}
        />
      </div>

      <input
        type="file"
        ref={inputImage}
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          setProcessing(true)

          // handle next image to detect
          if (image) {
            URL.revokeObjectURL(image)
            setImage(null)
          }

          const url = URL.createObjectURL(e.target.files[0]) // create image url
          imageRef.current.src = url // set image source
          setImage(url)
        }}
      />

      <p>
        {processing && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="absspinner">
              <span style={{ fontSize: "2rem" }}>🥵</span>
            </div>
            <b>Processing ...</b>
          </div>
        )}
      </p>

      <div
        className="btn-container"
        style={{ display: "flex", alignItems: "start" }}
      >
        <button
          onClick={() => {
            inputImage.current.click()
          }}
        >
          Open local image
        </button>
        {image && (
          /* show close btn when there is image */
          <button
            onClick={() => {
              inputImage.current.value = ""
              imageRef.current.src = "#"
              URL.revokeObjectURL(image)
              setImage(null)
            }}
          >
            Close image
          </button>
        )}
        <button
          onClick={() => {
            startCam()
          }}
        >
          Start camera
        </button>
        <button
          onClick={async () => {
            setProcessing(true)

            let source = new cv.Mat(
              videoRef.current.height,
              videoRef.current.width,
              cv.CV_8UC4
            )
            let cap = new cv.VideoCapture(videoRef.current)
            cap.read(source)

            console.log(`Source shape: ${source.cols}, ${source.rows}`)

            const canv = document.createElement("canvas")
            cv.imshow(canv, source)

            const dataURL = canv.toDataURL()

            imageRef.current.src = dataURL
            setImage(dataURL)
          }}
        >
          Capture
        </button>
      </div>

      <div>
        <video
          ref={videoRef}
          id="videoInput"
          style={{ maxWidth: 200, maxHeight: 200 }}
        ></video>
      </div>

      <div>
        <p>
          Note: on mobile, you might not see preview video, instead: always
          first click "Start Camera" and then click "Capture" !!!
        </p>
      </div>
    </div>
  )
}

export default App

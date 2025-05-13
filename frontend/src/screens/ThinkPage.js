import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();
  const totalLevels = 5;
  const [randomAnimal, setRandomAnimal] = useState("🦁");
  const [randomCount, setRandomCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [result, setResult] = useState("");
  const [level, setLevel] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const lastValidFingerCountRef = useRef(null);
  const [randomExpression, setRandomExpression] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(0);


  const generateChallenge = () => {
    const operators = ["+", "-"];
    const operator = operators[Math.floor(Math.random() * operators.length)];

    const num1 = Math.floor(Math.random() * 10) + 1; // 1–10
    const num2 = Math.floor(Math.random() * 10) + 1; // 1–10

    const expression = `${num1} ${operator} ${num2}`;

    let result;
    switch (operator) {
      case "+":
        result = num1 + num2;
        break;
      case "-":
        result = num1 - num2;
        break;
    }

    // Хариу 1–10 хооронд байгаа эсэхийг шалгана.
    if (result < 1 || result > 10) {
      return generateChallenge(); // Хэрвээ буруу бол өөр илэрхийлэл үүсгэнэ
    }

    setRandomExpression(expression);
    setCorrectAnswer(result);
    setUserAnswer("");
    setResult("");
    setCanRetry(false);
    lastValidFingerCountRef.current = null;
  };



  const videoRef = useRef(null);
  const ws = useRef(null);
  const [fingerCount, setFingerCount] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("🎥 Камер асаахад алдаа:", err);
      }
    };

    startCamera();

    ws.current = new WebSocket("ws://localhost:8765");

    ws.current.onopen = () => {
      console.log("✅ WebSocket холбогдлоо");
    };

    ws.current.onerror = (err) => {
      console.error("❌ WebSocket алдаа:", err);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.fingers !== undefined) {
        setFingerCount(data.fingers);
        if (data.fingers !== 0) {
          lastValidFingerCountRef.current = data.fingers;
        }
      }
    };

    const interval = setInterval(() => {
      if (
        videoRef.current &&
        ws.current &&
        ws.current.readyState === WebSocket.OPEN
      ) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL("image/jpeg");
        ws.current.send(JSON.stringify({ image }));
      }
    }, 300);

    return () => {
      clearInterval(interval);
      if (ws.current) ws.current.close();
    };
  }, []);

  // Хуруу 0 болсон үед автоматаар шалгах
  useEffect(() => {
    if (
      fingerCount === 0 &&
      lastValidFingerCountRef.current !== null &&
      !gameWon
    ) {
      handleCheckWithValue(lastValidFingerCountRef.current);
    }
  }, [fingerCount]);

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleCheck = () => {
    const value = userAnswer !== "" ? userAnswer : (fingerCount > 0 ? fingerCount : lastValidFingerCountRef.current);
    handleCheckWithValue(value);
  };

  const handleCheckWithValue = (value) => {
    const answerToCheck = parseFloat(value);
    if (answerToCheck === correctAnswer) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setResult("🎉 Зөв байна!");
      if (nextLevel === totalLevels) {
        setGameWon(true);
      } else {
        setTimeout(() => {
          generateChallenge();
        }, 1000);
      }
    } else {
      setResult("😅 Буруу байна. Дахин оролдоорой!");
      setCanRetry(true);
    }
  };


  const progressWidth = `${(level / totalLevels) * 100}%`;

  useEffect(() => {
    if (gameWon) {
      const timeout = setTimeout(() => {
        navigate('/page4');
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [gameWon, navigate]);

  return (
    <>
      <style>
        {`
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
      }
    `}
      </style>

      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "80%",
        margin: "0 auto",
        gap: "20px",
        padding: "20px",
        borderRadius: "15px",
      }}>
        <div
          style={{
            background: "#f3d4f8",
            height: "50px",
            width: "80%",
            margin: "20px auto",
            borderRadius: "20px",
            overflow: "hidden",
            flex: 9,
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div
            style={{
              background: "#d48df8",
              height: "100%",
              width: progressWidth,
              transition: "width 0.3s",
            }}
          />
        </div>
        <div style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px",
        }} >
          <button
            onClick={() => navigate('/page1/pause')}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#eee',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'flex', gap: '3px' }}>
              <div style={{ width: '4px', height: '16px', backgroundColor: '#333' }} />
              <div style={{ width: '4px', height: '16px', backgroundColor: '#333' }} />
            </span>
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "80%",
          margin: "0 auto",
          gap: "20px",
          backgroundColor: "#f9f1ff",
          padding: "20px",
          borderRadius: "15px",
        }}
      >
        <div
          style={{
            flex: 7,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "200px",
            fontWeight: "bold",
            color: "#9C27B0",
            textShadow: "2px 2px 5px rgba(0, 0, 0, 0.3)",
            animation: "pulse 1s infinite",
          }}
        >
          {randomExpression}
        </div>


        <div style={{ flex: 3, textAlign: "center" }}>
          <video
            ref={videoRef}
            autoPlay
            width="640"
            height="480"
            style={{ transform: "scaleX(-1)" }}
          />

          <h3 style={{ marginTop: "20px", fontSize: "24px" }}>
            Танигдсан хурууны тоо:{" "}
            <span style={{ color: "blue" }}>
              {fingerCount !== null
                ? fingerCount
                : lastValidFingerCountRef.current !== null
                  ? lastValidFingerCountRef.current
                  : "..."}
            </span>
          </h3>

          <input
            type="number"
            placeholder="Хэдэн амьтан байна?"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "18px",
              borderRadius: "10px",
              border: "1px solid #ccc",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={handleCheck}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              fontSize: "18px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#eecbff",
              cursor: "pointer",
              width: "100%",
            }}
            disabled={gameWon}
          >
            Шалгах
          </button>
          <div style={{ marginTop: "10px", fontSize: "20px", color: result.includes("Зөв") ? "green" : "red" }}>
            {result}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

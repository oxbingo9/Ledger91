"use client";
import { useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// Firebase 초기화
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey= "AIzaSyBi82idZAraoDMEMVBhVv66tURB0lSI0UM",
  authDomain= "ledger91-e95ea.firebaseapp.com",
  databaseURL= "https://ledger91-e95ea-default-rtdb.firebaseio.com",
  projectId= "ledger91-e95ea",
  storageBucket= "ledger91-e95ea.firebasestorage.app",
  messagingSenderId= "747494068723",
  appId="1:747494068723:web:67fe836743fb16f89f8286",
  measurementId= "G-LWQ95J4B1B"
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function Home() {
  const [year, setYear] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!year.trim()) { setError("년도를 입력해주세요."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const q = query(collection(db, "insa"), where("YEAR", "==", Number(year)));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError(`${year}년도 데이터가 없습니다.`);
      } else {
        setResult(snapshot.docs[0].data());
      }
    } catch (err) {
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <div className="card">
        <div className="header">
          <div className="badge">인사 조회 시스템</div>
          <h1 className="title">
            <span className="title-kr">의장</span>
            <span className="title-en">FINDER</span>
          </h1>
          <p className="subtitle">기준 년도를 입력하면 해당 년도의 의장을 조회합니다</p>
        </div>

        <div className="input-section">
          <div className="input-wrapper">
            <span className="input-icon">📅</span>
            <input
              type="number"
              placeholder="년도 입력 (예: 2023)"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="input"
            />
          </div>
          <button onClick={handleSearch} disabled={loading} className={`button ${loading ? "button-loading" : ""}`}>
            {loading ? <span className="spinner" /> : "조회하기"}
          </button>
        </div>

        {result && (
          <div className="result-box">
            <div className="result-year">{result.YEAR}년도</div>
            <div className="result-label">의장</div>
            <div className="result-name">{result.CHAIRMAN}</div>
          </div>
        )}

        {error && <div className="error-box">⚠️ {error}</div>}
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .container {
          min-height: 100vh;
          background: #0a0a0f;
          background-image: radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 20%, rgba(236,72,153,0.08) 0%, transparent 50%);
          display: flex; align-items: center; justify-content: center; padding: 24px;
          font-family: 'Noto Serif KR', serif;
        }
        .card {
          width: 100%; max-width: 480px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px; padding: 48px 40px; backdrop-filter: blur(20px);
          box-shadow: 0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1);
        }
        .header { text-align: center; margin-bottom: 40px; }
        .badge {
          display: inline-block; background: rgba(99,102,241,0.15);
          border: 1px solid rgba(99,102,241,0.3); color: #818cf8;
          font-size: 11px; letter-spacing: 3px; padding: 6px 16px;
          border-radius: 100px; margin-bottom: 20px;
        }
        .title { line-height: 1; margin-bottom: 12px; }
        .title-kr { display: block; font-size: 18px; color: rgba(255,255,255,0.5); letter-spacing: 8px; margin-bottom: 4px; }
        .title-en {
          display: block; font-family: 'Bebas Neue', sans-serif; font-size: 72px; letter-spacing: 6px;
          background: linear-gradient(135deg, #ffffff 0%, #818cf8 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .subtitle { font-size: 13px; color: rgba(255,255,255,0.35); letter-spacing: 0.5px; line-height: 1.6; }
        .input-section { display: flex; flex-direction: column; gap: 12px; }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 16px; font-size: 16px; pointer-events: none; }
        .input {
          width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 16px 16px 16px 48px; color: #ffffff;
          font-size: 16px; font-family: 'Noto Serif KR', serif; outline: none;
          transition: border-color 0.2s, background 0.2s; -moz-appearance: textfield;
        }
        .input::-webkit-outer-spin-button, .input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .input::placeholder { color: rgba(255,255,255,0.2); }
        .input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.05); }
        .button {
          width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none;
          border-radius: 14px; padding: 16px; color: #ffffff; font-size: 15px; font-weight: 700;
          font-family: 'Noto Serif KR', serif; letter-spacing: 2px; cursor: pointer;
          transition: opacity 0.2s, transform 0.1s; display: flex; align-items: center; justify-content: center; min-height: 54px;
        }
        .button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .button-loading { opacity: 0.7; cursor: not-allowed; }
        .spinner {
          width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .result-box {
          margin-top: 28px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25);
          border-radius: 16px; padding: 28px; text-align: center; animation: fadeUp 0.4s ease;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .result-year { font-size: 12px; letter-spacing: 3px; color: #818cf8; margin-bottom: 8px; }
        .result-label { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 10px; letter-spacing: 2px; }
        .result-name { font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: 2px; }
        .error-box {
          margin-top: 20px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 14px 18px; color: #fca5a5; font-size: 13px; text-align: center; animation: fadeUp 0.3s ease;
        }
      `}</style>
    </main>
  );
}

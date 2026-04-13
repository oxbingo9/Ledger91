"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

const firebaseConfig = {
  apiKey: "AIzaSyBi82idZAraoDMEMVBhVv66tURB0lSI0UM",
  authDomain: "ledger91-e95ea.firebaseapp.com",
  projectId: "ledger91-e95ea",
  storageBucket: "ledger91-e95ea.firebasestorage.app",
  messagingSenderId: "747494068723",
  appId: "1:747494068723:web:67fe836743fb16f89f8286"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const FAKE_CHARS = ["가","나","다","라","마","바","사","아","자","차","강","김","박","최","정","윤","장","임","한","오","서","신","권","황","송","류","전","홍","고","문","양","손","배","조","백","허","유","남","심","노","곽","성","태","준","민","수","지","현","영"];

// 겹치지 않게 위치 배정
function placeNoOverlap(count, areaW, areaH, itemW, itemH, margin = 10) {
  const placed = [];
  const maxTry = 300;
  for (let i = 0; i < count; i++) {
    let x, y, tries = 0, ok = false;
    while (tries < maxTry) {
      x = Math.random() * (areaW - itemW);
      y = Math.random() * (areaH - itemH);
      ok = placed.every(p =>
        x + itemW + margin < p.x || x > p.x + itemW + margin ||
        y + itemH + margin < p.y || y > p.y + itemH + margin
      );
      if (ok) break;
      tries++;
    }
    placed.push({ x, y });
  }
  return placed;
}

export default function LoginPage() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [success, setSuccess] = useState(false);
  const [failAnim, setFailAnim] = useState(false);
  const [usedChip, setUsedChip] = useState(null);
  const areaRef = useRef(null);

  // 드래그 상태
  const dragChar = useRef("");
  const dragChipId = useRef(null);
  const touchCloneRef = useRef(null);
  const touchChipId = useRef(null);
  const touchCharRef = useRef("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, "members"));
        const all = snap.docs.map(d => d.data()).filter(d => d.NAME && d.NAME.length >= 2);
        setMembers(all);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const initGame = useCallback(() => {
    if (members.length === 0) return;
    const areaW = Math.min(window.innerWidth, 480);
    const areaH = window.innerHeight - 180;

    // 랜덤 정답 회원 선택
    const target = members[Math.floor(Math.random() * members.length)];
    const hiddenIdx = Math.floor(Math.random() * target.NAME.length);
    const correctChar = target.NAME[hiddenIdx];

    // 오답 글자 풀
    const fakePool = FAKE_CHARS.filter(c => c !== correctChar).sort(() => Math.random() - 0.5);
    const chips = [
      { id: "correct", char: correctChar, isCorrect: true },
      ...fakePool.slice(0, 6).map((c, i) => ({ id: `fake${i}`, char: c, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);

    // 이름 카드 위치 (위쪽 영역 절반)
    const namePositions = placeNoOverlap(members.length, areaW - 80, areaH * 0.52, 70, 36, 8);
    // 글자 칩 위치 (아래쪽 영역)
    const chipPositions = placeNoOverlap(chips.length, areaW - 60, areaH * 0.42, 48, 48, 10)
      .map(p => ({ x: p.x, y: p.y + areaH * 0.54 }));

    setGameData({ target, hiddenIdx, correctChar, chips, namePositions, chipPositions, areaH });
    setAnswered(false);
    setSuccess(false);
    setUsedChip(null);
  }, [members]);

  useEffect(() => {
    if (members.length > 0) initGame();
  }, [members, initGame]);

  function checkAnswer(char, chipId) {
    if (answered) return;
    if (char === gameData.correctChar) {
      setAnswered(true);
      setUsedChip(chipId);
      setSuccess(true);
      setTimeout(() => router.push("/ledger"), 1800);
    } else {
      setFailAnim(true);
      setTimeout(() => setFailAnim(false), 600);
    }
  }

  // 드래그 (PC)
  function onDragStart(e, char, chipId) {
    dragChar.current = char;
    dragChipId.current = chipId;
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e) { e.preventDefault(); }
  function onDrop(e, memberName, idx) {
    e.preventDefault();
    if (memberName === gameData.target.NAME && idx === gameData.hiddenIdx) {
      checkAnswer(dragChar.current, dragChipId.current);
    } else {
      setFailAnim(true);
      setTimeout(() => setFailAnim(false), 600);
    }
  }

  // 터치 (모바일)
  function onTouchStart(e, char, chipId) {
    e.preventDefault();
    touchChipId.current = chipId;
    touchCharRef.current = char;
    const t = e.touches[0];
    const el = e.currentTarget;
    const clone = el.cloneNode(true);
    clone.style.cssText = `position:fixed;width:48px;height:48px;opacity:0.85;z-index:999;pointer-events:none;border-radius:50%;background:#0f3460;border:2px solid #e94560;color:white;font-size:20px;font-weight:bold;display:flex;align-items:center;justify-content:center;left:${t.clientX-24}px;top:${t.clientY-24}px;`;
    document.body.appendChild(clone);
    touchCloneRef.current = clone;
  }
  function onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (touchCloneRef.current) {
      touchCloneRef.current.style.left = (t.clientX - 24) + "px";
      touchCloneRef.current.style.top = (t.clientY - 24) + "px";
    }
  }
  function onTouchEnd(e) {
    if (touchCloneRef.current) { touchCloneRef.current.remove(); touchCloneRef.current = null; }
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el.dataset.member && el.dataset.hiddenidx !== undefined) {
      const memberName = el.dataset.member;
      const idx = Number(el.dataset.hiddenidx);
      if (memberName === gameData.target.NAME && idx === gameData.hiddenIdx) {
        checkAnswer(touchCharRef.current, touchChipId.current);
      } else {
        setFailAnim(true);
        setTimeout(() => setFailAnim(false), 600);
      }
    }
    touchChipId.current = null;
    touchCharRef.current = "";
  }

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#1a1a2e",color:"#aaa",fontFamily:"'Noto Sans KR',sans-serif"}}>
      불러오는 중...
    </div>
  );

  if (!gameData) return null;

  const { target, hiddenIdx, chips, namePositions, chipPositions, areaH } = gameData;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans KR', sans-serif; background: #1a1a2e; overflow: hidden; }

        .login-wrap { position: relative; width: 100vw; overflow: hidden; }

        /* 상단 타이틀 */
        .login-title { position: fixed; top: 16px; left: 0; right: 0; text-align: center; z-index: 10; pointer-events: none; }
        .login-title-sub { font-size: 11px; color: #555; letter-spacing: 2px; }
        .login-title-main { font-size: 16px; color: #888; margin-top: 2px; }

        /* 이름 카드 */
        .name-card { position: absolute; display: flex; gap: 4px; cursor: default; }
        .name-char { width: 34px; height: 34px; border-radius: 8px; background: #16213e; border: 1px solid #2a3a5e; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: #ccc; }
        .name-char.hole {
          border: 2px dashed #e94560;
          background: #0f3460;
          color: transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .name-char.hole.drag-over { border-color: #fff; background: #1a5090; transform: scale(1.15); }
        .name-char.hole.correct { border: 2px solid #28a745; background: #1a4a2e; color: #5dff8f; animation: pop 0.3s ease; }
        @keyframes pop { 0%{transform:scale(0.8)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }

        /* 글자 칩 */
        .chip { position: absolute; width: 48px; height: 48px; border-radius: 50%; background: #0f3460; border: 2px solid #e94560; color: white; font-size: 20px; font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: grab; touch-action: none; transition: box-shadow 0.15s, opacity 0.15s; }
        .chip:active { transform: scale(1.15); box-shadow: 0 8px 24px rgba(233,69,96,0.5); }
        .chip.used { opacity: 0; pointer-events: none; }

        /* 실패 흔들기 */
        .shake { animation: shake 0.5s ease; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }

        /* 성공 */
        .success-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .success-text { color: #5dff8f; font-size: 26px; font-weight: bold; margin-bottom: 10px; }
        .success-sub { color: #aaa; font-size: 14px; }

        /* 새 문제 버튼 */
        .retry-btn { position: fixed; bottom: 20px; right: 20px; background: none; border: 1px solid #333; color: #666; border-radius: 20px; padding: 6px 16px; font-size: 12px; cursor: pointer; font-family: inherit; z-index: 10; }
        .retry-btn:hover { border-color: #666; color: #aaa; }
      `}</style>

      <div className="login-title">
        <div className="login-title-sub">Simple Ledger91</div>
        <div className="login-title-main">회원을 찾아 ○에 글자를 맞춰보세요</div>
      </div>

      <div
        ref={areaRef}
        className="login-wrap"
        style={{ height: `${areaH + 80}px`, paddingTop: "60px" }}
      >
        {/* 이름 카드들 */}
        {members.map((m, mi) => {
          const pos = namePositions[mi] || { x: 0, y: 0 };
          const isTarget = m.NAME === target.NAME;
          return (
            <div
              key={m.NAME + mi}
              className="name-card"
              style={{ left: pos.x + "px", top: (pos.y + 60) + "px" }}
            >
              {m.NAME.split("").map((ch, ci) => {
                const isHole = isTarget && ci === hiddenIdx;
                return (
                  <div
                    key={ci}
                    className={`name-char${isHole ? " hole" + (success ? " correct" : "") : ""}`}
                    data-member={isTarget ? m.NAME : ""}
                    data-hiddenidx={isTarget ? hiddenIdx : ""}
                    onDragOver={isHole ? onDragOver : undefined}
                    onDrop={isHole ? (e) => onDrop(e, m.NAME, ci) : undefined}
                    onDragLeave={isHole ? (e) => e.currentTarget.classList.remove("drag-over") : undefined}
                    onDragEnter={isHole ? (e) => e.currentTarget.classList.add("drag-over") : undefined}
                  >
                    {isHole ? (success ? gameData.correctChar : "") : ch}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* 글자 칩들 */}
        {chips.map((chip, ci) => {
          const pos = chipPositions[ci] || { x: 0, y: 0 };
          return (
            <div
              key={chip.id}
              className={`chip${usedChip === chip.id ? " used" : ""}${failAnim ? " shake" : ""}`}
              style={{ left: pos.x + "px", top: pos.y + "px" }}
              draggable
              onDragStart={(e) => onDragStart(e, chip.char, chip.id)}
              onTouchStart={(e) => onTouchStart(e, chip.char, chip.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {chip.char}
            </div>
          );
        })}
      </div>

      {success && (
        <div className="success-overlay">
          <div className="success-text">✓ 확인되었습니다</div>
          <div className="success-sub">{target.NAME} 님, 이동 중...</div>
        </div>
      )}

      <button className="retry-btn" onClick={initGame}>↺ 다른 문제</button>
    </>
  );
}

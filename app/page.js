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

export default function LoginPage() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiddenMap, setHiddenMap] = useState([]);   // [{hiddenIdx, hiddenChar}]
  const [chips, setChips] = useState([]);            // [{id, char}]
  const [filled, setFilled] = useState({});          // {memberIdx: char}
  const [failIdx, setFailIdx] = useState(null);
  const [success, setSuccess] = useState(false);

  const dragChar = useRef("");
  const touchCloneRef = useRef(null);
  const touchCharRef = useRef("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(collection(db, "members"));
        const all = snap.docs.map(d => d.data()).filter(d => d.NAME && d.NAME.length >= 2);
        all.sort((a,b) => (a.NAME||"").localeCompare(b.NAME||"","ko"));
        setMembers(all);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const initGame = useCallback(() => {
    if (members.length === 0) return;

    // 각 회원마다 히든 인덱스 랜덤 배정
    const hMap = members.map(m => {
      const idx = Math.floor(Math.random() * m.NAME.length);
      return { hiddenIdx: idx, hiddenChar: m.NAME[idx] };
    });
    setHiddenMap(hMap);

    // 칩: 히든 글자 중복 제거 후 셔플
    const unique = [...new Set(hMap.map(h => h.hiddenChar))];
    const shuffled = unique.sort(() => Math.random() - 0.5);
    setChips(shuffled.map((char, i) => ({ id: `chip_${i}`, char })));

    setFilled({});
    setFailIdx(null);
    setSuccess(false);
  }, [members]);

  useEffect(() => { if (members.length > 0) initGame(); }, [members, initGame]);

  function checkDrop(char, memberIdx) {
    if (filled[memberIdx]) return; // 이미 채워진 곳
    const targetChar = hiddenMap[memberIdx]?.hiddenChar;
    if (char === targetChar) {
      const newFilled = { ...filled, [memberIdx]: char };
      setFilled(newFilled);
      // 이름 1개 완성 → 성공
      setSuccess(true);
      setTimeout(() => router.push("/ledger"), 1500);
    } else {
      setFailIdx(memberIdx);
      setTimeout(() => setFailIdx(null), 600);
    }
  }

  // PC 드래그
  function onDragStart(e, char) {
    dragChar.current = char;
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e) { e.preventDefault(); }
  function onDragEnter(e) { e.currentTarget.classList.add("drag-over"); }
  function onDragLeave(e) { e.currentTarget.classList.remove("drag-over"); }
  function onDrop(e, memberIdx) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    checkDrop(dragChar.current, memberIdx);
  }

  // 모바일 터치
  function onTouchStart(e, char) {
    e.preventDefault();
    touchCharRef.current = char;
    const t = e.touches[0];
    const clone = document.createElement("div");
    clone.textContent = char;
    clone.style.cssText = `position:fixed;width:44px;height:44px;border-radius:50%;background:#0f3460;border:2px solid #e94560;color:white;font-size:19px;font-weight:bold;line-height:44px;text-align:center;left:${t.clientX-22}px;top:${t.clientY-22}px;z-index:999;pointer-events:none;font-family:'Noto Sans KR',sans-serif;`;
    document.body.appendChild(clone);
    touchCloneRef.current = clone;
  }
  function onTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (touchCloneRef.current) {
      touchCloneRef.current.style.left = (t.clientX - 22) + "px";
      touchCloneRef.current.style.top = (t.clientY - 22) + "px";
    }
    document.querySelectorAll(".hole").forEach(el => el.classList.remove("drag-over"));
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el?.classList.contains("hole")) el.classList.add("drag-over");
  }
  function onTouchEnd(e) {
    if (touchCloneRef.current) { touchCloneRef.current.remove(); touchCloneRef.current = null; }
    document.querySelectorAll(".hole").forEach(el => el.classList.remove("drag-over"));
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el?.dataset.memberidx !== undefined && el.dataset.memberidx !== "") {
      checkDrop(touchCharRef.current, Number(el.dataset.memberidx));
    }
    touchCharRef.current = "";
  }

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#1a1a2e",color:"#aaa",fontFamily:"'Noto Sans KR',sans-serif"}}>
      불러오는 중...
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans KR', sans-serif; background: #1a1a2e; overflow: hidden; height: 100vh; }

        .page { display: flex; flex-direction: column; height: 100vh; max-width: 480px; margin: 0 auto; }

        /* 타이틀 */
        .top-bar { padding: 18px 0 10px; text-align: center; flex-shrink: 0; }
        .top-bar-sub { font-size: 11px; color: #444; letter-spacing: 2px; }
        .top-bar-main { font-size: 13px; color: #666; margin-top: 4px; }

        /* 칩 영역 - 위쪽 고정 */
        .chip-area {
          flex-shrink: 0;
          padding: 14px 10px 14px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          border-bottom: 1px solid #222;
          min-height: 80px;
          align-items: center;
        }
        .chip {
          width: 44px; height: 44px; border-radius: 50%;
          background: #0f3460; border: 2px solid #e94560;
          color: white; font-size: 19px; font-weight: bold;
          display: flex; align-items: center; justify-content: center;
          cursor: grab; touch-action: none;
          transition: opacity 0.2s, transform 0.15s;
          user-select: none;
        }
        .chip:active { transform: scale(1.15); box-shadow: 0 6px 20px rgba(233,69,96,0.4); }
        .chip.used { opacity: 0.15; pointer-events: none; }

        /* 이름 영역 - 아래쪽 스크롤 가능 */
        .name-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px 14px 20px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          align-content: start;
        }

        .name-card {
          background: #16213e;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
        }
        .name-char {
          width: 34px; height: 34px; border-radius: 7px;
          background: #1e2d4a; border: 1px solid #2a3a5e;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: bold; color: #bbb;
          flex-shrink: 0;
        }
        .hole {
          border: 2px dashed #e94560 !important;
          background: #0f2040 !important;
          cursor: pointer;
          transition: all 0.15s;
        }
        .hole.drag-over {
          border-color: #fff !important;
          background: #1a5090 !important;
          transform: scale(1.12);
        }
        .hole.correct {
          border: 2px solid #28a745 !important;
          background: #1a4a2e !important;
          color: #5dff8f !important;
          animation: pop 0.3s ease;
        }
        .hole.fail { animation: shake 0.5s ease; }

        @keyframes pop { 0%{transform:scale(0.8)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }

        /* 성공 */
        .success-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.92);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 100; animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .success-text { color: #5dff8f; font-size: 26px; font-weight: bold; margin-bottom: 10px; animation: pop 0.4s ease; }
        .success-sub { color: #777; font-size: 14px; }

        .retry-btn {
          position: fixed; bottom: 16px; right: 16px;
          background: none; border: 1px solid #2a2a2a; color: #444;
          border-radius: 20px; padding: 5px 14px; font-size: 11px;
          cursor: pointer; font-family: inherit; z-index: 10;
        }
        .retry-btn:hover { border-color: #555; color: #888; }
      `}</style>

      <div className="page">

        {/* 타이틀 */}
        <div className="top-bar">
          <div className="top-bar-sub">Simple Ledger91</div>
          <div className="top-bar-main">내 이름의 ○ 에 글자를 맞춰보세요</div>
        </div>

        {/* 위쪽: 드래그 글자들 */}
        <div className="chip-area">
          {chips.map(chip => {
            // 이 글자가 필요한 ○가 모두 채워졌으면 used
            const stillNeeded = hiddenMap.some((h, i) => h.hiddenChar === chip.char && !filled[i]);
            return (
              <div
                key={chip.id}
                className={`chip${!stillNeeded ? " used" : ""}`}
                draggable={stillNeeded}
                onDragStart={(e) => onDragStart(e, chip.char)}
                onTouchStart={(e) => onTouchStart(e, chip.char)}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {chip.char}
              </div>
            );
          })}
        </div>

        {/* 아래쪽: 이름 카드들 */}
        <div className="name-area">
          {members.map((m, mi) => {
            const { hiddenIdx, hiddenChar } = hiddenMap[mi] || {};
            const isFilled = !!filled[mi];
            return (
              <div key={mi} className="name-card">
                {m.NAME.split("").map((ch, ci) => {
                  const isHole = ci === hiddenIdx;
                  return (
                    <div
                      key={ci}
                      className={`name-char${
                        isHole
                          ? " hole" +
                            (isFilled ? " correct" : "") +
                            (failIdx === mi ? " fail" : "")
                          : ""
                      }`}
                      data-memberidx={isHole ? String(mi) : ""}
                      onDragOver={isHole && !isFilled ? onDragOver : undefined}
                      onDragEnter={isHole && !isFilled ? onDragEnter : undefined}
                      onDragLeave={isHole && !isFilled ? onDragLeave : undefined}
                      onDrop={isHole && !isFilled ? (e) => onDrop(e, mi) : undefined}
                    >
                      {isHole ? (isFilled ? filled[mi] : "") : ch}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {success && (
        <div className="success-overlay">
          <div className="success-text">✓ 확인되었습니다</div>
          <div className="success-sub">이동 중...</div>
        </div>
      )}

      <button className="retry-btn" onClick={initGame}>↺ 새로고침</button>
    </>
  );
}

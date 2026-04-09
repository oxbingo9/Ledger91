

"use client";
import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBi82idZAraoDMEMVBhVv66tURB0lSI0UM",
  authDomain: "ledger91-e95ea.firebaseapp.com",
  databaseURL: "https://ledger91-e95ea-default-rtdb.firebaseio.com",
  projectId: "ledger91-e95ea",
  storageBucket: "ledger91-e95ea.firebasestorage.app",
  messagingSenderId: "747494068723",
  appId: "1:747494068723:web:67fe836743fb16f89f8286",
  measurementId: "G-LWQ95J4B1B"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function Home() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear-1, currentYear-2, currentYear-3];

  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [insa, setInsa] = useState(null);
  const [items, setItems] = useState([]);
  const [pw, setPw] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsa() {
      setLoading(true);
      try {
        const snapshot = await getDocs(query(collection(db, "insa"), where("YEAR", "==", Number(selectedYear))));
        if (!snapshot.empty) {
          setInsa(snapshot.docs[0].data());
        } else {
          setInsa(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchInsa();
  }, [selectedYear]);

  useEffect(() => {
    async function fetchItems() {
      try {
        const snapshot = await getDocs(collection(db, "data"));
        const all = snapshot.docs.map(doc => doc.data());
        const filtered = all.filter(item => String(item.DATE).includes(selectedYear));
        setItems(filtered);
      } catch (e) {
        console.error(e);
      }
    }
    fetchItems();
  }, [selectedYear]);

  function formatDate(dateStr) {
    try {
      const d = new Date(dateStr);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${m}/${day}`;
    } catch {
      return dateStr;
    }
  }

  function checkAdmin(val) {
    setPw(val);
    const serverPw = insa ? String(insa.PWD || "") : "";
    setIsAdmin(val === serverPw && serverPw !== "");
  }

  const inItems = items.filter(i => i.TYPE === "입금");
  const outItems = items.filter(i => i.TYPE === "출금");
  const totalIn = inItems.reduce((s, i) => s + Number(i.AMT || 0), 0);
  const totalOut = outItems.reduce((s, i) => s + Number(i.AMT || 0), 0);
  const carryOver = insa ? Number(insa.CARRYOVER || 0) : 0;
  const balance = carryOver + totalIn - totalOut;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; background: #f0f2f5; color: #333; }
        .wrap { max-width: 480px; margin: 0 auto; padding: 15px; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
        .header-title { font-size: 12px; color: #888; letter-spacing: 1px; }
        .header-h1 { font-size: 22px; font-weight: bold; color: #1a1a1a; margin-top: 2px; }
        .insa-info { font-size: 11px; color: #666; text-align: right; line-height: 1.8; }
        .frame { background: white; border-radius: 12px; padding: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 15px; }
        .frame-title { font-weight: bold; color: #444; margin-bottom: 10px; }
        select { font-size: 20px; font-weight: bold; color: #007bff; border: 2px solid #007bff; padding: 8px 15px; border-radius: 8px; cursor: pointer; background: #fff; min-width: 120px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
        th { background: #f8f9fa; border-bottom: 2px solid #dee2e6; color: #666; font-weight: bold; padding: 10px 5px; }
        td { padding: 10px 5px; border-bottom: 1px solid #eee; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .col-date { width: 55px; text-align: center; color: #888; }
        .col-desc { text-align: left; padding-left: 10px; }
        .col-amt { width: 85px; text-align: right; font-weight: 500; }
        .plus { color: #28a745; }
        .minus { color: #dc3545; }
        .empty { color: #aaa; font-size: 12px; text-align: center; padding: 15px 0; }
        .summary-row { display: flex; justify-content: space-between; font-size: 15px; padding: 4px 0; }
        .balance { font-weight: bold; color: #007bff; font-size: 18px; margin-top: 10px; }
        .footer { margin-top: 20px; text-align: center; padding-bottom: 30px; }
        input[type=password] { padding: 10px; width: 140px; border: 1px solid #ddd; border-radius: 6px; text-align: center; font-size: 14px; }
        .loading { text-align: center; padding: 40px; color: #aaa; }
      `}</style>

      <div className="wrap">
        <div className="header">
          <div>
            <div className="header-title">LEDGER 91</div>
            <div className="header-h1">구일회비관리</div>
          </div>
          <div className="insa-info">
            회장: {insa ? insa.CHAIRMAN : "-"}<br />
            총무: {insa ? insa.SECRETARY : "-"}
          </div>
        </div>

        <div className="frame">
          <span style={{fontWeight:"bold", color:"#666", marginRight:"10px"}}>기준년도</span>
          <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setIsAdmin(false); setPw(""); }}>
            {years.map(y => <option key={y} value={String(y)}>{y}년</option>)}
          </select>
        </div>

        {loading ? <div className="loading">불러오는 중...</div> : <>

          <div className="frame">
            <div className="frame-title">↓ 입금내역</div>
            <table>
              <thead><tr><th className="col-date">날짜</th><th className="col-desc">내용</th><th className="col-amt">금액</th></tr></thead>
              <tbody>
                {inItems.length === 0
                  ? <tr><td colSpan={3} className="empty">내역 없음</td></tr>
                  : inItems.map((item, i) => (
                    <tr key={i}>
                      <td className="col-date">{formatDate(item.DATE)}</td>
                      <td className="col-desc">{item.DESC}</td>
                      <td className="col-amt plus">{Number(item.AMT).toLocaleString()}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <div className="frame">
            <div className="frame-title">↑ 출금내역</div>
            <table>
              <thead><tr><th className="col-date">날짜</th><th className="col-desc">내용</th><th className="col-amt">금액</th></tr></thead>
              <tbody>
                {outItems.length === 0
                  ? <tr><td colSpan={3} className="empty">내역 없음</td></tr>
                  : outItems.map((item, i) => (
                    <tr key={i}>
                      <td className="col-date">{formatDate(item.DATE)}</td>
                      <td className="col-desc">{item.DESC}</td>
                      <td className="col-amt minus">{Number(item.AMT).toLocaleString()}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          <div className="frame">
            <div className="summary-row"><span>이월금액</span><span>{carryOver.toLocaleString()}원</span></div>
            <div className="summary-row"><span>총 입금</span><span className="plus">+{totalIn.toLocaleString()}원</span></div>
            <div className="summary-row"><span>총 출금</span><span className="minus">-{totalOut.toLocaleString()}원</span></div>
            <div className="summary-row balance"><span>현재잔액</span><span>{balance.toLocaleString()}원</span></div>
          </div>

        </>}

        <div className="footer">
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={e => checkAdmin(e.target.value)}
          />
          {isAdmin && <p style={{marginTop:"10px", color:"#28a745", fontSize:"13px"}}>✅ 관리자 모드</p>}
        </div>
      </div>
    </>
  );
}

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "본인의값",
    authDomain: "본인의값",
    projectId: "본인의값",
    storageBucket: "본인의값",
    messagingSenderId: "본인의값",
    appId: "본인의값"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById('searchBtn').addEventListener('click', async () => {
    const year = document.getElementById('yearInput').value;
    const resultDiv = document.getElementById('result');
    
    resultDiv.innerText = "조회 중...";

    try {
        const docRef = doc(db, "insa", year);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            resultDiv.innerText = `${year}년 회장: ${docSnap.data().chairman}`;
        } else {
            resultDiv.innerText = "데이터가 없습니다.";
        }
    } catch (e) {
        resultDiv.innerText = "오류 발생: " + e.message;
    }
});

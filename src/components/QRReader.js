import { doc, getDoc, updateDoc } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import QrReader from "react-qr-reader";
import { db } from "../myFirebase";
import moment from "moment";
// import "../css/QRReader.scss";

// Scan한 QR 데이터를 얼마나 유지할 것인가?
const durationTime = 5000;
// QR code의 유효시간?
const validTime = 30000;

const Error = (error) => {
  console.log("from QRReader.js");
  console.log(error);
};

const QRReader = () => {
  const [scannedData, setScannedData] = useState(null);
  // const [parsedData, setParsedData] = useState(null);
  const [mode, setMode] = useState(true);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const today = moment().format("YYYY-MM-DD");
  // const week;

  useEffect(() => {
    // print userData when QR is scanned
    console.log(scannedData);
  }, [scannedData]);

  const clearData = useCallback(() => {
    // n초 동안 현재 userData를 유지한다.
    // n초 뒤에 null로 clear하여 새로운 QR scan을 기다린다.
    // 실수로 한 명의 QR이 중복 스캔되는 것을 방지하기 위함!
    setTimeout(() => {
      setScannedData(null);
    }, durationTime);
  }, []);

  const handleScan = (data) => {
    if (data && data !== scannedData) {
      setScannedData(data);
    }
  };

  const cameraChange = () => {
    setMode(!mode);
  };

  // process parsed data
  const processData = useCallback(async () => {
    if (!scannedData) return;
    const { uid, createdAt } = JSON.parse(scannedData);
    if (new Date().getTime() - createdAt > validTime) {
      // QR의 유효시간이 만료됨
      console.log(
        "QR의 유효시간이 만료되었습니다. 새로고침하여 새 QR코드를 발급받으세요."
      );
      return;
    }

    setIsLoading(true);
    const userRef = doc(db, "userlist", uid);
    const dailyRef = doc(db, `userlist/${uid}/daily`, today);

    // DB에서 이 uid를 가진 user를 찾아본다.
    await getDoc(userRef)
      .then(async (userSnap) => {
        if (userSnap.exists()) {
          // uid is valid
          const { userName, isWorking } = userSnap.data();
          const now = new Date().getTime();
          if (isWorking) {
            // finish working
            await getDoc(dailyRef)
              .then(async (dailySnap) => {
                if (dailySnap.exists()) {
                  const { workTime, lastStartedAt } = dailySnap.data();
                  await updateDoc(dailyRef, {
                    workTime: workTime + now - lastStartedAt,
                    lastFinishedAt: now,
                  })
                    .then(async () => {
                      await updateDoc(userRef, {
                        isWorking: false,
                      }).catch(Error);
                    })
                    .catch(Error);
                }
              })
              .then(() => {
                setText(`${userName}님 퇴근!`);
              })
              .catch(Error);
          } else {
            // start working
            await getDoc(dailyRef)
              .then(async (dailySnap) => {
                if (dailySnap.exists()) {
                  await updateDoc(dailyRef, {
                    lastStartedAt: now,
                  }).catch(Error);
                }
              })
              .then(async () => {
                await updateDoc(userRef, {
                  isWorking: true,
                }).catch(Error);
              })
              .then(() => {
                setText(`${userName}님 출근!`);
              })
              .catch(Error);
          }
        }
      })
      .then(() => {
        clearData();
        setIsLoading(false);
      })
      .catch(Error);
  }, [scannedData, today, clearData]);

  useEffect(() => {
    processData();

    return () => {
      setText("");
      setIsLoading(false);
    };
  }, [processData]);

  return (
    <div className="qr-reader--container">
      <QrReader
        className="qr-reader--camera"
        onScan={handleScan}
        onError={(error) => console.log(error)}
        // onLoad={() => console.log("loaded")}
        facingMode={mode ? "user" : "environment"}
        // facingMode="user"
        delay={2000}
        // showViewFinder={false}
        style={{
          width: 320,
          height: 320,
        }}
      />
      <button onClick={cameraChange}>카메라 전환</button>
      {scannedData && (
        <>
          <p>{isLoading ? "Loading..." : text}</p>
        </>
      )}
    </div>
  );
};

export default QRReader;

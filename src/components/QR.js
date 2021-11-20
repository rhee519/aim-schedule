import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import QRCode from "react-qr-code";
import QrReader from "react-qr-reader";
import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import { Box, Paper, Button, Typography } from "@mui/material";
import { db } from "../myFirebase";
import { UserContext } from "../contexts/Context";
// import { finishWork, startWork } from "./WorkTime";
import { getMonthRange } from "./CustomCalendar";
import moment from "moment";

// QR code의 새로고침 주기
const refreshTime = 30;
// Scan한 QR 데이터를 얼마나 유지할 것인가?
const durationTime = 5000;
// QR code의 유효시간?
const validTime = 30000;

const QRcode = () => {
  // userData.userName 은 한글 인코딩 문제때문에 QR 코드 생성은 되지만
  // scan할 때 문제가 발생하므로 QR code value에 넣지 말 것!
  const userData = useContext(UserContext);
  const [remainTime, setRemainTime] = useState(refreshTime);
  const [data, setData] = useState({
    uid: userData.uid,
    createdAt: new Date().getTime(),
  });

  const timer = useRef(null);

  const refresh = useCallback(() => {
    setRemainTime(refreshTime);
    setData({ uid: userData.uid, createdAt: new Date().getTime() });
  }, [userData.uid]);

  useEffect(() => {
    // refresh QR code periodically
    timer.current = setInterval(() => {
      if (remainTime === 0) {
        refresh();
      } else setRemainTime(remainTime - 1);
    }, 1000);

    return () => clearInterval(timer.current);
  }, [remainTime, userData.uid, refresh]);

  const onRefreshClick = () => {
    refresh();
  };

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 1,
      }}
    >
      <QRCode value={JSON.stringify(data)} size={400} />
      <Typography variant="body1" textAlign="center">
        남은 시간: {remainTime}초
      </Typography>
      <Button
        variant="contained"
        fullWidth
        id="btn--refresh"
        onClick={onRefreshClick}
        sx={{
          mt: 1,
        }}
      >
        refresh
      </Button>
    </Paper>
  );
};

const QRreader = () => {
  const [scannedData, setScannedData] = useState(null);
  const [mode, setMode] = useState(true);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      setText(
        "QR의 유효시간이 만료되었습니다. 새로고침하여 새 QR코드를 발급받으세요."
      );
      return;
    }

    setIsLoading(true);
    const userRef = doc(db, "userlist", uid);

    // DB에서 이 uid를 가진 user를 찾아본다.
    await getDoc(userRef)
      .then(async (userSnap) => {
        if (userSnap.exists()) {
          // uid is valid
          const {
            userName,
            isWorking,
            // lastLoginAt
          } = userSnap.data();
          if (isWorking) {
            // finish working
            // finishWork({ uid, lastLoginAt });
            CheckOut(uid);
            updateDoc(userRef, { isWorking: false });
            setText(`${userName}님 퇴근!`);
          } else {
            // start working
            // startWork({ uid });
            CheckIn(uid);
            updateDoc(userRef, { isWorking: true });
            setText(`${userName}님 출근!`);
          }
        } else {
          // uid is invaild
          setText("Error: uid invaild");
        }
      })
      .then(() => {
        clearData();
        setIsLoading(false);
      })
      .catch(Error);
  }, [scannedData, clearData]);

  useEffect(() => {
    processData();

    return () => {
      setText("");
      setIsLoading(false);
    };
  }, [processData]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        // justifyContent: "center",
        // bgcolor: "#333333",
      }}
    >
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
      <Button variant="contained" onClick={cameraChange}>
        카메라 전환
      </Button>
      {scannedData && (
        <Typography>{isLoading ? "Loading..." : text}</Typography>
      )}
    </Box>
  );
};

const CheckIn = async (uid) => {
  const { startDate, endDate } = getMonthRange();
  const docRef = doc(
    db,
    `userlist/${uid}/schedule/${moment(endDate).year()}/${moment(
      startDate
    ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}`,
    moment().format("YYYYMMDD")
  );
  await getDoc(docRef).then(async (docSnap) => {
    if (docSnap.exists()) {
      const { log } = docSnap.data() || [];
      log.push({ time: new Date(), type: "IN" });
      await updateDoc(docRef, {
        log,
      });
    } else {
      await setDoc(docRef, {
        start: moment().startOf("day").hour(9).toDate(),
        finish: moment().startOf("day").hour(18).toDate(),
        started: new Date(),
        log: [{ time: new Date(), type: "IN" }],
      });
    }
  });
};

const CheckOut = async (uid) => {
  const { startDate, endDate } = getMonthRange();
  const docRef = doc(
    db,
    `userlist/${uid}/schedule/${moment(endDate).year()}/${moment(
      startDate
    ).format("YYYYMMDD")}-${moment(endDate).format("YYYYMMDD")}`,
    moment().format("YYYYMMDD")
  );
  await getDoc(docRef).then(async (docSnap) => {
    if (docSnap.exists()) {
      const { log } = docSnap.data() || [];
      log.push({ time: new Date(), type: "OUT" });
      await updateDoc(docRef, {
        finished: new Date(),
        log,
      });
    } else {
      console.log("Error: no data today");
    }
  });
};

export { QRcode, QRreader };

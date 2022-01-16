import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import QRCode from "react-qr-code";
import QrReader from "react-qr-reader";
import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import { Box, Paper, Button, Typography } from "@mui/material";
import { db } from "../myFirebase";
import { UserContext } from "../contexts/Context";
import moment from "moment";
import { dayRef, initialDailyData } from "../docFunctions";
import AudioSuccess from "../resources/qr-success.mp3";
import AudioError from "../resources/qr-error.mp3";

// QR code의 새로고침 주기
const refreshTime = 30;
// Scan한 QR 데이터를 얼마나 유지할 것인가?
const durationTime = 5000;
// QR code의 유효시간?
const validTime = 30000;

const STATUS_SUCCESS = "success";
const STATUS_ERROR = "error";
const STATUS_WARNING = "warning";

const QRcode = () => {
  // userData.userName 은 한글 인코딩 문제때문에 QR 코드 생성은 되지만
  // scan할 때 문제가 발생하므로 QR code value에 넣지 말 것!
  const userData = useContext(UserContext);
  const [remainTime, setRemainTime] = useState(refreshTime);
  const [lastCreated, setLastCreated] = useState(new Date());
  const [data, setData] = useState({
    uid: userData.uid,
    createdAt: lastCreated,
  });

  const timer = useRef(null);

  const refresh = useCallback(() => {
    const time = new Date();
    setLastCreated(time);
    setData({ uid: userData.uid, createdAt: time });
    setRemainTime(Math.ceil(validTime / 1000));
  }, [userData.uid]);

  useEffect(() => {
    // refresh QR code periodically
    timer.current = setInterval(() => {
      const gap = new Date().getTime() - lastCreated.getTime();
      if (gap > validTime) {
        refresh();
      } else setRemainTime(Math.ceil((validTime - gap) / 1000));
    }, 1000);

    return () => clearInterval(timer.current);
  }, [lastCreated, userData.uid, refresh]);

  const onRefreshClick = () => {
    refresh();
  };

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 3,
      }}
    >
      <QRCode value={JSON.stringify(data)} size={256} />
      <Typography variant="body1" textAlign="center">
        남은 시간: {remainTime}초
      </Typography>
      <Button
        variant="contained"
        fullWidth
        id="btn--refresh"
        onClick={onRefreshClick}
        sx={{ mt: 1 }}
      >
        refresh
      </Button>
    </Paper>
  );
};

const QRreader = () => {
  const [scannedData, setScannedData] = useState(null);
  const [mode, setMode] = useState(true); // 전면, 후면 카메라 선택
  const [text, setText] = useState("");
  // const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioSuccess = useMemo(() => new Audio(AudioSuccess), []);
  const audioWarning = useMemo(() => new Audio(AudioError), []); // 나중에 warning alert sound로 교체
  const audioError = useMemo(() => new Audio(AudioError), []);

  const clearData = useCallback(() => {
    // n초 동안 현재 userData를 유지한다.
    // n초 뒤에 null로 clear하여 새로운 QR scan을 기다린다.
    // 실수로 한 명의 QR이 중복 스캔되는 것을 방지하기 위함!
    setTimeout(() => {
      setScannedData(null);
      // setError(null);
      setStatus(null);
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

  const playAudio = useCallback(
    (type) => {
      if (type === STATUS_SUCCESS) {
        audioSuccess.play();
      } else if (type === STATUS_WARNING) {
        audioWarning.play();
      } else if (type === STATUS_ERROR) {
        audioError.play();
      } else return;
    },
    [audioSuccess, audioWarning, audioError]
  );

  // process parsed data
  const processData = useCallback(async () => {
    if (!scannedData) return;
    const { uid, createdAt } = JSON.parse(scannedData);
    if (new Date().getTime() - new Date(createdAt).getTime() > validTime) {
      // QR의 유효시간이 만료됨
      setText(
        "QR의 유효시간이 만료되었습니다. 새로고침하여 새 QR코드를 발급받으세요."
      );
      // setError(true);
      setStatus(STATUS_ERROR);
      return;
    }
    setIsLoading(true);

    // DB에서 이 uid를 가진 user를 찾아본다.
    const userRef = doc(db, "userlist", uid);
    await getDoc(userRef)
      .then(async (userSnap) => {
        if (userSnap.exists()) {
          // 사용자 정보가 유효함
          const { uid, userName, isWorking, lastLoginAt } = userSnap.data();
          if (isWorking) {
            // 퇴근
            const lastLoginDate = lastLoginAt.toDate();
            if (!moment(lastLoginDate).isSame(moment(), "day")) {
              // 전날 퇴근을 안 찍은 것!
              const docRef = dayRef(uid, lastLoginDate);
              await getDoc(docRef)
                .then((docSnap) => {
                  if (docSnap.exists()) return docSnap.data();
                  else return undefined;
                })
                .then((data) => {
                  if (data) {
                    // 마지막으로 login한 날짜의 퇴근 시각에 퇴근한 것으로 처리한다.
                    const { finish, log } = data;
                    log.push({ time: finish, type: "out" });
                    updateDoc(docRef, { finished: finish, log });
                    CheckIn(uid);
                    updateDoc(userRef, { lastLoginAt: new Date() });
                    setText(
                      `${userName}님 출근! 오늘은 퇴근할 때 잊지 말고 QR체크 부탁드려요.`
                    );
                    setStatus(STATUS_WARNING);
                    playAudio(STATUS_WARNING);
                  } else {
                    // 에러: 마지막으로 login한 날짜의 데이터를 찾을 수 없다.
                    // 일단 퇴근 처리 후 다시 QR스캔하라고 안내한다.
                    updateDoc(userRef, { isWorking: false });
                    setText(
                      "알 수 없는 에러로 지난 퇴근처리가 되지 않았어요. QR코드를 다시 스캔해주세요."
                    );
                    // setError(true);
                    setStatus(STATUS_ERROR);
                    playAudio(STATUS_ERROR);
                  }
                });
              return;
            }
            // 퇴근
            CheckOut(uid);
            updateDoc(userRef, { isWorking: false, lastLogoutAt: new Date() });
            setText(`${userName}님 퇴근!`);
            setStatus(STATUS_SUCCESS);
            playAudio(STATUS_SUCCESS);
          } else {
            // 출근
            CheckIn(uid);
            updateDoc(userRef, { isWorking: true, lastLoginAt: new Date() });
            setText(`${userName}님 출근!`);
            setStatus(STATUS_SUCCESS);
            playAudio(STATUS_SUCCESS);
          }
        } else {
          // 사용자 정보가 유효하지 않음
          setText("사용자의 정보가 존재하지 않습니다. 관리자에게 문의하세요.");
          setStatus(STATUS_ERROR);
          playAudio(STATUS_ERROR);
          throw new Error();
        }
      })
      .then(() => {
        clearData();
        setIsLoading(false);
        // setError(false);
      })
      .catch((error) => {
        console.log(error);
        // setError(true);
        clearData();
      });
  }, [scannedData, clearData, playAudio]);

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
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#333333",
        border: "2px solid",
        borderColor:
          status === STATUS_SUCCESS
            ? "success.main"
            : status === STATUS_ERROR
            ? "error.main"
            : status === STATUS_WARNING
            ? "warning.main"
            : "transparent",
        width: 400,
        height: "95vh",
        overflow: "none",
      }}
    >
      <audio id="audio--success" src="src/resources/qr-success.mp3"></audio>
      <audio id="audio--error" src="src/resources/qr-error.mp3"></audio>
      <QrReader
        className="qr-reader--camera"
        onScan={handleScan}
        onError={(error) => console.log(error)}
        // onLoad={() => console.log("loaded")}
        facingMode={mode ? "user" : "environment"}
        delay={2000}
        style={{
          display: "block",
          width: "100%",
          // height: 320,
        }}
      />
      <Button
        variant="contained"
        color="success"
        onClick={cameraChange}
        id="btn--camera-change"
        sx={{
          position: "absolute",
          zIndex: 1,
          top: 0,
          right: 0,
        }}
      >
        카메라 전환
      </Button>
      <Paper sx={{ position: "absolute", bottom: 0, m: 2 }}>
        {scannedData && (
          <Typography variant="h6" sx={{ m: 1 }}>
            {isLoading ? "Loading..." : text}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

const CheckIn = async (uid) => {
  const docRef = dayRef(uid, moment());
  await getDoc(docRef).then(async (docSnap) => {
    const time = new Date();
    if (docSnap.exists()) {
      const data = docSnap.data();
      const started = data.started || time;
      const log = data.log || time;
      log.push({ time, type: "in" });
      await updateDoc(docRef, { started, log });
    } else {
      const log = [];
      log.push({ time, type: "in" });
      await setDoc(docRef, { ...initialDailyData(time), started: time, log });
    }
  });
};

const CheckOut = async (uid) => {
  const docRef = dayRef(uid, moment());
  await getDoc(docRef).then(async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const log = data.log || [];
      const time = new Date();
      log.push({ time, type: "out" });
      await updateDoc(docRef, { finished: time, log });
    } else {
      console.log("Error: no data today");
    }
  });
};

export { QRcode, QRreader };

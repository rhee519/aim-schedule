import React, { useContext, useEffect, useState } from "react";
// import QRCode from "qrcode.react";
import QRCode from "react-qr-code";
import { UserContext } from "../contexts/Context";

// QR code의 새로고침 주기
const refreshTime = 30;

const QRpage = () => {
  // userData.userName 은 한글 인코딩 문제때문에 QR 코드 생성은 되지만
  // scan할 때 문제가 발생하므로 QR code value에 넣지 말 것!
  const userData = useContext(UserContext);
  const [remainTime, setRemainTime] = useState(refreshTime);
  const [data, setData] = useState({
    uid: userData.uid,
    createdAt: new Date().getTime(),
  });

  useEffect(() => {
    // refresh QR code periodically
    const interval = setInterval(() => {
      if (remainTime === 0) {
        setRemainTime(refreshTime);
        setData({ uid: userData.uid, createdAt: new Date().getTime() });
      } else setRemainTime(remainTime - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remainTime, userData.uid]);

  return (
    <>
      <QRCode value={JSON.stringify(data)} />
      <p>남은 시간: {remainTime}초</p>
    </>
  );
};

export default QRpage;

import React, { useContext } from "react";
// import QRCode from "qrcode.react";
import QRCode from "react-qr-code";
import { UserContext } from "../contexts/Context";

const QRpage = () => {
  // userData.userName 은 한글 인코딩 문제때문에 QR 코드 생성은 되지만
  // scan할 때 문제가 발생하므로 QR code value에 넣지 말 것!
  const userData = useContext(UserContext);
  const data = {
    uid: userData.uid,
    createdAt: new Date().getTime(),
  };

  return <QRCode value={JSON.stringify(data)} />;
};

export default QRpage;

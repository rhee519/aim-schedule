import React, { useState } from "react";
import QrReader from "react-qr-reader";
import "../css/QRReader.scss";

const QRReader = () => {
  const [info, setInfo] = useState(null);

  const handleScan = (data) => {
    // console.log(data);
    if (data && data !== info) {
      setInfo(JSON.parse(data));
    }
  };
  console.log(info);
  return (
    <div className="qr-reader--container">
      <QrReader
        className="qr-reader--camera"
        onScan={handleScan}
        onError={(error) => console.log(error)}
        // onLoad={() => console.log("loaded")}
        facingMode="user"
        delay={1000}
        // showViewFinder={false}
        style={{
          width: 320,
          height: 320,
        }}
      />
      {/* {info && <p>{info}</p>} */}
    </div>
  );
};

export default QRReader;

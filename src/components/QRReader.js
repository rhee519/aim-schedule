import React from "react";
import QrReader from "react-qr-reader";

const QRReader = () => {
  return (
    <QrReader
      onScan={(data) => console.log(data)}
      onError={(error) => console.log(error)}
      delay={1000}
      style={{
        width: 500,
      }}
    />
  );
};

export default QRReader;

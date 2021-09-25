import React from "react";
import Loader from "react-loader-spinner";
import "./Loading.css";

const Loading = () => {
  return (
    <Loader className="loader-spinner" type="Oval" width={50} color="#6e7eb1" />
  );
};

export default Loading;

import React from "react";
import "../css/ProgressBar.scss";

const ProgressBar = ({ workTime, targetTime }) => {
  const overTime = workTime >= targetTime ? workTime - targetTime : 0;
  const workRatio = overTime > 0 ? 100 : (workTime / targetTime) * 100;
  const overRatio =
    workTime + overTime > 0 ? (overTime / (workTime + overTime)) * 100 : 0;
  return (
    <div className="progress-bar--container">
      <div
        className="progress-bar work-time"
        style={{
          width: `${workRatio}%`,
        }}
      ></div>
      <div
        className="progress-bar over-time"
        style={{
          width: `${overRatio}%`,
        }}
      ></div>
    </div>
  );
};

export default ProgressBar;

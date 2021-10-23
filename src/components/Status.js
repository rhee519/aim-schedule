import React from "react";

import "../css/Status.scss";

const Status = ({ user }) => {
  const className = user.isWorking ? " status-working" : "";
  return (
    <div className="status--container">
      <div className="status--info">
        <img
          className={`status--profile${className}`}
          src={user.profileImageURL}
          alt="profile"
        />
        <span id="status--name">{user.userName}</span>
        <div id="status--position">
          <span>{user.position}</span>
        </div>
        <span id="status--email">{user.email}</span>
      </div>
      <div className={`status--led${className}`}></div>
    </div>
  );
};

export default Status;

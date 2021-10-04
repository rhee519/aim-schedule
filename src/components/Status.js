import React from "react";

import "./Status.scss";

const Status = ({ user }) => {
  return (
    <div className="status--container">
      <img id="status--profile" src={user.profileImageURL} alt="profile" />
      <span id="status--name">{user.userName}</span>
      <span id="status--position">{user.position}</span>
      <span id="status--email">{user.email}</span>
      <span id="status--working">{user.isWorking ? "working" : "offline"}</span>
    </div>
  );
};

export default Status;

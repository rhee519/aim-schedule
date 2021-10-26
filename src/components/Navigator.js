import React, { useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import Notifications from "./NotificationContainer";
import useOutsideClick from "../useOutsideClick";
import "../css/Navigator.scss";
import { UserContext } from "../contexts/Context";

const Navigator = () => {
  const userData = useContext(UserContext);
  const [showNotify, setShowNotify] = useState(false);
  const classNames = `nav--notifications${showNotify ? " show" : ""}`;
  const notifyRef = useRef();

  const onNotifyClick = (event) => {
    setShowNotify(!showNotify);
  };

  useOutsideClick(notifyRef, () => {
    if (showNotify) setShowNotify(false);
  });

  return (
    <div className="nav--container">
      <Link className="nav--home" to="/" id="home">
        <i className="material-icons">home</i>
      </Link>

      {userData && (
        <div className="nav--side--menu">
          {userData.isAdmin && (
            <>
              <Link className="nav--qr-reader" to="/qr-reader">
                QR Reader
              </Link>
              <Link className="nav--admin" to="/admin">
                <i className="material-icons">admin_panel_settings</i>
              </Link>
            </>
          )}
          <Link className="nav--todo-list" to="/todo-list">
            <i className="material-icons">format_list_bulleted</i>
          </Link>
          <Link className="nav--calendar" to="/calendar">
            <i className="material-icons">event_available</i>{" "}
          </Link>
          <button className={classNames} onClick={onNotifyClick}>
            <i className="material-icons">notifications</i>
          </button>
          <Link className="nav--profile" to="/profile">
            {userData ? (
              <img src={userData.profileImageURL} alt="profile" />
            ) : (
              <i className="material-icons">account_circle</i>
            )}
          </Link>
        </div>
      )}

      {showNotify && <Notifications reference={notifyRef} />}
    </div>
  );
};

export default Navigator;

import React from "react";
import { Link } from "react-router-dom";
import "./Navigator.scss";

const Navigator = ({ userData, isAdmin }) => {
  return (
    <div className="nav--container">
      <Link className="nav--home" to="/">
        <span className="material-icons">home</span>{" "}
      </Link>

      <div className="nav--side--menu">
        {isAdmin && (
          <Link className="nav--admin" to="/admin">
            <i className="material-icons">admin_panel_settings</i>
          </Link>
        )}
        <Link className="nav--todo-list" to="/todo-list">
          <i className="material-icons">format_list_bulleted</i>
        </Link>
        <Link className="nav--calendar" to="/calendar">
          <i className="material-icons">event_available</i>{" "}
        </Link>
        <Link className="nav--profile" to="/profile">
          {/* <h4>Profile</h4> */}
          {userData ? (
            <img src={userData.photoURL} alt="profile" />
          ) : (
            <span className="material-icons">account_circle</span>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navigator;

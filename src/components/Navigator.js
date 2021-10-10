import React from "react";
import { Link } from "react-router-dom";
import "./Navigator.scss";

const Navigator = ({ userData, isAdmin }) => {
  return (
    <div className="nav--container">
      <Link className="nav--home" to="/" id="home">
        <i className="material-icons">home</i>
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
          {userData ? (
            <img src={userData.photoURL} alt="profile" />
          ) : (
            <i className="material-icons">account_circle</i>
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navigator;

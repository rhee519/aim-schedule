import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faHome,
  faList,
  faUserAlt,
} from "@fortawesome/free-solid-svg-icons";
import "./Navigator.scss";

const Navigator = ({ userData }) => {
  return (
    <div className="nav--container">
      <Link className="nav--home" to="/">
        <FontAwesomeIcon icon={faHome} />
      </Link>
      <div className="nav--side--menu">
        <Link className="nav--todo-list" to="/todo-list">
          <FontAwesomeIcon icon={faList} />
        </Link>
        <Link className="nav--calendar" to="/calendar">
          <FontAwesomeIcon icon={faCalendarAlt} />
        </Link>
        <Link className="nav--profile" to="/profile">
          {/* <h4>Profile</h4> */}
          {userData ? (
            <img src={userData.photoURL} alt="profile" />
          ) : (
            <FontAwesomeIcon icon={faUserAlt} />
          )}
        </Link>
      </div>
    </div>
  );
};

export default Navigator;

import React from "react";
import { Link } from "react-router-dom";
import "./Navigator.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faUser } from "@fortawesome/free-regular-svg-icons";
import { faUserAlt } from "@fortawesome/free-solid-svg-icons";

const Navigator = ({ userData }) => {
  return (
    <div className="nav--container">
      <Link className="nav--menu nav--home" to="/">
        {/* <h4>Home</h4> */}
        {/* <img src="../../images/logo.png" alt="AIM Korea Logo" /> */}
      </Link>
      <Link className="nav--menu nav--profile" to="/profile">
        {/* <h4>Profile</h4> */}
        {userData ? (
          <img src={userData.photoURL} alt="profile" />
        ) : (
          <FontAwesomeIcon icon={faUserAlt} size="2x" />
        )}
      </Link>
    </div>
  );
};

export default Navigator;

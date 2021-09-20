import React from "react";
import { Link } from "react-router-dom";
// import { auth } from "../myFirebase";

const Navigator = () => {
  return (
    <>
      <Link to="/">
        <h4>Home</h4>
      </Link>
      <Link to="/profile">
        <h4>Profile</h4>
      </Link>
    </>
  );
};

export default Navigator;

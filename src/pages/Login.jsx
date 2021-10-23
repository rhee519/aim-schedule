import {
  // getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
} from "@firebase/auth";
// import { faGoogle } from "@fortawesome/free-brands-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { auth } from "../myFirebase";
import "../css/Login.scss";

const Login = () => {
  const onGoogleLoginClick = (event) => {
    event.preventDefault();
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };
  return (
    <div className="login--container">
      <div className="img--box"></div>
      <div className="login--box">
        {/* <div className="aim-korea logo"></div> */}
        <h2 className="signin--text">Sign in</h2>
        <button id="social--container" onClick={onGoogleLoginClick}>
          <span>Continue with Google{"  "}</span>
          {/* <FontAwesomeIcon icon={faGoogle} size="2x" color="#aaa" /> */}
          <div id="google" alt="google"></div>
        </button>
      </div>
    </div>
  );
};

export default Login;

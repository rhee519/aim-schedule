import {
  // getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
} from "@firebase/auth";
// import { faGoogle } from "@fortawesome/free-brands-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { auth } from "../myFirebase";
import "./Login.css";

const Login = () => {
  const onGoogleLoginClick = (event) => {
    event.preventDefault();
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };
  return (
    <div className="login--container">
      <div>
        <h2>Sign in</h2>
        <button onClick={onGoogleLoginClick}>
          Continue with Google{" "}
          {/* <FontAwesomeIcon icon={faGoogle} size="2x" color="#aaa" /> */}
          <img id="google" src="../images/google.svg" alt="google" />
        </button>
      </div>
    </div>
  );
};

export default Login;

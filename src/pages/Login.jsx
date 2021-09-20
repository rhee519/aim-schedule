import {
  // getRedirectResult,
  GoogleAuthProvider,
  signInWithRedirect,
} from "@firebase/auth";
import React from "react";
import { auth } from "../myFirebase";

const Login = () => {
  const onGoogleLoginClick = (event) => {
    event.preventDefault();
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
    // getRedirectResult(auth).then((result) => {
    //   console.log(auth.currentUser);
    // });
  };
  return (
    <>
      <h2>Log in</h2>
      <button onClick={onGoogleLoginClick}>Continue with Google</button>
    </>
  );
};

export default Login;

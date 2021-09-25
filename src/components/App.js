import { onAuthStateChanged } from "@firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "../myFirebase";
import Navigator from "./Navigator";
import AppRouter from "./AppRouter";
import Loading from "./Loading";
import "./App.css";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(undefined);
  useEffect(() => {
    // component did mount
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData(user);
      } else {
        setUserData(undefined);
      }
      setIsLoading(false);
    });
  }, []);
  return (
    <div className="app-container">
      {isLoading ? <Loading /> : <AppRouter userData={userData} />}
    </div>
  );
}

export default App;

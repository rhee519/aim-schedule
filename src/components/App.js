import { onAuthStateChanged } from "@firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "../myFirebase";
import AppRouter from "./AppRouter";
import Loading from "./Loading";
import "./App.css";
// import NotFound from "../pages/NotFound";
// import Login from "../pages/Login";

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
      {/* {isLoading ? <Loading /> : <Login userData={userData} />} */}
    </div>
  );
}

export default App;

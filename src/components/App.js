import { onAuthStateChanged } from "@firebase/auth";
import React, { useEffect, useState } from "react";
import { auth } from "../myFirebase";
import AppRouter from "./AppRouter";
import Loading from "./Loading";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData(user);
      } else {
        setUserData(null);
      }
      setIsLoading(false);
    });
  }, []);
  return <>{isLoading ? <Loading /> : <AppRouter userData={userData} />}</>;
}

export default App;

import { collection, getDocs, onSnapshot } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import Status from "../components/Status";
import { db } from "../myFirebase";

import "./Admin.scss";

const Admin = ({ userData }) => {
  const [userList, setUserList] = useState([]);
  const fetchUserList = useCallback(async () => {
    const collectionRef = collection(db, "userlist");
    const fetchedList = [];
    const querySnap = await getDocs(collectionRef);
    querySnap.forEach((doc) => {
      fetchedList.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    setUserList(fetchedList);
  }, []);

  useEffect(() => {
    fetchUserList();
    const unsubscribe = onSnapshot(collection(db, "userlist"), (snapshot) => {
      fetchUserList();
    });

    return () => {
      unsubscribe();
    };
  }, [fetchUserList]);

  return (
    <div className="userlist--container">
      {userList.map((user, index) => (
        <Status key={index} user={user} />
      ))}
    </div>
  );
};

export default Admin;

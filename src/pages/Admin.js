import { collection, getDocs, onSnapshot } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import Status from "../components/Status";
import { db } from "../myFirebase";

import "../css/Admin.scss";

const Admin = () => {
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
    <div className="admin--container">
      <h2 className="admin--title">Admin</h2>
      {userList.map((user, index) => (
        <Status key={index} user={user} />
      ))}
    </div>
  );
};

export default Admin;

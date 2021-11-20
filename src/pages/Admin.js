import { collection, getDocs, onSnapshot } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { Box, Grid, List, Paper } from "@mui/material";
import Status from "../components/Status";
import { db } from "../myFirebase";

// import "../css/Admin.scss";

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
    <Box className="admin--container">
      <List>
        <Grid container columns={12} spacing={1}>
          <Grid item xs={12} md={6}>
            {userList.map((user, index) => (
              <Status key={index} user={user} />
            ))}
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper>Admin Notification</Paper>
          </Grid>
        </Grid>
      </List>
    </Box>
  );
};

export default Admin;

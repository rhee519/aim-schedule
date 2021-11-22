import { collection, getDocs, onSnapshot } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Grid,
  IconButton,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  Tab,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import Status from "../components/Status";
import { db } from "../myFirebase";
import { TabContext, TabList, TabPanel } from "@mui/lab";

const Admin = ({ match }) => {
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const fetchUserList = useCallback(async () => {
    const collectionRef = collection(db, "userlist");
    const fetchedList = [];
    const querySnap = await getDocs(collectionRef);
    querySnap.forEach((doc) => {
      fetchedList.push({
        ...doc.data(),
      });
    });
    setUserList(fetchedList);
  }, []);

  useEffect(() => {
    // userlist fetch
    // && 근로 on/off 모니터링
    fetchUserList();
    const unsubscribe = onSnapshot(collection(db, "userlist"), (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const data = change.doc.data();
          setUserList((list) => {
            const newList = [...list];
            const index = newList.findIndex((user) => user.uid === data.uid);
            newList[index] = data;
            return newList;
          });
        }
      });
    });
    return () => {
      unsubscribe();
    };
  }, [fetchUserList]);

  return (
    <>
      <Grid container columns={12} spacing={1}>
        <Grid item xs={12} md={6} lg={4}>
          <Stack spacing={1}>
            <UserListPanel users={userList} onClick={setSelectedUser} />
            {/* <Paper
              sx={{
                maxHeight: 400,
                overflowY: "auto",
                p: 1,
              }}
            >
              {userList.map((user, index) => (
                <ListItemButton
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    textTransform: "none",
                    borderRadius: 1,
                    p: 1,
                    mb: 1,
                    height: 40,
                  }}
                  onClick={() => setSelectedUser(user)}
                >
                  <Status user={user} />
                </ListItemButton>
              ))}
            </Paper> */}
            <AdminNotificationPanel
              sx={{
                display: {
                  xs: "none",
                  md: "block",
                },
              }}
            />
          </Stack>
        </Grid>
        <Grid item xs={12} md={6} lg={8}>
          <Stack spacing={1}>
            {selectedUser && <UserDisplay user={selectedUser} />}
            <AdminNotificationPanel
              sx={{
                display: {
                  xs: "block",
                  md: "none",
                },
              }}
            />
          </Stack>
        </Grid>
      </Grid>
    </>
  );
};

const UserListPanel = (props) => {
  const { users, onClick } = props;
  return (
    <Paper
      sx={{
        maxHeight: 400,
        overflowY: "auto",
        p: 1,
      }}
    >
      {users.map((user, index) => (
        <ListItemButton
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            textTransform: "none",
            borderRadius: 1,
            p: 1,
            mb: 1,
            height: 40,
          }}
          onClick={() => onClick(user)}
        >
          <Status user={user} />
        </ListItemButton>
      ))}
    </Paper>
  );
};

const UserDisplay = ({ user }) => {
  const [value, setValue] = useState("1");
  const handleChange = (event, value) => setValue(value);
  return (
    <Paper>
      <ListItem
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Status user={user} />
        <Box sx={{ display: "flex", flexGrow: 1, justifyContent: "flex-end" }}>
          <IconButton size="small">
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      </ListItem>
      <Box>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange}>
              <Tab label="이번 달" value="1" />
              <Tab label="다음 달" value="2" />
            </TabList>
          </Box>
          <TabPanel value="1">1</TabPanel>
          <TabPanel value="2">2</TabPanel>
        </TabContext>
      </Box>
    </Paper>
  );
};

const AdminNotificationPanel = (props) => {
  return <Paper {...props}>admin notification panel</Paper>;
};

export default Admin;

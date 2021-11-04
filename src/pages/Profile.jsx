import { useCallback, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
// import "../css/Profile.scss";
import { Avatar, Button, Paper, Typography } from "@mui/material";
import { UserContext } from "../contexts/Context";
import { auth, db } from "../myFirebase";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { doc, getDoc, onSnapshot } from "@firebase/firestore";

const Error = (error) => {
  console.log("from Profile.js");
  console.log(error);
};

export const ProfileAvatar = () => {
  const userData = useContext(UserContext);
  const [working, setWorking] = useState();

  const fetchUser = useCallback(async () => {
    const userRef = doc(db, "userlist", userData.uid);
    await getDoc(userRef)
      .then((docSnap) => setWorking(docSnap.data().isWorking))
      .catch(Error);
  }, [userData.uid]);

  const color = working ? "rgb(96, 207, 23)" : "#9c1919";

  useEffect(() => {
    fetchUser();
    const unsub = onSnapshot(doc(db, "userlist", userData.uid), (qsnap) =>
      fetchUser()
    );
    return () => {
      setWorking(null);
      unsub();
    };
  }, [fetchUser, userData.uid]);

  return (
    <Link
      className="nav--menu nav--profile"
      to="/profile"
      // style={{
      //   display: "flex",
      // }}
    >
      <Button
        size="large"
        edge="start"
        color="inherit"
        aria-label="profile"
        // sx={{
        //   boxShadow:
        //     "rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset",
        // }}
      >
        {userData ? (
          <Paper
            sx={{
              width: 100,
              height: 25,
              padding: 0.5,
              backgroundColor: color,
              boxShadow: `rgb(${color}, 0.99) 0px 3px 8px`,
            }}
          >
            <Typography
              variant="body"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                color: "#fff",
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              {working ? "Working" : "Offline"}
              <Avatar
                src={userData.profileImageURL}
                alt={userData.userName}
                sx={{
                  ml: 1,
                  width: 20,
                  height: 20,
                }}
              />
            </Typography>
          </Paper>
        ) : (
          <AccountCircle />
        )}
      </Button>
    </Link>
  );
};

const Profile = () => {
  const userData = useContext(UserContext);
  const history = useHistory();
  const onLogOutClick = async () => {
    await auth.signOut().then(() => {
      // back to sign-in page
      history.push("/");
    });
  };

  return (
    <div className="profile--container">
      <h2 className="profile--title">Profile</h2>
      <div className="profile--content">
        <img src={userData.profileImageURL} alt="" />
        <h2 className="profile--name">{userData.userName}</h2>
        <span className="profile--email">{userData.email}</span>
        <div className="button--container">
          <button className="profile--logout-btn" onClick={onLogOutClick}>
            <i className="material-icons">logout</i>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

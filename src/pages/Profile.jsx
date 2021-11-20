import { useCallback, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
// import "../css/Profile.scss";
import { Avatar, IconButton } from "@mui/material";
import { UserContext } from "../contexts/Context";
import { auth, db } from "../myFirebase";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { doc, getDoc, onSnapshot } from "@firebase/firestore";
import { StyledBadge } from "../components/Styles";

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

  // const color = working ? "rgb(96, 207, 23)" : "#9c1919";

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
    <Link className="nav--menu nav--profile" to="/profile">
      <IconButton
        size="small"
        edge="start"
        color="inherit"
        aria-label="profile"
      >
        {userData ? (
          // <Paper
          //   sx={{
          //     // width: 100,
          //     padding: 0.25,
          //     bgcolor: working ? "success.main" : "error.main",
          //     // borderRadius: "100%",
          //     boxShadow: `rgb(${color}, 0.99) 0px 3px 8px`,
          //   }}
          // >
          //   <Typography
          //     variant="body"
          //     sx={{
          //       display: "flex",
          //       alignItems: "center",
          //       justifyContent: "center",
          //       width: "100%",
          //       height: "100%",
          //       color: "#fff",
          //       textTransform: "uppercase",
          //       fontWeight: 700,
          //     }}
          //   >
          //     {working ? "Working" : "Offline"}
          //   </Typography>
          //   <StyledBadge
          //     overlap="circular"
          //     anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          //     variant="dot"
          //     badgeContent={!working && 0}
          //   >
          //     <Avatar
          //       src={userData.profileImageURL}
          //       alt={userData.userName}
          //       sx={{
          //         width: 24,
          //         height: 24,
          //       }}
          //     />
          //   </StyledBadge>
          // </Paper>
          <StyledBadge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            badgeContent={!working && 0}
          >
            <Avatar
              src={userData.profileImageURL}
              alt={userData.userName}
              sx={{
                width: 24,
                height: 24,
              }}
            />
          </StyledBadge>
        ) : (
          <AccountCircle />
        )}
      </IconButton>
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

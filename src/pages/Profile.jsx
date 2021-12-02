import { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";
import { UserContext } from "../contexts/Context";
import { auth, db } from "../myFirebase";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { doc, onSnapshot } from "@firebase/firestore";
import { StyledBadge } from "../components/Styles";
import LogoutIcon from "@mui/icons-material/Logout";

// const Error = (error) => {
//   console.log("from Profile.js");
//   console.log(error);
// };

export const ProfileAvatar = () => {
  const user = useContext(UserContext);
  const [working, setWorking] = useState();
  // const fetchUser = useCallback(async () => {
  //   const userRef = doc(db, "userlist", user.uid);
  //   await getDoc(userRef)
  //     .then((docSnap) => setWorking(docSnap.data().isWorking))
  //     .catch(Error);
  // }, [user.uid]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "userlist", user.uid), (docSnap) => {
      if (docSnap.exists()) setWorking(docSnap.data().isWorking);
    });
    return () => {
      setWorking(null);
      unsub();
    };
  }, [user.uid]);

  return (
    <Link className="nav--menu nav--profile" to="/profile">
      <IconButton
        size="small"
        edge="start"
        color="inherit"
        aria-label="profile"
      >
        {user ? (
          <StyledBadge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            badgeContent={!working && 0}
          >
            <Avatar
              src={user.profileImageURL}
              alt={user.userName}
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
  const user = useContext(UserContext);
  const history = useHistory();
  const onLogOutClick = async () => {
    await auth.signOut().then(() => {
      // back to sign-in page
      history.push("/");
    });
  };

  return (
    <Card sx={{ position: "relative", display: "flex", alignItems: "center" }}>
      <CardMedia
        component="img"
        src={user.profileImageURL}
        alt="profile image"
        sx={{ width: 128 }}
      />
      <CardContent>
        <Box>
          <Box display="flex" alignItems="flex-end">
            <Typography variant="h6" mr={1} fontWeight={700}>
              {user.userName}
            </Typography>
            <Typography variant="subtitle2">{user.position}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" component="div">
            {user.email}
          </Typography>
        </Box>
        <Button variant="contained" color="error" onClick={onLogOutClick}>
          <LogoutIcon size="small" />
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};

export default Profile;

import { useHistory } from "react-router";
import { auth } from "../myFirebase";

const Profile = ({ userData }) => {
  const history = useHistory();
  const onLogOutClick = () => {
    auth.signOut();
    history.push("/");
  };

  return (
    <div>
      <h2>Profile</h2>
      <h2>{userData.displayName}</h2>
      <img src={userData.photoURL} alt="" />
      <span>{userData.email}</span>
      <button onClick={onLogOutClick}>Log Out</button>
    </div>
  );
};

export default Profile;

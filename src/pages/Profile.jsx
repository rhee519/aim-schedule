import { useContext } from "react";
import { useHistory } from "react-router";
import { UserContext } from "../contexts/Context";
import { auth } from "../myFirebase";
import "../css/Profile.scss";

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

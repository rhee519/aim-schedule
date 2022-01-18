import {
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
} from "@firebase/auth";
import {
  Backdrop,
  Box,
  Button,
  Divider,
  FormControl,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import React, { useState, useEffect } from "react";
import { auth } from "../myFirebase";
import { QRreader } from "../components/QR";

const ERROR_INVALID_EMAIL = "auth/invalid-email";
const ERROR_USER_NOT_FOUND = "auth/user-not-found";
const ERROR_WRONG_PASSWORD = "auth/wrong-password";

const Login = () => {
  // const [ip, setIp] = useState();
  const [QRReaderOpen, setQRReaderOpen] = useState(false);
  const [QRLogin, setQRLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState();

  // useEffect(() => {
  //   fetch("https://ipinfo.io/json?token=1f7b7ebad3530c")
  //     .then((res) => res.json())
  //     .then((jsonRes) => setIp(jsonRes.ip));
  // }, []);

  const onGoogleLoginClick = (event) => {
    event.preventDefault();
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider);
  };

  const handleQRReaderClose = (event) => {
    const {
      target: { id },
    } = event;
    if (id !== "btn--camera-change") {
      setQRReaderOpen(false);
    }
  };

  const handleLoginOpenClick = () => {
    setQRLogin(true);
  };

  const handleEmailChange = (event) => setEmail(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);
  const handleLoginClick = (event) => {
    signInWithEmailAndPassword(auth, email, password)
      .then((cred) => {
        console.log(cred);
        setError(null);
      })
      .catch((error) => {
        setError(error.code);
      });
  };

  useEffect(() => {
    return () => {
      // setIp();
      setError();
      setEmail();
      setPassword();
    };
  }, []);

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="primary.main"
    >
      <Paper sx={{ p: 2, width: "50vw" }}>
        <Typography
          variant="button"
          component="div"
          sx={{ m: 1, fontSize: 24 }}
        >
          Sign in
        </Typography>
        <Divider variant="fullWidth" />
        <Typography varaint="body2" component="p">
          인사 관리 서비스 AIM-Schedule입니다.
        </Typography>

        <Button
          fullWidth
          color="success"
          variant="contained"
          id="social--container"
          onClick={onGoogleLoginClick}
          sx={{ mb: 1 }}
        >
          Continue with Google
          <GoogleIcon fontSize="small" sx={{ ml: 1 }} />
        </Button>
        {!QRLogin && (
          <Button
            fullWidth
            color="warning"
            variant="contained"
            onClick={handleLoginOpenClick}
          >
            QR 스캐너 로그인
          </Button>
        )}
        {QRLogin && (
          <FormControl fullWidth>
            <Stack direction="row" justifyContent="space-between">
              <Box flexGrow={1}>
                <TextField
                  fullWidth
                  value={email}
                  label="Email"
                  variant="outlined"
                  size="small"
                  onChange={handleEmailChange}
                  // error={Boolean(error)}
                />
                <TextField
                  fullWidth
                  value={password}
                  label="Password"
                  variant="outlined"
                  size="small"
                  type="password"
                  onChange={handlePasswordChange}
                  // error={Boolean(error)}
                />
              </Box>
              <Button
                variant="contained"
                // type="submit"
                onClick={handleLoginClick}
                disabled={!email || !password}
              >
                Log in
              </Button>
            </Stack>
            <Typography variant="body2" color="error">
              {error === ERROR_INVALID_EMAIL
                ? "이메일 형식의 아이디를 입력해주세요."
                : error === ERROR_USER_NOT_FOUND
                ? "잘못된 이메일 주소입니다."
                : error === ERROR_WRONG_PASSWORD
                ? "잘못된 패스워드입니다."
                : ""}
            </Typography>
          </FormControl>
        )}
      </Paper>

      {/* QR Reader Modal */}
      <Backdrop
        open={QRReaderOpen}
        onClick={handleQRReaderClose}
        sx={{
          height: "100vh",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        {QRReaderOpen && <QRreader />}
      </Backdrop>
    </Box>
  );
};

export default Login;

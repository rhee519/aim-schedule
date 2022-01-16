import { GoogleAuthProvider, signInWithRedirect } from "@firebase/auth";
import {
  Backdrop,
  Box,
  Button,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import React, { useState, useEffect } from "react";
import { auth } from "../myFirebase";
import { QRreader } from "../components/QR";

const Login = () => {
  const [ip, setIp] = useState();
  const [QRReaderOpen, setQRReaderOpen] = useState(false);

  useEffect(() => {
    fetch("https://ipinfo.io/json?token=1f7b7ebad3530c")
      .then((res) => res.json())
      .then((jsonRes) => setIp(jsonRes.ip));
  }, []);

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

  const handleQRReaderToggle = () => setQRReaderOpen(!QRReaderOpen);

  return (
    <Box
      height="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgcolor="primary.main"
    >
      <Paper sx={{ p: 2 }}>
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
        >
          Continue with Google
          <GoogleIcon fontSize="small" sx={{ ml: 1 }} />
        </Button>
        <Button
          fullWidth
          color="warning"
          variant="contained"
          onClick={handleQRReaderToggle}
          sx={{ mt: 1 }}
          disabled={
            ip !== process.env.REACT_APP_ALLOWED_IP_ADDRESS_PROD &&
            ip !== process.env.REACT_APP_ALLOWED_IP_ADDRESS_DEV
          }
        >
          QR 스캐너
        </Button>
      </Paper>

      {/* QR Reader Modal */}
      <Backdrop
        open={QRReaderOpen}
        onClick={handleQRReaderClose}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        {QRReaderOpen && <QRreader />}
      </Backdrop>
    </Box>
  );
};

export default Login;

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const LoginPage = ({ setUser }) => {
    const handleLoginSuccess = async (credentialResponse) => {
        try {
            const { credential } = credentialResponse;
            const res = await axios.post( `${import.meta.env.VITE_BACKEND_URL}/api/login`, {
                idToken: credential,
            });
            setUser(res.data.user);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLoginFailure = (error) => {
        console.error('Login failed:', error);
    };

    return (
        <div className="login-container">
            <h1>Welcome to YourNotes</h1>
            <p>Your personal space for thoughts and ideas. Sign in to continue.</p>
            <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginFailure}
                useOneTap
            />
        </div>
    );
};

export default LoginPage;

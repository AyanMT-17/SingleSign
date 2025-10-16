import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import NotesPage from './pages/NotesPage';
import './App.css';

axios.defaults.withCredentials = true;

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await axios.get( `${import.meta.env.VITE_BACKEND_URL}/api/user`);
                setUser(res.data.user);
            } catch (error) {
                console.log('No user logged in');
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="App">
            <Routes>
                <Route
                    path="/login"
                    element={!user ? <LoginPage setUser={setUser} /> : <Navigate to="/" />}
                />
                <Route
                    path="/"
                    element={user ? <NotesPage user={user} setUser={setUser} /> : <Navigate to="/login" />}
                />
            </Routes>
        </div>
    );
}

export default App;

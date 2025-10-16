import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotesPage = ({ user, setUser }) => {
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/notes', { withCredentials: true });
                setNotes(res.data.notes);
            } catch (error) {
                console.error('Failed to fetch notes:', error);
            }
        };
        fetchNotes();
    }, []);

    const handleAddNote = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;
        try {
            const res = await axios.post('http://localhost:5000/api/notes', { content: newNote }, { withCredentials: true });
            setNotes([...notes, res.data.note]);
            setNewNote('');
        } catch (error) {
            console.error('Failed to add note:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true });
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <div className="notes-container">
            <header>
                <h1>My Notes</h1>
                <div>
                    <span>Welcome, {user.name}!</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>
            <form onSubmit={handleAddNote}>
                <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a new note..."
                />
                <button type="submit">Add Note</button>
            </form>
            <ul className="notes-list">
                {notes.map((note) => (
                    <li key={note.id}>{note.content}</li>
                ))}
            </ul>
        </div>
    );
};

export default NotesPage;

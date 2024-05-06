import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const location = useLocation();
    const username = new URLSearchParams(location.search).get('username');

    const [documents, setDocuments] = useState([]);
    const [filename, setFilename] = useState('');

    useEffect(() => {
        fetchDocuments();
    }, [username]);

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`https://apt-backend.onrender.com/documents/${username}`);
            if (!response.ok) {
                throw new Error('Failed to fetch documents');
            }
            const data = await response.json();
            setDocuments(data);
        } catch (error) {
            console.error('Error fetching documents:', error);
        }
    };

    const handleCreateDocument = async () => {
        try {
            const response = await fetch('https://apt-backend.onrender.com/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: filename,
                    author: username,
                    content: '' // You can provide default content or leave it empty
                })
            });
            if (!response.ok) {
                throw new Error('Failed to create document');
            }
            const createdDocument = await response.json();
            setDocuments([...documents, createdDocument]); // Add the newly created document to the list
            setFilename(''); // Clear the filename input field after creating the document
        } catch (error) {
            console.error('Error creating document:', error);
        }
    };

    return (
        <div className="home">
            <header>
                <h1>Welcome, {username}!</h1>
            </header>
            <section className="document-list">
                <h2>My Documents</h2>
                <ul>
                    {documents.map(document => (
                        <li key={document.id}>{document.filename}</li>
                    ))}
                </ul>
            </section>
            <section className="create-document">
                <h2>Create New Document</h2>
                <input
                    type="text"
                    placeholder="Enter filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                />
                <button onClick={handleCreateDocument}>Create Document</button>
            </section>
        </div>

    );
};


export default Home;
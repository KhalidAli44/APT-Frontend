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
                    content: ''
                })
            });
            if (!response.ok) {
                throw new Error('Failed to create document');
            }
            const createdDocument = await response.json();
            setDocuments([...documents, createdDocument]);
            setFilename(''); 
        } catch (error) {
            console.error('Error creating document:', error);
        }
    };

    const handleDocumentClick = (document) => {
        const queryString = `?username=${username}&documentId=${document.id}&filename=${encodeURIComponent(document.filename)}&author=${encodeURIComponent(document.author)}&content=${encodeURIComponent(document.content)}`;
        window.location.href = `/TextEditor${queryString}`;
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
                        <li key={document.id} onClick={() => handleDocumentClick(document)}>
                            {document.filename}
                        </li>
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
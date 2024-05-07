import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const location = useLocation();
    const username = new URLSearchParams(location.search).get('username');

    const [documents, setDocuments] = useState([]);
    const [sharedDocuments, setSharedDocuments] = useState([]);
    const [filename, setFilename] = useState('');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [usernameInput, setUsernameInput] = useState('');
    const [canEdit, setCanEdit] = useState(false);

    useEffect(() => {
        fetchDocuments();
        fetchSharedDocuments();
    }, [username, selectedDocument]);

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

    const fetchSharedDocuments = async () => {
        try {
            const response = await fetch(`https://apt-backend.onrender.com/shared/${username}`);
            if (!response.ok) {
                throw new Error('Failed to fetch shared documents');
            }
            const data = await response.json();
            setSharedDocuments(data);
        } catch (error) {
            console.error('Error fetching shared documents:', error);
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

    const handleOpenDocument = (document) => {
        const queryString = `?username=${username}&documentId=${document.id}&filename=${encodeURIComponent(document.filename)}&author=${encodeURIComponent(document.author)}&content=${encodeURIComponent(document.content)}`;
        window.location.href = `/TextEditor${queryString}`;
    };

    const handleDocumentClick = (document) => {
        setSelectedDocument(document);
    };

    const handleSendDocument = async () => {
        if (!selectedDocument || !usernameInput) {
            console.error('Please select a document and enter a username.');
            return;
        }

        try {
            const response = await fetch('https://apt-backend.onrender.com/shared', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: usernameInput,
                    documentId: selectedDocument.id,
                    canEdit: canEdit
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send document');
            }

            // Reset selected document, username input, and canEdit after successful send
            setSelectedDocument(null);
            setUsernameInput('');
            setCanEdit(false);
        } catch (error) {
            console.error('Error sending document:', error);
        }
    };

    const handleDeleteDocument = async () => {
        if (!selectedDocument) {
            console.error('Please select a document.');
            return;
        }

        try {
            const response = await fetch(`https://apt-backend.onrender.com/documents/${selectedDocument.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error('Failed to delete document');
            }
            setSelectedDocument(null);
            console.log('Document deleted successfully');
        } catch (error) {
            console.error('Error deleting document:', error);
        }
    };


    return (
        <div className="home">
            <header>
                <h1>Welcome, {username}!</h1>
            </header>
            <section className="document-list-container">
                <section className="document-list">
                    <h2>My Documents</h2>
                    <ul>
                        {documents.map(document => (
                            <li key={document.id}>
                                <input
                                    type="radio"
                                    name="document"
                                    checked={selectedDocument && selectedDocument.id === document.id}
                                    onChange={() => handleDocumentClick(document)}
                                />
                                <span onClick={() => handleOpenDocument(document)}>{document.filename}</span>
                            </li>
                        ))}
                    </ul>
                </section>
                <section className="shared-document-list">
                    <h2>Shared with Me</h2>
                    <ul>
                        {sharedDocuments.map(document => (
                            <li key={document.id} onClick={() => handleOpenDocument(document)}>
                                {document.filename}
                            </li>
                        ))}
                    </ul>
                </section>
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
            <section className="send-document">
                <h2>Send Document</h2>
                <input
                    type="text"
                    placeholder="Enter username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                />
                <label>
                    <input
                        type="checkbox"
                        checked={canEdit}
                        onChange={() => setCanEdit(!canEdit)}
                    />
                    Can Edit
                </label>
                <button onClick={handleSendDocument}>Send Document</button>
            </section>
            <section>
                <button onClick={handleDeleteDocument}>Delete Document</button>
            </section>
        </div>
    );
};

export default Home;

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Modal from 'react-modal';
import './Home.css';
import ManagePermissionsModal from './ManagePermissionsModal'; 

const Home = () => {
    const location = useLocation();
    const username = new URLSearchParams(location.search).get('username');

    const [documents, setDocuments] = useState([]);
    const [enabledSharedDocuments, setEnabledSharedDocuments] = useState([]);
    const [disabledSharedDocuments, setDisabledSharedDocuments] = useState([]);
    const [filename, setFilename] = useState('');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [usernameInput, setUsernameInput] = useState('');
    const [fileNameInput, setFileNameInput] = useState('');
    const [canEdit, setCanEdit] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false); 
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);

    useEffect(() => {
        fetchDocuments();
        fetchEnabledSharedDocuments();
        fetchDisabledSharedDocuments();
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

    const fetchEnabledSharedDocuments = async () => {
        try {
            const response = await fetch(`https://apt-backend.onrender.com/shared/enabled/${username}`);
            if (!response.ok) {
                throw new Error('Failed to fetch shared documents');
            }
            const data = await response.json();
            setEnabledSharedDocuments(data);
        } catch (error) {
            console.error('Error fetching shared documents:', error);
        }
    };

    const fetchDisabledSharedDocuments = async () => {
        try {
            const response = await fetch(`https://apt-backend.onrender.com/shared/disabled/${username}`);
            if (!response.ok) {
                throw new Error('Failed to fetch shared documents');
            }
            const data = await response.json();
            setDisabledSharedDocuments(data);
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

    const handleSendDocument = async () => {
        if (!usernameInput) {
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

    const handleRenameDocument = async () => {
        if (!fileNameInput) {
            console.error('Please select a document and enter a file name.');
            return;
        }

        selectedDocument.filename = fileNameInput;

        try {
            const response = await fetch(`https://apt-backend.onrender.com/documents/rename/${selectedDocument.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedDocument)
            });
    
            if (!response.ok) {
                throw new Error('Failed to update document filename');
            }
    
            // Handle success
            setSelectedDocument(null);
            setFileNameInput('');
    
        } catch (error) {
            console.error('Error renaming document:', error);
        }

    };

    const handleDeleteDocument = async (document) => {

        try {
            const response = await fetch(`https://apt-backend.onrender.com/documents/${document.id}`, {
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

    const handleManagePermissions = async (document) => {
        setSelectedDocument(document);
        setIsModalOpen(true);
    };

    const handleRenameModalOpen = (document) => {
        setSelectedDocument(document);
        setIsRenameModalOpen(true);
    };

    const handleRenameModalClose = () => {
        setIsRenameModalOpen(false);
    };

    const handleSendModalOpen = (document) => {
        setSelectedDocument(document);
        setIsSendModalOpen(true);
    };
    
    const handleSendModalClose = () => {
        setIsSendModalOpen(false);
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
                                <span onClick={() => handleOpenDocument(document)}>{document.filename}</span>
                                <button onClick={() => handleRenameModalOpen(document)}>Rename</button>
                                <button onClick={() => handleManagePermissions(document)}>Manage</button>
                                <button onClick={() => handleSendModalOpen(document)}>Send</button>
                                <button onClick={() => handleDeleteDocument(document)}>Delete</button>
                            </li>
                        ))}
                    </ul>
                </section>
                <section className="shared-document-list">
                    <h2>Shared with Me, Enabled</h2>
                    <ul>
                        {enabledSharedDocuments.map(document => (
                            <li key={document.id}>
                            <span onClick={() => handleOpenDocument(document)}>{document.filename}</span>
                            <button onClick={() => handleRenameModalOpen(document)}>Rename</button>
                            <button onClick={() => handleSendModalOpen(document)}>Send</button>
                        </li>
                        ))}
                    </ul>
                </section>
                <section className="shared-document-list">
                    <h2>Shared with Me, Disabled</h2>
                    <ul>
                        {disabledSharedDocuments.map(document => (
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
            <ManagePermissionsModal
                isOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                document={selectedDocument} 
            >
                <h2>Manage Permissions</h2>
                <button onClick={() => setIsModalOpen(false)}>Close</button>
            </ManagePermissionsModal>
            {isRenameModalOpen && (
                <Modal isOpen={isRenameModalOpen} onRequestClose={handleRenameModalClose}>
                    <section className="rename-document">
                        <h2>Rename Document</h2>
                        <input
                            type="text"
                            placeholder="Enter new name"
                            value={fileNameInput}
                            onChange={(e) => setFileNameInput(e.target.value)}
                        />
                        <button onClick={handleRenameDocument}>Rename Document</button>
                        <button onClick={handleRenameModalClose}>Cancel</button>
                    </section>
                </Modal>
            )}
            {isSendModalOpen && (
                <Modal isOpen={isSendModalOpen} onRequestClose={handleSendModalClose}>
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
                        <button onClick={handleSendModalClose}>Cancel</button>
                    </section>
                </Modal>
            )}
        </div>
    );
};

export default Home;

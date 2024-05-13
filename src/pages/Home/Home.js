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
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState('myDocuments');

    function openNav() {
        document.getElementById("mySidenav").style.width = "250px";
    }
    
    function closeNav() {
        document.getElementById("mySidenav").style.width = "0";
    }
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
            setIsCreateModalOpen(false);
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
            setIsSendModalOpen(false);
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
            setIsRenameModalOpen(false);
    
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
            fetchDocuments();
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

    const handleCreateModalOpen = () => {
        setIsCreateModalOpen(true);
    };
    
    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
    };

    return (
        <div className="home">
            <div className='header'>
                <p>Welcome, {username}!</p>
                <div className='header-options'>
                    <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                        <option value="myDocuments">My Documents</option>
                        <option value="sharedWithMe">Shared with Me</option>
                    </select>
                    <button onClick={() => handleCreateModalOpen()}>+</button>
                </div>
            </div>
            <div className="document-list-container">
                {selectedSection === 'myDocuments' && (
                    <div className="document-container">
                     <div className="document-list">   
                        <h2>My Documents</h2>
                        <ul>
                            {documents.map(document => (
                                <li className='document-list' key={document.id}>
                                    
                                        <p onClick={() => handleOpenDocument(document)}>{document.filename}</p>
                                        <div className='buttons-container'>
                                        <button onClick={() => handleOpenDocument(document)}>Edit</button>
                                            <button onClick={() => handleRenameModalOpen(document)}>Rename</button>
                                            <button onClick={() => handleManagePermissions(document)}>Manage</button>
                                            <button onClick={() => handleSendModalOpen(document)}>Send</button>
                                            <button onClick={() => handleDeleteDocument(document)}>Delete</button>
                                        
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                )}
                {selectedSection === 'sharedWithMe' && (
                    <div className="document-container">
                    <div className="document-list">
                        <h2>Shared with Me</h2>
                        <ul>
                            {enabledSharedDocuments.map(document => (
                                <li key={document.id}>
                                    <p onClick={() => handleOpenDocument(document)}>{document.filename}</p>
                                    <div className='buttons-container buttons-container-shared'>
                                            <button onClick={() => handleOpenDocument(document)}>Edit</button>
                                            <button onClick={() => handleRenameModalOpen(document)}>Rename</button>
                                            <button onClick={() => handleManagePermissions(document)}>Manage</button>
                                            <button onClick={() => handleSendModalOpen(document)}>Send</button>
                                            <button onClick={() => handleDeleteDocument(document)}>Delete</button>
                                        </div>
                                </li>
                            ))}
                            {disabledSharedDocuments.map(document => (
                                <li key={document.id}>
                                    <span onClick={() => handleOpenDocument(document)}>{document.filename}</span>
                                    <p><i>(View Only)</i></p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                )}
            </div>
            <div id="mySidenav" class="sidenav">
                <a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>
                <a href="#">Settings</a>
                 <a href="#">Logout</a>
            </div>

<span onclick="openNav()">Open Settings</span>
            <ManagePermissionsModal
                isOpen={isModalOpen}
                closeModal={() => setIsModalOpen(false)}
                document={selectedDocument} 
            >
            <div className="Manage-document">
                <h2>Manage Permissions</h2>
                <button onClick={() => setIsModalOpen(false)}>Cancel</button>
            </div>
            </ManagePermissionsModal>
            {isRenameModalOpen && (
                <Modal isOpen={isRenameModalOpen} onRequestClose={handleRenameModalClose}>
                    <div className="rename-document">
                        <h2>Rename Document</h2>
                        <input
                            type="text"
                            placeholder="Enter new name"
                            value={fileNameInput}
                            onChange={(e) => setFileNameInput(e.target.value)}
                        />
                        <button onClick={handleRenameDocument}>Rename Document</button>
                        <button onClick={handleRenameModalClose}>Cancel</button>
                    </div>
                </Modal>
            )}
            {isSendModalOpen && (
                <Modal isOpen={isSendModalOpen} onRequestClose={handleSendModalClose}>
                    <div className="send-document">
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
                    </div>
                </Modal>
            )}
            {isCreateModalOpen && (
                <Modal isOpen={isCreateModalOpen} onRequestClose={handleCreateModalClose}>
                    <div className="create-document">
                        <h2>Create New Document</h2>
                        <input
                            type="text"
                            placeholder="Enter filename"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                        />
                        <button onClick={handleCreateDocument}>Add</button>
                        <button onClick={handleCreateModalClose}>Cancel</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Home;

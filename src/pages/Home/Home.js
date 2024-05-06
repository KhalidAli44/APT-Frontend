import React from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const location = useLocation();
    const [documents, setDocuments] = React.useState([]);

    // Function to add a new document
    const addDocument = () => {
        // Logic to create a new document and add it to the list of documents
        const newDocument = {
            id: Date.now(), // Generate a unique ID for the document
            title: "Untitled Document",
            content: ""
        };
        setDocuments([...documents, newDocument]);
    };

    return (
        <div className="home-container">
            <h1>Welcome to the Text Editor</h1>
            <button onClick={addDocument}>Add New Document</button>
            <ul>
                {documents.map((document) => (
                    <li key={document.id}>{document.title}</li>
                ))}
            </ul>
        </div>
    );
};

export default Home;
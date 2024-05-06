import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const location = useLocation();
    const username = new URLSearchParams(location.search).get('username');

    const [documents, setDocuments] = useState([]);

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
        </div>
    );
};

export default Home;
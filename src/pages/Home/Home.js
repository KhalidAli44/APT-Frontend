import React from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const location = useLocation();
    const username = new URLSearchParams(location.search).get('username');

    return (
        <div><h1>Hi, {username}</h1></div>
    );
};

export default Home;

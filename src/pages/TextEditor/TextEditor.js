import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './TextEditor.css';

const TextEditor = () => {

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const documentId = queryParams.get('documentId');
    const filename = queryParams.get('filename');
    const author = queryParams.get('author');
    const content = queryParams.get('content');


    return (
        <div><h1>{filename}, By {author}</h1></div>
    );
};

export default TextEditor;
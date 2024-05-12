import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; 
import './TextEditor.css';

const TextEditor = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const documentId = queryParams.get('documentId');
    const filename = queryParams.get('filename');
    const author = queryParams.get('author');
    const content = queryParams.get('content');

    const editorRef = useRef(null);

    const [stompClient, setStompClient] = useState(null);
    const [cursorIndex, setCursorIndex] = useState(null);
    const [insertedCharacter, setInsertedCharacter] = useState(null);

    useEffect(() => {
        const socket = new SockJS('https://apt-backend.onrender.com/ws');
        const client = Stomp.over(socket);

        client.connect({}, () => {
            client.subscribe(`/all/broadcast/${documentId}`, (message) => {
                const receivedMessage = message.body;
                console.log(receivedMessage);
            });
        });

        setStompClient(client);

        return () => {
            //client.disconnect();
        };

    }, []);
    
    useEffect(() => {
        if (!editorRef.current) {
            editorRef.current = new Quill('#editor-container', {
                modules: {
                    toolbar: [
                        ['bold', 'italic']
                    ],
                },
                theme: 'snow'
            });

            editorRef.current.on('text-change', handleTextChange);

            editorRef.current.setText('');
            editorRef.current.clipboard.dangerouslyPasteHTML(content);
        }
    }, [content]);

    const handleSave = () => {
        const newContent = editorRef.current.root.innerHTML;
        
        const documentObject = {
            _id: documentId,
            filename: filename,
            author: author,
            content: newContent
        };

        fetch(`https://apt-backend.onrender.com/documents/update/${documentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(documentObject),
        })
        .then(response => {
            if (response.ok) {
                console.log('Document saved successfully.');
            } else {
                console.error('Failed to save document.');
            }
        })
        .catch(error => {
            console.error('Error saving document:', error);
        });
    };

    const handleSendMessage = () => {
        if (stompClient !== null) {
            stompClient.send(`/app/operation/${documentId}`, {}, editorRef.current.root.innerHTML);
        }
    };

    const insertCharacter = (index, character) => {
        editorRef.current.insertText(index, character);
    };

    const handleTextChange = (delta, oldDelta, source) => {
        if (source === 'user') {
            let index = null;
            let insertedChar = null;
            delta.ops.forEach(op => {
              if (op.insert) {
                if (typeof op.insert === 'string') {
                  index = editorRef.current.getIndex(op);
                  insertedChar = op.insert;
                } else if (typeof op.insert === 'object') {
                  if (op.insert.hasOwnProperty('image')) {
                    index = editorRef.current.getIndex(op);
                    insertedChar = '[IMAGE]';
                  }
                }
              }
            });
            setCursorIndex(index);
            setInsertedCharacter(insertedChar);
            handleSendMessage();
        }
    };

    return (
        <div>
            <div>
                <h1>{filename}, By {author}</h1>
                <button onClick={handleSave}>Save</button>
            </div>
            <div id="editor-container" className="editor-container" />
            <button onClick={handleSendMessage}>Send</button>
        </div>
    );
};

export default TextEditor;

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
    const [content, setContent] = useState(queryParams.get('content'));

    const editorRef = useRef(null);
    const stompClientRef = useRef(null);

    const [buffer, setBuffer] = useState(content);

    useEffect(() => {
        // Initialize Stomp client
        const socket = new SockJS('https://apt-backend.onrender.com/ws');
        const client = Stomp.over(socket);
    
        client.connect({}, () => {
            console.log('WebSocket connection established.');
            stompClientRef.current = client;
    
            // Subscribe to the message channel
            if (stompClientRef.current) {
                stompClientRef.current.subscribe(`/all/broadcast/${documentId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    console.log(receivedMessage.insertedIndex + ", " +  receivedMessage.insertedChar);
                    insertAtIndex(receivedMessage.insertedIndex, receivedMessage.insertedChar);
                    
                    console.log("buffer1 = " + buffer);
                });
            }
        }, (error) => {
            console.error('WebSocket connection failed:', error);
        });
    
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }
        };
    }, [documentId]);
    
    
    
    

    useEffect(() => {
        if (!editorRef.current) {
            // Initialize Quill editor
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

    useEffect(() => {
        console.log("buffer2 = " + buffer);
        setContent(buffer);
        const plainText = buffer.replace(/<[^>]+>/g, ''); 
        editorRef.current.setText(plainText);
        editorRef.current.setSelection(plainText.length);
        console.log("plainText = " + plainText);
    }, [buffer]);

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

    const handleSendMessage = (insertedIndex, insertedChar) => {
        if (stompClientRef.current !== null) {
            stompClientRef.current.send(`/app/operation/${documentId}`, {}, JSON.stringify({ insertedIndex, insertedChar }));
        }
    };

    const handleTextChange = (delta, oldDelta, source) => {
        if (source === 'user') {
            let insertedIndex = null;
            let insertedChar = null;
            let textSize = null;
    
            delta.ops.forEach(op => {

                const selection = editorRef.current.getSelection();
                if (selection) {
                    const content = editorRef.current.getText(0, editorRef.current.getLength());
                    textSize = content.length;
                }

                if (op.insert) {
                    if (typeof op.insert === 'string') {
                        if (textSize === 2) {
                            insertedIndex = editorRef.current.getSelection().index;
                        }
                        else {
                            insertedIndex = editorRef.current.getSelection().index - 1;
                        }
                        insertedChar = op.insert;
                    } else if (typeof op.insert === 'object' && op.insert.hasOwnProperty('image')) {
                        insertedChar = '[IMAGE]';
                    }
                }
            });

            const plainText = buffer.replace(/<[^>]+>/g, ''); 
            editorRef.current.setText(plainText);
            editorRef.current.setSelection(plainText.length);

            handleSendMessage(insertedIndex, insertedChar);
        }
    };

    function insertAtIndex(index, character) {
        setBuffer(prevBuffer => {
            let str = prevBuffer.replace(/<[^>]+>/g, ''); 
            str = str.slice(0, index) + character + str.slice(index);
            return str;
        });
    }

    return (
        <div>
            <div className = 'header'>
            <p>{filename}, By {author}</p>
                <div className='header-options'>
                <button className="save-button" onClick={handleSave}>Save</button>
                <button className="send-button" onClick={handleSendMessage}>Send</button>
                </div>
            </div>
            
            <div id="editor-container" className="editor-container" />
            
        </div>
    );
};

export default TextEditor;
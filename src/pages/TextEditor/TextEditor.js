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

    let sessionId = null;
    let n = 0;
    let buffer = content;

    useEffect(() => {
        n = n + 1;
        if (n === 1) {
        sessionId = generateSessionId();
        console.log("session Id = " + sessionId);
        if (sessionId) {
            // Initialize Stomp client
            sessionId=generateSessionId();
            const socket = new SockJS('https://apt-backend.onrender.com/ws');
            const client = Stomp.over(socket);

            client.connect({}, () => {
                console.log('WebSocket connection established.');
                stompClientRef.current = client;

                if (stompClientRef.current) {
                    stompClientRef.current.subscribe(`/all/broadcast/${documentId}`, (message) => {
                        const receivedMessage = JSON.parse(message.body);
                        console.log(receivedMessage.insertedIndex + ", " + receivedMessage.insertedChar + ", " + receivedMessage.sessionId);
                        if (receivedMessage.sessionId === sessionId) return;
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
        }
    }
    }, []);


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
            console.log("sending session Id = " + sessionId);
            stompClientRef.current.send(`/app/operation/${documentId}`, {}, JSON.stringify({ insertedIndex, insertedChar, sessionId }));
        }
    };
    let myMessage = [];

    const handleTextChange = (delta, oldDelta, source) => {
        if (source !== 'user') return;
    
        let change = null;
    
        delta.ops.forEach(op => {
            if (op.insert !== undefined) {
                change = { type: 'insert', value: op.insert };
            } else if (op.delete) {
                change = { type: 'delete', value: op.delete };
            }
        });
    
        if (change) {
            let insertedIndex = editorRef.current.getSelection().index;
            let insertedChar = null;
    
            if (change.type === 'insert') {
                insertedChar = typeof change.value === 'string' ? change.value : '[IMAGE]';
                myMessage.push(new Message('ins', insertedChar, insertedIndex));
            } else if (change.type === 'delete') {
                insertedChar = '';
                myMessage.push(new Message('del', insertedChar, insertedIndex));
            }
    
            console.log("text change: sessionId = " + sessionId);
            handleSendMessage(insertedIndex, insertedChar);
        }
    };
    
    function processMessages() {
        while(myMessage.length !== 0) {
            let something = receive();
            if (something.operation === 'ack') {
                myMessage.shift();
                continue;
            }
            else {
                for (let i = 0; i < myMessage.length; i++) {
                    let message = myMessage[i];
                    if (something.operation === 'ins' && message.operation === 'ins') {
                        if (something.index <= message.index) {
                            message.index = message.index + 1;
                        }
                        else {
                            something.index = something.index + 1;
                        }
                    }
                    else if (something.operation === 'ins' && message.operation === 'del') {
                        if (something.index <= message.index) {
                            message.index = message.index + 1;
                        }
                        else {
                            something.index = something.index - 1;
                        }
                    }
                    else if (something.operation === 'del' && message.operation === 'ins') {
                        if (something.index <= message.index) {
                            message.index = message.index - 1;
                        }
                        else {
                            something.index = something.index + 1;
                        }
                    }
                    else if (something.operation === 'del' && message.operation === 'del') {
                        if (something.index <= message.index) {
                            message.index = message.index - 1;
                        }
                        else {
                            something.index = something.index - 1;
                        }
                    }
                }
                write(something);
            }
        }
    }

    function insertAtIndex(index, character) {
        // Transform the index based on the operations in the queue
        for (let i = 0; i < myMessage.length; i++) {
            let message = myMessage[i];
            if (message.operation === 'ins' && index > message.index) {
                index++;
            } else if (message.operation === 'del' && index >= message.index) {
                index--;
            }
        }
    
        // Insert the character at the transformed index
        buffer = buffer.substring(0, index) + character + buffer.substring(index);
    
        setContent(buffer);
        let plainText = buffer.replace(/<[^>]+>/g, '');
        editorRef.current.setText(plainText);
        editorRef.current.setSelection(index + 1);
    }

    function generateSessionId() {
        
        let x = 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        console.log("Generated session Id = " + x);
        return x;
    }

    return (
        <div>
            <div className='header header-Texteditor'>
                <p>{filename}, By {author}</p>
                <div className='header-options header-Texteditor'>
                    <button className="save-button" onClick={handleSave}>Save</button>
                </div>
            </div>

            <div id="editor-container" className="editor-container" />
            
        </div>
    );
};

export default TextEditor;
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
    const [content, setContent] = useState('');
    const canEdit = queryParams.get('canEdit');

    const editorRef = useRef(null);
    const stompClientRef = useRef(null);

    let sessionId = null;
    let n = 0;
    let buffer = content;
    let SpaceFlag = false;
    let localIndex = 0;

    var pending = [];

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const response = await fetch(`https://apt-backend.onrender.com/documents/content/${documentId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch document content');
            }
            const data = await response.text();
            buffer = data;
            let plainText = buffer.replace(/<[^>]+>/g, '');
            editorRef.current.setText(plainText);
            buffer = plainText;
            setContent(plainText);

        } catch (error) {
            console.error('Error fetching document content:', error);
        }
    };

    useEffect(() => {
        n = n + 1;
        if (n === 1) {
            sessionId = generateSessionId();
            console.log("session Id = " + sessionId);
            if (sessionId) {
                // Initialize Stomp client
                sessionId = generateSessionId();
                const socket = new SockJS('https://apt-backend.onrender.com/ws');
                const client = Stomp.over(socket);

                client.connect({}, () => {
                    console.log('WebSocket connection established.');
                    stompClientRef.current = client;

                    if (stompClientRef.current) {
                        stompClientRef.current.subscribe(`/all/broadcast/${documentId}`, (message) => {
                            const receivedMessage = JSON.parse(message.body);
                            // console.log("receivedMessage = " + JSON.stringify(receivedMessage));
                            // console.log("pending of 0 = " + JSON.stringify(JSON.parse(pending[0])));
                            for (let i = 0; i < pending.length; i++) {
                                if (JSON.stringify(receivedMessage) === JSON.stringify(JSON.parse(pending[i]))) {
                                    removeAtIndex(pending, i);
                                    console.log("NOP");
                                    return;
                                }
                            }
                            if (pending.length > 0) {
                                for (let i = 0; i < pending.length; i++) {
                                    if (receivedMessage.insertedChar.length === 1 && JSON.parse(pending[i]).insertedChar.length === 1) {
                                        if (receivedMessage.insertedIndex <= JSON.parse(pending[i]).insertedIndex) {
                                            JSON.parse(pending[i]).insertedIndex++;
                                            console.log("1-");
                                        }
                                        else {
                                            receivedMessage.insertedIndex++;
                                            console.log("2-");
                                        }
                                    }
                                    else if (receivedMessage.insertedChar.length === 1 && JSON.parse(pending[i]).insertedChar === "delete") {
                                        if (receivedMessage.insertedIndex <= JSON.parse(pending[i]).insertedIndex) {
                                            JSON.parse(pending[i]).insertedIndex++;
                                        }
                                        else {
                                            receivedMessage.insertedIndex--;
                                        }
                                    }
                                    else if (receivedMessage.insertedChar === "delete" && JSON.parse(pending[i]).insertedChar.length === 1) {
                                        if (receivedMessage.insertedIndex <= JSON.parse(pending[i]).insertedIndex) {
                                            JSON.parse(pending[i]).insertedIndex--;
                                        }
                                        else {
                                            receivedMessage.insertedIndex++;
                                        }
                                    }
                                    else if (receivedMessage.insertedChar === "delete" && JSON.parse(pending[i]).insertedChar === "delete") {
                                        if (receivedMessage.insertedIndex <= JSON.parse(pending[i]).insertedIndex) {
                                            JSON.parse(pending[i]).insertedIndex--;
                                        }
                                        else {
                                            receivedMessage.insertedIndex--;
                                        }
                                    }
                                }
                            }

                            console.log("final char: ", + receivedMessage.insertedChar + " final index: " + receivedMessage.insertedIndex);

                            if (receivedMessage.insertedChar.length === 1) 
                                insertAtIndex(receivedMessage.insertedIndex, receivedMessage.insertedChar);
                            else if (receivedMessage.insertedChar === 'delete') {
                                deleteAtIndex(receivedMessage.insertedIndex, receivedMessage.insertedChar);
                            }

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
            console.log("before pasting content: " + buffer);
            editorRef.current.clipboard.dangerouslyPasteHTML(content);

            console.log("can edit = " + canEdit)
            if (canEdit ===  "true") {
                editorRef.current.enable();
            } else {
                editorRef.current.disable();
            }
        }
    }, [content, canEdit]);

    // useEffect(() => {
    //     console.log("buffer2 = " + buffer);
    //     const plainText = buffer.replace(/<[^>]+>/g, '');
    //     setContent(buffer);
    //     editorRef.current.setText(plainText);
    //     editorRef.current.setSelection(plainText.length);
    //     console.log("plainText = " + plainText);
    // }, [content]);

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

                if (insertedChar === '\n') {
                    console.log("new line");
                    insertedIndex = insertedIndex;

                } else {
                    insertedIndex = insertedIndex - 1;
                }
            } else if (change.type === 'delete') {
                insertedChar = 'delete';
                insertedIndex = insertedIndex + 1;
            }

            console.log("prev selection = " + localIndex);
            localIndex = editorRef.current.getSelection().index;
            localIndex = parseInt(localIndex, 10); 
            console.log("selection = " + localIndex);
            console.log("text change: sessionId = " + sessionId);
            handleSendMessage(insertedIndex, insertedChar);

            pending.push(JSON.stringify({ insertedIndex, insertedChar, sessionId }));
            console.log(editorRef.current.getText());
            buffer = editorRef.current.getText();
            handleSave();
        }
    };

    function removeAtIndex(array, index) {
        if (index < 0 || index >= array.length) {
            return array;
        }
        array.splice(index, 1);
        return array;
    }

    function insertAtIndex(index, character) {
        console.log(" insertAtIndex: CHar = " + character);
        if (SpaceFlag === true && character !== '\n') {
            index = index + 1;

            SpaceFlag = false;
        }
        if (character === '\n') {
            SpaceFlag = true;
        }

        buffer = buffer.substring(0, index) + character + buffer.substring(index);

        let plainText = buffer.replace(/<[^>]+>/g, '');
        setContent(buffer);
        editorRef.current.setText(plainText);

        if (index <= localIndex) {
            console.log("shift +");
            localIndex++;
        }
        editorRef.current.setSelection(localIndex);
    }

    function deleteAtIndex(index, character) {

        buffer = buffer.substring(0, index - 1) + buffer.substring(index);

        let plainText = buffer.replace(/<[^>]+>/g, '');
        setContent(buffer);
        editorRef.current.setText(plainText);

        if (index <= localIndex) {
            console.log("shift -");
            localIndex--;
        }
        editorRef.current.setSelection(localIndex);
    }

    function generateSessionId() {
        let x = 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        console.log("Generated session Id gedan = " + x);
        return x;
    }

    return (
        <div>
            <div className='header header-Texteditor'>
                <p>{filename}</p>
            </div>

            <div id="editor-container" className="editor-container" />

        </div>
    );
};

export default TextEditor;
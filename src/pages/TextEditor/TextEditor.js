import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; 
import './TextEditor.css';

class Queue {
    constructor() {
        this.elements = [];
    }

    enqueue(element) {
        this.elements.push(element);
    }

    // Remove and return the first element of the queue
    dequeue() {
        return this.elements.shift();
    }

    // Get the first element of the queue without removing it
    peek() {
        return this.elements[0];
    }

    // Check if the queue is empty
    isEmpty() {
        return this.elements.length === 0;
    }

    // Get the size of the queue
    size() {
        return this.elements.length;
    }
}

class List {
    constructor() {
        this.elements = [];
    }

    // Add an element to the list
    add(element) {
        this.elements.push(element);
    }

    // Remove an element from the list by value
    remove(element) {
        const index = this.elements.indexOf(element);
        if (index !== -1) {
            this.elements.splice(index, 1);
            return true; // Element found and removed
        }
        return false; // Element not found
    }

    // Get the size of the list
    size() {
        return this.elements.length;
    }

    // Check if the list is empty
    isEmpty() {
        return this.elements.length === 0;
    }

    // Get an element at a specific index
    get(index) {
        return this.elements[index];
    }

    // Clear the list
    clear() {
        this.elements = [];
    }
}

const TextEditor = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const documentId = queryParams.get('documentId');
    const filename = queryParams.get('filename');
    const author = queryParams.get('author');
    const [content, setContent] = useState(queryParams.get('content'));

    const editorRef = useRef(null);
    const stompClientRef = useRef(null);

    let buffer = content;
    let n = 0;
    
    const pending = new Queue();
    const changes = new List();

    useEffect(() => {
        n = n + 1;
        console.log("Time = " + n);

        if (n === 1) {
        // Initialize Stomp client
        const socket = new SockJS('https://apt-backend.onrender.com/ws');
        const client = Stomp.over(socket);
    
        client.connect({}, () => {
            console.log('WebSocket connection established.');
            stompClientRef.current = client;
    
            if (stompClientRef.current) {
                stompClientRef.current.subscribe(`/all/broadcast/${documentId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    console.log(receivedMessage.insertedIndex + ", " +  receivedMessage.insertedChar+ ", " +  receivedMessage.timeStamp);

                    let currentChange = JSON.parse(pending.peek());

                    for (let i = 0; i < changes.size(); i++) {
                        console.log("change of " + i + " index = " + changes.get(i).insertedIndex);
                        if (currentChange.insertedIndex >= changes.get(i).insertedIndex) {
                            console.log("change of " + i + " index = " + changes.get(i).insertedIndex);
                            currentChange.insertedIndex = currentChange.insertedIndex + 1;
                        }
                    }

                    changes.add(JSON.parse(pending.dequeue()));
                    console.log("current change = " + JSON.stringify(currentChange));
                    insertAtIndex(currentChange.insertedIndex, currentChange.insertedChar);
                    
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

    // useEffect(() => {
    //     console.log("buffer2 = " + buffer);
    //     setContent(buffer);
    //     const plainText = buffer.replace(/<[^>]+>/g, ''); 
    //     editorRef.current.setText(plainText);
    //     editorRef.current.setSelection(plainText.length);
    //     console.log("plainText = " + plainText);
    // }, [buffer]);

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

    const handleSendMessage = (insertedIndex, insertedChar, timeStamp) => {
        if (stompClientRef.current !== null) {
            stompClientRef.current.send(`/app/operation/${documentId}`, {}, JSON.stringify({ insertedIndex, insertedChar, timeStamp }));
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
            let timeStamp = Date.now();
    
            if (change.type === 'insert') {
                insertedChar = typeof change.value === 'string' ? change.value : '[IMAGE]';
            } else if (change.type === 'delete') {
                insertedChar = '';
            }
    
            handleSendMessage(insertedIndex, insertedChar, timeStamp);

            pending.enqueue(JSON.stringify({ insertedIndex, insertedChar, timeStamp }));
        }
    };
    
    function insertAtIndex(index, character) {
        buffer = buffer.substring(0, index) + character + buffer.substring(index);
        
        setContent(buffer);
        let plainText = buffer.replace(/<[^>]+>/g, '');
        editorRef.current.setText(plainText);
        editorRef.current.setSelection(index + 1);
    }

    return (
        <div>
            <div className = 'header header-Texteditor'>
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
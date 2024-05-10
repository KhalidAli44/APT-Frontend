import React, { useState } from 'react';
import './signup.css';

const Signup = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const goToLogin = (e) => {
        e.preventDefault();
        window.location.href = '/Login';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setPasswordError('');
        setUsernameError('');

        if (formData.password !== formData.confirmPassword) {
            console.error('Passwords do not match');
            setPasswordError('*Passwords do not match')
            return;
        }

        const newUser = {
            username: formData.username,
            password: formData.password
        };

        try {
            const response = await fetch('https://apt-backend.onrender.com/users/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            if (!response.ok) {
                throw new Error('Username already exists!');
            }

            console.log('User created successfully');
        } catch (error) {
            console.error(error);
            setUsernameError('*Username already exists');
            return;
        }

        setFormData({
            username: '',
            password: '',
            confirmPassword: ''
        });
        
        window.location.href = `/Home?username=${formData.username}`;
    };

    return (
        <div className="signup-form">
            <h2>Sign Up</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <label id='confirm' htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                <p>{usernameError}</p>
                <p>{passwordError}</p>
                <div className='button-container'>
                    <button type="submit">Sign Up</button>
                    <button className="login" onClick={goToLogin}>Go to Log In</button>
                </div>
            </form>
        </div>
    );
};

export default Signup;

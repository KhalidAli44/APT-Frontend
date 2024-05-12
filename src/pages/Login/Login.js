import React, { useState } from 'react';
import './Login.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    
    const [dataError, setDataError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setDataError('');

        try {
            const response = await fetch('https://apt-backend.onrender.com/users/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(formData)
            });
      
            if (!response.ok) {
              throw new Error('Invalid username or password');
            }
      
            window.location.href = `/Home?username=${formData.username}`;

        } catch (error) {
            setDataError('*Invalid username or password');
            console.error(error);
            return;
        }


        console.log(formData);
        setFormData({
            username: '',
            password: ''
        });
    };

    const goToSignup = (e) => {
        e.preventDefault(); 
        window.location.href = '/Signup';
    };

    return (
        <div className="center-page">    
        <div className="login-form">
            <h2>Login</h2>
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
                </div>
                <p>{dataError}</p>
                <div className="button-container">
                    <button type="submit"className="login-button">Login</button>
                    <button className='signup' onClick={goToSignup}>Sign Up</button>
                </div>
            </form>
        </div>
    </div>
    );
};

export default Login;

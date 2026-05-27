import React, { useState } from 'react';
import { Mail, Lock, Check, AlertCircle } from 'lucide-react';
import { API_URL } from './apiService.js';
import './login.css';



const Login = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login'); // 'login' or 'create'

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Account creation states
  const [accountData, setAccountData] = useState({
    email: '',
    verification_code: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // =====================================
  // VALIDATION
  // =====================================
  const validateLogin = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAccountCreation = () => {
    const newErrors = {};

    if (!accountData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(accountData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!accountData.verification_code.trim()) {
      newErrors.verification_code = 'Verification code is required';
    }

    if (!accountData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (accountData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (accountData.password !== accountData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =====================================
  // LOGIN
  // =====================================
  const handleLogin = async () => {
    if (!validateLogin()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid email or password');
      }

      // Store user data
      localStorage.setItem("id", result.user.id);
      localStorage.setItem("email", result.user.email);
      console.log(result.user.id)
      

      onLoginSuccess(result);

    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================
  // SEND VERIFICATION CODE
  // =====================================
  const handleSendCode = async () => {
    if (!accountData.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(accountData.email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setIsSendingCode(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountData.email, password: accountData.password})
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setIsCodeSent(true);
      setErrors({ success: '✓ Verification code sent to your email!' });
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setIsSendingCode(false);
    }
  };

  //======================================
  // SEND RESET VERIFICATION CODE
  //======================================
  const handleResetSendCode = async () => {
    if (!accountData.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(accountData.email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setIsSendingCode(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/verification-reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountData.email })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setIsCodeSent(true);
      setErrors({ success: '✓ Verification code sent to your email!' });
    } catch (error) {
      setErrors({ email: error.message });
    } finally {
      setIsSendingCode(false);
    }
  };

  
  // =====================================
  // CREATE ACCOUNT (SETUP PASSWORD)
  // =====================================
  const handleCreateAccount = async () => {
    if (!validateAccountCreation()) return;

    if (!isCodeSent) {
      setErrors({ general: 'Please verify your email first' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountData.email,
          verification_code: accountData.verification_code,
          password: accountData.password
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup account');
      }

      // Show success message
      setErrors({ success: '✓ Account created successfully! Redirecting to login...' });
      
      // Reset form and switch to login after 2 seconds
      setTimeout(() => {
        setAccountData({
          email: '',
          verification_code: '',
          password: '',
          confirmPassword: ''
        });
        setIsCodeSent(false);
        setErrors({});
        setView('login');
      }, 2000);

    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };


  // =====================================
  // RESET PASSWORD)
  // =====================================
  const handleResetPassword = async () => {
    if (!validateAccountCreation()) return;

    if (!isCodeSent) {
      setErrors({ general: 'Please verify your email first' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: accountData.email,
          verification_code: accountData.verification_code,
          password: accountData.password
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup account');
      }

      // Show success message
      setErrors({ success: '✓ Password reseted successfully! Redirecting to login...' });
      
      // Reset form and switch to login after 2 seconds
      setTimeout(() => {
        setAccountData({
          email: '',
          verification_code: '',
          password: '',
          confirmPassword: ''
        });
        setIsCodeSent(false);
        setErrors({});
        setView('login');
      }, 2000);

    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };


  const isLoginDisabled = !email || !password || isLoading;
  const isCreateDisabled = !accountData.email || !accountData.verification_code || !accountData.password || !accountData.confirmPassword || isLoading;

  return (
    <div className="auth-container">
      {/* LEFT SIDE */}
      <div className="auth-left">
        <div className="auth-left-content">
          <h1>Welcome to Tech Tammina</h1>
          <p>Manage your workforce efficiently</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">
        <div className="auth-form-wrapper">
          {/* ERROR MESSAGE */}
          {errors.general && (
            <div className="alert-box alert-error">
              <AlertCircle size={18} />
              <p>{errors.general}</p>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {errors.success && (
            <div className="alert-box alert-success">
              <Check size={18} />
              <p>{errors.success}</p>
            </div>
          )}

          {/* =========================
              LOGIN VIEW
          ========================= */}
          {view === "login" && (
            <div className="auth-card">
              <div className="logo-wrapper">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTC83vvQLlJ68OzouX132qyPqWSaiSyZ5nSZg&s"
                  alt="Tech Tammina Logo"
                  className="logo"
                />
              </div>

              <h2>Log into your account</h2>

              {/* EMAIL */}
              <div className="form-group">
                <label className="form-label">Email</label>

                <div className="input-wrapper">
                  <Mail className="input-icon" size={18} />

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                    onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                    className="form-input"
                  />
                </div>

                {errors.email && (
                  <p className="error-text">{errors.email}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label className="form-label">Password</label>

                <div className="input-wrapper">
                  <Lock className="input-icon" size={18} />

                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({});
                    }}
                    onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                    className="form-input"
                  />
                </div>

                {errors.password && (
                  <p className="error-text">{errors.password}</p>
                )}
              </div>

              {/* FORGOT PASSWORD */}
              <div className="forgot-wrapper">
                <span
                  className="auth-link"
                  onClick={() => {
                    setView("forgot");
                    setErrors({});
                    setEmail("");
                    setPassword("");
                  }}
                >
                  Forgot Password?
                </span>
              </div>

              {/* LOGIN BUTTON */}
              <button
                onClick={handleLogin}
                disabled={isLoginDisabled}
                className="auth-btn"
              >
                {isLoading ? <div className="loader"></div> : "Login"}
              </button>

              {/* FOOTER */}
              <div className="auth-footer">
                <p>
                  New user?{" "}
                  <span
                    className="auth-link"
                    onClick={() => {
                      setView("create");
                      setErrors({});
                      setEmail("");
                      setPassword("");
                    }}
                  >
                    Create Account
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* =========================
              CREATE ACCOUNT VIEW
          ========================= */}
          {view === "create" && (
            <div className="auth-card">
              <h2>Create Your Account</h2>

              <p className="auth-subtitle">
                Setup your password to access your account
              </p>

              {/* EMAIL */}
              <div className="form-group">
                <label className="form-label">Email</label>

                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={accountData.email}
                  onChange={(e) => {
                    setAccountData({
                      ...accountData,
                      email: e.target.value,
                    });
                    setErrors({});
                  }}
                  disabled={isCodeSent}
                  className="form-input no-icon"
                />

                {errors.email && (
                  <p className="error-text">{errors.email}</p>
                )}
              </div>

              {/* VERIFICATION CODE */}
              <div className="form-group">
                <label className="form-label">Verification Code</label>

                <div className="flex-gap">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={accountData.verification_code}
                    onChange={(e) => {
                      setAccountData({
                        ...accountData,
                        verification_code: e.target.value,
                      });
                      setErrors({});
                    }}
                    className="form-input no-icon"
                  />

                  <button
                    onClick={handleSendCode}
                    disabled={isSendingCode || isCodeSent}
                    className="secondary-btn"
                  >
                    {isSendingCode ? (
                      <div className="loader-small"></div>
                    ) : isCodeSent ? (
                      "Sent"
                    ) : (
                      "Send Code"
                    )}
                  </button>
                </div>

                {errors.verification_code && (
                  <p className="error-text">
                    {errors.verification_code}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label className="form-label">Password</label>

                <input
                  type="password"
                  placeholder="Enter password"
                  value={accountData.password}
                  onChange={(e) => {
                    setAccountData({
                      ...accountData,
                      password: e.target.value,
                    });
                    setErrors({});
                  }}
                  className="form-input no-icon"
                />

                {errors.password && (
                  <p className="error-text">{errors.password}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={accountData.confirmPassword}
                  onChange={(e) => {
                    setAccountData({
                      ...accountData,
                      confirmPassword: e.target.value,
                    });
                    setErrors({});
                  }}
                  onKeyPress={(e) =>
                    handleKeyPress(e, handleCreateAccount)
                  }
                  className="form-input no-icon"
                />

                {errors.confirmPassword && (
                  <p className="error-text">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* BUTTON */}
              <button
                onClick={handleCreateAccount}
                disabled={isCreateDisabled}
                className="auth-btn"
              >
                {isLoading ? (
                  <div className="loader"></div>
                ) : (
                  "Create Account"
                )}
              </button>

              {/* FOOTER */}
              <div className="auth-footer">
                <p>
                  Already have an account?{" "}
                  <span
                    className="auth-link"
                    onClick={() => {
                      setView("login");
                      setErrors({});
                      setIsCodeSent(false);

                      setAccountData({
                        email: "",
                        verification_code: "",
                        password: "",
                        confirmPassword: "",
                      });
                    }}
                  >
                    Login
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* =========================
              FORGOT PASSWORD VIEW
          ========================= */}
          {view === "forgot" && (
            <div className="auth-card">
              <h2>Reset Your Password</h2>

              <p className="auth-subtitle">
                Reset your password with your registered email
              </p>

              {/* EMAIL */}
              <div className="form-group">
                <label className="form-label">Email</label>

                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={accountData.email}
                  onChange={(e) => {
                    setAccountData({
                      ...accountData,
                      email: e.target.value,
                    });
                    setErrors({});
                  }}
                  disabled={isCodeSent}
                  className="form-input no-icon"
                />

                {errors.email && (
                  <p className="error-text">{errors.email}</p>
                )}
              </div>

              {/* CODE */}
              <div className="form-group">
                <label className="form-label">Verification Code</label>

                <div className="flex-gap">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={accountData.verification_code}
                    onChange={(e) => {
                      setAccountData({
                        ...accountData,
                        verification_code: e.target.value,
                      });
                      setErrors({});
                    }}
                    className="form-input no-icon"
                  />

                  <button
                    onClick={handleResetSendCode}
                    disabled={isSendingCode || isCodeSent}
                    className="secondary-btn"
                  >
                    {isSendingCode ? (
                      <div className="loader-small"></div>
                    ) : isCodeSent ? (
                      "Sent"
                    ) : (
                      "Send Code"
                    )}
                  </button>
                </div>

                {errors.verification_code && (
                  <p className="error-text">
                    {errors.verification_code}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label className="form-label">Password</label>

                <input
                  type="password"
                  placeholder="Enter password"
                  value={accountData.password}
                  onChange={(e) => {
                    setAccountData({
                      ...accountData,
                      password: e.target.value,
                    });
                    setErrors({});
                  }}
                  className="form-input no-icon"
                />

                {errors.password && (
                  <p className="error-text">{errors.password}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>

                <input
                  type="password"
                  placeholder="Confirm password"
                  value={accountData.confirmPassword}
                  onChange={(e) => {
                    setAccountData({
                      ...accountData,
                      confirmPassword: e.target.value,
                    });
                    setErrors({});
                  }}
                  onKeyPress={(e) =>
                    handleKeyPress(e, handleResetPassword)
                  }
                  className="form-input no-icon"
                />

                {errors.confirmPassword && (
                  <p className="error-text">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* BUTTON */}
              <button
                onClick={handleResetPassword}
                disabled={isCreateDisabled}
                className="auth-btn"
              >
                {isLoading ? (
                  <div className="loader"></div>
                ) : (
                  "Reset Password"
                )}
              </button>

              {/* FOOTER */}
              <div className="auth-footer">
                <p>
                  Already have an account?{" "}
                  <span
                    className="auth-link"
                    onClick={() => {
                      setView("login");
                      setErrors({});
                      setIsCodeSent(false);

                      setAccountData({
                        email: "",
                        verification_code: "",
                        password: "",
                        confirmPassword: "",
                      });
                    }}
                  >
                    Login
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
};

export default Login;
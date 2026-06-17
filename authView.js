import { state } from '../state.js';
import { api } from '../api.js';
import { showToast, navigateTo } from '../app.js';

export const authView = {
  render(container) {
    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:100vh; padding: 20px;">
        <div class="glass-card" style="width: 450px; padding: 40px; display:flex; flex-direction:column; gap:24px;">
          <div style="text-align:center;">
            <h2 style="font-weight:700; margin-bottom:8px; background:var(--accent-gradient); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">NexusFlow</h2>
            <p style="color:var(--text-secondary); font-size:14px;">Next-Gen Project Management Platform</p>
          </div>

          <!-- Tabs -->
          <ul class="nav nav-pills nav-fill bg-dark p-1 rounded-pill" id="auth-tabs" style="border: 1px solid var(--glass-border);">
            <li class="nav-item">
              <a class="nav-link active rounded-pill text-light" id="login-tab" style="cursor:pointer; font-weight:600;">Login</a>
            </li>
            <li class="nav-item">
              <a class="nav-link rounded-pill text-secondary" id="register-tab" style="cursor:pointer; font-weight:600;">Register</a>
            </li>
          </ul>

          <!-- Form Area -->
          <div id="auth-form-container">
            <!-- Default: Login Form -->
            <form id="login-form" style="display:flex; flex-direction:column; gap:16px;">
              <div>
                <label class="form-label" style="font-size:13px; font-weight:500;">Email Address</label>
                <input type="email" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="login-email" required placeholder="name@company.com">
              </div>
              <div>
                <label class="form-label" style="font-size:13px; font-weight:500;">Password</label>
                <input type="password" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="login-password" required placeholder="••••••••">
              </div>
              <div style="text-align:right;">
                <a id="forgot-password-link" style="color:var(--accent-color); font-size:12px; cursor:pointer; text-decoration:none;">Forgot Password?</a>
              </div>
              <button type="submit" class="btn btn-primary w-100 p-3 rounded-3" style="background:var(--accent-gradient); border:none; font-weight:600; font-size:15px;">Sign In</button>
            </form>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
  },

  bindEvents(container) {
    const loginTab = container.querySelector('#login-tab');
    const registerTab = container.querySelector('#register-tab');
    const formContainer = container.querySelector('#auth-form-container');

    const showLoginForm = () => {
      loginTab.className = 'nav-link active rounded-pill text-light';
      registerTab.className = 'nav-link rounded-pill text-secondary';
      formContainer.innerHTML = `
        <form id="login-form" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label class="form-label" style="font-size:13px; font-weight:500;">Email Address</label>
            <input type="email" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="login-email" required placeholder="name@company.com">
          </div>
          <div>
            <label class="form-label" style="font-size:13px; font-weight:500;">Password</label>
            <input type="password" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="login-password" required placeholder="••••••••">
          </div>
          <div style="text-align:right;">
            <a id="forgot-password-link" style="color:var(--accent-color); font-size:12px; cursor:pointer; text-decoration:none;">Forgot Password?</a>
          </div>
          <button type="submit" class="btn btn-primary w-100 p-3 rounded-3" style="background:var(--accent-gradient); border:none; font-weight:600; font-size:15px;">Sign In</button>
        </form>
      `;

      // Bind Login submit
      formContainer.querySelector('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
          const res = await api.post('/auth/login', { email, password });
          state.setSession(res.user, res.accessToken, res.refreshToken);
          showToast('Welcome back, ' + res.user.name + '!');
          navigateTo('dashboard');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      // Bind Forgot Password link
      formContainer.querySelector('#forgot-password-link').addEventListener('click', showForgotForm);
    };

    const showRegisterForm = () => {
      registerTab.className = 'nav-link active rounded-pill text-light';
      loginTab.className = 'nav-link rounded-pill text-secondary';
      formContainer.innerHTML = `
        <form id="register-form" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label class="form-label" style="font-size:13px; font-weight:500;">Full Name</label>
            <input type="text" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="reg-name" required placeholder="John Doe">
          </div>
          <div>
            <label class="form-label" style="font-size:13px; font-weight:500;">Email Address</label>
            <input type="email" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="reg-email" required placeholder="name@company.com">
          </div>
          <div>
            <label class="form-label" style="font-size:13px; font-weight:500;">Password</label>
            <input type="password" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="reg-password" required placeholder="••••••••">
          </div>
          <button type="submit" class="btn btn-primary w-100 p-3 rounded-3" style="background:var(--accent-gradient); border:none; font-weight:600; font-size:15px;">Create Account</button>
        </form>
      `;

      formContainer.querySelector('#register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        try {
          const res = await api.post('/auth/register', { name, email, password });
          showToast(res.msg);
          showLoginForm();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    };

    const showForgotForm = () => {
      formContainer.innerHTML = `
        <form id="forgot-form" style="display:flex; flex-direction:column; gap:16px;">
          <h5 style="font-weight:600;">Forgot Password</h5>
          <p style="color:var(--text-secondary); font-size:13px; line-height:1.4;">Enter your email address and we'll send you a recovery link to verify your identity.</p>
          <div>
            <label class="form-label" style="font-size:13px; font-weight:500;">Email Address</label>
            <input type="email" class="form-control bg-dark text-light border-secondary p-3 rounded-3" id="forgot-email" required placeholder="name@company.com">
          </div>
          <button type="submit" class="btn btn-primary w-100 p-3 rounded-3" style="background:var(--accent-gradient); border:none; font-weight:600; font-size:15px;">Send Reset Link</button>
          <a id="back-to-login" style="color:var(--text-secondary); font-size:12px; cursor:pointer; text-align:center; text-decoration:none; margin-top:8px;">Back to Login</a>
        </form>
      `;

      formContainer.querySelector('#forgot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        try {
          const res = await api.post('/auth/forgot-password', { email });
          showToast(res.msg);
          showLoginForm();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });

      formContainer.querySelector('#back-to-login').addEventListener('click', showLoginForm);
    };

    loginTab.addEventListener('click', showLoginForm);
    registerTab.addEventListener('click', showRegisterForm);

    // Run login handler initially
    showLoginForm();
  }
};

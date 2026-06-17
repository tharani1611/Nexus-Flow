const validateEmail = (email) => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

module.exports = {
  validateRegister: (req, res, next) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields (name, email, password)' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: 'Please include a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be 6 or more characters long' });
    }
    next();
  },

  validateLogin: (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter all fields (email, password)' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ msg: 'Please include a valid email address' });
    }
    next();
  },

  validateTask: (req, res, next) => {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ msg: 'Task title is required' });
    }
    next();
  },

  validateProject: (req, res, next) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ msg: 'Project name is required' });
    }
    next();
  },

  validateWorkspace: (req, res, next) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ msg: 'Workspace name is required' });
    }
    next();
  }
};

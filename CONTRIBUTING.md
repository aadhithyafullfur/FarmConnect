# Contributing to FarmConnect

Thank you for your interest in contributing to FarmConnect! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### 1. Fork and Clone
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/FarmConnect.git
   cd FarmConnect
   ```

### 2. Set Up Development Environment
1. Follow the installation instructions in [README.md](README.md)
2. Run the setup script: `./setup.bat` (Windows) or `./setup.sh` (Linux/Mac)
3. Configure your `.env` file with development credentials

### 3. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

## 📋 Development Guidelines

### Code Style
- **JavaScript**: Use ES6+ features, async/await over promises
- **React**: Use functional components with hooks
- **CSS**: Use Tailwind CSS utility classes
- **File naming**: Use kebab-case for files, PascalCase for React components

### Commit Messages
Follow conventional commit format:
```
type(scope): description

feat(auth): add password reset functionality
fix(api): resolve product filtering bug  
docs(readme): update installation instructions
style(ui): improve mobile responsiveness
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Code Quality
- Write clear, self-documenting code
- Add comments for complex logic
- Include error handling
- Write tests for new features
- Ensure responsive design

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm test
```

### Backend Testing
```bash
cd server
npm test
```

### Manual Testing Checklist
- [ ] Registration/Login flow works
- [ ] Product CRUD operations function
- [ ] Image uploads work properly
- [ ] Real-time messaging operates
- [ ] Mobile responsiveness is maintained
- [ ] Error handling is appropriate

## 📁 Project Structure

Understanding the codebase structure:

```
FarmConnect/
├── client/src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Main application pages
│   ├── services/      # API communication
│   ├── context/       # React Context providers
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Utility functions
└── server/
    ├── controllers/   # Business logic
    ├── middleware/    # Auth, validation, etc.
    ├── models/       # Database schemas
    ├── routes/       # API endpoints
    └── uploads/      # File storage
```

## 🐛 Bug Reports

When reporting bugs, please include:
1. **Environment**: OS, browser, Node.js version
2. **Steps to reproduce**: Detailed steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Error logs**: Console errors, server logs

Use the bug report template:

```markdown
## Bug Description
Brief description of the bug

## Environment
- OS: [e.g., Windows 10, macOS 12.1, Ubuntu 20.04]
- Browser: [e.g., Chrome 96, Firefox 95, Safari 15]
- Node.js: [e.g., v16.13.0]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior  
What actually happened

## Screenshots
If applicable, add screenshots

## Error Logs
Any console or server errors
```

## ✨ Feature Requests

For feature requests, please:
1. Check existing issues to avoid duplicates
2. Describe the feature clearly
3. Explain the use case and benefits
4. Provide mockups or examples if possible

## 🔄 Pull Request Process

### Before Submitting
1. Ensure code follows project style guidelines
2. Test your changes thoroughly
3. Update documentation if needed
4. Add tests for new functionality

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing done

## Screenshots
If UI changes, include before/after screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process
1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Delete your feature branch after merge

## 🚀 Development Workflow

### Local Development
1. Start the development servers:
   ```bash
   # Terminal 1 - Server with auto-restart
   cd server && npm run dev
   
   # Terminal 2 - Client with hot reload  
   cd client && npm start
   ```

2. Make your changes
3. Test in browser at `http://localhost:3000`
4. Check server logs for any errors

### Database Development
- Use MongoDB Compass for visual database inspection
- Create test data for development
- Don't commit sensitive data or credentials

### API Development
- Test endpoints with Postman or similar tools
- Follow RESTful API conventions
- Include proper error handling and status codes
- Document new endpoints in README.md

## 📚 Resources

### Documentation
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Tools
- **Code Editor**: VS Code (recommended)
- **API Testing**: Postman, Insomnia
- **Database**: MongoDB Compass
- **Version Control**: Git, GitHub Desktop

## ❓ Getting Help

If you need help:

1. **Read Documentation**: Check README.md and this file
2. **Search Issues**: Look for existing discussions
3. **Ask Questions**: Create a GitHub issue with the `question` label
4. **Join Discussions**: Participate in GitHub Discussions

## 📞 Contact

- **GitHub Issues**: For bugs and features
- **GitHub Discussions**: For general questions
- **Email**: [Your contact email if applicable]

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Special mentions in README.md

Thank you for contributing to FarmConnect! 🌾

---

*Happy coding and happy farming!* 🚜
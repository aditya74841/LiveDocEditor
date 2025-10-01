📝 LiveDocEditor
A powerful real-time collaborative document editor that enables seamless teamwork with live synchronization. Built with modern web technologies for a smooth, Google Docs-like experience.

✨ Features
Real-Time Collaboration - Multiple users can simultaneously edit documents with instant synchronization across all connected clients.

Permission Control - Share documents with customizable access levels including read-only and write permissions for enhanced security and control.

Rich Text Editing - Powered by Quill.js for intuitive formatting with support for bold, italics, lists, headings, and custom embeds.

Shareable Links - Generate unique document links for easy collaboration without complex setup.

Read-Only Mode - View documents without edit permissions, perfect for presentations or document review.

Persistent Storage - All documents are stored in MongoDB, ensuring data persistence across sessions.

Live User Presence - See who's currently editing the document in real-time for transparent collaboration.

🛠️ Tech Stack
Frontend - React.js for building a dynamic and responsive user interface

Text Editor - Quill.js for rich text editing capabilities

Real-Time Communication - Socket.IO for bidirectional event-based communication

Backend - Node.js with Express.js for handling API routes and WebSocket connections

Database - MongoDB for scalable document and user data storage

🚀 Getting Started
Prerequisites
Node.js (v14 or higher)

MongoDB installed locally or MongoDB Atlas account

npm or yarn package manager

Installation
Clone the repository

bash
git clone https://github.com/aditya74841/LiveDocEditor.git
cd LiveDocEditor
Install dependencies for both client and server

bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
Set up environment variables

Create a .env file in the server directory:

text
MONGODB_URI=your_mongodb_connection_string
PORT=3001
CLIENT_URL=http://localhost:3000
Create a .env file in the client directory:

text
REACT_APP_SERVER_URL=http://localhost:3001
Start the application

bash
# Start server (from server directory)
npm start

# Start client (from client directory)
npm start
The application will be available at http://localhost:3000.

📖 Usage
Creating a Document
Open the application in your browser

Create a new document or join an existing one using a document ID

Start editing with real-time synchronization

Sharing Documents
Copy the unique document URL from your browser

Share the link with collaborators

Set appropriate permissions (read-only or write access)

Collaborators can join instantly and see live updates

Permission Management
Write Access: Full editing capabilities with real-time synchronization

Read-Only Access: View-only mode for document review and presentation

🏗️ Architecture
The application uses a client-server architecture with WebSocket connections for real-time communication:

Frontend: React components manage UI state and editor interactions

Backend: Express.js handles HTTP requests and Socket.IO manages WebSocket connections

Database: MongoDB stores document content, metadata, and user permissions

Real-Time Sync: Socket.IO broadcasts changes to all connected clients instantly

🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📄 License
This project is open source and available under the MIT License.

🔗 Links
GitHub Repository: https://github.com/aditya74841/LiveDocEditor

Developer: Aditya Ranjan

🙏 Acknowledgments
Built with React, Quill.js, Socket.IO, and MongoDB to provide a seamless collaborative editing experience.

📊 Project Stats
![JavaScript](https://img.shields.io/badge/JavaScript-95n real-time, anywhere, anytime* ✨

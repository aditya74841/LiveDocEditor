# 📝 LiveDocEditor

A powerful real-time collaborative document editor that enables seamless teamwork with live synchronization. Built with modern web technologies for a smooth, Google Docs-like experience.

![JavaScript](https://img.shields.io/badge/JavaScript-95.3%25-yellow)
![HTML](https://img.shields.io/badge/HTML-3.0%25-orange)
![CSS](https://img.shields.io/badge/CSS-1.7%25-blue)

## ✨ Features

- **Real-Time Collaboration** - Multiple users can simultaneously edit documents with instant synchronization across all connected clients
- **Permission Control** - Share documents with customizable access levels including read-only and write permissions
- **Rich Text Editing** - Powered by Quill.js for intuitive formatting with support for bold, italics, lists, headings, and custom embeds
- **Shareable Links** - Generate unique document links for easy collaboration without complex setup
- **Read-Only Mode** - View documents without edit permissions, perfect for presentations or document review
- **Persistent Storage** - All documents are stored in MongoDB, ensuring data persistence across sessions
- **Live User Presence** - See who's currently editing the document in real-time

## 🛠️ Tech Stack

- **Frontend**: React.js
- **Text Editor**: Quill.js
- **Real-Time Communication**: Socket.IO
- **Backend**: Node.js with Express.js
- **Database**: MongoDB

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB installed locally or MongoDB Atlas account
- npm or yarn package manager

### Installation

1. **Clone the repository**
git clone https://github.com/aditya74841/LiveDocEditor.git
cd LiveDocEditor

text

2. **Install dependencies for both client and server**
Install server dependencies
cd server
npm install

Install client dependencies
cd ../client
npm install

text

3. **Set up environment variables**

Create a `.env` file in the **server** directory:
MONGODB_URI=your_mongodb_connection_string
PORT=3001
CLIENT_URL=http://localhost:3000

text

Create a `.env` file in the **client** directory:
REACT_APP_SERVER_URL=http://localhost:3001

text

4. **Start the application**
Start server (from server directory)
npm start

Start client (from client directory)
npm start



The application will be available at `http://localhost:3000`

## 📖 Usage

### Creating a Document
1. Open the application in your browser
2. Create a new document or join an existing one using a document ID
3. Start editing with real-time synchronization

### Sharing Documents
1. Copy the unique document URL from your browser
2. Share the link with collaborators
3. Set appropriate permissions (read-only or write access)
4. Collaborators can join instantly and see live updates

### Permission Management
- **Write Access**: Full editing capabilities with real-time synchronization
- **Read-Only Access**: View-only mode for document review and presentation

## 🏗️ Architecture

The application uses a client-server architecture with WebSocket connections for real-time communication:

- **Frontend**: React components manage UI state and editor interactions
- **Backend**: Express.js handles HTTP requests and Socket.IO manages WebSocket connections
- **Database**: MongoDB stores document content, metadata, and user permissions
- **Real-Time Sync**: Socket.IO broadcasts changes to all connected clients instantly

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Developer

**Aditya Ranjan**
- GitHub: [@aditya74841](https://github.com/aditya74841)
- Portfolio: [iamadityaranjan.com](https://iamadityaranjan.com)

## 🙏 Acknowledgments

Built with React, Quill.js, Socket.IO, and MongoDB to provide a seamless collaborative editing experience.

---

*Empowering teams to collaborate in real-time, anywhere, anytime* ✨

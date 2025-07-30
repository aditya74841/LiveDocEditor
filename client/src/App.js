// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import EditorPage from './components/EditorPage';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Navigate replace to={`/docs/${crypto.randomUUID()}`} />} />
//         <Route path="/docs/:id" element={<EditorPage />} />
//       </Routes>
//     </Router>
//   );
// }



import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import EditorPage from './components/EditorPage';  // Adjust path as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate replace to={`/docs/${uuid()}`} />} />
        <Route path="/docs/:id" element={<EditorPage  />} />
      </Routes>
    </Router>
  );
}

export default App;

import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Groovy 🥁</h1>
      <div className="card">
        <p>Modern drum notation editor with clean architecture</p>
        <p>Core logic is completely separated from UI</p>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      <p className="read-the-docs">
        Ready to build something awesome!
      </p>
    </>
  )
}

export default App


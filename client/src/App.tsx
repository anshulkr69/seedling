// App.tsx
// Router + layout shell goes here — owned by Friend B (feature/frontend-auth)
// This placeholder lets the app compile from Day 1.

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Satoshi, sans-serif' }}>
          🌱 Seedling
        </h1>
        <p className="mt-2 text-gray-500">
          From scattered grants to funded missions.
        </p>
        <p className="mt-4 text-sm text-gray-400">
          App shell coming soon — see <code>src/router/</code> and <code>src/pages/</code>
        </p>
      </div>
    </div>
  )
}

export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-red-500 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">TAILWIND TEST</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-500 p-4 rounded">Blue Box</div>
        <div className="bg-green-500 p-4 rounded">Green Box</div>
      </div>
      <button className="mt-4 bg-yellow-500 hover:bg-yellow-600 px-6 py-2 rounded text-black font-bold">
        Test Button
      </button>
    </div>
  );
}
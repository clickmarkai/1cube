export default function TestPage() {
  return (
    <div>
      <h1 style={{ color: 'red', fontSize: '48px' }}>Test - Inline Styles Work</h1>
      <h1 className="text-4xl text-red-500">Test - Tailwind Classes</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded">Tailwind Button</button>
      <button className="btn-primary">Custom Button</button>
      <div className="card">
        <p>This is a card</p>
      </div>
      <div style={{ backgroundColor: '#C75D2C', color: 'white', padding: '20px' }}>
        Direct style with our orange color
      </div>
    </div>
  );
}
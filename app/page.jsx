import ObelixApp from '../components/ObelixApp';

export default function Page() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 0',
      }}
    >
      <ObelixApp />
    </main>
  );
}

import ObelixApp from '../components/ObelixApp';

export default function Page() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--cream-100)',
      }}
    >
      <ObelixApp />
    </main>
  );
}

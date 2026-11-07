import './globals.css';
export const metadata = { title: 'NoxVanta', description: 'Time de Valorant NoxVanta' };
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

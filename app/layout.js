import './globals.css';

export const metadata = {
  title: 'Van Stock',
  description: 'Van inventory tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}

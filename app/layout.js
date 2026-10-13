import './globals.css';

export const metadata = {
  title: 'Van Inventory Movement',
  description: 'POS360 Supply Chain Ops - tracks what gets loaded from the warehouse into each van',
  applicationName: 'Van Inventory Movement',
};

export const viewport = {
  themeColor: '#0A0A0B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen antialiased">{children}</body>
    </html>
  );
}

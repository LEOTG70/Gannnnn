import "./globals.css";

export const metadata = {
  title: "eFootball Champions Arena",
  description: "Register and compete in eFootball tournaments",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body min-h-screen">
        <nav className="border-b border-card2 px-6 py-4 flex items-center justify-between">
          <a href="/" className="heading text-2xl font-bold text-neon">
            eFootball <span className="text-blue">Arena</span>
          </a>
          <a
            href="/admin/login"
            className="text-sm text-muted hover:text-neon transition"
          >
            Admin
          </a>
        </nav>
        {children}
      </body>
    </html>
  );
}

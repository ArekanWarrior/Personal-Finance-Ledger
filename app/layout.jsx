export const metadata = {
  title: "Ledger — Personal Finance",
  description: "Track spending, budgets, and savings rate.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

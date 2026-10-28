import React from 'react';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Medrella Doctor Appointment Scheduler',
  description: 'Production-ready healthcare appointment scheduling platform connecting patients and verified doctors.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50/50 text-slate-800 antialiased">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}

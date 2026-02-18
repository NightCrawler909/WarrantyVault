import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-6">
          Welcome to <span className="text-blue-600">WarrantyVault</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Never lose track of your warranties again
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="primary">Get Started</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

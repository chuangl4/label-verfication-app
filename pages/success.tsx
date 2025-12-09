import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import VerificationResults from '@/components/VerificationResults';
import { VerificationResult } from '@/types';

export default function Success() {
  const router = useRouter();
  const [results, setResults] = useState<VerificationResult['fields'] | null>(null);

  useEffect(() => {
    // Get results from query params
    const resultsString = router.query.results as string;

    if (!resultsString) {
      // No results, redirect to home
      router.replace('/');
      return;
    }

    try {
      const parsed = JSON.parse(resultsString);
      setResults(parsed);
    } catch (error) {
      console.error('Failed to parse results:', error);
      router.replace('/');
    }
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Verification Successful | Label Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <VerificationResults results={results} />
      </main>
    </>
  );
}

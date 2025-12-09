import Head from 'next/head';
import VerificationForm from '@/components/VerificationForm';

export default function Home() {
  return (
    <>
      <Head>
        <title>Alcohol Label Verification | TTB Simulator</title>
        <meta name="description" content="AI-powered alcohol label verification tool" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-600/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Label Verification
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              AI-powered alcohol beverage label verification simulating the{' '}
              <span className="font-semibold text-gray-800">TTB approval process</span> using
              Claude Vision AI for accurate label analysis
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8 sm:p-10 lg:p-12">
              <VerificationForm />
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto">
              This tool simulates the TTB (Alcohol and Tobacco Tax and Trade Bureau) label approval process
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

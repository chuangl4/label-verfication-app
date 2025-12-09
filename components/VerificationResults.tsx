import Link from 'next/link';
import { VerificationResult } from '@/types';

interface VerificationResultsProps {
  results: VerificationResult['fields'];
}

export default function VerificationResults({ results }: VerificationResultsProps) {
  const fieldLabels: Record<keyof typeof results, string> = {
    brandName: 'Brand Name',
    productType: 'Product Class/Type',
    alcoholContent: 'Alcohol Content',
    netContents: 'Net Contents',
    governmentWarning: 'Government Warning',
  };

  const fieldIcons: Record<keyof typeof results, string> = {
    brandName: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
    productType: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    alcoholContent: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 008 10.586V5L7 4z',
    netContents: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
    governmentWarning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-2xl shadow-green-500/30 animate-[bounce_1s_ease-in-out]">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Verification Successful!
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          All required information on the label matches your submission.
        </p>
      </div>

      {/* Verified Fields Card */}
      <div className="bg-white border-2 border-green-100 rounded-2xl shadow-xl overflow-hidden mb-10">
        {/* Card Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <svg className="w-7 h-7 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verified Fields
          </h2>
          <p className="text-sm text-gray-600 mt-3 ml-10">All fields have been successfully validated</p>
        </div>

        {/* Fields List */}
        <div className="divide-y divide-gray-100">
          {(Object.keys(results) as Array<keyof typeof results>).map((fieldKey, index) => {
            const field = results[fieldKey];
            const isLastItem = index === Object.keys(results).length - 1;

            return (
              <div
                key={fieldKey}
                className={`px-8 py-8 hover:bg-gray-50/50 transition-colors ${
                  isLastItem ? '' : ''
                }`}
              >
                <div className="flex items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0 mr-5">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={fieldIcons[fieldKey]}
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {fieldLabels[fieldKey]}
                      </h3>
                      <svg
                        className="w-6 h-6 text-green-600 ml-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">
                          Expected:
                        </span>
                        <span className="text-sm text-gray-900 font-medium">
                          {field.expected}
                        </span>
                      </div>

                      <div className="flex items-start">
                        <span className="text-sm font-medium text-gray-500 w-28 flex-shrink-0">
                          Found:
                        </span>
                        <span className="text-sm text-gray-700">
                          {field.found}
                        </span>
                      </div>

                      {field.similarity !== undefined && field.similarity < 100 && (
                        <div className="flex items-center mt-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3 max-w-xs">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${field.similarity}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">
                            {field.similarity.toFixed(1)}% match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Verify Another Label
        </Link>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 shadow transition-all duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Results
        </button>
      </div>

      {/* Info Note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 flex items-center justify-center">
          <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          This label meets TTB compliance requirements based on our verification
        </p>
      </div>
    </div>
  );
}

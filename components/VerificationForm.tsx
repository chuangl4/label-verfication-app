import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';
import FieldError from './FieldError';
import { VerifyResponse } from '@/types';

interface FormInputs {
  brandName: string;
  productType: string;
  alcoholContent: string;
  netContents: string;
}

export default function VerificationForm() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<VerifyResponse | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  const onSubmit = async (data: FormInputs) => {
    // Validate image is selected
    if (!selectedImage) {
      setGeneralError('Please upload a label image');
      return;
    }

    setIsSubmitting(true);
    setApiErrors(null);
    setGeneralError(null);

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('brandName', data.brandName);
      formData.append('productType', data.productType);
      formData.append('alcoholContent', data.alcoholContent);
      formData.append('netContents', data.netContents);

      const response = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      });

      const result: VerifyResponse = await response.json();

      if (!response.ok) {
        setGeneralError(result.error || 'An error occurred during verification');
        setIsSubmitting(false);
        return;
      }

      if (result.success) {
        // Navigate to success page with results
        router.push({
          pathname: '/success',
          query: {
            results: JSON.stringify(result.fields),
          },
        });
      } else {
        // Show errors on form
        setApiErrors(result);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* General Error Message */}
      {generalError && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 shadow-sm">
          <div className="flex items-start">
            <svg className="text-red-500 mr-3 mt-0.5 flex-shrink-0" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800 text-sm font-medium">{generalError}</p>
          </div>
        </div>
      )}

      {/* Verification Errors Summary */}
      {apiErrors && !apiErrors.success && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-5 shadow-sm">
          <div className="flex items-start">
            <svg className="text-red-500 mr-3 flex-shrink-0" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-red-900 font-bold text-base mb-1">Verification Failed</h3>
              <p className="text-red-700 text-sm">
                The label does not match the form data. Please review the highlighted errors below and make corrections.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product Information Section */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-base font-semibold text-gray-900">Product Information</h2>
          <p className="text-sm text-gray-500 mt-1">Enter the details as they appear on your label</p>
        </div>

        {/* Brand Name */}
        <div>
          <label htmlFor="brandName" className="block text-sm font-semibold text-gray-800 mb-2">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <input
            id="brandName"
            type="text"
            {...register('brandName', { required: 'Brand name is required' })}
            className={`
              w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
              text-gray-900 placeholder-gray-400
              ${errors.brandName || apiErrors?.fields?.brandName?.error
                ? 'border-red-400 bg-red-50/50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
            placeholder="e.g., Old Tom Distillery"
            disabled={isSubmitting}
          />
          <FieldError message={errors.brandName?.message || apiErrors?.fields?.brandName?.error} />
        </div>

        {/* Product Type */}
        <div>
          <label htmlFor="productType" className="block text-sm font-semibold text-gray-800 mb-2">
            Product Class/Type <span className="text-red-500">*</span>
          </label>
          <input
            id="productType"
            type="text"
            {...register('productType', { required: 'Product type is required' })}
            className={`
              w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
              text-gray-900 placeholder-gray-400
              ${errors.productType || apiErrors?.fields?.productType?.error
                ? 'border-red-400 bg-red-50/50'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
            placeholder="e.g., Kentucky Straight Bourbon Whiskey"
            disabled={isSubmitting}
          />
          <FieldError message={errors.productType?.message || apiErrors?.fields?.productType?.error} />
        </div>

        {/* Alcohol Content & Net Contents - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Alcohol Content */}
          <div>
            <label htmlFor="alcoholContent" className="block text-sm font-semibold text-gray-800 mb-2">
              Alcohol Content (ABV) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="alcoholContent"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register('alcoholContent', {
                  required: 'Alcohol content is required',
                  min: { value: 0, message: 'Must be at least 0%' },
                  max: { value: 100, message: 'Cannot exceed 100%' },
                })}
                className={`
                  w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                  text-gray-900 placeholder-gray-400
                  ${errors.alcoholContent || apiErrors?.fields?.alcoholContent?.error
                    ? 'border-red-400 bg-red-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
                placeholder="e.g., 45"
                disabled={isSubmitting}
              />
              <span className="absolute right-4 top-3.5 text-gray-500 font-medium">%</span>
            </div>
            <FieldError message={errors.alcoholContent?.message || apiErrors?.fields?.alcoholContent?.error} />
          </div>

          {/* Net Contents */}
          <div>
            <label htmlFor="netContents" className="block text-sm font-semibold text-gray-800 mb-2">
              Net Contents <span className="text-red-500">*</span>
            </label>
            <input
              id="netContents"
              type="text"
              {...register('netContents', { required: 'Net contents is required' })}
              className={`
                w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all
                text-gray-900 placeholder-gray-400
                ${errors.netContents || apiErrors?.fields?.netContents?.error
                  ? 'border-red-400 bg-red-50/50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
              placeholder="e.g., 750 mL"
              disabled={isSubmitting}
            />
            <FieldError message={errors.netContents?.message || apiErrors?.fields?.netContents?.error} />
          </div>
        </div>
      </div>

      {/* Government Warning Error (if applicable) */}
      {apiErrors?.fields?.governmentWarning?.error && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-sm">
          <div className="flex items-start">
            <svg className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-amber-800 text-sm font-medium">
              {apiErrors.fields.governmentWarning.error}
            </p>
          </div>
        </div>
      )}

      {/* Image Upload Section */}
      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Label Image <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Upload a clear photo of your alcohol beverage label</p>
        </div>

        {!selectedImage ? (
          <ImageUpload onImageSelected={setSelectedImage} disabled={isSubmitting} />
        ) : (
          <ImagePreview file={selectedImage} onRemove={() => setSelectedImage(null)} />
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-white text-lg
            shadow-lg transition-all duration-200 transform
            ${isSubmitting
              ? 'bg-gray-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Verifying Label...
            </span>
          ) : (
            'Verify Label'
          )}
        </button>
      </div>
    </form>
  );
}

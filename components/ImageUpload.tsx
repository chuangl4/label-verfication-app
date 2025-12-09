import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  onImageSelected: (files: File[]) => void;
  disabled?: boolean;
}

export default function ImageUpload({ onImageSelected, disabled }: ImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelected(acceptedFiles);
      }
    },
    [onImageSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    maxFiles: 2,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
        ${isDragReject ? 'border-red-500 bg-red-50' : 'border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
      `}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <svg
          className="mx-auto text-gray-400"
          width="32"
          height="32"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {isDragActive && !isDragReject ? (
          <p className="text-blue-600 font-medium">Drop the image here</p>
        ) : isDragReject ? (
          <p className="text-red-600 font-medium">Invalid file type</p>
        ) : (
          <>
            <p className="text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">Up to 2 images (JPEG, PNG, or WebP, max 1MB each)</p>
          </>
        )}
      </div>
    </div>
  );
}

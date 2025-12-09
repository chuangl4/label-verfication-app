import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface MultiImagePreviewProps {
  files: File[];
  onRemove: (index: number) => void;
  onAddMore?: (newFiles: File[]) => void;
}

export default function MultiImagePreview({ files, onRemove, onAddMore }: MultiImagePreviewProps) {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    // Create preview URLs for all files
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup on unmount or when files change
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && onAddMore) {
        // Calculate how many more files we can accept
        const remainingSlots = 2 - files.length;
        const filesToAdd = acceptedFiles.slice(0, remainingSlots);
        onAddMore(filesToAdd);
      }
    },
    [files.length, onAddMore]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
    maxFiles: 2 - files.length,
    disabled: files.length >= 2 || !onAddMore,
    noClick: false,
    noKeyboard: false,
  });

  const canAddMore = files.length < 2 && onAddMore;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {files.map((file, index) => (
        <div
          key={index}
          className="relative border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          {/* Image badge */}
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm z-10">
            Image {index + 1} of {files.length}
          </div>

          {/* Image preview */}
          <div className="mb-3">
            <img
              src={previewUrls[index]}
              alt={`Label preview ${index + 1}`}
              className="max-h-96 w-full object-contain rounded"
            />
          </div>

          {/* Filename and remove button */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-600 truncate flex-1" title={file.name}>
              {file.name}
            </p>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="ml-2 text-red-600 hover:text-red-800 hover:bg-red-50 text-sm font-medium px-3 py-1 rounded transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Add more images dropzone */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 flex flex-col items-center justify-center min-h-[200px]
            ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            hover:border-gray-400
          `}
        >
          <input {...getInputProps()} />
          <svg
            className="mx-auto text-gray-400 mb-3"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          {isDragActive && !isDragReject ? (
            <p className="text-blue-600 font-medium">Drop the image here</p>
          ) : isDragReject ? (
            <p className="text-red-600 font-medium">Invalid file type</p>
          ) : (
            <>
              <p className="text-gray-600">
                <span className="font-medium text-blue-600">Click to add</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500 mt-1">Add another image (max 2 total, 1MB each)</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

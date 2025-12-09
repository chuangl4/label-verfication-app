import { useEffect, useState } from 'react';

interface MultiImagePreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

export default function MultiImagePreview({ files, onRemove }: MultiImagePreviewProps) {
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
    </div>
  );
}

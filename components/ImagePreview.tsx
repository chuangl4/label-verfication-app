import { useEffect, useState } from 'react';

interface ImagePreviewProps {
  file: File | null;
  onRemove?: () => void;
}

export default function ImagePreview({ file, onRemove }: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!file || !previewUrl) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <img
          src={previewUrl}
          alt="Label preview"
          className="w-full h-auto max-h-96 object-contain bg-gray-50"
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 truncate flex-1">{file.name}</span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-3 text-red-600 hover:text-red-800 font-medium"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

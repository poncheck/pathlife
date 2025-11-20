import { useState } from 'react';
import { Photo } from '../types';
import { Check } from 'lucide-react';

interface PhotoGalleryProps {
  photos: Photo[];
  onToggleSelect: (photoId: string) => void;
  editable?: boolean;
}

export function PhotoGallery({ photos, onToggleSelect, editable = false }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Brak zdjęć z tego dnia
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => setSelectedImage(photo.immichUrl)}
          >
            <img
              src={photo.thumbnailUrl || photo.immichUrl}
              alt={`Zdjęcie z ${new Date(photo.takenAt).toLocaleDateString()}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />

            {editable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(photo.id);
                }}
                className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  photo.selected
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/80 text-gray-700 hover:bg-white'
                }`}
              >
                {photo.selected && <Check size={18} />}
              </button>
            )}

            {photo.selected && !editable && (
              <div className="absolute top-2 right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                <Check size={18} />
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Pełny rozmiar"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
            onClick={() => setSelectedImage(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

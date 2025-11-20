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

  const handleImageClick = (photo: Photo) => {
    console.log('Opening full-size image:', photo.immichUrl);
    setSelectedImage(photo.immichUrl);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => handleImageClick(photo)}
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
          className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the image
            if (e.target === e.currentTarget) {
              setSelectedImage(null);
            }
          }}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Pełny rozmiar"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                console.error('Error loading full-size image:', selectedImage);
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="white"%3EBłąd ładowania%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
          <button
            className="absolute top-4 right-4 text-white text-5xl font-light hover:text-gray-300 bg-black/50 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            onClick={() => setSelectedImage(null)}
            aria-label="Zamknij"
          >
            ×
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            Kliknij poza zdjęciem lub naciśnij × aby zamknąć
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadToCloudinary, getOptimizedImageUrl } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  onUpload: (imageUrl: string, publicId: string) => void
  onRemove?: (publicId: string) => void
  existingImages?: Array<{ url: string; publicId: string }>
  maxImages?: number
  folder?: string
}

export default function ImageUpload({
  onUpload,
  onRemove,
  existingImages = [],
  maxImages = 5,
  folder = 'fashop/products'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (existingImages.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images autorisées`)
      return
    }

    setUploading(true)
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} n'est pas une image valide`)
          continue
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} est trop volumineux (max 5MB)`)
          continue
        }

        const result = await uploadToCloudinary(file, folder)
        const optimizedUrl = getOptimizedImageUrl(result.public_id, {
          width: 800,
          quality: 'auto'
        })
        
        onUpload(optimizedUrl, result.public_id)
        toast.success(`${file.name} uploadé avec succès`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload')
    } finally {
      setUploading(false)
    }
  }, [existingImages.length, maxImages, folder, onUpload])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files)
    }
  }, [handleFileUpload])

  const handleRemove = useCallback((publicId: string) => {
    if (onRemove) {
      onRemove(publicId)
      toast.success('Image supprimée')
    }
  }, [onRemove])

  return (
    <div className="space-y-4">
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingImages.map((image, index) => (
            <div key={image.publicId} className="relative group">
              <img
                src={image.url}
                alt={`Image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border"
              />
              {onRemove && (
                <button
                  onClick={() => handleRemove(image.publicId)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {existingImages.length < maxImages && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-sm text-gray-600">Upload en cours...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Glissez vos images ici ou <span className="text-primary-600 font-medium">cliquez pour parcourir</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, GIF jusqu'à 5MB ({existingImages.length}/{maxImages} images)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {existingImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Aucune image ajoutée</p>
        </div>
      )}
    </div>
  )
}

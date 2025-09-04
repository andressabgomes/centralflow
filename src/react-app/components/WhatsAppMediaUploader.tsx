import { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, Music, FileText, Loader2 } from 'lucide-react';

interface MediaFile {
  file: File;
  preview?: string;
  base64?: string;
}

interface WhatsAppMediaUploaderProps {
  onMediaSelected: (mediaData: { data: string; mimetype: string; filename: string }) => void;
  onClose: () => void;
  maxSizeMB?: number;
}

export default function WhatsAppMediaUploader({ 
  onMediaSelected, 
  onClose, 
  maxSizeMB = 16 
}: WhatsAppMediaUploaderProps) {
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4'],
    document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const getFileIcon = (mimeType: string) => {
    if (supportedTypes.image.includes(mimeType)) {
      return <Image className="h-8 w-8 text-green-600" />;
    } else if (supportedTypes.video.includes(mimeType)) {
      return <Video className="h-8 w-8 text-blue-600" />;
    } else if (supportedTypes.audio.includes(mimeType)) {
      return <Music className="h-8 w-8 text-purple-600" />;
    } else if (supportedTypes.document.includes(mimeType)) {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const isSupported = (mimeType: string) => {
    return Object.values(supportedTypes).some(types => types.includes(mimeType));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    // Check file type
    if (!isSupported(file.type)) {
      setError('Tipo de arquivo não suportado');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just base64
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Create preview for images
      let preview = undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      setMediaFile({
        file,
        preview,
        base64
      });
    } catch (err) {
      setError('Erro ao processar arquivo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSend = () => {
    if (mediaFile && mediaFile.base64) {
      onMediaSelected({
        data: mediaFile.base64,
        mimetype: mediaFile.file.type,
        filename: mediaFile.file.name
      });
      onClose();
    }
  };

  const clearFile = () => {
    if (mediaFile?.preview) {
      URL.revokeObjectURL(mediaFile.preview);
    }
    setMediaFile(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Enviar Mídia</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {!mediaFile ? (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-green-600 animate-spin mb-2" />
                  <p className="text-sm text-gray-600">Processando arquivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Clique ou arraste um arquivo aqui
                  </p>
                  <p className="text-xs text-gray-500">
                    Máximo {maxSizeMB}MB
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*,audio/*,application/pdf,text/*"
              onChange={handleFileInputChange}
            />

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Tipos suportados:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <p className="font-medium">📷 Imagens</p>
                  <p>JPEG, PNG, GIF, WebP</p>
                </div>
                <div>
                  <p className="font-medium">🎥 Vídeos</p>
                  <p>MP4, MPEG, MOV</p>
                </div>
                <div>
                  <p className="font-medium">🎵 Áudios</p>
                  <p>MP3, OGG, WAV, M4A</p>
                </div>
                <div>
                  <p className="font-medium">📄 Documentos</p>
                  <p>PDF, TXT, DOC, DOCX</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {getFileIcon(mediaFile.file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {mediaFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(mediaFile.file.size)} • {mediaFile.file.type}
                  </p>
                </div>
                
                <button
                  onClick={clearFile}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Preview for images */}
              {mediaFile.preview && (
                <div className="mt-3">
                  <img
                    src={mediaFile.preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={clearFile}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Escolher outro
              </button>
              
              <button
                onClick={handleSend}
                className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                Enviar Arquivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

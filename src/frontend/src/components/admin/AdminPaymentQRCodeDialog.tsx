import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { QrCode, Upload, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useGetPaymentQRCode, useAdminUploadPaymentQRCode, useAdminClearPaymentQRCode } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { safeErrorMessage } from '../../lib/safeErrorMessage';

interface AdminPaymentQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminPaymentQRCodeDialog({ open, onOpenChange }: AdminPaymentQRCodeDialogProps) {
  const { data: currentQRCode, refetch } = useGetPaymentQRCode();
  const uploadQRCode = useAdminUploadPaymentQRCode();
  const clearQRCode = useAdminClearPaymentQRCode();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(0);
      setError('');
      setSuccessMessage('');
      refetch();
    }
  }, [open, refetch]);

  // Reset success/error on new file selection
  useEffect(() => {
    if (selectedFile) {
      setError('');
      setSuccessMessage('');
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccessMessage('');
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setError('Please select a PNG or JPEG image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError('');
    setSuccessMessage('');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      await uploadQRCode.mutateAsync(blob);
      
      // Success - refresh and show message
      await refetch();
      setSuccessMessage('QR code uploaded successfully!');
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (err) {
      const errorMsg = safeErrorMessage(err);
      setError(errorMsg);
      setUploadProgress(0);
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to remove the current payment QR code? Users will not see a QR code until you upload a new one.')) {
      try {
        await clearQRCode.mutateAsync();
        await refetch();
        setSuccessMessage('QR code removed successfully');
      } catch (err) {
        setError(safeErrorMessage(err));
      }
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError('');
    setSuccessMessage('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <QrCode className="w-5 h-5 shrink-0 text-primary" />
            <span className="break-words">Payment QR Code Management</span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed break-words">
            Upload or manage the payment QR code shown to users during subscription payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Success Message */}
          {successMessage && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200 break-words leading-relaxed">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <AlertDescription className="break-words leading-relaxed whitespace-normal overflow-wrap-anywhere">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Current QR Code */}
          {currentQRCode && !selectedFile && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium leading-relaxed">Current QR Code</p>
                  <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                    <img
                      src={currentQRCode.getDirectURL()}
                      alt="Payment QR Code"
                      className="max-w-full max-h-80 w-auto h-auto object-contain rounded-lg border shadow-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleClear}
                  disabled={clearQRCode.isPending}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2 shrink-0" />
                  {clearQRCode.isPending ? 'Removing...' : 'Remove QR Code'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Upload Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium leading-relaxed">
                  {currentQRCode ? 'Replace QR Code' : 'Upload QR Code'}
                </p>
                <p className="text-xs text-muted-foreground break-words leading-relaxed">
                  Select a PNG or JPEG image (max 5MB). This QR code will be displayed to users when they make subscription payments.
                </p>
              </div>

              {selectedFile && previewUrl && (
                <div className="space-y-3">
                  <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                    <img
                      src={previewUrl}
                      alt="QR Code Preview"
                      className="max-w-full max-h-80 w-auto h-auto object-contain rounded-lg border shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground break-words leading-relaxed overflow-wrap-anywhere">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploadQRCode.isPending}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={uploadQRCode.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2 shrink-0" />
                    Select Image
                  </Button>
                </label>

                {selectedFile && (
                  <>
                    <Button
                      onClick={handleUpload}
                      disabled={uploadQRCode.isPending || uploadProgress > 0}
                      className="flex-1"
                    >
                      {uploadQRCode.isPending ? 'Uploading...' : 'Upload'}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={uploadQRCode.isPending}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

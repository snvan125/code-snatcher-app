import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageUploadProps {
  userId: string;
}

const ImageUpload = ({ userId }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setPreview(URL.createObjectURL(file));
    await uploadAndAnalyze(file);
  };

  const uploadAndAnalyze = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("skin-scans")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("skin-scans")
        .getPublicUrl(filePath);

      const { data: scanData, error: insertError } = await supabase
        .from("skin_scans")
        .insert({
          user_id: userId,
          image_url: publicUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: "Image uploaded",
        description: "Starting AI analysis...",
      });

      setUploading(false);
      setAnalyzing(true);

      const { error: analysisError } = await supabase.functions.invoke("analyze-skin", {
        body: { imageUrl: publicUrl, scanId: scanData.id },
      });

      if (analysisError) throw analysisError;

      toast({
        title: "Analysis complete!",
        description: "Check the History tab to view results.",
      });

      setPreview(null);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Skin Image</CardTitle>
        <CardDescription>
          Upload a clear photo of the skin area you'd like to analyze
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is an AI-powered tool for educational purposes only. Always consult a healthcare
            professional for medical advice.
          </AlertDescription>
        </Alert>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg"
              />
              {(uploading || analyzing) && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{uploading ? "Uploading..." : "Analyzing..."}</span>
                </div>
              )}
            </div>
          ) : (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading || analyzing}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB</p>
              </div>
            </label>
          )}
        </div>

        {!preview && (
          <Button
            onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
            disabled={uploading || analyzing}
            className="w-full"
          >
            Select Image
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
